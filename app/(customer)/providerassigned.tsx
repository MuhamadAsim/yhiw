import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';

const { height, width } = Dimensions.get('window');

// Google Maps API Keys
const ANDROID_API_KEY = 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A';
const IOS_API_KEY = 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU';

interface ProviderLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  lastUpdate?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ProviderData {
  id: string;
  name: string;
  rating: number;
  totalRatings?: number;
  profileImage?: string;
  vehicleDetails?: string;
  phone?: string;
  licensePlate?: string;
  email?: string;
  yearsOfExperience?: number;
  completedJobs?: number;
}

interface JobStatusResponse {
  status: 'searching' | 'accepted' | 'en-route' | 'arrived' | 'started' | 'completed' | 'cancelled';
  eta?: string;
  distance?: string;
  provider?: {
    name: string;
    phone: string;
    rating: number;
  };
}

const API_BASE_URL = 'https://yhiw-backend.onrender.com';

const ProviderAssignedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const navigationInProgress = useRef(false);

  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [eta, setEta] = useState<string>('');
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [providerDetails, setProviderDetails] = useState<ProviderData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('accepted');
  const [hasShownArrivedAlert, setHasShownArrivedAlert] = useState(false);

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely get number from params
  const getNumberParam = (param: string | string[] | undefined): number | null => {
    if (!param) return null;
    const value = Array.isArray(param) ? param[0] : param;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  // Get provider data from params
  const providerName = getStringParam(params.providerName) || 'Ahmed Al-Khalifa';
  const providerRating = getStringParam(params.providerRating) || '4.8';
  const providerImage = getStringParam(params.providerImage);
  const providerPhone = getStringParam(params.providerPhone) || '+973 3312 4567';
  const providerId = getStringParam(params.providerId);
  const vehicleDetails = getStringParam(params.vehicleDetails) || 'White Flatbed Truck';
  const licensePlate = getStringParam(params.licensePlate) || 'BHR 5432';
  const estimatedArrival = getStringParam(params.estimatedArrival) || '15';
  const serviceType = getStringParam(params.serviceName) || 'Roadside Towing';

  // Get booking data from params
  const bookingId = getStringParam(params.bookingId);
  const serviceName = getStringParam(params.serviceName) || 'Roadside Towing';
  const vehicleType = getStringParam(params.vehicleType) || 'Sedan';
  const pickupAddress = getStringParam(params.pickupAddress) || '123 Main Street, Manama';
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const totalAmount = getStringParam(params.totalAmount) || '89.25';

  // Get coordinates
  const pickupLat = getNumberParam(params.pickupLat) || 26.2285;
  const pickupLng = getNumberParam(params.pickupLng) || 50.5860;
  const providerLat = getNumberParam(params.providerLat);
  const providerLng = getNumberParam(params.providerLng);
  const dropoffLat = getNumberParam(params.dropoffLat);
  const dropoffLng = getNumberParam(params.dropoffLng);

  // Check if this is a "no providers" scenario
  const noProviders = getStringParam(params.noProviders) === 'true';

  // Debug logger
  const addDebug = (message: string) => {
    console.log(`🔍 [ProviderAssigned] ${message}`);
  };

  // Set initial ETA
  useEffect(() => {
    addDebug(`Initializing with bookingId: ${bookingId}, providerId: ${providerId}`);
    addDebug(`Pickup location: ${pickupLat}, ${pickupLng}`);
    
    setEta(`${estimatedArrival} min`);
    const etaMinutes = parseInt(estimatedArrival);
    if (!isNaN(etaMinutes)) {
      setTimeRemaining(etaMinutes * 60);
    }

    // Set initial provider location if provided
    if (providerLat && providerLng) {
      addDebug(`Initial provider location from params: ${providerLat}, ${providerLng}`);
      setProviderLocation({
        latitude: providerLat,
        longitude: providerLng,
        lastUpdate: new Date().toISOString(),
      });
      setIsLoading(false);
    } else {
      addDebug('No initial provider location in params');
    }

    // Start polling for provider location and job status
    if (bookingId) {
      startPolling();
    }

    // Start ETA countdown
    startEtaCountdown();

    // Cleanup on unmount
    return () => {
      addDebug('Cleaning up - stopping polling');
      isMounted.current = false;
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
    };
  }, [bookingId, providerId]);

  const startPolling = () => {
    addDebug('🔄 Starting polling for provider location & job status (every 10 seconds)');
    
    const poll = async () => {
      if (!isMounted.current || navigationInProgress.current) return;
      
      // Fetch both location and status in parallel
      await Promise.all([
        fetchProviderLocation(),
        fetchJobStatus()
      ]);
      
      // Schedule next poll
      if (isMounted.current && !navigationInProgress.current) {
        pollingTimer.current = setTimeout(poll, 10000); // Poll every 10 seconds
      }
    };
    
    // Start polling immediately
    poll();
  };

  const fetchProviderLocation = async () => {
    if (!bookingId) {
      addDebug('❌ No bookingId available for location fetch');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        return;
      }

      const url = `${API_BASE_URL}/api/jobs/${bookingId}/provider-location`;
      addDebug(`📍 Polling #${pollingAttempts + 1} - Fetching provider location`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!isMounted.current) return;

      if (!response.ok) {
        addDebug(`❌ Location fetch failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      setPollingAttempts(prev => prev + 1);

      if (data.success && data.location) {
        addDebug(`✅ Location received: ${data.location.latitude}, ${data.location.longitude}`);
        
        const newLocation = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          heading: data.location.heading,
          lastUpdate: data.timestamp || new Date().toISOString(),
        };

        setProviderLocation(newLocation);

        // Fetch route and ETA
        fetchRoute(newLocation.latitude, newLocation.longitude, pickupLat, pickupLng);
        getEtaFromGoogleMaps(newLocation.latitude, newLocation.longitude, pickupLat, pickupLng);

        // Center map to show both provider and pickup on first location
        if (isLoading && mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: newLocation.latitude, longitude: newLocation.longitude },
              { latitude: pickupLat, longitude: pickupLng }
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }

        setIsLoading(false);
      } else {
        addDebug(`ℹ️ No location update available`);
      }

      // Also fetch provider details if not already loaded
      if (!providerDetails) {
        fetchProviderDetails();
      }

    } catch (error) {
      addDebug(`❌ Error fetching location: ${error}`);
    }
  };

  const fetchJobStatus = async () => {
    if (!bookingId || navigationInProgress.current) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = `${API_BASE_URL}/api/jobs/${bookingId}/status`;
      addDebug(`📊 Checking job status...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data: JobStatusResponse = await response.json();
      addDebug(`📊 Job status: ${data.status}`);

      // Update current status
      setCurrentStatus(data.status);

      // Update ETA if provided
      if (data.eta) {
        setEta(data.eta);
      }

      // ===== HANDLE PROVIDER ARRIVAL =====
      if (data.status === 'arrived' && !hasShownArrivedAlert) {
        addDebug('✅ Provider has ARRIVED!');
        setHasShownArrivedAlert(true);
        
        // Show alert to user
        Alert.alert(
          'Provider Arrived',
          `${providerName} has arrived at your location. Please go outside to meet them.`,
          [{ text: 'OK' }]
        );
      }

      // ===== HANDLE SERVICE STARTED =====
      if (data.status === 'started') {
        addDebug('✅✅✅ SERVICE HAS STARTED - Navigating to ServiceInProgress');
        
        // Navigate to ServiceInProgress if not already navigating
        if (!navigationInProgress.current) {
          navigationInProgress.current = true;
          
          // Stop polling
          if (pollingTimer.current) {
            clearTimeout(pollingTimer.current);
            pollingTimer.current = null;
          }

          // Navigate to ServiceInProgress
          setTimeout(() => {
            if (isMounted.current) {
              router.push({
                pathname: '/(customer)/ServiceInProgress',
                params: {
                  bookingId,
                  providerName,
                  providerId,
                  providerPhone,
                  serviceType,
                  vehicleType,
                  pickupLocation: pickupAddress,
                  pickupLat: pickupLat.toString(),
                  pickupLng: pickupLng.toString(),
                  totalAmount,
                }
              });
            }
          }, 500);
        }
      }

    } catch (error) {
      addDebug(`Error checking job status: ${error}`);
    }
  };

  const fetchProviderDetails = async () => {
    if (!providerId) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = `${API_BASE_URL}/api/providers/${providerId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProviderDetails(data.provider);
      }
    } catch (error) {
      addDebug(`Error fetching provider details: ${error}`);
    }
  };

  // Decode Google Maps polyline
  const decodePolyline = (t: string): Coordinates[] => {
    let points: Coordinates[] = [];
    let lat = 0;
    let lng = 0;
    let index = 0;
    let shift = 0;
    let result = 0;

    while (index < t.length) {
      let b = 0;
      shift = 0;
      result = 0;

      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  };

  // Fetch route from Google Maps
  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      addDebug(`Fetching route from ${startLat},${startLng} to ${endLat},${endLng}`);
      const apiKey = Platform.select({
        android: ANDROID_API_KEY,
        ios: IOS_API_KEY,
      });

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
        addDebug(`Route found with ${points.length} points`);
      }
    } catch (error) {
      addDebug(`Error fetching route: ${error}`);
    }
  };

  // Get ETA from Google Maps
  const getEtaFromGoogleMaps = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    try {
      const apiKey = Platform.select({
        android: ANDROID_API_KEY,
        ios: IOS_API_KEY,
      });

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const durationText = data.rows[0].elements[0].duration.text;
        setEta(durationText);
        addDebug(`ETA updated: ${durationText}`);

        const durationInSeconds = data.rows[0].elements[0].duration.value;
        setTimeRemaining(durationInSeconds);
      }
    } catch (error) {
      addDebug(`Error getting ETA: ${error}`);
    }
  };

  const forceRefresh = () => {
    addDebug('🔄 Manually refreshing');
    fetchProviderLocation();
    fetchJobStatus();
  };

  const startEtaCountdown = () => {
    const etaMinutes = parseInt(estimatedArrival);
    if (isNaN(etaMinutes)) return;

    setTimeRemaining(etaMinutes * 60);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Error', 'Provider phone number not available');
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: {
        providerName,
        bookingId,
        providerId,
      }
    });
  };

  const handleOpenInMaps = () => {
    if (providerLocation && pickupLat && pickupLng) {
      const url = Platform.select({
        ios: `maps://app?saddr=${providerLocation.latitude},${providerLocation.longitude}&daddr=${pickupLat},${pickupLng}`,
        android: `google.navigation:q=${pickupLat},${pickupLng}`,
      });

      if (url) {
        Linking.openURL(url);
      }
    } else {
      Alert.alert('Error', 'Location information not available');
    }
  };

  const handleTrackProvider = () => {
    if (providerLocation) {
      addDebug(`🔄 Navigating to TrackProviderScreen`);
      router.push({
        pathname: '/(customer)/TrackProvider',
        params: {
          bookingId: bookingId,
          providerId: providerId,
          providerName: providerName,
          providerPhone: providerPhone,
          providerLat: providerLocation.latitude.toString(),
          providerLng: providerLocation.longitude.toString(),
          pickupLat: pickupLat.toString(),
          pickupLng: pickupLng.toString(),
          pickupAddress: pickupAddress,
          dropoffLat: dropoffLat?.toString() || '',
          dropoffLng: dropoffLng?.toString() || '',
          estimatedArrival: timeRemaining.toString(),
          eta: eta,
          serviceType: serviceType,
          vehicleType: vehicleType,
          totalAmount: totalAmount,
          lastUpdate: providerLocation.lastUpdate || new Date().toISOString()
        }
      });
    } else {
      Alert.alert('Tracking', 'Provider location is being updated...');
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/jobs/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cancelledBy: 'customer' })
              });

              // Remove bookingId from storage since job is cancelled
              await AsyncStorage.removeItem('currentBookingId');
              
              router.back();
            } catch (error) {
              console.error('Cancel error:', error);
              router.back();
            }
          }
        }
      ]
    );
  };

  // If no providers found, show appropriate message
  if (noProviders) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle-outline" size={80} color="#ff4444" />
          </View>
          <Text style={styles.title}>No Providers Available</Text>
          <Text style={styles.subtitle}>
            We couldn't find any providers in your area at this time. Please try again later.
          </Text>

          <TouchableOpacity
            style={[styles.trackButton, { marginTop: 30 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.trackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Check if provider has arrived
  const hasProviderArrived = currentStatus === 'arrived';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/provider_assigned/tick.png')}
            style={styles.tickIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Provider Assigned!</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Your service provider is on the way</Text>

        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          hasProviderArrived ? styles.statusBadgeGreen : styles.statusBadgeBlue
        ]}>
          <Text style={styles.statusText}>
            {currentStatus === 'arrived' ? 'PROVIDER ARRIVED' : 
             currentStatus === 'started' ? 'SERVICE STARTED' :
             currentStatus === 'en-route' ? 'ON THE WAY' :
             currentStatus?.toUpperCase() || 'PROVIDER ASSIGNED'}
          </Text>
        </View>

        {/* Debug Panel - TEMPORARY for testing */}
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🔍 DEBUG INFO</Text>
          <ScrollView style={styles.debugScroll} horizontal>
            <View>
              <Text style={styles.debugText}>• Booking ID: {bookingId}</Text>
              <Text style={styles.debugText}>• Provider ID: {providerId}</Text>
              <Text style={styles.debugText}>• Status: {currentStatus}</Text>
              <Text style={styles.debugText}>• Polling: #{pollingAttempts}</Text>
              <Text style={styles.debugText}>• Location: {providerLocation ? '✓' : '✗'}</Text>
              <Text style={styles.debugText}>• Last update: {providerLocation?.lastUpdate ? new Date(providerLocation.lastUpdate).toLocaleTimeString() : 'N/A'}</Text>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.debugButton} onPress={forceRefresh}>
            <Text style={styles.debugButtonText}>🔄 FORCE REFRESH</Text>
          </TouchableOpacity>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {/* ETA Badge */}
          <View style={styles.etaBadge}>
            <Text style={styles.etaLabel}>ARRIVAL IN</Text>
            <Text style={styles.etaTime}>
              {timeRemaining > 0 ? formatTime(timeRemaining) : eta || 'Calculating...'}
            </Text>
          </View>

          {/* Google Maps */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: pickupLat,
              longitude: pickupLng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsTraffic={true}
          >
            {/* Pickup Location Marker */}
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              title="Pickup Location"
              description={pickupAddress}
            >
              <View style={styles.pickupMarkerContainer}>
                <View style={styles.pickupMarkerDot} />
              </View>
            </Marker>

            {/* Provider Location Marker */}
            {providerLocation && (
              <Marker
                coordinate={providerLocation}
                title={providerName}
                description="Your provider"
              >
                <View style={styles.providerMarkerContainer}>
                  <Ionicons name="car" size={24} color="#68bdee" />
                </View>
              </Marker>
            )}

            {/* Dropoff Location Marker (if available) */}
            {dropoffLat && dropoffLng && (
              <Marker
                coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
                title="Dropoff Location"
                description={dropoffAddress}
              >
                <View style={styles.dropoffMarkerContainer}>
                  <Ionicons name="flag" size={20} color="#10B981" />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#68bdee"
              />
            )}
          </MapView>

          {/* Map Overlay Buttons */}
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={() => {
              if (providerLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: providerLocation.latitude,
                  longitude: providerLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }
            }}
          >
            <Ionicons name="locate" size={20} color="#68bdee" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={handleOpenInMaps}
          >
            <Ionicons name="navigate-outline" size={20} color="#68bdee" />
          </TouchableOpacity>

          {/* Polling Info */}
          <View style={styles.pollingBadge}>
            <Text style={styles.pollingText}>Live • {pollingAttempts}</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              {providerImage ? (
                <Image source={{ uri: providerImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={40} color="#68bdee" />
              )}
            </View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>{providerRating}</Text>
                <Text style={styles.reviewsText}>
                  • {providerDetails?.totalRatings || '127'} reviews
                </Text>
              </View>
              <Text style={styles.vehicleInfo}>{vehicleDetails}</Text>
              <Text style={styles.plateNumber}>{licensePlate}</Text>
            </View>
          </View>

          {/* Provider Location Info */}
          {providerLocation ? (
            <View style={styles.locationInfoContainer}>
              <Ionicons name="location" size={14} color="#68bdee" />
              <Text style={styles.locationInfoText}>
                Last updated: {new Date(providerLocation.lastUpdate || '').toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <View style={styles.locationInfoContainer}>
              <ActivityIndicator size="small" color="#68bdee" />
              <Text style={styles.locationInfoText}>Waiting for provider location...</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#68bdee" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#68bdee" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>

          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingId?.slice(-8) || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{vehicleType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {pickupAddress}
            </Text>
          </View>

          {dropoffAddress ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {dropoffAddress}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Cost</Text>
            <Text style={styles.detailValueHighlight}>{totalAmount} BHD</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>JOB STATUS</Text>

          <View style={styles.cardDivider} />

          {/* Status Item 1 - Active */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxActive}>
              <View style={styles.statusDotActive} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextActive}>Provider Assigned</Text>
              <Text style={styles.statusTimeActive}>Just now</Text>
            </View>
          </View>

          {/* Status Item 2 - In progress (current) */}
          <View style={styles.statusItem}>
            <View style={[styles.statusCheckboxInactive, (providerLocation || hasProviderArrived) && styles.statusCheckboxActive]}>
              {(providerLocation || hasProviderArrived) && <View style={styles.statusDotActive} />}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTextInactive, (providerLocation || hasProviderArrived) && styles.statusTextActive]}>
                {hasProviderArrived ? 'Provider Arrived' : 'Provider On the Way'}
              </Text>
              <Text style={[styles.statusTimeInactive, (providerLocation || hasProviderArrived) && styles.statusTimeActive]}>
                {hasProviderArrived 
                  ? 'Provider has arrived' 
                  : providerLocation 
                    ? 'Live tracking active' 
                    : `ETA: ${estimatedArrival} minutes`}
              </Text>
            </View>
          </View>

          {/* Status Item 3 - Waiting */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxInactive} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextInactive}>Service In Progress</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrackProvider}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.trackButtonText}>Track Provider Live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: height * 0.04,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: Math.min(80, height * 0.1),
    height: Math.min(80, height * 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
    backgroundColor: 'transparent',
  },
  tickIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Math.min(22, height * 0.028),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: height * 0.01,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(12, height * 0.015),
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: height * 0.025,
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  statusBadgeBlue: {
    backgroundColor: '#68bdee',
  },
  statusBadgeGreen: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Debug Panel
  debugPanel: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugScroll: {
    maxHeight: 100,
    marginBottom: 10,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  debugButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  etaBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    zIndex: 10,
    elevation: 5,
  },
  etaLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  etaTime: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  recenterButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
    elevation: 5,
  },
  openMapsButton: {
    position: 'absolute',
    top: 70,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
    elevation: 5,
  },
  pollingBadge: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#68bdee',
    zIndex: 10,
    elevation: 5,
  },
  pollingText: {
    fontSize: 10,
    color: '#68bdee',
    fontWeight: '600',
  },
  pickupMarkerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  pickupMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  providerMarkerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  dropoffMarkerContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  providerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#5c5c5c',
    marginBottom: 4,
  },
  plateNumber: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '600',
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationInfoText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 0,
    marginTop: 5,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 0.6,
    textAlign: 'right',
  },
  detailValueHighlight: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    flex: 0.6,
    textAlign: 'right',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusCheckboxActive: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 9,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  statusDotActive: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  statusCheckboxInactive: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    borderRadius: 9,
    marginRight: 12,
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTextActive: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusTimeActive: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusTextInactive: {
    fontSize: 14,
    color: '#b0b0b0',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusTimeInactive: {
    fontSize: 11,
    color: '#d0d0d0',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  trackButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ProviderAssignedScreen;
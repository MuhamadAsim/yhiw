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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import ChatPopup from './components/ChatPopup';
import {styles} from './styles/ProviderAssignedStyles';

const { height } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com';

// Types
interface Coordinates {
  lat: number;
  lng: number;
}

interface JobDetails {
  bookingId: string;
  status: 'searching' | 'accepted' | 'en-route' | 'arrived' | 'started' | 'in_progress' | 'completed' | 'cancelled' | 'completed_confirmed';
  serviceType: string;
  serviceName: string;
  vehicleType: string;
  pickup: {
    address: string;
    coordinates: Coordinates;
  };
  dropoff?: {
    address: string;
    coordinates: Coordinates;
  };
  provider?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    profileImage?: string;
    yearsOfExperience?: number;
    completedJobs?: number;
    vehicle?: {
      type: string;
      makeModel: string;
      licensePlate: string;
      color?: string;
      description: string;
    };
  };
  providerLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    updatedAt: string;
  };
  payment: {
    totalAmount: number;
    baseFee: number;
    tip: number;
  };
  estimatedArrival: string;
  distance?: string;
  createdAt: string;
}

interface RouteData {
  polyline: string;
  distance: string;
  eta: string;
  distanceValue?: number;
  etaValue?: number;
}

const ProviderAssignedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const routeFetchTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const navigationInProgress = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  // State
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [eta, setEta] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [hasShownArrivedAlert, setHasShownArrivedAlert] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // Get ONLY bookingId from params
  const bookingId = useLocalSearchParams().bookingId as string;

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    const logMessage = `🔍 [ProviderAssigned] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Handle message button press - open chat popup
  const handleMessage = () => {
    addDebug(`💬 Opening chat popup with provider`);
    setChatVisible(true);
  };

  // Decode polyline from Google Maps format or simple pipe-separated format
  const decodePolyline = (encoded: string): any[] => {
    if (!encoded || typeof encoded !== 'string') {
      return [];
    }

    // Check if it's a simple pipe-separated format (lat,lng|lat,lng) - fallback from backend
    if (encoded.includes('|')) {
      return encoded.split('|').map(point => {
        const [lat, lng] = point.split(',').map(Number);
        return {
          latitude: lat,
          longitude: lng,
        };
      }).filter(point =>
        !isNaN(point.latitude) &&
        !isNaN(point.longitude) &&
        point.latitude !== 0 &&
        point.longitude !== 0
      );
    }

    // Otherwise, assume it's Google's encoded polyline format
    const points: any[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  };
  // In ProviderAssignedScreen - UPDATED to just use GET (no body needed)
  const fetchRouteFromBackend = async () => {
    if (isFetchingRoute || !bookingId) return;

    setIsFetchingRoute(true);
    addDebug(`📍 Fetching route from backend`);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        return;
      }

      // Simple GET request - backend knows both locations from:
      // - Provider location from ProviderLiveStatus
      // - Pickup location from job.bookingData
      const url = `${API_BASE_URL}/api/customer/${bookingId}/route`;
      addDebug(`🌐 Calling route API: ${url}`);

      const response = await fetch(url, {
        method: 'GET', // Changed from POST to GET
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
        // NO BODY - backend already knows everything
      });

      const data = await response.json();
      addDebug(`📦 Route API response:`, data);

      if (data.success && data.route) {
        // Store route data
        setRouteData(data.route);

        // Decode and set route coordinates for map
        if (data.route.polyline) {
          const points = decodePolyline(data.route.polyline);
          setRouteCoordinates(points);
          addDebug(`🗺️ Route has ${points.length} points`);
        }

        // Set ETA and distance
        setEta(data.route.eta || 'Calculating...');

        // Parse ETA to seconds for countdown if available
        if (data.route.etaValue) {
          setTimeRemaining(data.route.etaValue);
        } else if (data.route.eta) {
          const etaMatch = data.route.eta.match(/(\d+)/);
          if (etaMatch) {
            const minutes = parseInt(etaMatch[0]);
            setTimeRemaining(minutes * 60);
          }
        }

        // Update provider location if returned
        if (data.route.providerLocation) {
          setProviderLocation({
            latitude: data.route.providerLocation.latitude,
            longitude: data.route.providerLocation.longitude,
          });
        }

        addDebug(`✅ Route updated: ${data.route.distance}, ETA: ${data.route.eta}`);
      } else {
        addDebug(`⚠️ Route fetch failed:`, data.message);
      }
    } catch (error) {
      addDebug(`❌ Error fetching route: ${error}`);
    } finally {
      setIsFetchingRoute(false);
    }
  };

  // Fetch complete job details
  const fetchJobDetails = async () => {
    if (!bookingId) {
      addDebug('❌ No bookingId provided');
      setApiError('No booking ID provided');
      return;
    }

    try {
      addDebug(`📡 Fetching job details for booking: ${bookingId}`);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        setApiError('Authentication failed');
        return;
      }

      const url = `${API_BASE_URL}/api/customer/${bookingId}/details`;
      addDebug(`🌐 Calling API: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      addDebug(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        addDebug(`❌ API Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      addDebug(`📦 API Response:`, data);

      if (data.success && data.job) {
        addDebug(`✅ Job details fetched successfully`);
        addDebug(`   - Status: ${data.job.status}`);
        addDebug(`   - Provider: ${data.job.provider?.name || 'Not assigned'}`);
        addDebug(`   - Pickup: ${data.job.pickup?.address || 'No address'}`);

        setJobDetails(data.job);
        setApiError(null);

        // Set initial provider location if available
        if (data.job.providerLocation) {
          addDebug(`📍 Provider location from API:`, data.job.providerLocation);
          setProviderLocation({
            latitude: data.job.providerLocation.latitude,
            longitude: data.job.providerLocation.longitude,
          });
        }

        // Set initial ETA
        setEta(data.job.estimatedArrival || '15 min');
        const etaMinutes = parseInt(data.job.estimatedArrival || '15');
        if (!isNaN(etaMinutes)) {
          setTimeRemaining(etaMinutes * 60);
        }

        // Center map on pickup if map is ready
        if (mapRef.current && data.job.pickup?.coordinates && mapReady) {
          addDebug(`🗺️ Centering map on pickup location`);
          mapRef.current.animateToRegion({
            latitude: data.job.pickup.coordinates.lat,
            longitude: data.job.pickup.coordinates.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }

        // Check initial status and navigate if needed
        handleStatusNavigation(data.job.status);
      } else {
        addDebug(`❌ API returned success=false or no job data`);
        setApiError('No job data received');
      }
    } catch (error) {
      addDebug(`❌ Error fetching job details: ${error}`);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle navigation based on status
  const handleStatusNavigation = (status: string) => {
    if (navigationInProgress.current) return;

    // Handle ARRIVED - Show alert but stay on screen
    if (status === 'arrived' && !hasShownArrivedAlert) {
      addDebug(`🚗 Provider has arrived!`);
      setHasShownArrivedAlert(true);
      Alert.alert(
        'Provider Arrived',
        `${jobDetails?.provider?.name || 'Your provider'} has arrived at your location.`,
        [{ text: 'OK' }]
      );
    }

    // Handle STARTED/IN_PROGRESS - Navigate to ServiceInProgress
    if ((status === 'started' || status === 'in_progress') && !navigationInProgress.current) {
      addDebug(`🔄 Service started/in_progress - navigating to ServiceInProgress`);
      navigationInProgress.current = true;

      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }

      setTimeout(() => {
        if (isMounted.current) {
          router.push({
            pathname: '/(customer)/ServiceInProgress',
            params: {
              bookingId,
              providerName: jobDetails?.provider?.name || '',
              providerId: jobDetails?.provider?.id || '',
              providerPhone: jobDetails?.provider?.phone || '',
              serviceType: jobDetails?.serviceName || '',
              vehicleType: jobDetails?.vehicleType || '',
              pickupLocation: jobDetails?.pickup?.address || '',
              pickupLat: jobDetails?.pickup?.coordinates?.lat?.toString() || '',
              pickupLng: jobDetails?.pickup?.coordinates?.lng?.toString() || '',
              totalAmount: jobDetails?.payment?.totalAmount?.toString() || '0',
            }
          });
        }
      }, 500);
    }

    // Handle COMPLETED - Navigate immediately
    if ((status === 'completed' || status === 'completed_confirmed') && !navigationInProgress.current) {
      addDebug(`✅✅✅ JOB COMPLETED - navigating to ServiceCompleted`);
      navigationInProgress.current = true;

      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }

      // Navigate immediately
      if (isMounted.current) {
        router.push({
          pathname: '/(customer)/ServiceCompleted',
          params: {
            bookingId,
            providerName: jobDetails?.provider?.name || '',
            providerId: jobDetails?.provider?.id || '',
            providerPhone: jobDetails?.provider?.phone || '',
            serviceType: jobDetails?.serviceName || '',
            totalAmount: jobDetails?.payment?.totalAmount?.toString() || '0',
            duration: formatTime(timeRemaining),
            pickupLocation: jobDetails?.pickup?.address || '',
            pickupLat: jobDetails?.pickup?.coordinates?.lat?.toString() || '',
            pickupLng: jobDetails?.pickup?.coordinates?.lng?.toString() || '',
            completedAt: new Date().toISOString(),
          }
        });
      }
    }
  };


  // Update the call in fetchProviderLocation:
  const fetchProviderLocation = async () => {
    if (!bookingId) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = `${API_BASE_URL}/api/customer/${bookingId}/provider-location`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.success && data.location) {
        setPollingAttempts(prev => prev + 1);

        const newLocation = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        };

        addDebug(`📍 Provider location update #${pollingAttempts + 1}:`, newLocation);
        setProviderLocation(newLocation);

        // Fetch route after location update - NO COORDINATES NEEDED
        if (routeFetchTimer.current) {
          clearTimeout(routeFetchTimer.current);
        }

        routeFetchTimer.current = setTimeout(() => {
          fetchRouteFromBackend(); // Just call without parameters
        }, 2000);
      }
    } catch (error) {
      addDebug(`❌ Error fetching location: ${error}`);
    }
  };

  // Fetch job status
  const fetchJobStatus = async () => {
    if (!bookingId || navigationInProgress.current) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = `${API_BASE_URL}/api/customer/${bookingId}/details`;
      addDebug(`📊 Polling #${pollingAttempts + 1} - Checking job details`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addDebug(`❌ Status check failed: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.success && data.job && data.job.status) {
        const newStatus = data.job.status;
        addDebug(`📊 Job status update: ${newStatus}`);

        // Update job details with any new data
        setJobDetails(prev => prev ? { ...prev, ...data.job } : data.job);

        // Handle navigation based on new status
        handleStatusNavigation(newStatus);
      }
    } catch (error) {
      addDebug(`❌ Error fetching status: ${error}`);
    }
  };

  // Polling loop
  const startPolling = () => {
    addDebug('🔄 Starting polling (every 10 seconds)');

    const poll = async () => {
      if (!isMounted.current || navigationInProgress.current) return;

      await Promise.all([
        fetchProviderLocation(),
        fetchJobStatus()
      ]);

      if (isMounted.current && !navigationInProgress.current) {
        pollingTimer.current = setTimeout(poll, 10000);
      }
    };

    poll();
  };

  // Initial load
  useEffect(() => {
    addDebug(`🚀 Component mounted with bookingId: ${bookingId}`);

    if (!bookingId) {
      addDebug('❌ No booking ID in params');
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }

    // Fetch initial data
    fetchJobDetails().then(() => {
      // Start polling after initial data loads
      startPolling();
    });

    // Start ETA countdown
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev > 1 ? prev - 1 : 0);
    }, 1000);

    return () => {
      addDebug('🧹 Cleaning up component');
      isMounted.current = false;
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      if (routeFetchTimer.current) {
        clearTimeout(routeFetchTimer.current);
        routeFetchTimer.current = null;
      }
      clearInterval(interval);
    };
  }, [bookingId]);

  // Action handlers
  const handleCall = () => {
    if (jobDetails?.provider?.phone) {
      addDebug(`📞 Calling provider: ${jobDetails.provider.phone}`);
      Linking.openURL(`tel:${jobDetails.provider.phone}`);
    } else {
      Alert.alert('Error', 'Provider phone number not available');
    }
  };

  const handleOpenInMaps = () => {
    if (providerLocation && jobDetails?.pickup?.coordinates) {
      addDebug(`🗺️ Opening in external maps app`);
      const url = Platform.select({
        ios: `maps://app?saddr=${providerLocation.latitude},${providerLocation.longitude}&daddr=${jobDetails.pickup.coordinates.lat},${jobDetails.pickup.coordinates.lng}`,
        android: `google.navigation:q=${jobDetails.pickup.coordinates.lat},${jobDetails.pickup.coordinates.lng}`,
      });

      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const handleTrackProvider = () => {
    if (providerLocation && jobDetails) {
      addDebug(`📍 Navigating to TrackProvider screen`);
      router.push({
        pathname: '/(customer)/TrackProvider',
        params: {
          bookingId,
          providerId: jobDetails.provider?.id,
          providerName: jobDetails.provider?.name,
          providerPhone: jobDetails.provider?.phone,
          providerLat: providerLocation.latitude.toString(),
          providerLng: providerLocation.longitude.toString(),
          pickupLat: jobDetails.pickup?.coordinates?.lat?.toString() || '',
          pickupLng: jobDetails.pickup?.coordinates?.lng?.toString() || '',
          pickupAddress: jobDetails.pickup?.address || '',
          dropoffLat: jobDetails.dropoff?.coordinates?.lat?.toString() || '',
          dropoffLng: jobDetails.dropoff?.coordinates?.lng?.toString() || '',
          estimatedArrival: timeRemaining.toString(),
          eta,
          serviceType: jobDetails.serviceName,
          vehicleType: jobDetails.vehicleType,
          totalAmount: jobDetails.payment?.totalAmount?.toString() || '0',
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
            addDebug(`❌ Cancelling request: ${bookingId}`);
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/customer/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cancelledBy: 'customer' })
              });

              await AsyncStorage.removeItem('currentBookingId');
              router.replace('/(customer)/Home');
            } catch (error) {
              console.error('Cancel error:', error);
              router.replace('/(customer)/Home');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    addDebug(`🔄 Manual refresh triggered`);
    setRefreshing(true);
    await fetchJobDetails();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
        <Text style={styles.loadingText}>Loading job details...</Text>
        {apiError && (
          <Text style={styles.errorText}>Error: {apiError}</Text>
        )}
      </View>
    );
  }

  // No job found
  if (!jobDetails) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Ionicons name="alert-circle-outline" size={80} color="#ff4444" />
          <Text style={styles.title}>Job Not Found</Text>
          <Text style={styles.subtitle}>
            We couldn't find details for this job. Please try again.
          </Text>
          {apiError && (
            <Text style={styles.errorText}>Error: {apiError}</Text>
          )}
          <TouchableOpacity
            style={[styles.trackButton, { marginTop: 30 }]}
            onPress={() => router.replace('/(customer)/Home')}
          >
            <Text style={styles.trackButtonText}>Go Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const provider = jobDetails.provider;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
        <Text style={styles.subtitle}>Your service provider is on the way</Text>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {/* ETA Badge */}
          <View style={styles.etaBadge}>
            <Text style={styles.etaLabel}>ARRIVAL IN</Text>
            <Text style={styles.etaTime}>
              {timeRemaining > 0 ? formatTime(timeRemaining) : eta || 'Calculating...'}
            </Text>
          </View>

          {jobDetails?.pickup?.coordinates ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: jobDetails.pickup.coordinates.lat,
                longitude: jobDetails.pickup.coordinates.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={true}
              showsMyLocationButton={false}
              onMapReady={() => {
                addDebug(`🗺️ Map is ready`);
                setMapReady(true);
              }}
            >
              {/* Pickup Marker */}
              {jobDetails.pickup?.coordinates && (
                <Marker
                  coordinate={{
                    latitude: jobDetails.pickup.coordinates.lat,
                    longitude: jobDetails.pickup.coordinates.lng
                  }}
                  title="Pickup Location"
                  description={jobDetails.pickup.address}
                >
                  <View style={styles.pickupMarkerContainer}>
                    <View style={styles.pickupMarkerDot} />
                  </View>
                </Marker>
              )}

              {/* Provider Marker */}
              {providerLocation && (
                <Marker
                  coordinate={providerLocation}
                  title={provider?.name || 'Provider'}
                  description="Your provider"
                >
                  <View style={styles.providerMarkerContainer}>
                    <Ionicons name="car" size={24} color="#68bdee" />
                  </View>
                </Marker>
              )}

              {/* Dropoff Marker */}
              {jobDetails.dropoff?.coordinates && (
                <Marker
                  coordinate={{
                    latitude: jobDetails.dropoff.coordinates.lat,
                    longitude: jobDetails.dropoff.coordinates.lng
                  }}
                  title="Dropoff Location"
                  description={jobDetails.dropoff.address}
                >
                  <View style={styles.dropoffMarkerContainer}>
                    <Ionicons name="flag" size={20} color="#10B981" />
                  </View>
                </Marker>
              )}

              {/* Route from Backend */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={4}
                  strokeColor="#68bdee"
                />
              )}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Text style={styles.mapPlaceholderText}>Map not available</Text>
              <Text style={styles.mapPlaceholderSubtext}>Pickup location coordinates missing</Text>
            </View>
          )}

          {/* Map Controls */}
          {jobDetails?.pickup?.coordinates && (
            <>
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
            </>
          )}

          <View style={styles.pollingBadge}>
            <Text style={styles.pollingText}>Live • {pollingAttempts}</Text>
          </View>
        </View>

        {/* Route Info Card - NEW */}
        {routeData && (
          <View style={styles.routeInfoCard}>
            <View style={styles.routeInfoRow}>
              <View style={styles.routeInfoItem}>
                <Ionicons name="time-outline" size={18} color="#68bdee" />
                <Text style={styles.routeInfoLabel}>ETA</Text>
                <Text style={styles.routeInfoValue}>{routeData.eta}</Text>
              </View>
              <View style={styles.routeInfoDivider} />
              <View style={styles.routeInfoItem}>
                <Ionicons name="map-outline" size={18} color="#68bdee" />
                <Text style={styles.routeInfoLabel}>Distance</Text>
                <Text style={styles.routeInfoValue}>{routeData.distance}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Provider Card */}
        {provider && (
          <View style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <View style={styles.profileImageContainer}>
                {provider.profileImage ? (
                  <Image source={{ uri: provider.profileImage }} style={styles.profileImage} />
                ) : (
                  <Ionicons name="person" size={40} color="#68bdee" />
                )}
              </View>

              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                  <Text style={styles.reviewsText}>
                    • {provider.completedJobs || 127} jobs
                  </Text>
                </View>
                <Text style={styles.vehicleInfo}>
                  {provider.vehicle?.description || 'Professional Service Vehicle'}
                </Text>
                <Text style={styles.plateNumber}>
                  {provider.vehicle?.licensePlate || 'BHR 1234'}
                </Text>
              </View>
            </View>

            {providerLocation && (
              <View style={styles.locationInfoContainer}>
                <Ionicons name="location" size={14} color="#68bdee" />
                <Text style={styles.locationInfoText}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

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
        )}

        {/* Service Details Card */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>
          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingId?.slice(-8)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{jobDetails.serviceName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{jobDetails.vehicleType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {jobDetails.pickup?.address || 'Address not available'}
            </Text>
          </View>

          {jobDetails.dropoff && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {jobDetails.dropoff.address}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Cost</Text>
            <Text style={styles.detailValueHighlight}>
              {jobDetails.payment?.totalAmount || 0} BHD
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>JOB STATUS</Text>
          <View style={styles.cardDivider} />

          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxActive}>
              <View style={styles.statusDotActive} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextActive}>Provider Assigned</Text>
              <Text style={styles.statusTimeActive}>Just now</Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <View style={[
              styles.statusCheckboxInactive,
              (providerLocation) && styles.statusCheckboxActive
            ]}>
              {providerLocation && <View style={styles.statusDotActive} />}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[
                styles.statusTextInactive,
                providerLocation && styles.statusTextActive
              ]}>
                Provider On the Way
              </Text>
              <Text style={[
                styles.statusTimeInactive,
                providerLocation && styles.statusTimeActive
              ]}>
                {providerLocation ? `ETA: ${eta}` : 'Waiting for provider'}
              </Text>
            </View>
          </View>

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

      {/* Chat Popup */}
      <ChatPopup
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        bookingId={bookingId}
        providerName={jobDetails?.provider?.name || 'Provider'}
      />
    </View>
  );
};

export default ProviderAssignedScreen;
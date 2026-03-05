import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

// Google Maps API Keys
const ANDROID_API_KEY = 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A';
const IOS_API_KEY = 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU';
const API_BASE_URL = 'https://yhiw-backend.onrender.com';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ProviderLocation extends Coordinates {
  heading?: number;
  speed?: number;
  lastUpdate?: string;
}

interface UpdateEvent {
  id: string;
  type: 'accepted' | 'en-route' | 'arrived' | 'started' | 'completed';
  message: string;
  timestamp: Date;
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

const TrackProviderScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const navigationInProgress = useRef(false);

  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Coordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState<string>('5 min');
  const [distance, setDistance] = useState<string>('1.2 km');
  const [providerName, setProviderName] = useState<string>('Ahmed Al-Khalifa');
  const [providerPhone, setProviderPhone] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('en-route');

  const [region, setRegion] = useState<Region>({
    latitude: 26.2285,
    longitude: 50.5860,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Extract params
  const bookingId = params.bookingId as string;
  const providerLat = parseFloat(params.providerLat as string);
  const providerLng = parseFloat(params.providerLng as string);
  const pickupLat = parseFloat(params.pickupLat as string);
  const pickupLng = parseFloat(params.pickupLng as string);
  const dropoffLat = parseFloat(params.dropoffLat as string);
  const dropoffLng = parseFloat(params.dropoffLng as string);
  const providerNameParam = params.providerName as string;
  const providerIdParam = params.providerId as string;
  const providerPhoneParam = params.providerPhone as string;
  const estimatedArrival = params.estimatedArrival as string;
  const serviceType = params.serviceType as string || 'Towing Service';
  const vehicleType = params.vehicleType as string || 'Sedan';
  const pickupAddress = params.pickupAddress as string || 'Pickup Location';
  const totalAmount = params.totalAmount as string || '89.25';
  const lastUpdate = params.lastUpdate as string;

  useEffect(() => {
    if (providerNameParam) setProviderName(providerNameParam);
    if (providerIdParam) setProviderId(providerIdParam);
    if (providerPhoneParam) setProviderPhone(providerPhoneParam);

    // Set initial locations from params
    if (!isNaN(providerLat) && !isNaN(providerLng)) {
      setProviderLocation({
        latitude: providerLat,
        longitude: providerLng,
        lastUpdate: lastUpdate || new Date().toISOString(),
      });
    }

    if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
      setPickupLocation({ latitude: pickupLat, longitude: pickupLng });
    }

    if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
      setDropoffLocation({ latitude: dropoffLat, longitude: dropoffLng });
    }

    if (estimatedArrival) {
      setEta(estimatedArrival);
    }

    // Add initial updates
    setUpdates([
      {
        id: '1',
        type: 'accepted',
        message: 'Provider accepted your request',
        timestamp: new Date(Date.now() - 2 * 60000),
      },
      {
        id: '2',
        type: 'en-route',
        message: 'Provider is on the way',
        timestamp: new Date(Date.now() - 1 * 60000),
      },
    ]);

    // Get current user location
    getUserLocation();

    // Start polling for provider location and job status
    if (bookingId) {
      startPolling();
    }

    return () => {
      console.log('🧹 Cleaning up TrackProviderScreen');
      isMounted.current = false;
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
    };
  }, []);

  const startPolling = () => {
    console.log('🔄 Starting polling for provider location & job status (every 10 seconds)');
    
    const poll = async () => {
      if (!isMounted.current || navigationInProgress.current) return;
      
      // Fetch both location and status in parallel
      await Promise.all([
        fetchProviderLocation(),
        fetchJobStatus()
      ]);
      
      if (isMounted.current && !navigationInProgress.current) {
        pollingTimer.current = setTimeout(poll, 10000); // Poll every 10 seconds
      }
    };
    
    // Start polling immediately
    poll();
  };

  const fetchProviderLocation = async () => {
    if (!bookingId) {
      console.log('❌ No bookingId available for location fetch');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const url = `${API_BASE_URL}/api/customer/${bookingId}/provider-location`;
      console.log(`📍 Polling #${pollingAttempts + 1} - Fetching provider location`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!isMounted.current) return;

      if (!response.ok) {
        console.log(`❌ Location fetch failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      setPollingAttempts(prev => prev + 1);

      if (data.success && data.location) {
        console.log(`✅ Location received: ${data.location.latitude}, ${data.location.longitude}`);
        
        const newLocation = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          heading: data.location.heading,
          speed: data.location.speed,
          lastUpdate: data.timestamp || new Date().toISOString(),
        };

        setProviderLocation(newLocation);

        // Update route between provider and pickup
        if (pickupLocation) {
          getRoute(newLocation, pickupLocation);
        }

        // Fit map to show both provider and pickup (only on first location)
        if (isLoading && pickupLocation) {
          fitMapToCoordinates(newLocation, pickupLocation);
        }

        setIsLoading(false);
      }

    } catch (error) {
      console.log(`❌ Error fetching location: ${error}`);
    }
  };

  const fetchJobStatus = async () => {
    if (!bookingId || navigationInProgress.current) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = `${API_BASE_URL}/api/jobs/${bookingId}/status`;
      console.log(`📊 Checking job status...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data: JobStatusResponse = await response.json();
      console.log(`📊 Job status: ${data.status}`);

      // Update current status
      setCurrentStatus(data.status);

      // Update ETA if provided
      if (data.eta) {
        setEta(data.eta);
      }

      // Update distance if provided
      if (data.distance) {
        setDistance(data.distance);
      }

      // ===== HANDLE PROVIDER ARRIVAL =====
      if (data.status === 'arrived') {
        // Check if we've already added this update
        if (!updates.some(u => u.type === 'arrived')) {
          console.log('✅ Provider has ARRIVED!');
          
          const newUpdate: UpdateEvent = {
            id: Date.now().toString(),
            type: 'arrived',
            message: 'Provider has arrived at your location',
            timestamp: new Date(),
          };
          setUpdates(prev => [newUpdate, ...prev]);
          
          // Show alert to user
          Alert.alert(
            'Provider Arrived',
            `${providerName} has arrived at your location. Please go outside to meet them.`,
            [{ text: 'OK' }]
          );
        }
      }

      // ===== HANDLE SERVICE STARTED =====
      if (data.status === 'started') {
        console.log('✅✅✅ SERVICE HAS STARTED - Navigating to ServiceInProgress');
        
        // Check if we've already added this update
        if (!updates.some(u => u.type === 'started')) {
          const newUpdate: UpdateEvent = {
            id: Date.now().toString(),
            type: 'started',
            message: 'Service has started',
            timestamp: new Date(),
          };
          setUpdates(prev => [newUpdate, ...prev]);
        }

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

      // ===== HANDLE SERVICE COMPLETED =====
      if (data.status === 'completed') {
        console.log('✅ Service completed');
        
        if (!updates.some(u => u.type === 'completed')) {
          const newUpdate: UpdateEvent = {
            id: Date.now().toString(),
            type: 'completed',
            message: 'Service completed',
            timestamp: new Date(),
          };
          setUpdates(prev => [newUpdate, ...prev]);
        }

        // You could navigate to a completion/rating screen here
        // router.push({ pathname: '/(customer)/ServiceCompleted', params: { bookingId } });
      }

    } catch (error) {
      console.log('Error checking job status:', error);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for tracking');
        return;
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
    }
  };

  const getRoute = async (origin: Coordinates, destination: Coordinates) => {
    try {
      const apiKey = Platform.select({
        android: ANDROID_API_KEY,
        ios: IOS_API_KEY,
      });

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);

        // Update ETA and distance from route
        if (data.routes[0].legs.length > 0) {
          const leg = data.routes[0].legs[0];
          setEta(leg.duration.text);
          setDistance(leg.distance.text);
        }
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  const decodePolyline = (t: string, e: number = 5) => {
    let points = [];
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

  const fitMapToCoordinates = (coord1: Coordinates, coord2: Coordinates) => {
    if (!mapRef.current) return;

    const latitudes = [coord1.latitude, coord2.latitude];
    const longitudes = [coord1.longitude, coord2.longitude];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };

    setRegion(newRegion);
    mapRef.current.animateToRegion(newRegion, 1000);
  };

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Call', `Calling ${providerName}...`);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: {
        providerName,
        providerId,
        bookingId,
      }
    });
  };

  const handleStartService = () => {
    // This button should only appear when provider has arrived
    Alert.alert(
      'Start Service',
      'Have you met the provider and are you ready to start the service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start',
          onPress: async () => {
            try {
              // Update status via API
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/jobs/${bookingId}/start`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              // The next poll will detect 'started' status and navigate
              // But we can also navigate immediately
              navigationInProgress.current = true;
              
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
            } catch (error) {
              console.error('Error starting service:', error);
              Alert.alert('Error', 'Failed to start service. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => Linking.openURL('tel:+97312345678') },
        { text: 'Chat Support', onPress: () => console.log('Open chat support') },
      ]
    );
  };

  const handleRecenter = () => {
    if (providerLocation && pickupLocation) {
      fitMapToCoordinates(providerLocation, pickupLocation);
    } else if (providerLocation) {
      mapRef.current?.animateToRegion({
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleOpenInMaps = () => {
    if (providerLocation && pickupLocation) {
      const url = Platform.select({
        ios: `maps://app?saddr=${providerLocation.latitude},${providerLocation.longitude}&daddr=${pickupLocation.latitude},${pickupLocation.longitude}`,
        android: `google.navigation:q=${pickupLocation.latitude},${pickupLocation.longitude}`,
      });

      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const forceRefresh = () => {
    console.log('🔄 Manually refreshing');
    fetchProviderLocation();
    fetchJobStatus();
  };

  // Format time for updates
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} min ago`;
  };

  // Check if provider has arrived (to show Start Service button)
  const hasProviderArrived = currentStatus === 'arrived';

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapSection}>
        {isLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color="#68bdee" />
            <Text style={styles.mapLoaderText}>Loading provider location...</Text>
          </View>
        )}

        {/* Debug Button - TEMPORARY for testing */}
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={forceRefresh}
        >
          <Text style={styles.debugButtonText}>🔄</Text>
        </TouchableOpacity>

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
          showsCompass={true}
        >
          {/* Provider Marker */}
          {providerLocation && (
            <Marker
              coordinate={providerLocation}
              title={providerName}
              description="Your provider"
            >
              <View style={styles.providerMarker}>
                <Ionicons name="car" size={24} color="#68bdee" />
              </View>
            </Marker>
          )}

          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              title="Your Location"
              description="Pickup point"
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={24} color="#ff4444" />
              </View>
            </Marker>
          )}

          {/* Dropoff Marker (if available) */}
          {dropoffLocation && (
            <Marker
              coordinate={dropoffLocation}
              title="Destination"
              description="Dropoff point"
              pinColor="#10B981"
            />
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

        {/* Arriving Badge */}
        <View style={styles.arrivingBadge}>
          <Ionicons name="time-outline" size={18} color="#3c3c3c" />
          <View>
            <Text style={styles.arrivingLabel}>Arriving in</Text>
            <Text style={styles.arrivingTime}>{eta}</Text>
          </View>
        </View>

        {/* Status Badge - Shows current job status */}
        <View style={[
          styles.statusBadge,
          hasProviderArrived ? styles.statusBadgeGreen : styles.statusBadgeBlue
        ]}>
          <Text style={styles.statusText}>
            {currentStatus === 'arrived' ? 'PROVIDER ARRIVED' : 
             currentStatus === 'started' ? 'SERVICE STARTED' :
             currentStatus === 'en-route' ? 'ON THE WAY' :
             currentStatus?.toUpperCase() || 'EN ROUTE'}
          </Text>
        </View>

        {/* Map Controls */}
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={20} color="#68bdee" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapsButton} onPress={handleOpenInMaps}>
          <Ionicons name="navigate-outline" size={20} color="#68bdee" />
        </TouchableOpacity>

        {/* Polling Info */}
        <View style={styles.pollingBadge}>
          <Text style={styles.pollingText}>Live • {pollingAttempts}</Text>
        </View>

        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceLabel}>Distance</Text>
          <Text style={styles.distanceValue}>{distance}</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Provider Info */}
          <View style={styles.providerSection}>
            <View style={styles.providerTextContainer}>
              <Text style={styles.providerName}>{providerName}</Text>
              <Text style={styles.providerStatus}>
                {hasProviderArrived 
                  ? 'Provider has arrived at your location' 
                  : providerLocation 
                    ? 'Moving towards your location' 
                    : 'Waiting for location...'}
              </Text>
              {providerLocation?.lastUpdate && (
                <Text style={styles.lastUpdate}>
                  Last updated: {new Date(providerLocation.lastUpdate).toLocaleTimeString()}
                </Text>
              )}
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={32} color="#68bdee" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
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

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationDotContainer}>
                <View style={styles.locationDotOuter} />
                <View style={styles.locationDotInner} />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Provider Current Location</Text>
                <Text style={styles.locationValue}>
                  {providerLocation
                    ? `${providerLocation.latitude.toFixed(4)}, ${providerLocation.longitude.toFixed(4)}`
                    : 'Loading...'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.locationConnector} />

            <View style={styles.locationItem}>
              <View style={styles.locationDotOutline} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your Location</Text>
                <Text style={styles.locationValue}>
                  {pickupLocation
                    ? `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`
                    : 'Loading...'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Updates Card */}
          <View style={styles.updatesCard}>
            <Text style={styles.updatesTitle}>UPDATES</Text>

            {updates.map((update) => (
              <View key={update.id} style={styles.updateItem}>
                <View style={[
                  styles.updateDot,
                  update.type === 'accepted' || update.type === 'en-route' || update.type === 'arrived' || update.type === 'started'
                    ? styles.updateDotGreen
                    : styles.updateDotGray
                ]} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>{update.message}</Text>
                  <Text style={styles.updateTime}>{formatTime(update.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Start Service Button - Only show when provider has arrived */}
          {hasProviderArrived && (
            <TouchableOpacity
              style={styles.startServiceButton}
              onPress={handleStartService}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#68bdee', '#4a9fd6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.startServiceText}>
                  Provider Arrived - Start Service
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Contact Support Button */}
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
  },
  mapSection: {
    height: height * 0.5,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLoaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#3c3c3c',
  },
  debugButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 15,
    elevation: 5,
  },
  debugButtonText: {
    fontSize: 18,
  },
  providerMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  pickupMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  arrivingBadge: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  arrivingLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrivingTime: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 120,
    left: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 5,
  },
  statusBadgeBlue: {
    backgroundColor: '#68bdee',
  },
  statusBadgeGreen: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  recenterButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  mapsButton: {
    position: 'absolute',
    top: 115,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  pollingBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#68bdee',
    zIndex: 5,
  },
  pollingText: {
    fontSize: 10,
    color: '#68bdee',
    fontWeight: '600',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  distanceLabel: {
    fontSize: 9,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 80,
    height: 4,
    backgroundColor: '#d0d0d0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  providerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  providerTextContainer: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerStatus: {
    fontSize: 13,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
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
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotContainer: {
    position: 'relative',
    width: 20,
    height: 20,
    marginRight: 12,
    marginTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDotOuter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#68bdee',
    opacity: 0.3,
  },
  locationDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#68bdee',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  locationDotOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: 'transparent',
    marginTop: 3,
    marginRight: 12,
  },
  locationConnector: {
    width: 2,
    height: 30,
    backgroundColor: '#d0d0d0',
    marginLeft: 7,
    marginVertical: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  locationValue: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  updatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  updatesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  updateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 3,
  },
  updateDotGreen: {
    backgroundColor: '#4CAF50',
  },
  updateDotGray: {
    backgroundColor: '#b0b0b0',
  },
  updateContent: {
    flex: 1,
  },
  updateText: {
    fontSize: 13,
    color: '#5c5c5c',
    marginBottom: 2,
  },
  updateTime: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  startServiceButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startServiceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default TrackProviderScreen;
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Region } from 'react-native-maps';
import ChatPopup from './components/ChatPopup';
import { styles } from './styles/TrackProviderStyles';

const { height } = Dimensions.get('window');
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
  type: 'accepted' | 'started' | 'completed' | 'completed_confirmed';
  message: string;
  timestamp: Date;
}

interface JobStatusResponse {
  status: 'accepted' | 'started' | 'completed' | 'cancelled' | 'completed_confirmed';
  eta?: string;
  distance?: string;
  provider?: {
    name: string;
    phone: string;
    rating: number;
  };
}

interface RouteResponse {
  success: boolean;
  usingFallback?: boolean;
  route: {
    providerLocation: {
      latitude: number;
      longitude: number;
      lastUpdate: string;
      heading?: number;
      speed?: number;
    };
    pickupLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
    dropoffLocation?: {
      latitude: number;
      longitude: number;
      address: string;
    } | null;
    polyline?: string;
    distance: string;
    eta: string;
    distanceValue?: number;
    etaValue?: number;
    steps?: Array<{
      instruction: string;
      distance: string;
      duration: string;
    }>;
    startAddress?: string;
    endAddress?: string;
    providerName: string;
    providerPhone: string;
  };
}

interface LiveTrackingResponse {
  success: boolean;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    lastUpdate: string;
  } | null;
  status: string;
  eta?: string;
  distance?: string;
  providerName?: string;
  providerPhone?: string;
}

const TrackProviderScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const routeFetchTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const navigationInProgress = useRef(false);
  const initialRouteFetched = useRef(false);

  // Chat state
  const [chatVisible, setChatVisible] = useState(false);

  // Location states
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Coordinates | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('Loading address...');
  const [dropoffLocation, setDropoffLocation] = useState<Coordinates | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<string>('');
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState<string>('Calculating...');
  const [distance, setDistance] = useState<string>('Calculating...');
  const [providerName, setProviderName] = useState<string>('Provider');
  const [providerPhone, setProviderPhone] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<string>('accepted');
  const [apiError, setApiError] = useState<string | null>(null);

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
  const pickupAddressParam = params.pickupAddress as string || 'Pickup Location';
  const totalAmount = params.totalAmount as string || '0';

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    const logMessage = `🔍 [TrackProvider] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  const handleMessage = () => {
    addDebug(`💬 Opening chat popup with provider`);
    setChatVisible(true);
  };

  useEffect(() => {
    addDebug(`🚀 Component mounted with bookingId: ${bookingId}`);

    // Set provider info from params
    if (providerNameParam) setProviderName(providerNameParam);
    if (providerIdParam) setProviderId(providerIdParam);
    if (providerPhoneParam) setProviderPhone(providerPhoneParam);
    if (pickupAddressParam) setPickupAddress(pickupAddressParam);

    // Set initial locations from params (as fallback)
    if (!isNaN(providerLat) && !isNaN(providerLng)) {
      addDebug(`📍 Initial provider location from params: ${providerLat}, ${providerLng}`);
      setProviderLocation({
        latitude: providerLat,
        longitude: providerLng,
        lastUpdate: new Date().toISOString(),
      });
    }

    if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
      addDebug(`📍 Pickup location from params: ${pickupLat}, ${pickupLng}`);
      setPickupLocation({ latitude: pickupLat, longitude: pickupLng });
    }

    // Handle dropoff location - only set if both coordinates are valid
    if (!isNaN(dropoffLat) && !isNaN(dropoffLng) && dropoffLat !== 0 && dropoffLng !== 0) {
      addDebug(`📍 Dropoff location from params: ${dropoffLat}, ${dropoffLng}`);
      setDropoffLocation({ latitude: dropoffLat, longitude: dropoffLng });
    }

    if (estimatedArrival) {
      setEta(estimatedArrival);
    }

    // Add initial updates
    const initialUpdates: UpdateEvent[] = [
      {
        id: '1',
        type: 'accepted',
        message: 'Provider accepted your request',
        timestamp: new Date(Date.now() - 2 * 60000),
      }
    ];
    setUpdates(initialUpdates);

    // Get current user location
    getUserLocation();

    // Start polling for provider location and job status
    if (bookingId) {
      startPolling();
    }

    return () => {
      addDebug('🧹 Cleaning up TrackProviderScreen');
      isMounted.current = false;
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      if (routeFetchTimer.current) {
        clearTimeout(routeFetchTimer.current);
        routeFetchTimer.current = null;
      }
    };
  }, []);

  // Fetch route data from backend (includes polyline and addresses)
  const fetchRouteData = async () => {
    if (!bookingId || initialRouteFetched.current) return;

    try {
      addDebug(`🗺️ Fetching route data from backend`);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        addDebug('❌ No token found');
        return;
      }

      // SIMPLE GET request - backend knows all locations
      const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/route`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        addDebug(`❌ Route fetch failed: ${response.status}`);
        return;
      }

      const data: RouteResponse = await response.json();
      addDebug(`✅ Route data received`, data);

      if (data.success && data.route) {
        initialRouteFetched.current = true;

        // Update locations with real data from backend
        if (data.route.providerLocation) {
          setProviderLocation({
            latitude: data.route.providerLocation.latitude,
            longitude: data.route.providerLocation.longitude,
            heading: data.route.providerLocation.heading || 0,
            speed: data.route.providerLocation.speed || 0,
            lastUpdate: data.route.providerLocation.lastUpdate,
          });
        }

        if (data.route.pickupLocation) {
          setPickupLocation({
            latitude: data.route.pickupLocation.latitude,
            longitude: data.route.pickupLocation.longitude,
          });
          setPickupAddress(data.route.pickupLocation.address);
        }

        // Handle dropoff location - only if it exists with valid coordinates
        if (data.route.dropoffLocation &&
          data.route.dropoffLocation.latitude &&
          data.route.dropoffLocation.longitude) {
          setDropoffLocation({
            latitude: data.route.dropoffLocation.latitude,
            longitude: data.route.dropoffLocation.longitude,
          });
          setDropoffAddress(data.route.dropoffLocation.address || 'Dropoff location');
        } else {
          setDropoffLocation(null);
        }

        // Update ETA and distance
        if (data.route.eta) setEta(data.route.eta);
        if (data.route.distance) setDistance(data.route.distance);

        // Decode and set route polyline
        if (data.route.polyline) {
          const points = decodePolyline(data.route.polyline);
          setRouteCoordinates(points);
          addDebug(`🗺️ Decoded ${points.length} polyline points`);
        }

        // Update provider info
        if (data.route.providerName) setProviderName(data.route.providerName);
        if (data.route.providerPhone) setProviderPhone(data.route.providerPhone);

        // Fit map to show both locations
        if (data.route.providerLocation && data.route.pickupLocation) {
          fitMapToCoordinates(
            {
              latitude: data.route.providerLocation.latitude,
              longitude: data.route.providerLocation.longitude,
            },
            {
              latitude: data.route.pickupLocation.latitude,
              longitude: data.route.pickupLocation.longitude,
            }
          );
        }

        setIsLoading(false);
        setApiError(null);
      }
    } catch (error) {
      addDebug(`❌ Error fetching route: ${error}`);
      setApiError('Failed to load route data');
    }
  };

  // Fetch live tracking data (lightweight polling)
  const fetchLiveTracking = async () => {
    if (!bookingId) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/live-tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addDebug(`⚠️ Live tracking fetch failed: ${response.status}`);
        return;
      }

      const data: LiveTrackingResponse = await response.json();

      if (data.success) {
        setPollingAttempts(prev => prev + 1);

        // Update provider location
        if (data.location) {
          const newLocation = {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            heading: data.location.heading || 0,
            speed: data.location.speed || 0,
            lastUpdate: data.location.lastUpdate,
          };

          setProviderLocation(newLocation);

          // Refresh route when provider location changes significantly
          if (providerLocation &&
            (Math.abs(newLocation.latitude - providerLocation.latitude) > 0.001 ||
              Math.abs(newLocation.longitude - providerLocation.longitude) > 0.001)) {

            if (routeFetchTimer.current) {
              clearTimeout(routeFetchTimer.current);
            }

            routeFetchTimer.current = setTimeout(() => {
              fetchRouteData(); // Refresh route with new provider location
            }, 5000); // Wait 5 seconds after significant movement
          }
        }

        // Update status
        if (data.status) {
          setCurrentStatus(data.status);
        }

        // Update ETA if provided
        if (data.eta) setEta(data.eta);
        if (data.distance) setDistance(data.distance);
        if (data.providerName) setProviderName(data.providerName);
        if (data.providerPhone) setProviderPhone(data.providerPhone);
      }
    } catch (error) {
      addDebug(`❌ Error fetching live tracking: ${error}`);
    }
  };

  // Fetch job status - polls every 10 seconds
  const fetchJobStatus = async () => {
    if (!bookingId || navigationInProgress.current) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addDebug(`⚠️ Job status fetch failed: ${response.status}`);
        return;
      }

      const data: JobStatusResponse = await response.json();
      addDebug(`📊 Job status: ${data.status}`);

      setCurrentStatus(data.status);

      // Update ETA if provided
      if (data.eta) setEta(data.eta);
      if (data.distance) setDistance(data.distance);

      // ===== AUTO-NAVIGATE WHEN SERVICE STARTS =====
      if (data.status === 'started') {
        addDebug('✅✅✅ SERVICE HAS STARTED - Auto-navigating to ServiceInProgress');

        if (!updates.some(u => u.type === 'started')) {
          const newUpdate: UpdateEvent = {
            id: Date.now().toString(),
            type: 'started',
            message: 'Service has started',
            timestamp: new Date(),
          };
          setUpdates(prev => [newUpdate, ...prev]);
        }

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
      addDebug(`❌ Error checking job status: ${error}`);
    }
  };

  const startPolling = () => {
    addDebug('🔄 Starting polling (every 10 seconds)');

    // Fetch route data first (only once)
    fetchRouteData();

    const poll = async () => {
      if (!isMounted.current || navigationInProgress.current) return;

      await Promise.all([
        fetchLiveTracking(),
        fetchJobStatus()
      ]);

      if (isMounted.current && !navigationInProgress.current) {
        pollingTimer.current = setTimeout(poll, 10000);
      }
    };

    // Start first poll after 2 seconds
    setTimeout(poll, 2000);
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        addDebug('⚠️ Location permission denied');
        Alert.alert('Permission denied', 'Location permission is required for tracking');
        return;
      }
      addDebug('✅ Location permission granted');
    } catch (error) {
      addDebug(`❌ Error getting location permission: ${error}`);
    }
  };

  const decodePolyline = (encoded: string): Coordinates[] => {
    if (!encoded) return [];

    // Check if it's a simple pipe-separated format (lat,lng|lat,lng)
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

    // Google's encoded polyline format
    const points: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    const len = encoded.length;

    while (index < len) {
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

  
  const fitMapToCoordinates = (coord1: Coordinates, coord2: Coordinates) => {
    if (!mapRef.current || !coord1 || !coord2) return;

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
      addDebug(`📞 Calling provider: ${providerPhone}`);
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Call', `Calling ${providerName}...`);
    }
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
      addDebug(`🗺️ Recentering map`);
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
      addDebug(`🗺️ Opening in external maps app`);
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
    addDebug('🔄 Manually refreshing');
    fetchLiveTracking();
    fetchJobStatus();
    fetchRouteData(); // Always refresh route on manual refresh
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} min ago`;
  };

  if (isLoading && !providerLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
        {apiError && <Text style={styles.errorText}>{apiError}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapSection}>
        {isLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color="#68bdee" />
            <Text style={styles.mapLoaderText}>Loading route...</Text>
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={forceRefresh}
        >
          <Ionicons name="refresh" size={20} color="#68bdee" />
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
          onMapReady={() => addDebug('🗺️ Map is ready')}
        >
          {/* Provider Marker */}
          {providerLocation && (
            <Marker
              coordinate={{
                latitude: providerLocation.latitude,
                longitude: providerLocation.longitude
              }}
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
              coordinate={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude
              }}
              title="Your Location"
              description={pickupAddress}
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={24} color="#ff4444" />
              </View>
            </Marker>
          )}

          {/* Dropoff Marker */}
          {dropoffLocation && dropoffLocation.latitude && dropoffLocation.longitude && (
            <Marker
              coordinate={{
                latitude: dropoffLocation.latitude,
                longitude: dropoffLocation.longitude
              }}
              title="Destination"
              description={dropoffAddress}
            >
              <View style={styles.dropoffMarker}>
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

        {/* Arriving Badge */}
        <View style={styles.arrivingBadge}>
          <Ionicons name="time-outline" size={18} color="#3c3c3c" />
          <View>
            <Text style={styles.arrivingLabel}>Arriving in</Text>
            <Text style={styles.arrivingTime}>{eta}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          currentStatus === 'started' ? styles.statusBadgeGreen : styles.statusBadgeBlue
        ]}>
          <Text style={styles.statusText}>
            {currentStatus === 'started' ? 'SERVICE STARTED' :
              currentStatus === 'accepted' ? 'ON THE WAY' :
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
                {currentStatus === 'started'
                  ? 'Service has started'
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
                <Text style={styles.locationValue} numberOfLines={2}>
                  {providerLocation
                    ? `${providerLocation.latitude.toFixed(6)}, ${providerLocation.longitude.toFixed(6)}`
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
                <Text style={styles.locationValue} numberOfLines={2}>
                  {pickupAddress}
                </Text>
              </View>
            </View>

            {dropoffLocation && dropoffLocation.latitude && dropoffLocation.longitude && (
              <>
                <View style={styles.locationConnector} />
                <View style={styles.locationItem}>
                  <View style={[styles.locationDotOutline, { borderColor: '#10B981' }]} />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationLabel}>Destination</Text>
                    <Text style={styles.locationValue} numberOfLines={2}>
                      {dropoffAddress || 'Dropoff location'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Updates Card */}
          <View style={styles.updatesCard}>
            <Text style={styles.updatesTitle}>UPDATES</Text>

            {updates.map((update) => (
              <View key={update.id} style={styles.updateItem}>
                <View style={[
                  styles.updateDot,
                  update.type === 'accepted' || update.type === 'started'
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

      {/* Chat Popup */}
      <ChatPopup
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        bookingId={bookingId}
        providerName={providerName}
      />
    </View>
  );
};




export default TrackProviderScreen;
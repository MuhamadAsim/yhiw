import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  Linking,
  Dimensions,
  AppState,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import ChatPopup from './components/ChatPopup';

const { height } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface JobDetails {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  distance: string;
  eta: string;
  navigationTips?: string;
  status?: string;
  routePolyline?: string; // Add this for route from backend
}

export default function NavigateToCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  console.log('🚀 NavigateToCustomerScreen mounted with bookingId:', bookingId);

  const mapRef = useRef<MapView>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const jobRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const routeFetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const [chatVisible, setChatVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [cancellationAcknowledged, setCancellationAcknowledged] = useState(false);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  const isValidCoordinate = (coord: Coordinates | null | undefined): coord is Coordinates => {
    return !!coord &&
      typeof coord.latitude === 'number' &&
      typeof coord.longitude === 'number' &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude) &&
      coord.latitude !== 0 &&
      coord.longitude !== 0;
  };

  // Helper to safely parse float
  const safeParseFloat = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'undefined' || value === null) return defaultValue;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper to safely get string
  const safeGetString = (value: any, defaultValue: string = ''): string => {
    if (typeof value === 'undefined' || value === null) return defaultValue;
    return String(value);
  };

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [NavigateToCustomer] ${message}`, data || '');
  };

  // Save booking to AsyncStorage when component mounts
  const saveBookingToStorage = async () => {
    try {
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      let activeBookings = activeBookingsJson ? JSON.parse(activeBookingsJson) : [];
      
      const existingIndex = activeBookings.findIndex((b: any) => b.bookingId === bookingId);
      
      const bookingData = {
        bookingId,
        status: 'accepted',
        customerName: jobDetails?.customerName || safeGetString(params.customerName, 'Customer'),
        customerPhone: jobDetails?.customerPhone || safeGetString(params.customerPhone, ''),
        pickupLocation: jobDetails?.pickupLocation || safeGetString(params.pickupLocation, ''),
        timestamp: new Date().toISOString(),
        screen: 'NavigateToCustomer',
      };

      if (existingIndex >= 0) {
        activeBookings[existingIndex] = { ...activeBookings[existingIndex], ...bookingData };
      } else {
        activeBookings.push(bookingData);
      }

      await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
      await AsyncStorage.setItem('currentBookingId', bookingId);
      await AsyncStorage.setItem('currentBookingStatus', 'accepted');
      
      addDebug('✅ Booking saved to AsyncStorage:', bookingData);
    } catch (error) {
      addDebug('❌ Error saving booking to storage:', error);
    }
  };

  // Check job status from backend
  const checkJobStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      addDebug('📡 Checking job status...');

      const response = await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          addDebug(`📊 Job status: ${data.status}`);
          
          if (data.status === 'cancelled' && !cancellationAcknowledged) {
            handleJobCancelled(data.cancellationReason || 'Customer cancelled the service');
          }
          
          if (data.job) {
            setJobDetails(prev => ({
              ...(prev || {}),
              ...data.job,
              status: data.status,
            }));
          }
        }
      } else {
        addDebug(`⚠️ Status check failed: ${response.status}`);
      }
    } catch (error) {
      addDebug('❌ Error checking job status:', error);
    }
  };

  // Handle job cancellation
  const handleJobCancelled = (reason: string) => {
    if (cancellationAcknowledged) return;
    
    setCancellationAcknowledged(true);
    
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
    if (jobRefreshInterval.current) {
      clearInterval(jobRefreshInterval.current);
      jobRefreshInterval.current = null;
    }
    if (routeFetchTimeout.current) {
      clearTimeout(routeFetchTimeout.current);
      routeFetchTimeout.current = null;
    }

    Alert.alert(
      'Service Cancelled',
      `The customer has cancelled this service.\n\nReason: ${reason}`,
      [
        {
          text: 'OK',
          onPress: async () => {
            await cleanupBooking();
            router.replace('/(provider)/HomePage');
          }
        }
      ],
      { cancelable: false }
    );
  };

  // Clean up booking from storage
  const cleanupBooking = async () => {
    try {
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
      }

      const currentId = await AsyncStorage.getItem('currentBookingId');
      if (currentId === bookingId) {
        await AsyncStorage.removeItem('currentBookingId');
        await AsyncStorage.removeItem('currentBookingStatus');
      }

      addDebug('✅ Booking cleaned up from storage');
    } catch (error) {
      addDebug('❌ Error cleaning up booking:', error);
    }
  };

  // Fetch fresh job details from backend
  const fetchActiveJobDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      addDebug(`📡 Fetching active job details for: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          addDebug('📦 Fresh job details received:', data.job);
          setJobDetails(prev => ({
            ...(prev || {}),
            ...data.job,
            status: data.status || prev?.status,
            pickupLat: safeParseFloat(data.job.pickupLat, prev?.pickupLat),
            pickupLng: safeParseFloat(data.job.pickupLng, prev?.pickupLng),
            dropoffLat: safeParseFloat(data.job.dropoffLat, prev?.dropoffLat),
            dropoffLng: safeParseFloat(data.job.dropoffLng, prev?.dropoffLng),
            customerRating: safeParseFloat(data.job.customerRating, 4.5),
          } as JobDetails));

          // If route polyline is provided in job details, decode it
          if (data.job.routePolyline) {
            const points = decodePolyline(data.job.routePolyline);
            const validPoints = points.filter(point => isValidCoordinate(point));
            if (validPoints.length > 0) {
              setRouteCoordinates(validPoints);
              addDebug(`🗺️ Route from job details: ${validPoints.length} points`);
            }
          }
        }
      } else {
        addDebug(`⚠️ Failed to fetch active job: ${response.status}`);
      }
    } catch (error) {
      addDebug('❌ Error fetching active job:', error);
    }
  };

  // Fetch route from backend (not directly from Google)
  const fetchRouteFromBackend = async (start: Coordinates, end: Coordinates) => {
    if (!isValidCoordinate(start) || !isValidCoordinate(end) || isFetchingRoute) {
      return;
    }

    setIsFetchingRoute(true);
    addDebug(`📍 Fetching route from backend for booking: ${bookingId}`);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/route`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLat: start.latitude,
          originLng: start.longitude,
          destLat: end.latitude,
          destLng: end.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.route) {
          // Decode polyline if provided
          if (data.route.polyline) {
            const points = decodePolyline(data.route.polyline);
            const validPoints = points.filter(point => isValidCoordinate(point));
            
            if (validPoints.length > 0) {
              setRouteCoordinates(validPoints);
              addDebug(`🗺️ Route updated with ${validPoints.length} points from backend`);
            }
          }
          
          // Update ETA and distance from backend
          setJobDetails(prev => ({
            ...prev!,
            distance: data.route.distance || prev?.distance || 'Calculating...',
            eta: data.route.eta || prev?.eta || 'Calculating...',
          }));
          
          addDebug(`📊 New ETA: ${data.route.eta}, Distance: ${data.route.distance}`);
        } else {
          addDebug('⚠️ No route data in response');
        }
      } else {
        addDebug(`⚠️ Route fetch failed: ${response.status}`);
      }
    } catch (error) {
      addDebug('Error fetching route from backend:', error);
    } finally {
      setIsFetchingRoute(false);
    }
  };

  // Initialize with params data and fetch fresh data
  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }

    addDebug('📦 Setting initial job data from navigation params');

    const jobFromParams: JobDetails = {
      bookingId: bookingId,
      customerName: safeGetString(params.customerName, 'Customer'),
      customerPhone: safeGetString(params.customerPhone, ''),
      customerRating: safeParseFloat(params.customerRating, 4.5),
      pickupLocation: safeGetString(params.pickupLocation, 'Pickup location'),
      pickupLat: safeParseFloat(params.pickupLat, undefined),
      pickupLng: safeParseFloat(params.pickupLng, undefined),
      dropoffLocation: safeGetString(params.dropoffLocation, undefined),
      dropoffLat: safeParseFloat(params.dropoffLat, undefined),
      dropoffLng: safeParseFloat(params.dropoffLng, undefined),
      distance: safeGetString(params.distance, 'Calculating...'),
      eta: safeGetString(params.eta, 'Calculating...'),
      navigationTips: safeGetString(params.description, 'Call customer upon arrival.'),
      status: 'accepted',
    };

    setJobDetails(jobFromParams);

    saveBookingToStorage();
    fetchActiveJobDetails();
    checkLocationPermission();

    statusCheckInterval.current = setInterval(checkJobStatus, 10000);
    checkJobStatus();
    jobRefreshInterval.current = setInterval(fetchActiveJobDetails, 30000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkJobStatus();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
      if (jobRefreshInterval.current) {
        clearInterval(jobRefreshInterval.current);
        jobRefreshInterval.current = null;
      }
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
      if (routeFetchTimeout.current) {
        clearTimeout(routeFetchTimeout.current);
        routeFetchTimeout.current = null;
      }
      subscription.remove();
      addDebug('🧹 Cleanup complete');
    };
  }, []);

  // Start location tracking when we have permission and job is loaded
  useEffect(() => {
    if (locationPermission && jobDetails) {
      startLocationTracking();
    }
  }, [locationPermission, jobDetails]);

  // Fetch route when both current location and pickup location are available
  useEffect(() => {
    if (currentLocation && jobDetails?.pickupLat && jobDetails?.pickupLng) {
      const destination = {
        latitude: jobDetails.pickupLat,
        longitude: jobDetails.pickupLng,
      };
      
      if (isValidCoordinate(currentLocation) && isValidCoordinate(destination)) {
        // Debounce route fetching to avoid too many calls
        if (routeFetchTimeout.current) {
          clearTimeout(routeFetchTimeout.current);
        }
        
        routeFetchTimeout.current = setTimeout(() => {
          fetchRouteFromBackend(currentLocation, destination);
        }, 2000); // Wait 2 seconds after last location update
      }
    }
  }, [currentLocation, jobDetails?.pickupLat, jobDetails?.pickupLng]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        requestLocationPermission();
      }
    } catch (error) {
      addDebug('Error checking location permission:', error);
      setLocationPermission(false);
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use navigation.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        setIsLoading(false);
      }
    } catch (error) {
      addDebug('Error requesting location permission:', error);
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      addDebug('📍 Current location:', currentLoc);
      setCurrentLocation(currentLoc);
      setIsLoading(false);

      if (mapRef.current && isValidCoordinate(currentLoc)) {
        mapRef.current.animateToRegion({
          ...currentLoc,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }

      return currentLoc;
    } catch (error) {
      addDebug('Error getting current location:', error);
      setIsLoading(false);
      return null;
    }
  };

  const startLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
    }

    addDebug('📍 Starting location tracking (every 10 seconds)');

    updateProviderLocation();
    locationInterval.current = setInterval(updateProviderLocation, 10000);
  };

  const updateProviderLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const newLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      addDebug('📍 Sending location update:', newLoc);
      setCurrentLocation(newLoc);

      const token = await AsyncStorage.getItem('userToken');
      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');

      if (token && firebaseUserId && isValidCoordinate(newLoc)) {
        const response = await fetch(`${API_BASE_URL}/provider/${firebaseUserId}/location`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            latitude: newLoc.latitude,
            longitude: newLoc.longitude,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          addDebug('✅ Location sent successfully');
        } else {
          addDebug('⚠️ Location send failed:', response.status);
        }
      }
    } catch (error) {
      addDebug('Error updating location:', error);
    }
  };

  // Decode polyline function for Google Maps
  const decodePolyline = (encoded: string): Coordinates[] => {
    if (!encoded || typeof encoded !== 'string') {
      return [];
    }

    const points: Coordinates[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
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

      const point = {
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      };

      if (!isNaN(point.latitude) && !isNaN(point.longitude)) {
        points.push(point);
      }
    }
    return points;
  };

  const handleCompass = () => {
    if (currentLocation && isValidCoordinate(currentLocation) && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  const handleCall = () => {
    if (jobDetails?.customerPhone) {
      const phoneNumber = `tel:${jobDetails.customerPhone}`;
      Linking.canOpenURL(phoneNumber)
        .then(supported => {
          if (supported) {
            return Linking.openURL(phoneNumber);
          } else {
            Alert.alert('Error', 'Cannot make phone calls from this device');
          }
        })
        .catch(err => {
          Alert.alert('Error', 'Failed to open phone app');
        });
    } else {
      Alert.alert('Call', 'No phone number available');
    }
  };

  const handleMessage = () => {
    addDebug('💬 Opening chat popup with customer');
    setChatVisible(true);
  };

  const handleArrived = () => {
    if (!jobDetails) {
      Alert.alert('Error', 'Job details not loaded');
      return;
    }

    AsyncStorage.setItem('currentBookingStatus', 'arrived').catch(err => 
      addDebug('Error updating status:', err)
    );

    Alert.alert(
      'Arrived at Location',
      'Have you arrived at the pickup location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: () => {
            router.push({
              pathname: '/ServiceInProgressScreen',
              params: {
                bookingId: bookingId || '',
                customerName: jobDetails?.customerName || '',
                customerPhone: jobDetails?.customerPhone || '',
                serviceType: safeGetString(params.serviceType, ''),
                vehicleType: safeGetString(params.vehicleType, ''),
                estimatedEarnings: safeGetString(params.estimatedEarnings, '0'),
              }
            });
          }
        }
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Opening report form...');
  };

  const handleCancelService = () => {
    Alert.alert(
      'Cancel Service',
      'Are you sure you want to cancel this service?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/provider/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'provider_cancelled' }),
              });
              
              await cleanupBooking();
              router.replace('/(provider)/Home');
            } catch (error) {
              console.log('Cancel API call failed:', error);
              router.replace('/(provider)/Home');
            }
          }
        }
      ]
    );
  };

  // Get pickup coordinates for map
  const getPickupCoordinates = (): Coordinates | null => {
    if (jobDetails?.pickupLat && jobDetails?.pickupLng) {
      const coords = {
        latitude: jobDetails.pickupLat,
        longitude: jobDetails.pickupLng,
      };
      return isValidCoordinate(coords) ? coords : null;
    }
    return null;
  };

  // Get dropoff coordinates for map
  const getDropoffCoordinates = (): Coordinates | null => {
    if (jobDetails?.dropoffLat && jobDetails?.dropoffLng) {
      const coords = {
        latitude: jobDetails.dropoffLat,
        longitude: jobDetails.dropoffLng,
      };
      return isValidCoordinate(coords) ? coords : null;
    }
    return null;
  };

  const getInitialRegion = () => {
    if (currentLocation && isValidCoordinate(currentLocation)) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const pickupCoords = getPickupCoordinates();
    if (pickupCoords) {
      return {
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    return {
      latitude: 26.2285,
      longitude: 50.5860,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F4FB" />

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={getInitialRegion()}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={true}
        >
          {getPickupCoordinates() && (
            <Marker
              coordinate={getPickupCoordinates()!}
              title="Pickup Location"
              description={jobDetails?.pickupLocation || 'Pickup location'}
            >
              <View style={styles.pickupMarker}>
                <Feather name="map-pin" size={24} color="#00C853" />
              </View>
            </Marker>
          )}

          {getDropoffCoordinates() && (
            <Marker
              coordinate={getDropoffCoordinates()!}
              title="Dropoff Location"
              description={jobDetails?.dropoffLocation || 'Dropoff location'}
            >
              <View style={styles.dropoffMarker}>
                <Feather name="flag" size={24} color="#F44336" />
              </View>
            </Marker>
          )}

          {routeCoordinates.length >= 2 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4285F4"
            />
          )}
        </MapView>

    

        <TouchableOpacity style={styles.compassBtn} onPress={handleCompass} activeOpacity={0.8}>
          <Feather name="navigation" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        <View style={styles.navCard}>
          <View style={styles.navCardTop}>
            <View style={styles.navIconWrap}>
              <Feather name="navigation" size={18} color="#8fd1fb" />
            </View>
            <View style={styles.navCardTextBlock}>
              <Text style={styles.navCardLabel}>NEXT TURN</Text>
              <Text style={styles.navCardTurn}>
                {routeCoordinates.length > 0 ? 'Route loaded - follow GPS' : 'Calculating route...'}
              </Text>
            </View>
          </View>
          <View style={styles.navCardDivider} />
          <View style={styles.navCardBottom}>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>ETA</Text>
              <Text style={styles.navStatValue}>{jobDetails?.eta || 'Calculating...'}</Text>
            </View>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>DISTANCE</Text>
              <Text style={styles.navStatValue}>{jobDetails?.distance || 'Calculating...'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.navActiveBadge}>
          <View style={styles.navActiveTextBlock}>
            <Text style={styles.navActiveTitle}>Navigation Active</Text>
            <Text style={styles.navActiveSub}>Following GPS route</Text>
          </View>
          <View style={styles.navActiveIcon}>
            <Feather name="map-pin" size={20} color="#ffffff" />
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetSectionLabel}>CUSTOMER DETAILS</Text>

          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={26} color="#8fd1fb" />
              </View>
              <View style={styles.customerText}>
                <Text style={styles.customerName}>{jobDetails?.customerName || 'Customer'}</Text>
                <Text style={styles.customerRating}>⭐ {jobDetails?.customerRating?.toFixed(1) || '4.5'} Customer Rating</Text>
              </View>
            </View>

            <View style={styles.customerDivider} />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.7}>
                <Feather name="phone" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <View style={styles.actionBtnDivider} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleMessage} activeOpacity={0.7}>
                <Feather name="message-square" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color="#5B9BD5" style={styles.locationIcon} />
              <View>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationValue}>{jobDetails?.pickupLocation || 'Loading...'}</Text>
              </View>
            </View>
          </View>

          {jobDetails?.dropoffLocation && (
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Feather name="flag" size={16} color="#5B9BD5" style={styles.locationIcon} />
                <View>
                  <Text style={styles.locationLabel}>DROPOFF LOCATION</Text>
                  <Text style={styles.locationValue}>{jobDetails.dropoffLocation}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.tipsCard}>
            <View style={styles.tipsRow}>
              <View style={styles.tipsIconWrap}>
                <Feather name="alert-circle" size={18} color="#5B9BD5" />
              </View>
              <View style={styles.tipsTextBlock}>
                <Text style={styles.tipsTitle}>Navigation Tips</Text>
                <Text style={styles.tipsText}>
                  {jobDetails?.navigationTips || 'Call customer upon arrival.'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.arrivedBtn} onPress={handleArrived} activeOpacity={0.85}>
            <Feather name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.arrivedBtnText}>I've Arrived at Location</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={handleReportIssue} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Report Issue</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>+</Text>
            <TouchableOpacity onPress={handleCancelService} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Cancel Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <ChatPopup
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        bookingId={bookingId}
        customerName={jobDetails?.customerName || 'Customer'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D6EAF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
    height: height * 0.5,
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 27,
    left: 16,
    width: 45,
    height: 45,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
  },
  compassBtn: {
    position: 'absolute',
    top: 27,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  navCard: {
    position: 'absolute',
    top: 88,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#87cefa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  navCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardTextBlock: {
    flex: 1,
  },
  navCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1,
    marginBottom: 2,
  },
  navCardTurn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  navCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  navCardBottom: {
    flexDirection: 'row',
    gap: 24,
  },
  navCardStat: {
    flexDirection: 'column',
  },
  navStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7d8492',
    letterSpacing: 1,
  },
  navStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  navActiveBadge: {
    position: 'absolute',
    bottom: 24,
    left: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  navActiveTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  navActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#737a8a',
    letterSpacing: 0.3,
  },
  navActiveSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  navActiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#87cefa',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  customerRating: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  customerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 7,
  },
  actionBtnDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8fd1fb',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  tipsCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
    padding: 14,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipsIconWrap: {
    marginTop: 1,
  },
  tipsTextBlock: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E86C1',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#5B9BD5',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#1d94d2',
    shadowColor: '#1d94d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  arrivedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
  footerDot: {
    fontSize: 14,
    color: '#6a7282',
  },
  pickupMarker: {
    padding: 5,
  },
  dropoffMarker: {
    padding: 5,
  },
});
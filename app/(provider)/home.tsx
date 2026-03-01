// HomePage.tsx - Fixed with proper navigation to job requests page
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import MapView, { Marker, Region } from 'react-native-maps';
import { providerWebSocket } from '../../services/websocket.service';
import Sidebar from "./components/sidebar";

// Get screen width for styles
const { width, height } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface PerformanceData {
  earnings: number;
  jobs: number;
  hours: number;
  rating: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  isManual: boolean;
  timestamp: string;
}

interface ProviderData {
  id: string;
  name: string;
  providerId: string;
  rating: number;
  jobsCompleted: number;
  isVerified: boolean;
  firebaseUserId?: string;
  token?: string;
}

interface LocationSuggestion {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

interface JobRequest {
  id: string;
  bookingId?: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  customerRating?: number;
  serviceType: string;
  serviceName: string;
  serviceId?: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  distance: string;
  estimatedDistance?: number;
  estimatedEarnings: number;
  price: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  timestamp: string;
  description?: string;
  vehicleDetails?: {
    type?: string;
    makeModel?: string;
    year?: string;
    color?: string;
    licensePlate?: string;
  };
  issues?: string[];
  photos?: string[];
}

const HomePage = () => {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    earnings: 0,
    jobs: 0,
    hours: 0,
    rating: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Store incoming job requests
  const [incomingJobRequest, setIncomingJobRequest] = useState<JobRequest | null>(null);

  // Map picker states
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 26.2285,
    longitude: 50.5860,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  // Load provider data on mount
  useEffect(() => {
    loadProviderData();
    checkLocationPermission();
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
      removeWebSocketListeners();
      providerWebSocket.disconnect();
    };
  }, []);

  // Setup WebSocket when provider data is loaded
  useEffect(() => {
    if (providerData?.firebaseUserId) {
      setupWebSocket();
    }
  }, [providerData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshNotificationCount();
    }, [])
  );

  // Start/stop location tracking based on online status
  useEffect(() => {
    if (isOnline && locationPermission) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isOnline, locationPermission]);

  const setupWebSocket = async () => {
    try {
      // Remove existing listeners
      removeWebSocketListeners();

      // Add connection listener with proper type
      providerWebSocket.onConnectionChange((isConnected: boolean) => {
        console.log('Provider WebSocket connection changed:', isConnected);
        setWsConnected(isConnected);
        
        if (isConnected && isOnline) {
          // Send online status via WebSocket
          providerWebSocket.send('provider_status', { 
            isOnline: true,
            location: currentLocation 
          });
        }
      });

      // Add message listeners for job requests
      providerWebSocket.on('new_job_request', handleNewJobRequest);
      providerWebSocket.on('job_cancelled', handleJobCancelled);
      providerWebSocket.on('job_updated', handleJobUpdated);
      providerWebSocket.on('notification', handleNotification);
      providerWebSocket.on('provider_status_update', handleStatusUpdate);
      
      // Debug listener for all messages
      providerWebSocket.on('*', (message: any) => {
        console.log('📨 All WebSocket messages:', JSON.stringify(message, null, 2));
      });

      // Connect to WebSocket
      const connected = await providerWebSocket.connect('provider');
      
      if (connected) {
        console.log('Provider WebSocket connected successfully');
      } else {
        console.log('Provider WebSocket connection failed');
      }
    } catch (error) {
      console.error('Error setting up provider WebSocket:', error);
    }
  };

  const removeWebSocketListeners = () => {
    providerWebSocket.off('new_job_request', handleNewJobRequest);
    providerWebSocket.off('job_cancelled', handleJobCancelled);
    providerWebSocket.off('job_updated', handleJobUpdated);
    providerWebSocket.off('notification', handleNotification);
    providerWebSocket.off('provider_status_update', handleStatusUpdate);
    providerWebSocket.off('*', () => {});
  };

  const handleNewJobRequest = (message: any) => {
    // The message comes as { type: 'new_job_request', data: {...} }
    const jobData = message.data || message;
    console.log('📦 New job request received:', JSON.stringify(jobData, null, 2));
    
    // Store the full job data
    setIncomingJobRequest(jobData as JobRequest);
    
    // Increment notification count
    setNotificationCount(prev => prev + 1);
    
    // Vibrate on new request
    if (Platform.OS !== 'web') {
      Vibration.vibrate(500);
    }
    
    // Optional: Show a toast or alert
    if (Platform.OS === 'ios') {
      // You could use a toast library here
    }
  };

  const handleJobCancelled = (data: any) => {
    console.log('Job cancelled:', data);
    
    // Decrement notification count if appropriate
    setNotificationCount(prev => Math.max(0, prev - 1));
    
    // Clear incoming job if it matches
    if (incomingJobRequest && (incomingJobRequest.id === data.jobId || incomingJobRequest.bookingId === data.bookingId)) {
      setIncomingJobRequest(null);
    }
    
    // Show alert
    Alert.alert('Job Cancelled', 'A job request has been cancelled.');
  };

  const handleJobUpdated = (data: any) => {
    console.log('Job updated:', data);
    // Refresh jobs list if needed
    if (providerData?.firebaseUserId && providerData?.token) {
      fetchRecentJobs(providerData.firebaseUserId, providerData.token);
    }
    
    // Update incoming job if it matches
    if (incomingJobRequest && (incomingJobRequest.id === data.jobId || incomingJobRequest.bookingId === data.bookingId)) {
      setIncomingJobRequest(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const handleNotification = (data: any) => {
    console.log('Notification received:', data);
    setNotificationCount(prev => prev + (data.count || 1));
  };

  const handleStatusUpdate = (data: any) => {
    console.log('Status update received:', data);
    // Update online status if changed from elsewhere
    if (data.isOnline !== undefined && data.isOnline !== isOnline) {
      setIsOnline(data.isOnline);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await getCurrentLocation(false);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission(false);
    }
  };

  const requestLocationPermissionIfNeeded = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      return false;
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
      );
    }
  };

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');

      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('Provider data loaded:', userData);

        const firebaseUserId = userData.firebaseUserId || userData.uid;
        
        setProviderData({
          id: firebaseUserId || 'PRV-001234',
          name: userData.name || 'AHMED AL-KHALIFA',
          providerId: userData.providerId || 'PRV-001234',
          rating: userData.rating || 4.8,
          jobsCompleted: userData.jobsCompleted || 234,
          isVerified: userData.isVerified || true,
          firebaseUserId: firebaseUserId,
          token: token,
        });

        // Fetch all data
        if (firebaseUserId) {
          await fetchAllProviderData(firebaseUserId, token);
        }
      } else {
        // Demo data for testing
        setProviderData({
          id: 'PRV-001234',
          name: 'AHMED AL-KHALIFA',
          providerId: 'PRV-001234',
          rating: 4.8,
          jobsCompleted: 234,
          isVerified: true,
        });

        setPerformanceData({
          earnings: 245,
          jobs: 8,
          hours: 5.5,
          rating: 4.8,
        });

        setRecentJobs([
          {
            id: '1',
            title: 'TOWING SERVICE',
            time: '2 HOURS AGO',
            price: 75,
            status: 'COMPLETED'
          },
          {
            id: '2',
            title: 'BATTERY JUMP',
            time: '4 HOURS AGO',
            price: 35,
            status: 'COMPLETED'
          },
          {
            id: '3',
            title: 'FUEL DELIVERY',
            time: '6 HOURS AGO',
            price: 25,
            status: 'COMPLETED'
          }
        ]);
        
        setNotificationCount(3);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProviderData = async (firebaseUserId: string, token: string) => {
    try {
      await fetchProviderStatus(firebaseUserId, token);
      await fetchPerformanceData(firebaseUserId, token);
      await fetchRecentJobs(firebaseUserId, token);
      await fetchNotificationCount(token);
    } catch (error) {
      console.error('Error fetching provider data:', error);
    }
  };

  const fetchProviderStatus = async (firebaseUserId: string, token: string) => {
    try {
      const statusUrl = `${API_BASE_URL}/provider/${firebaseUserId}/status`;
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const statusData = await response.json();
        if (statusData.success) {
          setIsOnline(statusData.data.isOnline);
        }
      }
    } catch (error) {
      console.error('Error fetching provider status:', error);
    }
  };

  const fetchPerformanceData = async (firebaseUserId: string, token: string) => {
    try {
      const performanceUrl = `${API_BASE_URL}/provider/${firebaseUserId}/performance`;
      const response = await fetch(performanceUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPerformanceData({
            earnings: data.data.earnings || 0,
            jobs: data.data.jobs || 0,
            hours: data.data.hours || 0,
            rating: data.data.rating || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchRecentJobs = async (firebaseUserId: string, token: string) => {
    try {
      const jobsUrl = `${API_BASE_URL}/jobs/provider/${firebaseUserId}/recent`;
      const response = await fetch(jobsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const jobsData = await response.json();
        if (jobsData.success && jobsData.data) {
          setRecentJobs(jobsData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const fetchNotificationCount = async (token?: string) => {
    try {
      const authToken = token || await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (!authToken || !userDataStr) {
        return;
      }
      
      const notificationUrl = `${API_BASE_URL}/notifications/unread-count`;
      
      const response = await fetch(notificationUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotificationCount(data.count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const refreshNotificationCount = () => {
    if (providerData?.token) {
      fetchNotificationCount(providerData.token);
    }
  };

  const getCurrentLocation = async (isManualSelection: boolean = false) => {
    if (currentLocation?.isManual && !isManualSelection) {
      return currentLocation;
    }

    if (!locationPermission) {
      return null;
    }

    setIsLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address ?
        `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '')
        : 'Current Location';

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress || 'Current Location',
        isManual: isManualSelection,
        timestamp: new Date().toISOString(),
      };

      setCurrentLocation(locationData);

      if (isOnline && providerData?.firebaseUserId && providerData?.token) {
        await sendLocationToBackend(locationData);
        
        // Also send via WebSocket for real-time updates
        if (wsConnected) {
          providerWebSocket.send('location_update', {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            isManual: locationData.isManual,
            timestamp: locationData.timestamp,
          });
        }
      }

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const sendLocationToBackend = async (location: LocationData) => {
    if (!providerData?.firebaseUserId || !providerData?.token) return;

    try {
      const url = `${API_BASE_URL}/provider/${providerData.firebaseUserId}/location`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          isManual: location.isManual,
          timestamp: location.timestamp,
        }),
      });

      if (response.ok) {
        console.log('✅ Location sent successfully');
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  };

  const startLocationTracking = (overrideLocation?: LocationData) => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
    }

    const sendLocation = async () => {
      const activeLocation = overrideLocation || currentLocation;
      if (activeLocation?.isManual) {
        if (isOnline && providerData?.firebaseUserId && providerData?.token) {
          await sendLocationToBackend(activeLocation);
          
          // Also send via WebSocket
          if (wsConnected) {
            providerWebSocket.send('location_update', {
              latitude: activeLocation.latitude,
              longitude: activeLocation.longitude,
              address: activeLocation.address,
              isManual: activeLocation.isManual,
              timestamp: activeLocation.timestamp,
            });
          }
        }
      } else {
        await getCurrentLocation(false);
      }
    };

    sendLocation();

    locationInterval.current = setInterval(sendLocation, 30000);
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const handleLocationSelection = (type: 'auto' | 'manual') => {
    setLocationModalVisible(false);

    if (type === 'auto') {
      if (!locationPermission) {
        requestLocationPermissionIfNeeded().then((granted) => {
          if (granted) {
            getCurrentLocation(false).then(() => {
              if (isOnline) {
                startLocationTracking();
              }
            });
          } else {
            Alert.alert(
              'Location Permission Required',
              'Please enable location services to use auto-update location.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: openLocationSettings }
              ]
            );
          }
        });
      } else {
        getCurrentLocation(false).then(() => {
          if (isOnline) {
            startLocationTracking();
          }
        });
      }
    } else {
      openMapPicker();
    }
  };

  const openMapPicker = () => {
    setMapPickerVisible(true);

    if (locationPermission) {
      Location.getCurrentPositionAsync({})
        .then(async (location) => {
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          setMapRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);

          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          const formattedAddress = address ?
            `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '')
            : 'Current Location';

          setSelectedLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: formattedAddress,
          });
        })
        .catch((error) => {
          console.log('Could not get current location for map:', error);
          setMapRegion({
            latitude: 26.2285,
            longitude: 50.5860,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        });
    }
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      const geocodeResults = await Location.geocodeAsync(query);

      if (geocodeResults.length > 0) {
        const suggestions: LocationSuggestion[] = [];

        for (let i = 0; i < Math.min(geocodeResults.length, 5); i++) {
          const result = geocodeResults[i];
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            const formattedAddress = address ?
              `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '')
              : `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`;

            suggestions.push({
              id: `geo-${i}-${Date.now()}`,
              title: address?.street || address?.name || query,
              address: formattedAddress,
              latitude: result.latitude,
              longitude: result.longitude,
            });
          } catch (reverseError) {
            suggestions.push({
              id: `geo-${i}-${Date.now()}`,
              title: query,
              address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
              latitude: result.latitude,
              longitude: result.longitude,
            });
          }
        }

        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    setSelectedLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address,
    });

    setSearchQuery(suggestion.address);
    setShowSuggestions(false);

    const newRegion = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const formattedAddress = address ?
        `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '')
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setSelectedLocation({
        latitude,
        longitude,
        address: formattedAddress,
      });
    } catch (error) {
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    }
  };

  const confirmManualLocation = () => {
    if (selectedLocation) {
      const manualLocation: LocationData = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address,
        isManual: true,
        timestamp: new Date().toISOString(),
      };

      setCurrentLocation(manualLocation);

      if (isOnline && providerData?.firebaseUserId && providerData?.token) {
        sendLocationToBackend(manualLocation);
        
        // Send via WebSocket
        if (wsConnected) {
          providerWebSocket.send('location_update', {
            latitude: manualLocation.latitude,
            longitude: manualLocation.longitude,
            address: manualLocation.address,
            isManual: true,
            timestamp: manualLocation.timestamp,
          });
        }
      }

      if (isOnline) {
        startLocationTracking(manualLocation);
      }

      setMapPickerVisible(false);
      setSearchQuery('');
      setSearchSuggestions([]);
    }
  };

  const toggleOnlineStatus = () => {
    const newStatus = !isOnline;
    console.log('Toggling online status to:', newStatus);
    
    if (newStatus) {
      if (!locationPermission) {
        setLocationModalVisible(true);
        return;
      }
      
      if (!currentLocation) {
        getCurrentLocation(false).then((location) => {
          if (location) {
            setIsOnline(true);
            startLocationTracking();
            refreshNotificationCount();
            
            if (providerData?.firebaseUserId && providerData?.token) {
              updateProviderStatus(true);
              
              // Send online status via WebSocket
              if (wsConnected) {
                providerWebSocket.send('provider_status', { 
                  isOnline: true,
                  location: location 
                });
              }
            }
          } else {
            setLocationModalVisible(true);
          }
        });
        return;
      }
      
      setIsOnline(true);
      startLocationTracking();
      refreshNotificationCount();
      
      if (providerData?.firebaseUserId && providerData?.token) {
        updateProviderStatus(true);
        
        // Send online status via WebSocket
        if (wsConnected) {
          providerWebSocket.send('provider_status', { 
            isOnline: true,
            location: currentLocation 
          });
        }
      }
    } else {
      setIsOnline(false);
      stopLocationTracking();
      
      if (providerData?.firebaseUserId && providerData?.token) {
        updateProviderStatus(false);
        
        // Send offline status via WebSocket
        if (wsConnected) {
          providerWebSocket.send('provider_status', { isOnline: false });
        }
      }
    }
  };

  const updateProviderStatus = async (status: boolean) => {
    if (!providerData?.firebaseUserId || !providerData?.token) return;

    try {
      const url = `${API_BASE_URL}/provider/${providerData.firebaseUserId}/status`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isOnline: status,
        }),
      });

      const responseData = await response.json();
      console.log('Status update response:', responseData);
    } catch (error) {
      console.error('Error updating provider status:', error);
    }
  };

  const handleUpdateLocation = () => {
    setLocationModalVisible(true);
  };

  const openSidebar = () => {
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const handleNotificationPress = () => {
    console.log('🔔 Notification pressed, incoming job:', incomingJobRequest);
    
    if (incomingJobRequest) {
      // Navigate with all job data
      router.push({
        pathname: '/NewRequestNotification',
        params: {
          // Core identifiers
          jobId: incomingJobRequest.id,
          bookingId: incomingJobRequest.bookingId || incomingJobRequest.id,
          
          // Customer info
          customerName: incomingJobRequest.customerName,
          customerPhone: incomingJobRequest.customerPhone || '',
          customerRating: incomingJobRequest.customerRating?.toString() || '',
          
          // Service details
          serviceType: incomingJobRequest.serviceType,
          serviceName: incomingJobRequest.serviceName || incomingJobRequest.serviceType,
          
          // Pickup location
          pickupLocation: incomingJobRequest.pickupLocation,
          pickupLat: incomingJobRequest.pickupLat?.toString() || '',
          pickupLng: incomingJobRequest.pickupLng?.toString() || '',
          
          // Dropoff location (if available)
          dropoffLocation: incomingJobRequest.dropoffLocation || '',
          dropoffLat: incomingJobRequest.dropoffLat?.toString() || '',
          dropoffLng: incomingJobRequest.dropoffLng?.toString() || '',
          
          // Job details
          distance: incomingJobRequest.distance,
          estimatedEarnings: incomingJobRequest.estimatedEarnings.toString(),
          price: (incomingJobRequest.price || incomingJobRequest.estimatedEarnings).toString(),
          urgency: incomingJobRequest.urgency || 'normal',
          timestamp: incomingJobRequest.timestamp,
          
          // Additional details
          description: incomingJobRequest.description || '',
          
          // Vehicle details (flattened)
          vehicleType: incomingJobRequest.vehicleDetails?.type || '',
          vehicleMakeModel: incomingJobRequest.vehicleDetails?.makeModel || '',
          vehicleYear: incomingJobRequest.vehicleDetails?.year || '',
          vehicleColor: incomingJobRequest.vehicleDetails?.color || '',
          vehicleLicensePlate: incomingJobRequest.vehicleDetails?.licensePlate || '',
          
          // Issues and photos (as JSON strings)
          issues: JSON.stringify(incomingJobRequest.issues || []),
          photos: JSON.stringify(incomingJobRequest.photos || []),
        }
      });
    } else {
      // If no specific job, just go to the page (it will show "No Request Found")
      console.log('No incoming job, going to empty notification page');
      router.push('/NewRequestNotification');
    }
  };

  const formatProviderId = (id: string) => {
    if (id.startsWith('PRV-')) return id;
    return `PRV-${id.slice(-6)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Sidebar visible={sidebarVisible} onClose={closeSidebar} />

      {/* Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location Mode</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.locationOption}
                onPress={() => handleLocationSelection('auto')}
                disabled={isLoadingLocation}
              >
                <View style={styles.locationOptionIcon}>
                  <Feather name="navigation" size={24} color="#68bdee" />
                </View>
                <View style={styles.locationOptionInfo}>
                  <Text style={styles.locationOptionTitle}>Auto-update Location</Text>
                  <Text style={styles.locationOptionDescription}>
                    Your location will update every 30 seconds automatically
                  </Text>
                </View>
                {isLoadingLocation && (
                  <ActivityIndicator size="small" color="#68bdee" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationOption}
                onPress={() => handleLocationSelection('manual')}
              >
                <View style={styles.locationOptionIcon}>
                  <Feather name="map-pin" size={24} color="#68bdee" />
                </View>
                <View style={styles.locationOptionInfo}>
                  <Text style={styles.locationOptionTitle}>Manual Location</Text>
                  <Text style={styles.locationOptionDescription}>
                    Pick a location on the map (will be resent every 30 seconds)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLocationModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal
        visible={mapPickerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <View style={styles.mapPickerContainer}>
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity onPress={() => setMapPickerVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.mapPickerTitle}>Select Location</Text>
            <TouchableOpacity onPress={confirmManualLocation}>
              <Text style={styles.mapPickerConfirm}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchLocation(text);
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchSuggestions([]);
                setShowSuggestions(false);
              }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showSuggestions && searchSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {isSearching ? (
                  <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
                ) : (
                  searchSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <Ionicons name="location" size={20} color="#68bdee" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {suggestion.title}
                        </Text>
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {suggestion.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          <MapView
            ref={mapRef}
            style={styles.mapPicker}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                draggable
                onDragEnd={handleMapPress}
              />
            )}
          </MapView>

          {selectedLocation && (
            <View style={styles.selectedLocationCard}>
              <Ionicons name="location" size={24} color="#68bdee" />
              <View style={styles.selectedLocationInfo}>
                <Text style={styles.selectedLocationTitle}>Selected Location</Text>
                <Text style={styles.selectedLocationAddress}>
                  {selectedLocation.address}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Container */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.providerIdContainer}>
            <Text style={styles.providerIdLabel}>PROVIDER ID</Text>
            <Text style={styles.providerIdValue}>
              {providerData ? formatProviderId(providerData.providerId) : 'PRV-001234'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Feather name="bell" size={24} color="#000" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
            {/* WebSocket status indicator */}
            {wsConnected && (
              <View style={styles.wsBadge}>
                <View style={styles.wsBadgeDot} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Container */}
        <View style={styles.profileContainer}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={require("../../assets/provider/avatar.png")}
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {providerData?.name || 'AHMED AL-KHALIFA'}
              </Text>
              <View style={styles.profileStats}>
                <Ionicons name="star" size={13} color="#000" />
                <Text style={styles.rating}>{providerData?.rating || 4.8}</Text>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.jobCount}>{providerData?.jobsCompleted || 234} Jobs</Text>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.verified}>
                  {providerData?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Status Container */}
        <View style={styles.statusContainer}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIndicator, isOnline && styles.statusIndicatorOnline]} />
            <View>
              <Text style={styles.statusText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
              <Text style={styles.statusSubtext}>
                {isOnline ? 'ACCEPTING JOBS' : 'NOT ACCEPTING'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleSwitch, isOnline && styles.toggleSwitchOnline]}
            onPress={toggleOnlineStatus}
          >
            <View style={[styles.toggleThumb, isOnline && styles.toggleThumbOnline]} />
          </TouchableOpacity>
        </View>

        {/* WebSocket Status (optional) */}
        {wsConnected && (
          <View style={styles.wsStatusContainer}>
            <View style={styles.wsStatusDot} />
            <Text style={styles.wsStatusText}>Connected to real-time updates</Text>
          </View>
        )}

        {/* Performance Container */}
        <View style={styles.performanceContainer}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>TODAY'S PERFORMANCE</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.performanceCards}>
            <View style={styles.performanceCard}>
              <Feather name="dollar-sign" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>{performanceData.earnings}</Text>
              <Text style={styles.performanceLabel}>BHD</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="trending-up" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>{performanceData.jobs}</Text>
              <Text style={styles.performanceLabel}>JOBS</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="clock" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>{performanceData.hours}</Text>
              <Text style={styles.performanceLabel}>HOURS</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="star" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>{performanceData.rating}</Text>
              <Text style={styles.performanceLabel}>RATING</Text>
            </View>
          </View>
        </View>

        {/* Recent Jobs Container */}
        <View style={styles.recentJobsContainer}>
          <View style={styles.recentJobsHeader}>
            <Text style={styles.recentJobsTitle}>RECENT JOBS</Text>
            <TouchableOpacity>
              <Text style={styles.historyText}>HISTORY</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length > 0 ? (
            recentJobs.map((job, index) => (
              <View key={job.id || index} style={styles.jobCard}>
                <View style={styles.jobCardContent}>
                  <View>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobTime}>{job.time}</Text>
                  </View>
                  <View style={styles.jobRight}>
                    <Text style={styles.jobPrice}>{job.price}</Text>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>{job.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyJobsContainer}>
              <Text style={styles.emptyJobsText}>No recent jobs</Text>
            </View>
          )}

          {/* Location Card */}
          <View style={styles.locationCard}>
            <Feather name="map-pin" size={20} color="#000" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>
                {currentLocation?.isManual ? 'MANUAL LOCATION' : 'CURRENT LOCATION'}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {currentLocation?.address || 'Not set'}
              </Text>
         
              <TouchableOpacity onPress={handleUpdateLocation}>
                <Text style={styles.updateLocationText}>
                  {currentLocation?.isManual ? 'CHANGE LOCATION' : 'UPDATE LOCATION'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>VIEW EARNINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>MY SCHEDULE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    paddingTop: 35,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  providerIdContainer: {
    alignItems: "center",
  },
  providerIdLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  providerIdValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  wsBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  wsBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  profileContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#87CEFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: {
    width: 36,
    height: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  rating: {
    fontSize: 13,
    color: "#000",
    marginLeft: 4,
    marginRight: 4,
    fontWeight: "600",
  },
  plus: {
    fontSize: 10,
    color: "#9CA3AF",
    marginHorizontal: 2,
    fontWeight: "400",
  },
  jobCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  verified: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#d1d5dc",
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D1D5DB",
    marginRight: 12,
  },
  statusIndicatorOnline: {
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.3,
  },
  statusSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  wsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
  },
  wsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  wsStatusText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  toggleSwitchOnline: {
    backgroundColor: "#68bdee",
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOnline: {
    alignSelf: "flex-end",
  },
  performanceContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },
  viewAllText: {
    fontSize: 13,
    color: "#87CEFA",
    fontWeight: "600",
    letterSpacing: 0,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  performanceCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  performanceCard: {
    width: "24%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    letterSpacing: 0,
  },
  recentJobsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  recentJobsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentJobsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },
  historyText: {
    fontSize: 13,
    color: "#87CEFA",
    fontWeight: "600",
    letterSpacing: 0,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  jobCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.15,
  },
  jobTime: {
    fontSize: 12,
    color: "#87CEFA",
    fontWeight: "500",
    letterSpacing: 0,
  },
  jobRight: {
    alignItems: "flex-end",
  },
  jobPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    letterSpacing: -0.15,
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "700",
    letterSpacing: 0,
  },
  emptyJobsContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 12,
  },
  emptyJobsText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  locationCard: {
    backgroundColor: "#e2f5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 16,
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a0a0a",
    marginBottom: 4,
    letterSpacing: -0.15,
  },
  locationAddress: {
    fontSize: 13,
    color: "#4a5565",
    marginBottom: 8,
  },
  updateLocationText: {
    fontFamily: Platform.select({
      ios: "Copperplate",
      android: "serif",
      web: "serif",
    }),
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0,
    color: "#4a5565",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  bottomButtons: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#87cefa",
    letterSpacing: -0.15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    marginBottom: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  locationOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationOptionInfo: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  locationOptionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalFooter: {
    alignItems: 'center',
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  mapPickerConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#68bdee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#000',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  loader: {
    padding: 20,
  },
  mapPicker: {
    flex: 1,
  },
  selectedLocationCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedLocationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedLocationTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectedLocationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default HomePage;
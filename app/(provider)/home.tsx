// HomePage.tsx - Complete with provider status check on mount
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
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
  Vibration,
  View,
} from "react-native";
import MapView, { Marker, Region } from 'react-native-maps';
import Sidebar from "./components/Sidebar";

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
  jobNumber?: string;

  // Customer info
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  customerRating?: number;

  // Service details
  serviceType: string;
  serviceName?: string;
  serviceId?: string;

  // Pickup location
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;

  // Dropoff location
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;

  // Job details
  distance: string;
  estimatedDistance?: number;
  estimatedEarnings: number;
  price: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  timestamp: string;
  description?: string;

  // Vehicle details - object format
  vehicleDetails?: {
    type?: string;
    makeModel?: string;
    year?: string;
    color?: string;
    licensePlate?: string;
  };

  // Flattened fields for easy access
  vehicleType?: string;
  vehicleMakeModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleLicensePlate?: string;

  // Additional data
  issues?: string[];
  photos?: string[];
  expiresAt?: string;
}

interface JobRequestQueue {
  [key: string]: JobRequest;
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
    earnings: 245,
    jobs: 8,
    hours: 5.5,
    rating: 4.8,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store multiple incoming job requests in a queue
  const [jobRequestQueue, setJobRequestQueue] = useState<JobRequestQueue>({});
  const [currentJobRequest, setCurrentJobRequest] = useState<JobRequest | null>(null);
  const [hasActiveJob, setHasActiveJob] = useState(false);

  // Polling control
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const activeJobCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(false);

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

  // Add this helper function at the top with your other interfaces
  const isValidCoordinate = (coord: any): coord is { latitude: number; longitude: number } => {
    return coord &&
      typeof coord.latitude === 'number' &&
      typeof coord.longitude === 'number' &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude) &&
      coord.latitude !== 0 &&
      coord.longitude !== 0;
  };

  // Helper to create a safe region
  const createSafeRegion = (
    latitude?: number,
    longitude?: number,
    latitudeDelta: number = 0.02,
    longitudeDelta: number = 0.02
  ): Region => {
    // If we have valid coordinates, use them
    if (typeof latitude === 'number' && typeof longitude === 'number' &&
      !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
      return {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      };
    }

    // Default fallback (Faisalabad, Pakistan - your service area)
    return {
      latitude: 31.4504,
      longitude: 73.1350,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  // Check provider status from backend
  const checkProviderStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');

      if (!token || !firebaseUserId) {
        console.log('⚠️ No token or firebaseUserId found for status check');
        return;
      }

      console.log('📡 Checking provider status for:', firebaseUserId);

      const response = await fetch(`${API_BASE_URL}/provider/${firebaseUserId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          console.log('📊 Provider status from backend:', data.data);

          // Set online status based on backend
          setIsOnline(data.data.isOnline || false);

          // Store the status in AsyncStorage
          await AsyncStorage.setItem('providerOnlineStatus', JSON.stringify({
            isOnline: data.data.isOnline || false,
            timestamp: new Date().toISOString()
          }));

          // If there's a current booking ID, store it
          if (data.data.currentBookingId) {
            await AsyncStorage.setItem('currentBookingId', data.data.currentBookingId);
            console.log('✅ Restored current booking:', data.data.currentBookingId);
          }

          // If there's a location, update it
          if (data.data.currentLocation?.coordinates) {
            const [lng, lat] = data.data.currentLocation.coordinates;
            const locationData: LocationData = {
              latitude: lat,
              longitude: lng,
              address: 'Restored location',
              isManual: false,
              timestamp: data.data.lastSeen || new Date().toISOString(),
            };
            setCurrentLocation(locationData);
          }
        }
      } else {
        console.log('⚠️ Failed to fetch provider status:', response.status);
      }
    } catch (error) {
      console.error('Error checking provider status:', error);
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeHomePage = async () => {
      await loadProviderData();        // ✅ This sets providerData with token and firebaseUserId
      await checkLocationPermission();
      await checkProviderStatus();      // ✅ This runs AFTER loadProviderData() - SHOULD work
      await loadSeenJobsFromStorage();
      await checkActiveJob();
    };

    initializeHomePage();

    return () => {
      stopPolling();
      stopLocationTracking();
      if (activeJobCheckInterval.current) {
        clearInterval(activeJobCheckInterval.current);
      }
    };
  }, []);

  // Start periodic active job check when online
  useEffect(() => {
    if (isOnline) {
      // Check every 30 seconds
      activeJobCheckInterval.current = setInterval(() => {
        checkActiveJob();
      }, 30000);

      return () => {
        if (activeJobCheckInterval.current) {
          clearInterval(activeJobCheckInterval.current);
        }
      };
    }
  }, [isOnline]);

  // Start/stop polling based on online status
  useEffect(() => {
    if (isOnline && providerData?.token) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isOnline, providerData]);

  // Start/stop location tracking based on online status
  useEffect(() => {
    if (isOnline && locationPermission && currentLocation && !currentLocation.isManual) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isOnline, locationPermission, currentLocation?.isManual]);

  // Update notification count based on queue size
  useEffect(() => {
    const queueSize = Object.keys(jobRequestQueue).length;
    setNotificationCount(queueSize);

    // If there are jobs in queue and no current job showing and no active job, show the next one
    if (queueSize > 0 && !currentJobRequest && !hasActiveJob) {
      const nextJobId = Object.keys(jobRequestQueue)[0];
      setCurrentJobRequest(jobRequestQueue[nextJobId]);
    }
  }, [jobRequestQueue, hasActiveJob]);

  // Add this function to check for active job
  const checkActiveJob = async () => {
    try {
      // Get bookingId from local storage
      const currentBookingId = await AsyncStorage.getItem('currentBookingId');

      if (!currentBookingId) {
        console.log('📭 No active booking found in storage');
        return;
      }

      console.log('🔍 Checking active job for bookingId:', currentBookingId);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Make API call to check job status
      const response = await fetch(`${API_BASE_URL}/provider/job/${currentBookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If 404 or error, clean up storage
        if (response.status === 404) {
          console.log('❌ Job not found, cleaning up storage');
          await cleanupStoredBooking(currentBookingId);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        console.log('📊 Active job status:', data.status);

        // Handle based on status
        switch (data.status) {
          case 'accepted':
            // Navigate to NavigateToCustomerScreen
            console.log('🚗 Job accepted - navigating to customer');
            router.replace({
              pathname: '/NavigateToCustomerScreen',
              params: { bookingId: currentBookingId }
            });
            break;

          case 'in_progress':
            // Navigate to ServiceInProgressScreen
            console.log('🔧 Job in progress - navigating to service');
            router.replace({
              pathname: '/ServiceInProgressScreen',
              params: { bookingId: currentBookingId }
            });
            break;

          case 'completed':
          case 'cancelled':
            // Clean up storage
            console.log(`✅ Job ${data.status} - cleaning up storage`);
            await cleanupStoredBooking(currentBookingId);
            break;

          default:
            console.log('ℹ️ Unknown job status:', data.status);
            break;
        }
      }
    } catch (error) {
      console.error('Error checking active job:', error);
    }
  };

  // Add cleanup function
  const cleanupStoredBooking = async (bookingId: string) => {
    try {
      console.log('🧹 Cleaning up booking:', bookingId);

      // Remove from activeBookings array
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
      }

      // Clear current booking if it matches
      const currentId = await AsyncStorage.getItem('currentBookingId');
      if (currentId === bookingId) {
        await AsyncStorage.removeItem('currentBookingId');
        await AsyncStorage.removeItem('currentBookingStatus');
      }

      console.log('✅ Booking cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up booking:', error);
    }
  };

  // Load seen jobs from AsyncStorage
  const loadSeenJobsFromStorage = async () => {
    try {
      const seenJobs = await AsyncStorage.getItem('seenJobs');
      if (seenJobs) {
        // We'll use this when fetching jobs to filter out already seen ones
        console.log('📋 Loaded seen jobs from storage:', JSON.parse(seenJobs).length);
      }
    } catch (error) {
      console.error('Error loading seen jobs:', error);
    }
  };

  // Mark job as seen and store in AsyncStorage
  const markJobAsSeen = async (jobId: string) => {
    try {
      const seenJobsStr = await AsyncStorage.getItem('seenJobs');
      let seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];

      // Add to seen jobs if not already there
      if (!seenJobs.includes(jobId)) {
        seenJobs.unshift(jobId); // Add to beginning

        // Keep only last 10
        if (seenJobs.length > 10) {
          seenJobs = seenJobs.slice(0, 10);
        }

        await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
        console.log(`✅ Job ${jobId} marked as seen. Total seen: ${seenJobs.length}`);
      }
    } catch (error) {
      console.error('Error marking job as seen:', error);
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

  // HomePage.tsx - Updated loadProviderData
  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');

      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('Provider data loaded:', userData);

        const firebaseUserId = userData.firebaseUserId || userData.uid;

        // ✅ SAVE TO ASYNCSTORAGE
        if (firebaseUserId) {
          await AsyncStorage.setItem('firebaseUserId', firebaseUserId);
          console.log('✅ Saved firebaseUserId to AsyncStorage:', firebaseUserId);
        }

        // Set basic provider data from AsyncStorage
        setProviderData({
          id: firebaseUserId || userData.id || 'PRV-001234',
          name: userData.fullName || userData.name || 'AHMED AL-KHALIFA',
          providerId: userData.providerId || userData.id || 'PRV-001234',
          rating: userData.rating || 4.8,
          jobsCompleted: userData.jobsCompleted || 234,
          isVerified: userData.isVerified || userData.status === 'active' || true,
          firebaseUserId: firebaseUserId,
          token: token,
        });

        // Fetch complete profile and performance data from backend
        if (firebaseUserId && token) {
          await fetchPerformanceData(firebaseUserId, token);
          await fetchRecentJobs(firebaseUserId, token);
        }
      } else {
        console.log('No provider data found, using defaults');
        setProviderData({
          id: 'PRV-001234',
          name: 'AHMED AL-KHALIFA',
          providerId: 'PRV-001234',
          rating: 4.8,
          jobsCompleted: 234,
          isVerified: true,
        });
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // HomePage.tsx - Updated fetchPerformanceData function with proper type handling
  const fetchPerformanceData = async (firebaseUserId: string, token: string) => {
    try {
      const performanceUrl = `${API_BASE_URL}/provider/${firebaseUserId}/info`;
      console.log('📡 Fetching provider data from:', performanceUrl);
      
      const response = await fetch(performanceUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Received provider data:', data.data);
          
          // Update provider data with profile information
          if (data.data.profile) {
            setProviderData(prev => {
              // Create a new object with all required fields
              const updatedProvider: ProviderData = {
                id: prev?.id || data.data.profile.id || 'PRV-001234',
                name: data.data.profile.name || prev?.name || 'AHMED AL-KHALIFA',
                providerId: data.data.profile.providerId || prev?.providerId || 'PRV-001234',
                rating: data.data.profile.rating || prev?.rating || 4.8,
                jobsCompleted: data.data.profile.totalJobs || prev?.jobsCompleted || 234,
                isVerified: data.data.profile.isVerified || prev?.isVerified || true,
                firebaseUserId: prev?.firebaseUserId || firebaseUserId,
                token: prev?.token || token,
              };
              return updatedProvider;
            });
          }
          
          // Update performance data
          setPerformanceData({
            earnings: data.data.performance?.earnings || 0,
            jobs: data.data.performance?.jobs || 0,
            hours: data.data.performance?.hours || 0,
            rating: data.data.performance?.rating || 4.8,
          });
          
          // Update recent jobs if available
          if (data.data.recentJobs && data.data.recentJobs.length > 0) {
            setRecentJobs(data.data.recentJobs);
          }
        }
      } else {
        console.log('⚠️ Failed to fetch performance data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching performance data, using defaults:', error);
      // Keep default values
    }
  };

  // Try to fetch recent jobs, but use defaults if fails
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
      // If fails, show empty recent jobs
    } catch (error) {
      console.error('Error fetching recent jobs, showing empty:', error);
      setRecentJobs([]);
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

      // If online and not manual, location will be sent by tracking interval
      // If manual, send once
      if (isManualSelection && isOnline && providerData?.token) {
        await sendLocationToBackend(locationData);
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
        console.log(`✅ Location sent successfully (${location.isManual ? 'manual' : 'auto'})`);
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  };

  const startLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
    }

    // Send location every 10 seconds
    locationInterval.current = setInterval(async () => {
      // Check if currentLocation exists
      if (!currentLocation) {
        console.log('📍 No current location yet');
        return;
      }

      if (!currentLocation.isManual) {
        // Auto mode - get new GPS location
        const newLocation = await getCurrentLocation(false);
        if (newLocation && isOnline) {
          await sendLocationToBackend(newLocation);
        }
      } else {
        // Manual mode - resend the same location
        if (isOnline) {
          await sendLocationToBackend(currentLocation);
        }
      }
    }, 10000); // 10 seconds

    console.log('📍 Location tracking started (every 10 seconds)');
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
      console.log('📍 Location tracking stopped');
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Poll immediately
    pollAvailableJobs();

    // Then poll every 5 seconds
    pollingInterval.current = setInterval(() => {
      pollAvailableJobs();
    }, 5000);

    console.log('🔄 Job polling started (every 5 seconds)');
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      console.log('🔄 Job polling stopped');
    }
  };

  const pollAvailableJobs = async () => {
    if (!isOnline || !providerData?.token || isPolling.current) return;

    isPolling.current = true;

    try {
      // Get provider's location for radius search
      let lat, lng;
      if (currentLocation) {
        lat = currentLocation.latitude;
        lng = currentLocation.longitude;
      }

      // Build URL with query params
      let url = `${API_BASE_URL}/provider/available-jobs`;

      // Add location if available
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }

      console.log('🌐 Polling URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch jobs:', response.status);
        return;
      }

      const data = await response.json();

      if (data.success && data.jobs && data.jobs.length > 0) {
        console.log(`📦 Received ${data.jobs.length} job(s) from polling`);

        // Get seen jobs from storage
        const seenJobsStr = await AsyncStorage.getItem('seenJobs');
        const seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];

        // Filter out already seen jobs
        const newJobs = data.jobs.filter((job: any) => {
          const jobId = job.bookingId || job.id;
          return !seenJobs.includes(jobId);
        });

        if (newJobs.length > 0) {
          console.log(`🆕 ${newJobs.length} new job(s) after filtering seen jobs`);

          // Process each new job
          newJobs.forEach((job: any) => {
            const jobId = job.bookingId || job.id || `job-${Date.now()}-${Math.random()}`;

            // Parse and enhance job data
            const enhancedJob = enhanceJobData(job, jobId);

            // Add to queue if not already there
            setJobRequestQueue(prev => {
              if (prev[jobId]) return prev; // Already exists

              return {
                ...prev,
                [jobId]: enhancedJob
              };
            });
          });

          // Vibrate for new jobs
          if (newJobs.length > 0 && Platform.OS !== 'web') {
            Vibration.vibrate(500);
          }
        }
      }
    } catch (error) {
      console.error('Error polling jobs:', error);
    } finally {
      isPolling.current = false;
    }
  };

  const enhanceJobData = (job: any, jobId: string): JobRequest => {
    return {
      id: jobId,
      bookingId: job.bookingId || jobId,
      customerName: job.customer?.name || 'Customer',
      customerPhone: job.customer?.phone || '',
      serviceType: job.serviceName || job.serviceType || 'Service',
      pickupLocation: job.pickup?.address || 'Pickup location',
      pickupLat: job.pickup?.coordinates?.lat,
      pickupLng: job.pickup?.coordinates?.lng,
      dropoffLocation: job.dropoff?.address,
      dropoffLat: job.dropoff?.coordinates?.lat,
      dropoffLng: job.dropoff?.coordinates?.lng,
      distance: job.distance || '2.5 km',
      estimatedEarnings: job.payment?.totalAmount || job.estimatedEarnings || 25,
      price: job.payment?.totalAmount || job.estimatedEarnings || 25,
      urgency: job.urgency || 'normal',
      timestamp: job.createdAt || new Date().toISOString(),
      description: job.description || '',
      vehicleDetails: job.vehicle || {},
      vehicleType: job.vehicle?.type,
      vehicleMakeModel: job.vehicle?.makeModel,
      vehicleYear: job.vehicle?.year,
      vehicleColor: job.vehicle?.color,
      vehicleLicensePlate: job.vehicle?.licensePlate,
      issues: job.issues || [],
      photos: job.photos || [],
    };
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
          // Use the helper to create a safe region
          const newRegion = createSafeRegion(
            location.coords.latitude,
            location.coords.longitude,
            0.02,
            0.02
          );

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
          // Use safe fallback
          setMapRegion(createSafeRegion(undefined, undefined, 0.05, 0.05));
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

    // Use helper to create safe region
    const newRegion = createSafeRegion(
      suggestion.latitude,
      suggestion.longitude,
      0.02,
      0.02
    );

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

      // Send manual location once
      if (isOnline && providerData?.token) {
        sendLocationToBackend(manualLocation);
      }

      // Stop any auto-tracking and restart with manual mode
      stopLocationTracking();
      if (isOnline) {
        startLocationTracking(); // This will now send the manual location every 10 seconds
      }

      setMapPickerVisible(false);
      setSearchQuery('');
      setSearchSuggestions([]);

      Alert.alert('Location Set', 'Manual location has been set successfully.');
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    console.log('Toggling online status to:', newStatus);

    if (newStatus) {
      if (!locationPermission) {
        setLocationModalVisible(true);
        return;
      }

      if (!currentLocation) {
        const location = await getCurrentLocation(false);
        if (location) {
          setIsOnline(true);
          startLocationTracking();
          await updateProviderStatus(true);
        } else {
          setLocationModalVisible(true);
        }
        return;
      }

      setIsOnline(true);
      startLocationTracking();
      await updateProviderStatus(true);
    } else {
      setIsOnline(false);
      stopLocationTracking();
      stopPolling();
      await updateProviderStatus(false);
    }
  };

  const updateProviderStatus = async (status: boolean) => {
    if (!providerData?.firebaseUserId || !providerData?.token) return;

    try {
      const url = `${API_BASE_URL}/provider/${providerData.firebaseUserId}/status`;

      console.log(`📤 Updating provider status to: ${status ? 'ONLINE' : 'OFFLINE'}`);

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
      console.log('✅ Status update response:', responseData);

      // Store the status in AsyncStorage
      await AsyncStorage.setItem('providerOnlineStatus', JSON.stringify({
        isOnline: status,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('❌ Error updating provider status:', error);
      // Revert UI if backend update fails
      setIsOnline(!status);
      Alert.alert(
        'Status Update Failed',
        'Could not update your status. Please check your connection and try again.'
      );
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
    console.log('🔔 Notification pressed, current job:', currentJobRequest);
    console.log('🔔 Queue size:', Object.keys(jobRequestQueue).length);

    if (currentJobRequest) {
      const jobId = currentJobRequest.id || currentJobRequest.bookingId || '';

      // Mark this job as seen before navigating
      if (jobId) {
        markJobAsSeen(jobId);
      }

      // Log the data being sent
      console.log('📤 Navigating with job data:', {
        jobId: currentJobRequest.id,
        customerName: currentJobRequest.customerName,
        serviceType: currentJobRequest.serviceType,
      });

      // ✅ FIXED: Remove this job from queue BEFORE navigating
      setJobRequestQueue(prev => {
        const newQueue = { ...prev };
        delete newQueue[jobId];
        return newQueue;
      });

      // ✅ Also clear currentJobRequest
      setCurrentJobRequest(null);

      // Navigate with all job data
      router.push({
        pathname: '/NewRequestNotificationScreen',
        params: {
          jobId: currentJobRequest.id,
          bookingId: currentJobRequest.bookingId || currentJobRequest.id,
          customerName: currentJobRequest.customerName,
          customerPhone: currentJobRequest.customerPhone || '',
          customerRating: currentJobRequest.customerRating?.toString() || '',
          serviceType: currentJobRequest.serviceType,
          serviceName: currentJobRequest.serviceName || currentJobRequest.serviceType,
          serviceId: currentJobRequest.serviceId || '',
          pickupLocation: currentJobRequest.pickupLocation,
          pickupLat: currentJobRequest.pickupLat?.toString() || '',
          pickupLng: currentJobRequest.pickupLng?.toString() || '',
          dropoffLocation: currentJobRequest.dropoffLocation || '',
          dropoffLat: currentJobRequest.dropoffLat?.toString() || '',
          dropoffLng: currentJobRequest.dropoffLng?.toString() || '',
          distance: currentJobRequest.distance,
          estimatedEarnings: currentJobRequest.estimatedEarnings.toString(),
          price: (currentJobRequest.price || currentJobRequest.estimatedEarnings).toString(),
          urgency: currentJobRequest.urgency || 'normal',
          timestamp: currentJobRequest.timestamp,
          description: currentJobRequest.description || '',
          vehicleType: currentJobRequest.vehicleType || currentJobRequest.vehicleDetails?.type || '',
          vehicleMakeModel: currentJobRequest.vehicleMakeModel || currentJobRequest.vehicleDetails?.makeModel || '',
          vehicleYear: currentJobRequest.vehicleYear || currentJobRequest.vehicleDetails?.year || '',
          vehicleColor: currentJobRequest.vehicleColor || currentJobRequest.vehicleDetails?.color || '',
          vehicleLicensePlate: currentJobRequest.vehicleLicensePlate || currentJobRequest.vehicleDetails?.licensePlate || '',
          issues: JSON.stringify(currentJobRequest.issues || []),
          photos: JSON.stringify(currentJobRequest.photos || []),
          queueSize: Object.keys(jobRequestQueue).length.toString(),
          isLastInQueue: (Object.keys(jobRequestQueue).length === 0).toString(),
        }
      });
    } else {
      Alert.alert(
        'No Job Requests',
        Object.keys(jobRequestQueue).length > 0
          ? 'Loading next request...'
          : 'No pending job requests at the moment.',
        [{ text: 'OK' }]
      );
    }
  };

  const markJobAsActive = (jobId: string) => {
    // Remove from queue
    setJobRequestQueue(prev => {
      const newQueue = { ...prev };
      delete newQueue[jobId];
      return newQueue;
    });

    setHasActiveJob(true);
    setCurrentJobRequest(null);
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
                    Your location will update every 10 seconds automatically
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
                    Pick a location on the map (will be sent every 10 seconds)
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
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 9,
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
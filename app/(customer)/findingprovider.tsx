// findingprovider.tsx - Fixed navigation after provider accepts
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {styles} from './styles/FindingProviderStyles';
const { height } = Dimensions.get('window');

// API configuration
const API_BASE_URL = 'https://yhiw-backend.onrender.com';

// Define types
type ConnectionStatus = 'creating' | 'searching' | 'found' | 'error' | 'no_providers' | 'timeout';

interface StatusResponse {
  status: 'searching' | 'accepted' | 'expired';
}

const FindingProviderScreen = () => {
  const [spinValue] = useState(new Animated.Value(0));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('creating');
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [isExistingBooking, setIsExistingBooking] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  const params = useLocalSearchParams();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null); // NEW: For navigation delay
  const navigationInProgress = useRef(false);
  const isMounted = useRef(true);
  const hasCancelledOnUnmount = useRef(false);
  const isTerminalState = useRef(false); // Track if we're in a terminal state

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely get number from params (for coordinates)
  const getNumberParam = (param: string | string[] | undefined): number | null => {
    if (!param) return null;
    const value = Array.isArray(param) ? param[0] : param;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  // Helper function to safely parse JSON from params
  const getParsedArray = (param: string | string[] | undefined): any[] => {
    const value = getStringParam(param);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  // Get bookingId from params (this is the only required param for existing bookings)
  const bookingIdFromParams = getStringParam(params.bookingId);
  
  // Get service info (may be empty for existing bookings)
  const serviceId = getStringParam(params.serviceId);
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);

  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';

  // Get all data from previous screens (may be empty for existing bookings)
  const pickupAddress = getStringParam(params.pickupAddress);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const serviceTime = getStringParam(params.serviceTime);
  const totalAmount = getStringParam(params.totalAmount);
  const urgency = getStringParam(params.urgency);
  const description = getStringParam(params.description);
  const issues = getParsedArray(params.issues);
  const photos = getParsedArray(params.photos);

  // Vehicle data
  const vehicleType = getStringParam(params.vehicleType);
  const makeModel = getStringParam(params.makeModel);
  const year = getStringParam(params.year);
  const color = getStringParam(params.color);
  const licensePlate = getStringParam(params.licensePlate);

  // Contact data
  const fullName = getStringParam(params.fullName);
  const phoneNumber = getStringParam(params.phoneNumber);
  const email = getStringParam(params.email);
  const emergencyContact = getStringParam(params.emergencyContact);

  // Special fields from VehicleContactInfo
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);

  // Schedule data
  const scheduledDate = getStringParam(params.scheduledDate);
  const scheduledTimeSlot = getStringParam(params.scheduledTimeSlot);

  // Location skipped flag
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

  // Additional flags
  const hasInsurance = getStringParam(params.hasInsurance) === 'true';
  const needSpecificTruck = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications = getStringParam(params.hasModifications) === 'true';
  const needMultilingual = getStringParam(params.needMultilingual) === 'true';

  // Selected tip
  const selectedTip = parseFloat(getStringParam(params.selectedTip)) || 0;

  // Get coordinates
  const pickupLat = getNumberParam(params.pickupLat);
  const pickupLng = getNumberParam(params.pickupLng);
  const dropoffLat = getNumberParam(params.dropoffLat);
  const dropoffLng = getNumberParam(params.dropoffLng);

  // Log initial params
  console.log('🔍 ===== FINDING PROVIDER SCREEN MOUNTED =====');
  console.log('🔍 Timestamp:', new Date().toISOString());
  console.log('🔍 Booking ID from params:', bookingIdFromParams || 'none');
  console.log('🔍 Service info:', { serviceId, serviceName, servicePrice, serviceCategory });

  // Initialize - determine if this is an existing booking
  useEffect(() => {
    console.log('🔍 INITIALIZATION CHECK - bookingIdFromParams:', bookingIdFromParams);
    
    const initializeScreen = async () => {
      try {
        // If we have a bookingId in params, check if it's an existing booking
        if (bookingIdFromParams) {
          console.log('🔍 Found bookingId in params:', bookingIdFromParams);
          
          // Check if we have minimal data to determine if it's existing
          const hasNewBookingData = serviceId || pickupAddress || fullName;
          
          if (!hasNewBookingData) {
            console.log('📋 EXISTING BOOKING DETECTED - using bookingId:', bookingIdFromParams);
            setIsExistingBooking(true);
            setBookingId(bookingIdFromParams);
            setConnectionStatus('searching');
            setInitialized(true);
            
            // Start polling immediately
            startPolling(bookingIdFromParams);
          } else {
            console.log('📋 Has new booking data - will create new notification');
            setInitialized(true);
            // Will create new notification in main useEffect
          }
        } else {
          // Try to get bookingId from AsyncStorage as fallback
          const storedBookingId = await AsyncStorage.getItem('currentBookingId');
          if (storedBookingId) {
            console.log('📋 Found bookingId in AsyncStorage:', storedBookingId);
            setIsExistingBooking(true);
            setBookingId(storedBookingId);
            setConnectionStatus('searching');
            setInitialized(true);
            
            // Start polling immediately
            startPolling(storedBookingId);
          } else {
            console.log('📋 No bookingId found - new booking');
            setInitialized(true);
          }
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setInitialized(true);
      }
    };

    initializeScreen();
  }, []); // Run once on mount

  // Main useEffect for animations and event listeners
  useEffect(() => {
    if (!initialized) {
      console.log('⏳ Waiting for initialization...');
      return;
    }

    console.log('🔄 ===== MAIN USEFFECT TRIGGERED =====');
    console.log('🔄 isExistingBooking:', isExistingBooking);
    console.log('🔄 bookingId:', bookingId);
    console.log('🔄 connectionStatus:', connectionStatus);

    // Start spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Only create new notification if:
    // 1. Not an existing booking
    // 2. No bookingId set yet
    // 3. Status is still 'creating'
    if (!isExistingBooking && !bookingId && connectionStatus === 'creating') {
      console.log('📤 New booking detected - creating notification');
      createJobNotification();
    }

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set timeout for finding provider (2 minutes)
    timeoutTimer.current = setTimeout(() => {
      if (!isMounted.current) return;
      console.log('⏰ 2-minute timeout reached');
      if (connectionStatus === 'searching') {
        handleTimeout();
      }
    }, 120000); // 2 minutes

    // Cleanup on unmount
    return () => {
      console.log('🧹 ===== CLEANING UP FINDING PROVIDER SCREEN =====');
      console.log('🧹 Current connectionStatus:', connectionStatus);
      console.log('🧹 isTerminalState.current:', isTerminalState.current);
      
      isMounted.current = false;

      // Clear navigation timeout if it exists
      if (navigationTimeout.current) {
        console.log('🧹 Clearing navigation timeout');
        clearTimeout(navigationTimeout.current);
        navigationTimeout.current = null;
      }

      // Cancel the booking ONLY if:
      // 1. We have a bookingId
      // 2. We're still in 'searching' state (not in a terminal state)
      // 3. Haven't already cancelled on unmount
      // 4. Not in a terminal state
      if (bookingId && 
          connectionStatus === 'searching' && 
          !hasCancelledOnUnmount.current && 
          !isTerminalState.current) {
        console.log('🧹 Component unmounting while searching - cancelling booking');
        hasCancelledOnUnmount.current = true;
        cancelBooking(bookingId, false); // Don't navigate, just cancel
      } else {
        console.log('🧹 Not cancelling booking - reason:', {
          hasBookingId: !!bookingId,
          isSearching: connectionStatus === 'searching',
          alreadyCancelled: hasCancelledOnUnmount.current,
          isTerminal: isTerminalState.current
        });
      }

      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      if (timeoutTimer.current) {
        clearTimeout(timeoutTimer.current);
        timeoutTimer.current = null;
      }

      backHandler.remove();
      subscription.remove();
    };
  }, [initialized, isExistingBooking, bookingId, connectionStatus]);

  // Add this useEffect at the beginning of your component, right after all the getStringParam calls
  useEffect(() => {
    // Parse waypoints if available
    let parsedWaypoints: any[] = [];
    const waypointsParam = getStringParam(params.waypoints);
    const hasWaypoints = getStringParam(params.hasWaypoints) === 'true';

    if (hasWaypoints && waypointsParam) {
      try {
        parsedWaypoints = JSON.parse(waypointsParam);
      } catch (e) {
        console.error('Error parsing waypoints for log:', e);
      }
    }

    // Log ALL received data for debugging
    console.log('=====================================');
    console.log('🔍 FindingProvider - RECEIVED DATA:');
    console.log('=====================================');

    // Booking Info
    console.log('🎫 BOOKING INFO:');
    console.log('  • bookingId:', bookingIdFromParams || '(not provided)');
    console.log('  • isExistingBooking:', isExistingBooking);

    // Service Info
    console.log('📦 SERVICE INFO:');
    console.log('  • serviceId:', serviceId || '(not provided)');
    console.log('  • serviceName:', serviceName || '(not provided)');
    console.log('  • servicePrice:', servicePrice || '(not provided)');
    console.log('  • serviceCategory:', serviceCategory || '(not provided)');

    // Only log detailed data if it's a new booking
    if (!isExistingBooking) {
      // Location Data - WITH COORDINATES
      console.log('📍 LOCATION DATA:');
      console.log('  • pickupAddress:', pickupAddress);
      console.log('  • pickupLat:', pickupLat);
      console.log('  • pickupLng:', pickupLng);
      console.log('  • dropoffAddress:', dropoffAddress || '(not provided)');
      console.log('  • dropoffLat:', dropoffLat || '(not provided)');
      console.log('  • dropoffLng:', dropoffLng || '(not provided)');

      // Waypoints Data
      console.log('🛑 WAYPOINTS DATA:');
      console.log('  • hasWaypoints:', hasWaypoints);
      if (parsedWaypoints.length > 0) {
        console.log('  • waypoints count:', parsedWaypoints.length);
        parsedWaypoints.forEach((wp: any, index: number) => {
          console.log(`    Stop ${index + 1}:`);
          console.log(`      address: ${wp.address}`);
          console.log(`      lat: ${wp.lat}`);
          console.log(`      lng: ${wp.lng}`);
          console.log(`      order: ${wp.order}`);
        });
      } else {
        console.log('  • waypoints: none');
      }

      // Vehicle Data
      console.log('🚗 VEHICLE DATA:');
      console.log('  • vehicleType:', vehicleType);
      console.log('  • makeModel:', makeModel);
      console.log('  • year:', year);
      console.log('  • color:', color);
      console.log('  • licensePlate:', licensePlate);

      // Contact Data
      console.log('👤 CONTACT DATA:');
      console.log('  • fullName:', fullName);
      console.log('  • phoneNumber:', phoneNumber);
      console.log('  • email:', email);
      console.log('  • emergencyContact:', emergencyContact);

      // Special Fields
      console.log('🔧 SPECIAL FIELDS:');
      console.log('  • hasLicenseFront:', !!licenseFront);
      console.log('  • hasLicenseBack:', !!licenseBack);
      console.log('  • fuelType:', fuelType || '(not provided)');
      console.log('  • partDescription:', partDescription ? partDescription.substring(0, 50) + '...' : '(not provided)');

      // Additional Details
      console.log('📝 ADDITIONAL DETAILS:');
      console.log('  • urgency:', urgency);
      console.log('  • issues count:', issues.length);
      console.log('  • description:', description ? description.substring(0, 50) + '...' : '(not provided)');
      console.log('  • photos count:', photos.length);
      console.log('  • hasInsurance:', hasInsurance);
      console.log('  • needSpecificTruck:', needSpecificTruck);
      console.log('  • hasModifications:', hasModifications);
      console.log('  • needMultilingual:', needMultilingual);

      // Schedule Data
      console.log('📅 SCHEDULE DATA:');
      console.log('  • serviceTime:', serviceTime);
      console.log('  • scheduledDate:', scheduledDate || '(not provided)');
      console.log('  • scheduledTimeSlot:', scheduledTimeSlot || '(not provided)');

      // Payment Data
      console.log('💰 PAYMENT DATA:');
      console.log('  • selectedTip:', selectedTip);
      console.log('  • totalAmount:', totalAmount);

      // Service Types & Flags
      console.log('⚙️ SERVICE TYPES:');
      console.log('  • isCarRental:', isCarRental);
      console.log('  • isFuelDelivery:', isFuelDelivery);
      console.log('  • isSpareParts:', isSpareParts);
      console.log('  • locationSkipped:', locationSkipped);
    } else {
      console.log('📋 EXISTING BOOKING - detailed data not available');
    }

    console.log('=====================================');

  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('📱 App state changed:', { from: appState.current, to: nextAppState });

    if (!isMounted.current) return;

    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App came to foreground, checking status');
      if (bookingId && connectionStatus === 'searching') {
        // Immediately check status when app returns to foreground
        checkBookingStatus(bookingId);
      }
    }
    appState.current = nextAppState;
  };

  const handleBackPress = (): boolean => {
    console.log('🔙 Back button pressed');

    if (navigationInProgress.current) {
      console.log('⛔ Navigation already in progress, skipping back handler');
      return true;
    }

    if (bookingId && connectionStatus === 'searching') {
      console.log('🔙 User pressed back while searching - cancelling booking');

      Alert.alert(
        'Cancel Search',
        'Are you sure you want to cancel finding a provider?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              if (bookingId) {
                isTerminalState.current = true; // Mark as terminal since we're cancelling
                cancelBooking(bookingId, true); // Navigate back after cancel
              } else {
                router.back();
              }
            }
          }
        ]
      );
      return true; // Prevent default back behavior
    }

    return false; // Allow default back behavior
  };

  // Handler for the Cancel Request button (same logic as back press)
  const handleCancelPress = () => {
    console.log('🔙 Cancel Request button pressed');

    if (navigationInProgress.current) return;

    if (bookingId && connectionStatus === 'searching') {
      Alert.alert(
        'Cancel Search',
        'Are you sure you want to cancel finding a provider?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              if (bookingId) {
                isTerminalState.current = true;
                cancelBooking(bookingId, true);
              } else {
                router.back();
              }
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const createJobNotification = async () => {
    console.log('📤 ===== CREATING JOB NOTIFICATION =====');

    try {
      setConnectionStatus('creating');

      const token = await AsyncStorage.getItem('userToken');
      console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'No token');

      if (!token) {
        throw new Error('Authentication token not found. Please sign in again.');
      }

      const url = `${API_BASE_URL}/api/jobs/create-notification`;
      console.log('🌐 API URL:', url);

      // Generate a booking ID (frontend generates)
      const newBookingId = `YHIW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log('🆔 Generated Booking ID:', newBookingId);

      // Prepare booking data
      const bookingData = {
        bookingId: newBookingId,
        pickup: {
          address: pickupAddress,
          coordinates: pickupLat && pickupLng ? {
            lat: pickupLat,
            lng: pickupLng
          } : null
        },
        dropoff: {
          address: dropoffAddress,
          coordinates: dropoffLat && dropoffLng ? {
            lat: dropoffLat,
            lng: dropoffLng
          } : null
        },
        serviceId,
        serviceName,
        servicePrice: parseFloat(servicePrice) || 0,
        serviceCategory,
        isCarRental,
        isFuelDelivery,
        isSpareParts,
        vehicle: {
          type: vehicleType,
          makeModel,
          year,
          color,
          licensePlate,
        },
        customer: {
          name: fullName,
          phone: phoneNumber,
          email,
          emergencyContact,
        },
        carRental: isCarRental ? {
          licenseFront,
          licenseBack,
          hasInsurance,
        } : null,
        fuelDelivery: isFuelDelivery ? {
          fuelType,
        } : null,
        spareParts: isSpareParts ? {
          partDescription,
        } : null,
        additionalDetails: {
          urgency,
          issues: issues.length > 0 ? issues : null,
          description,
          photos: photos.length > 0 ? photos : null,
          needSpecificTruck,
          hasModifications,
          needMultilingual,
        },
        schedule: {
          type: serviceTime,
          scheduledDateTime: serviceTime === 'schedule_later' ? {
            date: scheduledDate,
            timeSlot: scheduledTimeSlot,
          } : null,
        },
        payment: {
          totalAmount: parseFloat(totalAmount) || 0,
          selectedTip,
          baseServiceFee: parseFloat(servicePrice) || 0,
          paymentMethod: 'cash',
        },
        locationSkipped,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
        version: '1.1',
      };

      console.log('📦 Request body size:', JSON.stringify(bookingData).length, 'bytes');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!isMounted.current) return;

      console.log('📥 Response status:', response.status);

      const responseData = await response.json();
      console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Server error: ${response.status}`);
      }

      if (responseData.success) {
        console.log('✅ Notification created successfully with ID:', responseData.bookingId);

        // Store bookingId in AsyncStorage (keep until job completed)
        await AsyncStorage.setItem('currentBookingId', responseData.bookingId);

        setBookingId(responseData.bookingId);
        setConnectionStatus('searching');

        // Start polling for status
        startPolling(responseData.bookingId);
      } else {
        throw new Error('Failed to create notification');
      }

    } catch (error: unknown) {
      if (!isMounted.current) return;

      console.error('❌❌❌ CREATE NOTIFICATION ERROR ❌❌❌');
      console.error('Error:', error instanceof Error ? error.message : String(error));

      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');

      Alert.alert(
        'Request Failed',
        error instanceof Error ? error.message : 'Failed to process request',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: createJobNotification }
        ]
      );
    }
  };

  const startPolling = (id: string) => {
    console.log('🔄 Starting polling for booking:', id);

    const poll = async () => {
      if (!isMounted.current || navigationInProgress.current) return;

      await checkBookingStatus(id);

      // Schedule next poll if still searching
      if (isMounted.current && connectionStatus === 'searching' && !navigationInProgress.current) {
        pollingTimer.current = setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };

    // Start polling immediately
    poll();
  };

  const checkBookingStatus = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('❌ No token found for status check');
        return;
      }

      const url = `${API_BASE_URL}/api/jobs/${id}/status`;
      console.log(`🔄 Polling #${pollingAttempts + 1} - Checking status for booking:`, id);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!isMounted.current) return;

      if (!response.ok) {
        console.error('❌ Status check failed:', response.status);
        return;
      }

      const data: StatusResponse = await response.json();
      console.log(`📊 Status response:`, data);

      setPollingAttempts(prev => prev + 1);

      // Handle different statuses
      if (data.status === 'accepted') {
        console.log('✅✅✅ PROVIDER ACCEPTED!');
        // Just pass the bookingId, nothing else
        handleProviderAccepted(id);
      } 
      else if (data.status === 'expired') {
        console.log('❌ Booking expired');
        isTerminalState.current = true; // Mark as terminal state
        handleNoProviders('expired');
      }
      // If status is 'searching', continue polling

    } catch (error) {
      console.error('❌ Error checking status:', error);
    }
  };
// FIXED: handleProviderAccepted with router.replace that survives unmount
const handleProviderAccepted = (id: string) => {
  if (!isMounted.current || navigationInProgress.current) return;

  console.log('✅✅✅ ===== PROVIDER ACCEPTED! =====');
  console.log('✅ Booking ID:', id);
  console.log('⏳ Will navigate in 5 seconds...');

  isTerminalState.current = true;
  navigationInProgress.current = true;
  setConnectionStatus('found');

  // Stop polling and timeout
  if (pollingTimer.current) {
    clearTimeout(pollingTimer.current);
    pollingTimer.current = null;
  }
  if (timeoutTimer.current) {
    clearTimeout(timeoutTimer.current);
    timeoutTimer.current = null;
  }

  // IMPORTANT: Don't store the timeout in a ref that gets cleared
  // Use a direct setTimeout that will execute even if component unmounts
  setTimeout(() => {
    console.log('🚀 ===== 5 SECOND DELAY COMPLETE =====');
    console.log('📍 Navigating to ProviderAssigned with bookingId:', id);
    
    // Use replace instead of push to prevent back button issues
    router.replace({
      pathname: '/(customer)/ProviderAssigned',
      params: { bookingId: id }
    });
    
    console.log('✅ Navigation call executed');
  }, 5000);
};
  const handleTimeout = () => {
    if (!isMounted.current || navigationInProgress.current) return;

    console.log('⏰ ===== SEARCH TIMEOUT (2 minutes) =====');

    isTerminalState.current = true; // Mark as terminal state

    if (bookingId) {
      cancelBooking(bookingId, false, 'timeout');
    } else {
      setConnectionStatus('timeout');
      navigationInProgress.current = true;

      setTimeout(() => {
        router.push({
          pathname: '/(customer)/NoProviderAvailable',
          params: { reason: 'timeout', ...params },
        });
      }, 1000);
    }
  };

  const handleNoProviders = (reason: string) => {
    if (!isMounted.current || navigationInProgress.current) return;

    console.log('❌ ===== NO PROVIDERS AVAILABLE =====');
    console.log('❌ Reason:', reason);

    isTerminalState.current = true; // Mark as terminal state
    navigationInProgress.current = true;
    setConnectionStatus('no_providers');

    // Stop polling and timeout
    if (pollingTimer.current) {
      clearTimeout(pollingTimer.current);
      pollingTimer.current = null;
    }
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }

    // Remove bookingId from storage since job is cancelled/expired
    AsyncStorage.removeItem('currentBookingId').catch(err =>
      console.error('Error removing bookingId:', err)
    );

    setTimeout(() => {
      router.push({
        pathname: '/(customer)/NoProviderAvailable',
        params: { reason, ...params },
      });
    }, 1000);
  };

  const cancelBooking = async (id: string, navigateBack: boolean = true, reason: string = 'user_cancelled') => {
    console.log('❌ ===== CANCELLING BOOKING =====');
    console.log('❌ Booking ID:', id);
    console.log('❌ Reason:', reason);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('❌ No token found for cancellation');
        if (navigateBack) router.back();
        return;
      }

      const url = `${API_BASE_URL}/api/jobs/${id}/cancel`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!isMounted.current) return;

      console.log('📥 Cancel response status:', response.status);

      // Remove bookingId from storage regardless of response
      await AsyncStorage.removeItem('currentBookingId');

      if (navigateBack) {
        // Navigate back to previous screen
        router.back();
      }

    } catch (error) {
      console.error('❌ Error cancelling booking:', error);

      // Still remove from storage and navigate back
      await AsyncStorage.removeItem('currentBookingId').catch(() => { });

      if (navigateBack) {
        router.back();
      }
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderStatusMessage = () => {
    switch (connectionStatus) {
      case 'creating':
        return 'Creating your booking...';
      case 'searching':
        return `Searching for providers...`;
      case 'found':
        return 'Provider found! Assigning now...';
      case 'no_providers':
        return 'No providers available at this time';
      case 'timeout':
        return 'Search timed out. Please try again.';
      case 'error':
        return 'Connection error. Please try again.';
      default:
        return 'Finding a provider...';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/finding_provider.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Finding a Provider</Text>

        <Text style={styles.subtitle}>
          {renderStatusMessage()}
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerCompleted}>
              <Ionicons name="checkmark-circle" size={24} color="#68bdee" />
            </View>
            <Text style={styles.stepTextCompleted}>Request received</Text>
          </View>

          {/* Step 2 - active while searching, completed when found */}
          <View style={[
            styles.stepCard,
            connectionStatus !== 'found' && styles.stepCardActive,
            connectionStatus === 'found' && styles.stepCardCompleted,
          ]}>
            {connectionStatus === 'found' ? (
              <View style={styles.stepIconContainerCompleted}>
                <Ionicons name="checkmark-circle" size={24} color="#68bdee" />
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.stepIconContainerActive,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
              </Animated.View>
            )}
            <Text style={connectionStatus === 'found' ? styles.stepTextCompleted : styles.stepTextActive}>
              {connectionStatus === 'no_providers' ? 'No providers available' :
                connectionStatus === 'timeout' ? 'Search timed out' :
                  'Searching for providers...'}
            </Text>
          </View>

          {/* Step 3 - inactive while searching, active when found */}
          <View style={[
            styles.stepCard,
            connectionStatus === 'found' && styles.stepCardActive,
          ]}>
            <View style={styles.stepIconContainerInactive}>
              {connectionStatus === 'found' ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
                </Animated.View>
              ) : (
                <View style={[
                  styles.emptyCircle,
                  connectionStatus === 'no_providers' && styles.inactiveCircle,
                  connectionStatus === 'timeout' && styles.inactiveCircle
                ]} />
              )}
            </View>
            <Text style={[
              styles.stepTextInactive,
              connectionStatus === 'found' && styles.stepTextActive,
              (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.stepTextInactive
            ]}>
              {connectionStatus === 'found' ? 'Assigning provider...' :
                connectionStatus === 'no_providers' ? 'No provider found' :
                  connectionStatus === 'timeout' ? 'Search failed' :
                    'Assigning provider'}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>DID YOU KNOW?</Text>
          <Text style={styles.infoText}>
            YHIW connects you with verified and rated service providers. Average
            response time is under 2 minutes.
          </Text>
        </View>

        <View style={styles.paginationContainer}>
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={[
            styles.dotActive,
            connectionStatus === 'found' && styles.dotCompleted,
            (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.dotError
          ]} />
          <View style={styles.dotInactive} />
        </View>

        {error && connectionStatus === 'error' && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>

      {/* Bottom section: cancellation notice + cancel button */}
      <View style={styles.bottomSection}>
        <View style={styles.cancellationNotice}>
          <Text style={styles.cancellationText}>
            Cancellation is free until a provider accepts.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelPress}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color="#ff4444" />
          <Text style={styles.cancelButtonText}>CANCEL REQUEST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default FindingProviderScreen;
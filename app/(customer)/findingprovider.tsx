// findingprovider.tsx - Complete with WebSocket-only approach
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { customerWebSocket } from '../../services/websocket.service';

const { height } = Dimensions.get('window');

// API configuration
const API_BASE_URL = 'https://yhiw-backend.onrender.com';

// Define types
type ConnectionStatus = 'connecting' | 'searching' | 'found' | 'error' | 'no_providers' | 'timeout';

interface ProviderData {
  id: string;
  name: string;
  rating: number;
  profileImage?: string;
  vehicleDetails?: string;
  phone?: string;
}

interface AcceptedJobData {
  bookingId: string;
  jobId?: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerImage?: string;
  estimatedArrival?: string;
  vehicleDetails?: string;
  provider?: ProviderData;
  providerPhone?: string;
  licensePlate?: string;
}

interface WebSocketData {
  type?: string;
  status?: string;
  bookingId?: string;
  jobId?: string;
  providerId?: string;
  providerName?: string;
  providerRating?: number;
  providerImage?: string;
  estimatedArrival?: string;
  vehicleDetails?: string;
  provider?: ProviderData;
  message?: string;
  data?: AcceptedJobData;
}

// Type guard to check if object has data property
function hasDataProperty(obj: any): obj is { data: any } {
  return obj && typeof obj === 'object' && 'data' in obj;
}

const FindingProviderScreen = () => {
  const [spinValue] = useState(new Animated.Value(0));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  const params = useLocalSearchParams();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const wsListenerRemoved = useRef(false);
  const navigationInProgress = useRef(false); // Prevent multiple navigation attempts

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

  // Get service info
  const serviceId = getStringParam(params.serviceId);
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);
  
  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';

  // Get all data from previous screens
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
  
  // NEW FIELDS from VehicleContactInfo
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
  console.log('🔍 All params:', JSON.stringify(params, null, 2));
  console.log('🔍 Service info:', { serviceId, serviceName, servicePrice, serviceCategory });
  console.log('🔍 Pickup location:', { pickupAddress, pickupLat, pickupLng });
  console.log('🔍 Dropoff location:', { dropoffAddress, dropoffLat, dropoffLng });
  console.log('🔍 Customer:', { fullName, phoneNumber, email });

  useEffect(() => {
    console.log('🔄 ===== USEFFECT TRIGGERED =====');
    console.log('🔄 Starting animation and booking request');
    
    // Start spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Send booking request and setup WebSocket
    sendBookingRequest();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set timeout for finding provider (2 minutes)
    timeoutTimer.current = setTimeout(() => {
      console.log('⏰ Timeout reached after 2 minutes, current status:', connectionStatus);
      if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
        console.log('⏰ Search timeout reached - calling handleNoProviders');
        setConnectionStatus('timeout');
        handleNoProviders('timeout');
      }
    }, 120000); // 2 minutes

    // Cleanup on unmount
    return () => {
      console.log('🧹 ===== CLEANING UP FINDING PROVIDER SCREEN =====');
      if (timeoutTimer.current) {
        clearTimeout(timeoutTimer.current);
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      subscription.remove();
      removeWebSocketListeners();
      customerWebSocket.disconnect();
      wsListenerRemoved.current = true;
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('📱 App state changed:', { from: appState.current, to: nextAppState });
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App came to foreground');
      // App has come to the foreground, reconnect WebSocket if needed and we're still searching
      if (!customerWebSocket.isConnected() && 
          (connectionStatus === 'searching' || connectionStatus === 'connecting') && 
          bookingId) {
        console.log('📱 App came to foreground, reconnecting WebSocket');
        setupWebSocket();
        
        // Request status update
        setTimeout(() => {
          if (customerWebSocket.isConnected() && bookingId) {
            console.log('📱 Requesting status update after foreground');
            customerWebSocket.send('request_status', { bookingId });
          }
        }, 1000);
      }
    }
    appState.current = nextAppState;
  };

  const setupWebSocket = async () => {
    console.log('🔌 ===== SETTING UP WEBSOCKET =====');
    console.log('🔌 Current bookingId:', bookingId);
    
    try {
      // Remove existing listeners first
      removeWebSocketListeners();

      // Add connection listener
      customerWebSocket.onConnectionChange(handleConnectionChange);

      // Add message listeners for ALL possible acceptance events
      customerWebSocket.on('job_accepted', handleJobAccepted);
      customerWebSocket.on('provider_assigned', handleProviderFound);
      customerWebSocket.on('booking_confirmed', handleProviderFound);
      customerWebSocket.on('booking_accepted', handleProviderFound);
      
      customerWebSocket.on('booking_cancelled', () => {
        console.log('❌ Booking cancelled event received');
        handleNoProviders('cancelled');
      });
      
      customerWebSocket.on('booking_expired', () => {
        console.log('⏰ Booking expired event received');
        handleNoProviders('expired');
      });
      
      customerWebSocket.on('status_update', handleStatusUpdate);
      customerWebSocket.on('error', handleWebSocketError);

      // Connect to WebSocket
      console.log('🔌 Attempting to connect WebSocket as customer...');
      const connected = await customerWebSocket.connect('customer');
      
      if (connected) {
        console.log('✅ WebSocket connected successfully');
        setWsConnected(true);
        
        // If we have a booking ID, request status immediately
        if (bookingId) {
          console.log('📡 Requesting status for booking:', bookingId);
          customerWebSocket.send('request_status', { bookingId });
        }
      } else {
        console.log('❌ WebSocket connection failed');
        setWsConnected(false);
        
        // Try to reconnect after 3 seconds if we're still searching
        if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
          console.log('🔄 Scheduling WebSocket reconnect in 3 seconds');
          reconnectTimer.current = setTimeout(() => {
            if (!wsListenerRemoved.current) {
              console.log('🔄 Attempting WebSocket reconnect...');
              setupWebSocket();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Error setting up WebSocket:', error);
      setWsConnected(false);
      
      // Try to reconnect
      if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
        console.log('🔄 Scheduling WebSocket reconnect after error');
        reconnectTimer.current = setTimeout(() => {
          if (!wsListenerRemoved.current) {
            console.log('🔄 Attempting WebSocket reconnect after error');
            setupWebSocket();
          }
        }, 3000);
      }
    }
  };

  const handleConnectionChange = (isConnected: boolean) => {
    console.log('🔌 WebSocket connection changed:', { 
      isConnected, 
      bookingId, 
      connectionStatus 
    });
    setWsConnected(isConnected);
    
    if (isConnected && bookingId && (connectionStatus === 'searching' || connectionStatus === 'connecting')) {
      console.log('📡 Requesting status update for booking:', bookingId);
      customerWebSocket.send('request_status', { bookingId });
    } else if (!isConnected && (connectionStatus === 'searching' || connectionStatus === 'connecting')) {
      console.log('🔄 WebSocket disconnected, scheduling reconnect');
      reconnectTimer.current = setTimeout(() => {
        if (!wsListenerRemoved.current) {
          console.log('🔄 Attempting to reconnect WebSocket...');
          setupWebSocket();
        }
      }, 3000);
    }
  };

  const handleWebSocketError = (error?: any) => {
    console.error('❌ WebSocket error:', error || 'Unknown error');
    setWsConnected(false);
    
    if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
      console.log('🔄 Scheduling reconnect due to error');
      reconnectTimer.current = setTimeout(() => {
        if (!wsListenerRemoved.current) {
          setupWebSocket();
        }
      }, 3000);
    }
  };

  const removeWebSocketListeners = () => {
    console.log('🔌 Removing all WebSocket listeners');
    customerWebSocket.off('job_accepted', handleJobAccepted);
    customerWebSocket.off('provider_assigned', handleProviderFound);
    customerWebSocket.off('booking_confirmed', handleProviderFound);
    customerWebSocket.off('booking_accepted', handleProviderFound);
    customerWebSocket.off('booking_cancelled', () => handleNoProviders('cancelled'));
    customerWebSocket.off('booking_expired', () => handleNoProviders('expired'));
    customerWebSocket.off('status_update', handleStatusUpdate);
    customerWebSocket.off('error', handleWebSocketError);
  };

  const handleStatusUpdate = (data: any) => {
    console.log('📊 ===== STATUS UPDATE RECEIVED =====');
    console.log('📊 Raw data:', JSON.stringify(data, null, 2));
    
    const messageData = hasDataProperty(data) ? data.data : data;
    
    if (messageData.status === 'searching' || messageData.status === 'pending') {
      console.log('ℹ️ Status: Searching for providers');
      setConnectionStatus('searching');
    } else if (
      messageData.status === 'accepted' || 
      messageData.status === 'confirmed' || 
      messageData.status === 'provider_assigned'
    ) {
      console.log('✅ Status indicates job accepted!');
      handleProviderFound(messageData);
    } else if (messageData.status === 'cancelled' || messageData.status === 'expired') {
      console.log('❌ Status indicates job cancelled/expired');
      handleNoProviders(messageData.status);
    }
  };

  const handleJobAccepted = (message: any) => {
    console.log('🎉 ===== JOB ACCEPTED MESSAGE RECEIVED =====');
    const messageData = message.data || message;
    
    const providerData = {
      bookingId: messageData.bookingId || messageData.jobId,
      providerId: messageData.providerId || messageData.userId || '',
      providerName: messageData.providerName || 'Provider',
      providerRating: messageData.providerRating || 4.5,
      providerImage: messageData.providerImage || '',
      estimatedArrival: messageData.estimatedArrival || '10-15 minutes',
      vehicleDetails: messageData.vehicleDetails || '',
      providerPhone: messageData.providerPhone || '',
      licensePlate: messageData.licensePlate || '',
      provider: messageData.provider || null
    };
    
    handleProviderFound(providerData);
  };
const sendBookingRequest = async () => {
  console.log('📤 ===== SENDING BOOKING REQUEST =====');
  
  try {
    setConnectionStatus('connecting');
    
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication token not found. Please sign in again.');
    }

    // Generate a temporary booking ID (backend will replace it)
    const tempBookingId = `TEMP-${Date.now()}`;

    // Prepare COMPLETE booking data with all necessary information
    const bookingData = {
      // ✅ ADD THIS - bookingId is required by the model
      bookingId: tempBookingId,
      
      // Location information
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
      
      // Service information
      serviceId,
      serviceName,
      servicePrice: parseFloat(servicePrice) || 0,
      serviceCategory,
      serviceType: serviceTime,
      
      // Service type flags
      isCarRental,
      isFuelDelivery,
      isSpareParts,
      
      // Vehicle information
      vehicle: {
        type: vehicleType,
        makeModel,
        year,
        color,
        licensePlate,
      },
      
      // Customer contact information
      customer: {
        name: fullName,
        phone: phoneNumber,
        email,
        emergencyContact,
      },
      
      // Service-specific details
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
      
      // Additional details
      additionalDetails: {
        urgency,
        issues: issues.length > 0 ? issues : null,
        description,
        photos: photos.length > 0 ? photos : null,
        needSpecificTruck,
        hasModifications,
        needMultilingual,
      },
      
      // Schedule information
      schedule: {
        type: serviceTime,
        scheduledDateTime: serviceTime === 'schedule_later' ? {
          date: scheduledDate,
          timeSlot: scheduledTimeSlot,
        } : null,
      },
      
      // Payment information
      payment: {
        totalAmount: parseFloat(totalAmount) || 0,
        selectedTip,
        baseServiceFee: parseFloat(servicePrice) || 0,
        paymentMethod: 'cash',
      },
      
      // Additional flags
      locationSkipped,
      
      // Metadata
      timestamp: new Date().toISOString(),
      platform: 'mobile',
      version: '1.1',
    };

    console.log('📤 Sending COMPLETE booking data:', JSON.stringify(bookingData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/jobs/customer/finding-provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    const responseData = await response.json();
    console.log('📤 Response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || 'Failed to create booking');
    }

    console.log('✅ Booking created successfully with ID:', responseData.bookingId);
    setBookingId(responseData.bookingId);
    setConnectionStatus('searching');

    // Setup WebSocket after getting booking ID
    await setupWebSocket();

  } catch (error: unknown) {
    console.error('❌ Booking request error:', error);
    
    setConnectionStatus('error');
    setError(error instanceof Error ? error.message : 'An unknown error occurred');
    
    Alert.alert(
      'Booking Failed',
      error instanceof Error ? error.message : 'Failed to process request',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
        { text: 'Retry', onPress: sendBookingRequest }
      ]
    );
  }
};

  const handleProviderFound = (data: any) => {
    console.log('✅✅✅ ===== PROVIDER FOUND! =====');
    console.log('✅ Full data received:', JSON.stringify(data, null, 2));
    
    // Prevent multiple navigation attempts
    if (navigationInProgress.current) {
      console.log('⛔ Navigation already in progress, skipping...');
      return;
    }
    
    // Clear timeout timer
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }

    // Clear reconnect timer
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    setConnectionStatus('found');
    navigationInProgress.current = true;

    // Extract ALL provider data from various possible structures
    let providerId = '';
    let providerName = '';
    let providerRating = 0;
    let providerImage = '';
    let estimatedArrival = '10-15 minutes';
    let vehicleDetails = '';
    let providerPhone = '';
    let licensePlate = '';
    let finalBookingId = bookingId || '';
    let provider = null;
    
    // Try to extract from provider object if it exists
    if (data.provider) {
      provider = data.provider;
      providerId = data.provider.id || data.provider.userId || '';
      providerName = data.provider.name || data.provider.fullName || '';
      providerRating = data.provider.rating || 0;
      providerImage = data.provider.profileImage || data.provider.image || '';
      vehicleDetails = data.provider.vehicleDetails || data.provider.vehicle || '';
      providerPhone = data.provider.phone || data.provider.phoneNumber || '';
      licensePlate = data.provider.licensePlate || '';
    }
    
    // Fall back to direct fields (prioritize direct fields over provider object)
    providerId = data.providerId || data.userId || providerId || '';
    providerName = data.providerName || providerName || 'Provider';
    providerRating = data.providerRating || providerRating || 4.5;
    providerImage = data.providerImage || providerImage || '';
    estimatedArrival = data.estimatedArrival || estimatedArrival || '10-15 minutes';
    vehicleDetails = data.vehicleDetails || vehicleDetails || '';
    providerPhone = data.providerPhone || data.phone || providerPhone || '';
    licensePlate = data.licensePlate || licensePlate || '';
    finalBookingId = data.bookingId || data.jobId || bookingId || '';

    // CRITICAL: Validate that we have providerId
    if (!providerId) {
      console.error('❌ CRITICAL: No providerId found in the data!');
      // Try to generate one from provider name as last resort (not ideal)
      providerId = `prov_${Date.now()}`;
    }

    console.log('✅ Extracted provider data:', {
      providerId,
      providerName,
      providerRating,
      providerImage,
      estimatedArrival,
      vehicleDetails,
      providerPhone,
      licensePlate,
      finalBookingId
    });

    // Create navigation params with ALL data including providerId
    const navigationParams = {
      // Include ALL original params
      ...params,
      
      // Override/add provider-specific data - CRITICAL FIELDS
      bookingId: finalBookingId,
      providerId: providerId,  // ✅ CRITICAL: This was missing!
      providerName,
      providerRating: providerRating.toString(),
      providerImage,
      estimatedArrival,
      vehicleDetails,
      providerPhone,
      licensePlate,
      
      // Ensure coordinates are passed as strings
      pickupLat: pickupLat?.toString() || '',
      pickupLng: pickupLng?.toString() || '',
      dropoffLat: dropoffLat?.toString() || '',
      dropoffLng: dropoffLng?.toString() || '',
      
      // Ensure all critical data is passed
      serviceId,
      serviceName,
      servicePrice,
      pickupAddress,
      dropoffAddress,
      fullName,
      phoneNumber,
      totalAmount,
      vehicleType,
      makeModel,
    };

    console.log('🚀 ===== NAVIGATING TO PROVIDER ASSIGNED =====');
    console.log('🚀 Navigation params:', JSON.stringify(navigationParams, null, 2));

    // Navigate to provider assigned screen
    setTimeout(() => {
      try {
        router.push({
          pathname: '/(customer)/ProviderAssigned',
          params: navigationParams,
        });
        console.log('✅ Navigation executed successfully with providerId:', providerId);
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        navigationInProgress.current = false;
        
        Alert.alert(
          'Navigation Error',
          'Failed to navigate. Please check your booking in the home screen.',
          [{ text: 'OK', onPress: () => router.push('/customer/home') }]
        );
      }
    }, 1500);
  };

  const handleNoProviders = (reason: string = 'no_providers') => {
    console.log('❌ ===== NO PROVIDERS FOUND =====');
    console.log('❌ Reason:', reason);
    
    if (navigationInProgress.current) {
      console.log('⛔ Navigation already in progress, skipping...');
      return;
    }
    
    // Clear timers
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    setConnectionStatus('no_providers');
    navigationInProgress.current = true;

    // Navigate to no providers available screen
    setTimeout(() => {
      try {
        const navigationParams = {
          reason,
          serviceId,
          serviceName,
          pickupAddress,
          dropoffAddress,
          totalAmount,
          pickupLat: pickupLat?.toString() || '',
          pickupLng: pickupLng?.toString() || '',
        };
        
        router.push({
          pathname: '/(customer)/NoProvidersAvailableScreen',
          params: navigationParams,
        });
        
        console.log('✅ Navigation to NoProvidersAvailableScreen executed');
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        navigationInProgress.current = false;
        Alert.alert(
          'Error',
          'Failed to navigate. Please try again.',
          [{ text: 'OK', onPress: () => router.push('/customer/home') }]
        );
      }
    }, 1500);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Render connection status message
  const renderStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to server...';
      case 'searching':
        return wsConnected 
          ? 'Searching for providers in your area...' 
          : 'Connecting to server...';
      case 'found':
        return 'Provider found! Redirecting...';
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
        {/* Icon at the top */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/finding_provider.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Finding a Provider</Text>

        {/* Subtitle with status */}
        <Text style={styles.subtitle}>
          {renderStatusMessage()}
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {/* Step 1: Request received */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerCompleted}>
              <Ionicons name="checkmark-circle" size={24} color="#68bdee" />
            </View>
            <Text style={styles.stepTextCompleted}>Request received</Text>
          </View>

          {/* Step 2: Searching for providers (Active) */}
          <View style={[styles.stepCard, styles.stepCardActive]}>
            <Animated.View
              style={[
                styles.stepIconContainerActive,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
            </Animated.View>
            <Text style={styles.stepTextActive}>
              {connectionStatus === 'found' ? 'Provider found!' : 
               connectionStatus === 'no_providers' ? 'No providers available' :
               connectionStatus === 'timeout' ? 'Search timed out' :
               'Searching for providers...'}
            </Text>
          </View>

          {/* Step 3: Assigning provider */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerInactive}>
              <View style={[
                styles.emptyCircle,
                connectionStatus === 'found' && styles.completedCircle,
                connectionStatus === 'no_providers' && styles.inactiveCircle,
                connectionStatus === 'timeout' && styles.inactiveCircle
              ]} />
            </View>
            <Text style={[
              styles.stepTextInactive,
              connectionStatus === 'found' && styles.stepTextCompleted,
              (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.stepTextInactive
            ]}>
              {connectionStatus === 'found' ? 'Provider assigned' : 
               connectionStatus === 'no_providers' ? 'No provider found' :
               connectionStatus === 'timeout' ? 'Search failed' :
               'Assigning provider'}
            </Text>
          </View>
        </View>

        {/* Did You Know Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>DID YOU KNOW?</Text>
          <Text style={styles.infoText}>
            YHIW connects you with verified and rated service providers. Average
            response time is under 2 minutes.
          </Text>
        </View>

        {/* Pagination Dots */}
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

        {/* Error message if any */}
        {error && connectionStatus === 'error' && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>
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
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: Math.min(160, height * 0.2),
    height: Math.min(160, height * 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.03,
    backgroundColor: 'transparent',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Math.min(24, height * 0.032),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: height * 0.015,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(14, height * 0.018),
    color: '#68bdee',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: height * 0.02,
    letterSpacing: 0.3,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
    marginBottom: height * 0.03,
  },
  stepCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  stepIconContainerCompleted: {
    marginRight: 15,
  },
  stepIconContainerActive: {
    marginRight: 15,
  },
  stepIconContainerInactive: {
    marginRight: 15,
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    backgroundColor: 'transparent',
  },
  completedCircle: {
    borderColor: '#68bdee',
    backgroundColor: '#68bdee',
  },
  inactiveCircle: {
    borderColor: '#ff4444',
    backgroundColor: 'transparent',
  },
  stepTextCompleted: {
    fontSize: Math.min(14, height * 0.018),
    color: '#68bdee',
    fontWeight: '600',
    flex: 1,
  },
  stepTextActive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
  },
  stepTextInactive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#b0b0b0',
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3c5c5',
    padding: 18,
    width: '100%',
    marginBottom: height * 0.03,
  },
  infoTitle: {
    fontSize: Math.min(12, height * 0.016),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: Math.min(12, height * 0.016),
    color: '#5c5c5c',
    lineHeight: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  dotCompleted: {
    backgroundColor: '#4CAF50',
  },
  dotError: {
    backgroundColor: '#ff4444',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
  errorText: {
    color: '#ff4444',
    fontSize: Math.min(12, height * 0.016),
    marginTop: 15,
    textAlign: 'center',
  },
});

export default FindingProviderScreen;
// findingprovider.tsx - Fixed TypeScript errors
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

interface BookingData {
  bookingId: string;
  providerName?: string;
  providerRating?: number;
  providerImage?: string;
  estimatedArrival?: string;
  vehicleDetails?: string;
  status?: string;
  provider?: any;
}

interface WebSocketData {
  status?: string;
  bookingId?: string;
  providerName?: string;
  providerRating?: number;
  providerImage?: string;
  estimatedArrival?: string;
  vehicleDetails?: string;
  provider?: any;
  message?: string;
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

  useEffect(() => {
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
      if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
        console.log('Search timeout reached');
        setConnectionStatus('timeout');
        handleNoProviders('timeout');
      }
    }, 120000); // 2 minutes

    // Cleanup on unmount
    return () => {
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
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, reconnect WebSocket if needed and we're still searching
      if (!customerWebSocket.isConnected() && 
          (connectionStatus === 'searching' || connectionStatus === 'connecting') && 
          bookingId) {
        console.log('App came to foreground, reconnecting WebSocket');
        setupWebSocket();
        
        // Request status update
        setTimeout(() => {
          if (customerWebSocket.isConnected() && bookingId) {
            customerWebSocket.send('request_status', { bookingId });
          }
        }, 1000);
      }
    }
    appState.current = nextAppState;
  };

  const setupWebSocket = async () => {
    try {
      // Remove existing listeners first
      removeWebSocketListeners();

      // Add connection listener
      customerWebSocket.onConnectionChange(handleConnectionChange);

      // Add message listeners
      customerWebSocket.on('provider_assigned', handleProviderFound);
      customerWebSocket.on('booking_confirmed', handleProviderFound);
      customerWebSocket.on('booking_accepted', handleProviderFound);
      customerWebSocket.on('booking_cancelled', () => handleNoProviders('cancelled'));
      customerWebSocket.on('booking_expired', () => handleNoProviders('expired'));
      customerWebSocket.on('status_update', handleStatusUpdate);
      customerWebSocket.on('error', handleWebSocketError);

      // Connect to WebSocket
      const connected = await customerWebSocket.connect('customer');
      
      if (connected) {
        console.log('WebSocket connected successfully');
        setWsConnected(true);
        
        // If we have a booking ID, request status immediately
        if (bookingId) {
          customerWebSocket.send('request_status', { bookingId });
        }
      } else {
        console.log('WebSocket connection failed');
        setWsConnected(false);
        
        // Try to reconnect after 3 seconds if we're still searching
        if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
          reconnectTimer.current = setTimeout(() => {
            if (!wsListenerRemoved.current) {
              setupWebSocket();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setWsConnected(false);
      
      // Try to reconnect
      if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
        reconnectTimer.current = setTimeout(() => {
          if (!wsListenerRemoved.current) {
            setupWebSocket();
          }
        }, 3000);
      }
    }
  };

  const handleConnectionChange = (isConnected: boolean) => {
    console.log('WebSocket connection changed:', isConnected);
    setWsConnected(isConnected);
    
    if (isConnected && bookingId && (connectionStatus === 'searching' || connectionStatus === 'connecting')) {
      // Request status update
      customerWebSocket.send('request_status', { bookingId });
    } else if (!isConnected && (connectionStatus === 'searching' || connectionStatus === 'connecting')) {
      // Try to reconnect
      reconnectTimer.current = setTimeout(() => {
        if (!wsListenerRemoved.current) {
          setupWebSocket();
        }
      }, 3000);
    }
  };

  const handleWebSocketError = () => {
    console.error('WebSocket error');
    setWsConnected(false);
    
    // Try to reconnect
    if (connectionStatus === 'searching' || connectionStatus === 'connecting') {
      reconnectTimer.current = setTimeout(() => {
        if (!wsListenerRemoved.current) {
          setupWebSocket();
        }
      }, 3000);
    }
  };

  const removeWebSocketListeners = () => {
    customerWebSocket.off('provider_assigned', handleProviderFound);
    customerWebSocket.off('booking_confirmed', handleProviderFound);
    customerWebSocket.off('booking_accepted', handleProviderFound);
    customerWebSocket.off('booking_cancelled', () => handleNoProviders('cancelled'));
    customerWebSocket.off('booking_expired', () => handleNoProviders('expired'));
    customerWebSocket.off('status_update', handleStatusUpdate);
    customerWebSocket.off('error', handleWebSocketError);
  };

  const handleStatusUpdate = (data: WebSocketData) => {
    console.log('Status update received:', data);
    
    if (data.status === 'searching' || data.status === 'pending') {
      setConnectionStatus('searching');
    } else if (data.status === 'accepted' || data.status === 'confirmed' || data.status === 'provider_assigned') {
      handleProviderFound(data);
    } else if (data.status === 'cancelled' || data.status === 'expired') {
      handleNoProviders(data.status);
    }
  };

  const sendBookingRequest = async () => {
    console.log('📤 sendBookingRequest function STARTED');
    try {
      setConnectionStatus('connecting');
      
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token retrieved:', token ? 'Yes' : 'No');

      if (!token) {
        throw new Error('Authentication token not found. Please sign in again.');
      }

      // Prepare booking data
      const bookingData = {
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
        serviceType: serviceTime,
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

      const response = await fetch(`${API_BASE_URL}/api/jobs/customer/finding-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to create booking');
      }

      setBookingId(responseData.bookingId);
      setConnectionStatus('searching');

      // Setup WebSocket after getting booking ID
      await setupWebSocket();

    } catch (error: unknown) {
      console.error('Booking request error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      
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

 // Update the handleProviderFound function to handle both types
const handleProviderFound = (data: BookingData | WebSocketData) => {
  console.log('Provider found:', data);
  
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

  // Create a properly typed booking data object with defaults
  const bookingData: BookingData = {
    bookingId: data.bookingId || bookingId || '',
    providerName: data.providerName || data.provider?.name || '',
    providerRating: data.providerRating || data.provider?.rating || 0,
    providerImage: data.providerImage || data.provider?.profileImage || '',
    estimatedArrival: data.estimatedArrival || '10-15 minutes',
    vehicleDetails: data.vehicleDetails || data.provider?.vehicleDetails || '',
    provider: data.provider
  };

  // Navigate to provider assigned screen
  setTimeout(() => {
    router.push({
      pathname: '/providerassigned',
      params: {
        ...params,
        bookingId: bookingData.bookingId,
        providerName: bookingData.providerName,
        // providerRating: bookingData.providerRating.toString(),
        providerImage: bookingData.providerImage,
        estimatedArrival: bookingData.estimatedArrival,
        vehicleDetails: bookingData.vehicleDetails,
        pickupLat: pickupLat?.toString() || '',
        pickupLng: pickupLng?.toString() || '',
        dropoffLat: dropoffLat?.toString() || '',
        dropoffLng: dropoffLng?.toString() || '',
      },
    });
  }, 1500);
};
  const handleNoProviders = (reason: string = 'no_providers') => {
    console.log('No providers found, reason:', reason);
    
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

    setConnectionStatus('no_providers');

    // Navigate to no providers screen
    router.push({
      pathname: '/ProviderAssigned',
      params: {
        ...params,
        noProviders: 'true',
        reason: reason,
        pickupLat: pickupLat?.toString() || '',
        pickupLng: pickupLng?.toString() || '',
        dropoffLat: dropoffLat?.toString() || '',
        dropoffLng: dropoffLng?.toString() || '',
      },
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Format schedule display text
  const getScheduleDisplay = () => {
    if (serviceTime === 'right_now') {
      return 'ASAP Service';
    } else if (serviceTime === 'schedule_later') {
      if (scheduledDate && scheduledTimeSlot) {
        try {
          const date = new Date(scheduledDate);
          return `Scheduled: ${date.toLocaleDateString()} at ${scheduledTimeSlot}`;
        } catch {
          return `Scheduled: ${scheduledDate} at ${scheduledTimeSlot}`;
        }
      }
      return 'Scheduled Service';
    } else {
      return 'Not specified';
    }
  };

  // Get service-specific display
  const getServiceSpecificDisplay = () => {
    if (isCarRental && licenseFront) {
      return '✓ License verified';
    }
    if (isFuelDelivery && fuelType) {
      const fuelLabel = fuelType === 'petrol' ? 'Petrol' : 
                        fuelType === 'diesel' ? 'Diesel' : 'Premium';
      return `Fuel: ${fuelLabel}`;
    }
    if (isSpareParts && partDescription) {
      return 'Part details provided';
    }
    return null;
  };

  // Render connection status message
  const renderStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to server...';
      case 'searching':
        return wsConnected 
          ? 'Searching for providers' 
          : 'Connecting to server';
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

        {/* Subtitle with WebSocket indicator */}
        <Text style={styles.subtitle}>
          {renderStatusMessage()}
        </Text>

        {/* WebSocket Status Indicator
        {(connectionStatus === 'searching' || connectionStatus === 'connecting') && (
          <View style={[
            styles.wsIndicator,
            wsConnected ? styles.wsConnected : styles.wsDisconnected
          ]}>
            <View style={[
              styles.wsDot,
              wsConnected ? styles.wsDotConnected : styles.wsDotDisconnected
            ]} />
            <Text style={[
              styles.wsText,
              wsConnected ? styles.wsTextConnected : styles.wsTextDisconnected
            ]}>
              {wsConnected ? 'Live updates active' : 'Connecting...'}
            </Text>
          </View>
        )} */}

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
  wsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  wsConnected: {
    backgroundColor: '#E8F5E9',
  },
  wsDisconnected: {
    backgroundColor: '#FFEBEE',
  },
  wsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  wsDotConnected: {
    backgroundColor: '#4CAF50',
  },
  wsDotDisconnected: {
    backgroundColor: '#F44336',
  },
  wsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wsTextConnected: {
    color: '#2E7D32',
  },
  wsTextDisconnected: {
    color: '#C62828',
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
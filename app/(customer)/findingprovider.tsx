import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

// API configuration
const API_BASE_URL = 'https://yhiw-backend.onrender.com'; // Replace with your actual API URL
const POLLING_INTERVAL = 5000; // Poll every 5 seconds
const MAX_POLLING_ATTEMPTS = 60; // Max 5 minutes (60 * 5s = 5min)

// Define types
type ConnectionStatus = 'connecting' | 'searching' | 'found' | 'error' | 'no_providers';

interface BookingData {
  bookingId: string;
  providerName?: string;
  providerRating?: number;
  providerImage?: string;
  estimatedArrival?: string;
  vehicleDetails?: string;
  status?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const FindingProviderScreen = () => {
  const [spinValue] = useState(new Animated.Value(0));
  const [isSearching, setIsSearching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  const params = useLocalSearchParams();
  const router = useRouter();
  const pollingTimer = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

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
  
  // Get coordinates (assuming they're passed as separate lat/lng params)
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

    // Send booking request to backend
    sendBookingRequest();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, resume polling if needed
        if (isSearching && bookingId) {
          startPolling();
        }
      }
      appState.current = nextAppState;
    });

    // Cleanup on unmount
    return () => {
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
      }
      subscription.remove();
    };
  }, []);

  const sendBookingRequest = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Get auth token from storage
      // const token = await AsyncStorage.getItem('userToken');
      
      // if (!token) {
      //   throw new Error('Authentication token not found');
      // }

      // Prepare comprehensive booking data with ALL fields
      const bookingData = {
        // Location data with coordinates
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
        serviceType: serviceTime, // 'right_now' or 'schedule_later'
        
        // Service-specific requirements
        isCarRental,
        isFuelDelivery,
        isSpareParts,
        
        // Vehicle details
        vehicle: {
          type: vehicleType,
          makeModel,
          year,
          color,
          licensePlate,
        },
        
        // Customer contact
        customer: {
          name: fullName,
          phone: phoneNumber,
          email,
          emergencyContact,
        },
        
        // NEW FIELDS - Service-specific data
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
          paymentMethod: 'cash', // MVP only supports cash
        },
        
        // Location skipped flag
        locationSkipped,
        
        // Metadata
        timestamp: new Date().toISOString(),
        platform: 'mobile',
        version: '1.1',
      };

      console.log('Sending comprehensive booking request:', JSON.stringify(bookingData, null, 2));

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/customer/finding_provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create booking');
      }

      // Store booking ID and start polling
      setBookingId(responseData.bookingId);
      setConnectionStatus('searching');
      startPolling(responseData.bookingId);

    } catch (error: unknown) {
      console.error('Booking request error:', error);
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      Alert.alert(
        'Connection Error',
        'Failed to connect to the server. Would you like to retry?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: sendBookingRequest }
        ]
      );
    }
  };

  const startPolling = (id?: string) => {
    const bookingIdToUse = id || bookingId;
    if (!bookingIdToUse) return;

    const pollBookingStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        const response = await fetch(`${API_BASE_URL}/api/customer/${bookingIdToUse}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to check booking status');
        }

        console.log('Booking status:', data.status);

        // Handle different booking statuses
        switch (data.status) {
          case 'provider_assigned':
          case 'confirmed':
            // Provider found! Navigate to next screen with ALL data
            setConnectionStatus('found');
            handleProviderFound({
              ...data,
              bookingId: bookingIdToUse,
            });
            break;

          case 'cancelled':
          case 'expired':
            // No providers available - navigate to no providers page
            setConnectionStatus('no_providers');
            handleNoProviders();
            break;

          case 'searching':
          case 'pending':
            // Still searching, continue polling if within limits
            setPollingAttempts(prev => {
              const newAttempts = prev + 1;
              if (newAttempts < MAX_POLLING_ATTEMPTS) {
                // Schedule next poll
                pollingTimer.current = setTimeout(pollBookingStatus, POLLING_INTERVAL) as unknown as number;
                return newAttempts;
              } else {
                // Max attempts reached - timeout - navigate to no providers page
                setConnectionStatus('no_providers');
                handleNoProviders();
                return newAttempts;
              }
            });
            break;

          default:
            // Unknown status, continue polling
            pollingTimer.current = setTimeout(pollBookingStatus, POLLING_INTERVAL) as unknown as number;
        }

      } catch (error: unknown) {
        console.error('Polling error:', error);
        // Don't stop polling on network errors, just retry
        pollingTimer.current = setTimeout(pollBookingStatus, POLLING_INTERVAL) as unknown as number;
      }
    };

    // Start polling
    pollBookingStatus();
  };

  const handleProviderFound = (bookingData: BookingData) => {
    // Clear any pending timers
    if (pollingTimer.current) {
      clearTimeout(pollingTimer.current);
    }

    // Navigate to provider assigned screen with ALL booking info
    setTimeout(() => {
      router.push({
        pathname: '/providerassigned',
        params: {
          // Pass ALL data to the next screen
          ...params,
          bookingId: bookingData.bookingId,
          providerName: bookingData.providerName || '',
          providerRating: bookingData.providerRating?.toString() || '0',
          providerImage: bookingData.providerImage || '',
          estimatedArrival: bookingData.estimatedArrival || '',
          vehicleDetails: bookingData.vehicleDetails || '',
          // Pass coordinates
          pickupLat: pickupLat?.toString() || '',
          pickupLng: pickupLng?.toString() || '',
          dropoffLat: dropoffLat?.toString() || '',
          dropoffLng: dropoffLng?.toString() || '',
        },
      });
    }, 1500); // Short delay to show "found" animation
  };

  const handleNoProviders = () => {
    // Clear any pending timers
    if (pollingTimer.current) {
      clearTimeout(pollingTimer.current);
    }

    // Navigate to no providers available screen with ALL data
    router.push({
      pathname: '/ProviderAssigned',
      params: {
        ...params,
        noProviders: 'true',
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
        return pollingAttempts > 0 
          ? `Searching for providers... (${pollingAttempts}s)` 
          : 'Searching for providers...';
      case 'found':
        return 'Provider found! Redirecting...';
      case 'no_providers':
        return 'No providers available at this time';
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

        {/* Subtitle */}
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
               'Searching for providers...'}
            </Text>
          </View>

          {/* Step 3: Assigning provider */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerInactive}>
              <View style={[
                styles.emptyCircle,
                connectionStatus === 'found' && styles.completedCircle,
                connectionStatus === 'no_providers' && styles.inactiveCircle
              ]} />
            </View>
            <Text style={[
              styles.stepTextInactive,
              connectionStatus === 'found' && styles.stepTextCompleted,
              connectionStatus === 'no_providers' && styles.stepTextInactive
            ]}>
              {connectionStatus === 'found' ? 'Provider assigned' : 
               connectionStatus === 'no_providers' ? 'No provider found' :
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
            connectionStatus === 'no_providers' && styles.dotError
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
    marginBottom: height * 0.03,
    letterSpacing: 0.3,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: height * 0.03,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: Math.min(16, height * 0.02),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: Math.min(13, height * 0.016),
    color: '#5c5c5c',
    marginBottom: 5,
  },
  serviceSpecificText: {
    fontSize: Math.min(12, height * 0.015),
    color: '#4CAF50',
    marginBottom: 5,
    fontWeight: '500',
  },
  coordinatesText: {
    fontSize: Math.min(11, height * 0.014),
    color: '#68bdee',
    marginBottom: 5,
    marginLeft: 10,
  },
  totalAmount: {
    fontSize: Math.min(15, height * 0.018),
    color: '#68bdee',
    fontWeight: 'bold',
    marginTop: 5,
  },
  tipText: {
    fontSize: Math.min(11, height * 0.014),
    color: '#8c8c8c',
    fontStyle: 'italic',
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
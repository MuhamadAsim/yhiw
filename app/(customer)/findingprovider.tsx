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
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { styles } from './styles/FindingProviderStyles';

const { height } = Dimensions.get('window');
const API_BASE_URL = 'https://yhiw-backend.onrender.com';

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

  // ALL navigation/flow guards as refs so they're synchronous and never stale
  const appState = useRef(AppState.currentState);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const isDone = useRef(false); // single unified "stop everything" flag

  // ─── Param helpers ───────────────────────────────────────────────────────────

  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  const getNumberParam = (param: string | string[] | undefined): number | null => {
    if (!param) return null;
    const value = Array.isArray(param) ? param[0] : param;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const getParsedArray = (param: string | string[] | undefined): any[] => {
    const value = getStringParam(param);
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  };

  // ─── Params ──────────────────────────────────────────────────────────────────

  const bookingIdFromParams = getStringParam(params.bookingId);
  const serviceId           = getStringParam(params.serviceId);
  const serviceName         = getStringParam(params.serviceName);
  const servicePrice        = getStringParam(params.servicePrice);
  const serviceCategory     = getStringParam(params.serviceCategory);

  const isCarRental   = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts  = serviceId === '12';

  const pickupAddress   = getStringParam(params.pickupAddress);
  const dropoffAddress  = getStringParam(params.dropoffAddress);
  const serviceTime     = getStringParam(params.serviceTime);
  const totalAmount     = getStringParam(params.totalAmount);
  const urgency         = getStringParam(params.urgency);
  const description     = getStringParam(params.description);
  const issues          = getParsedArray(params.issues);
  const photos          = getParsedArray(params.photos);

  const vehicleType  = getStringParam(params.vehicleType);
  const makeModel    = getStringParam(params.makeModel);
  const year         = getStringParam(params.year);
  const color        = getStringParam(params.color);
  const licensePlate = getStringParam(params.licensePlate);

  const fullName        = getStringParam(params.fullName);
  const phoneNumber     = getStringParam(params.phoneNumber);
  const email           = getStringParam(params.email);
  const emergencyContact = getStringParam(params.emergencyContact);

  const licenseFront   = getStringParam(params.licenseFront);
  const licenseBack    = getStringParam(params.licenseBack);
  const fuelType       = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);

  const scheduledDate     = getStringParam(params.scheduledDate);
  const scheduledTimeSlot = getStringParam(params.scheduledTimeSlot);

  const locationSkipped    = getStringParam(params.locationSkipped) === 'true';
  const hasInsurance       = getStringParam(params.hasInsurance) === 'true';
  const needSpecificTruck  = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications   = getStringParam(params.hasModifications) === 'true';
  const needMultilingual   = getStringParam(params.needMultilingual) === 'true';
  const selectedTip        = parseFloat(getStringParam(params.selectedTip)) || 0;

  const pickupLat  = getNumberParam(params.pickupLat);
  const pickupLng  = getNumberParam(params.pickupLng);
  const dropoffLat = getNumberParam(params.dropoffLat);
  const dropoffLng = getNumberParam(params.dropoffLng);

  // ─── Shared helpers ───────────────────────────────────────────────────────────

  /** Kill timers immediately — call before any navigation */
  const stopAllTimers = () => {
    if (pollingTimer.current) {
      clearTimeout(pollingTimer.current);
      pollingTimer.current = null;
    }
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }
  };

  /** Mark done and stop timers atomically */
  const markDone = (): boolean => {
    if (isDone.current) return false; // already done, abort
    isDone.current = true;
    stopAllTimers();
    return true;
  };

  // ─── Initialization ───────────────────────────────────────────────────────────

  useEffect(() => {
    console.log('🔍 INITIALIZATION CHECK - bookingIdFromParams:', bookingIdFromParams);

    const init = async () => {
      try {
        if (bookingIdFromParams) {
          const hasNewData = serviceId || pickupAddress || fullName;
          if (!hasNewData) {
            console.log('📋 EXISTING BOOKING:', bookingIdFromParams);
            setIsExistingBooking(true);
            setBookingId(bookingIdFromParams);
            setConnectionStatus('searching');
            setInitialized(true);
            startPolling(bookingIdFromParams);
            return;
          }
        } else {
          const stored = await AsyncStorage.getItem('currentBookingId');
          if (stored) {
            console.log('📋 Found bookingId in storage:', stored);
            setIsExistingBooking(true);
            setBookingId(stored);
            setConnectionStatus('searching');
            setInitialized(true);
            startPolling(stored);
            return;
          }
        }
        console.log('📋 No bookingId found - new booking');
        setInitialized(true);
      } catch (e) {
        console.error('❌ Init error:', e);
        setInitialized(true);
      }
    };

    init();

    return () => { isMounted.current = false; };
  }, []);

  // ─── Main effect (animation + create booking + event listeners) ───────────────

  useEffect(() => {
    if (!initialized) return;

    console.log('🔄 MAIN EFFECT - status:', connectionStatus);

    Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();

    if (!isExistingBooking && !bookingId && connectionStatus === 'creating') {
      createJobNotification();
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    timeoutTimer.current = setTimeout(() => {
      if (!isMounted.current || isDone.current) return;
      console.log('⏰ 3-minute timeout reached');
      handleTimeout();
    }, 180000);

    return () => {
      stopAllTimers();
      backHandler.remove();
      subscription.remove();
    };
  }, [initialized, isExistingBooking, bookingId]);
  // NOTE: connectionStatus intentionally NOT in deps — we don't want re-runs on status changes

  // ─── App state ────────────────────────────────────────────────────────────────

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (!isMounted.current || isDone.current) return;
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 Foreground — rechecking status');
      if (bookingId) checkBookingStatus(bookingId);
    }
    appState.current = nextAppState;
  };

  // ─── Back press ───────────────────────────────────────────────────────────────

  const handleBackPress = (): boolean => {
    if (isDone.current) return true;

    Alert.alert(
      'Cancel Search',
      'Are you sure you want to cancel?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => performCancel(),
        },
      ]
    );
    return true; // always intercept back
  };

  // ─── Cancel button ────────────────────────────────────────────────────────────

  const handleCancelPress = () => {
    console.log('🔙 Cancel Request button pressed');
    console.log('🔙 connectionStatus:', connectionStatus);
    console.log('🔙 isDone:', isDone.current);

    if (isDone.current) return;

    if (!bookingId) {
      // Nothing was created yet, just go back
      if (markDone()) router.back();
      return;
    }

    console.log('🔙 Showing cancel alert');
    Alert.alert(
      'Cancel Search',
      'Are you sure you want to cancel finding a provider?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            console.log('✅ User confirmed cancellation');
            performCancel();
          },
        },
      ]
    );
  };

  /**
   * The single cancel path. Stops polling FIRST, then hits the API,
   * then navigates back — never to NoProviderAvailable.
   */
  const performCancel = async () => {
    if (!markDone()) return; // already done

    console.log('❌ ===== CANCELLING BOOKING =====');
    console.log('❌ Booking ID:', bookingId);

    // Stop polling before anything so a racing status check can't fire
    stopAllTimers();

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && bookingId) {
        await fetch(`${API_BASE_URL}/api/jobs/${bookingId}/cancel`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: 'user_cancelled' }),
        }).catch(e => console.error('Cancel API error (non-fatal):', e));
      }
    } catch (e) {
      console.error('Cancel error (non-fatal):', e);
    }

    await AsyncStorage.removeItem('currentBookingId').catch(console.error);
    console.log('✅ Removed bookingId from storage');

    if (isMounted.current) {
      console.log('🚀 Navigating back after cancel');
      router.back();
    }
  };

  // ─── Create booking ───────────────────────────────────────────────────────────

  const createJobNotification = async () => {
    console.log('📤 ===== CREATING JOB NOTIFICATION =====');
    try {
      setConnectionStatus('creating');

      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found. Please sign in again.');

      const newBookingId = `YHIW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const bookingData = {
        bookingId: newBookingId,
        pickup: {
          address: pickupAddress,
          coordinates: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null,
        },
        dropoff: {
          address: dropoffAddress,
          coordinates: dropoffLat && dropoffLng ? { lat: dropoffLat, lng: dropoffLng } : null,
        },
        serviceId, serviceName,
        servicePrice: parseFloat(servicePrice) || 0,
        serviceCategory, isCarRental, isFuelDelivery, isSpareParts,
        vehicle: { type: vehicleType, makeModel, year, color, licensePlate },
        customer: { name: fullName, phone: phoneNumber, email, emergencyContact },
        carRental: isCarRental ? { licenseFront, licenseBack, hasInsurance } : null,
        fuelDelivery: isFuelDelivery ? { fuelType } : null,
        spareParts: isSpareParts ? { partDescription } : null,
        additionalDetails: {
          urgency,
          issues: issues.length > 0 ? issues : null,
          description,
          photos: photos.length > 0 ? photos : null,
          needSpecificTruck, hasModifications, needMultilingual,
        },
        schedule: {
          type: serviceTime,
          scheduledDateTime:
            serviceTime === 'schedule_later'
              ? { date: scheduledDate, timeSlot: scheduledTimeSlot }
              : null,
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

      const response = await fetch(`${API_BASE_URL}/api/jobs/create-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!isMounted.current || isDone.current) return;

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Server error: ${response.status}`);
      }

      if (responseData.success) {
        console.log('✅ Notification created, ID:', responseData.bookingId);
        await AsyncStorage.setItem('currentBookingId', responseData.bookingId);
        setBookingId(responseData.bookingId);
        setConnectionStatus('searching');
        startPolling(responseData.bookingId);
      } else {
        throw new Error('Failed to create notification');
      }
    } catch (e: unknown) {
      if (!isMounted.current || isDone.current) return;
      console.error('❌ CREATE NOTIFICATION ERROR:', e);
      setConnectionStatus('error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      Alert.alert(
        'Request Failed',
        e instanceof Error ? e.message : 'Failed to process request',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { if (markDone()) router.back(); } },
          { text: 'Retry', onPress: createJobNotification },
        ]
      );
    }
  };

  // ─── Polling ──────────────────────────────────────────────────────────────────

  const startPolling = (id: string) => {
    console.log('🔄 Starting polling for booking:', id);

    const poll = async () => {
      if (!isMounted.current || isDone.current) return;
      await checkBookingStatus(id);
      // Only schedule next poll if still running
      if (isMounted.current && !isDone.current) {
        pollingTimer.current = setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const checkBookingStatus = async (id: string) => {
    if (isDone.current) return; // bail immediately if we're done

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!isMounted.current || isDone.current) return;

      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ Booking 404 — no provider found');
          handleNoProviders('not_found');
        }
        // other non-ok: just let polling retry
        return;
      }

      const data: StatusResponse = await response.json();
      console.log('📊 Status:', data);
      setPollingAttempts(prev => prev + 1);

      if (data.status === 'accepted') {
        handleProviderAccepted(id);
      } else if (data.status === 'expired') {
        console.log('❌ Booking expired');
        handleNoProviders('expired');
      }
    } catch (e) {
      console.error('❌ Error checking status:', e);
    }
  };

  // ─── Terminal handlers ────────────────────────────────────────────────────────

  const handleProviderAccepted = (id: string) => {
    if (!markDone()) return;

    console.log('✅ PROVIDER ACCEPTED — navigating to ProviderAssigned');
    setConnectionStatus('found');
    AsyncStorage.setItem('currentBookingId', id).catch(console.error);

    setTimeout(() => {
      if (isMounted.current) {
        router.replace({
          pathname: '/(customer)/ProviderAssigned',
          params: { bookingId: id },
        });
      }
    }, 1500);
  };

  const handleNoProviders = (reason: string) => {
    if (!markDone()) return;

    console.log('❌ NO PROVIDERS — reason:', reason);
    setConnectionStatus('no_providers');
    AsyncStorage.removeItem('currentBookingId').catch(console.error);

    if (isMounted.current) {
      router.replace({
        pathname: '/(customer)/NoProviderAvailable',
        params: { reason, serviceId, serviceName, servicePrice, serviceCategory },
      });
    }
  };

  const handleTimeout = () => {
    if (!markDone()) return;

    console.log('⏰ TIMEOUT — navigating to NoProviderAvailable');
    setConnectionStatus('timeout');
    AsyncStorage.removeItem('currentBookingId').catch(console.error);

    if (isMounted.current) {
      router.replace({
        pathname: '/(customer)/NoProviderAvailable',
        params: { reason: 'timeout', serviceId, serviceName, servicePrice, serviceCategory },
      });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderStatusMessage = () => {
    switch (connectionStatus) {
      case 'creating':     return 'Creating your booking...';
      case 'searching':    return 'Searching for providers...';
      case 'found':        return 'Provider found! Assigning now...';
      case 'no_providers': return 'No providers available at this time';
      case 'timeout':      return 'Search timed out. Please try again.';
      case 'error':        return 'Connection error. Please try again.';
      default:             return 'Finding a provider...';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/finding_provider.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Finding a Provider</Text>
        <Text style={styles.subtitle}>{renderStatusMessage()}</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerCompleted}>
              <Ionicons name="checkmark-circle" size={24} color="#68bdee" />
            </View>
            <Text style={styles.stepTextCompleted}>Request received</Text>
          </View>

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
              <Animated.View style={[styles.stepIconContainerActive, { transform: [{ rotate: spin }] }]}>
                <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
              </Animated.View>
            )}
            <Text style={connectionStatus === 'found' ? styles.stepTextCompleted : styles.stepTextActive}>
              {connectionStatus === 'no_providers' ? 'No providers available' :
               connectionStatus === 'timeout'      ? 'Search timed out' :
               'Searching for providers...'}
            </Text>
          </View>

          <View style={[styles.stepCard, connectionStatus === 'found' && styles.stepCardActive]}>
            <View style={styles.stepIconContainerInactive}>
              {connectionStatus === 'found' ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
                </Animated.View>
              ) : (
                <View style={[
                  styles.emptyCircle,
                  (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.inactiveCircle,
                ]} />
              )}
            </View>
            <Text style={[
              styles.stepTextInactive,
              connectionStatus === 'found' && styles.stepTextActive,
              (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.stepTextInactive,
            ]}>
              {connectionStatus === 'found'        ? 'Assigning provider...' :
               connectionStatus === 'no_providers' ? 'No provider found' :
               connectionStatus === 'timeout'      ? 'Search failed' :
               'Assigning provider'}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>DID YOU KNOW?</Text>
          <Text style={styles.infoText}>
            YHIW connects you with verified and rated service providers. Average response time is under 2 minutes.
          </Text>
        </View>

        <View style={styles.paginationContainer}>
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={[
            styles.dotActive,
            connectionStatus === 'found' && styles.dotCompleted,
            (connectionStatus === 'no_providers' || connectionStatus === 'timeout') && styles.dotError,
          ]} />
          <View style={styles.dotInactive} />
        </View>

        {error && connectionStatus === 'error' && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>

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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  AppState
} from 'react-native';
import usePreventBack from '@/hooks/usePreventBack';

import ChatPopup from './components/ChatPopup';
import { styles } from './styles/ServiceInProgressStyles';
const { height } = Dimensions.get('window');

const API_BASE_URL = 'https://yhiw-backend.onrender.com';

interface JobDetailsResponse {
  success: boolean;
  data: {
    bookingId: string;
    status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'completed_confirmed' | 'completed_provider';
    timeline: {
      acceptedAt: string;
      startedAt: string | null;
      completedAt: string | null;
      cancelledAt: string | null;
      cancelledBy: string | null;
    };
    provider: {
      id: string;
      name: string;
      phone: string;
      email: string;
      profileImage?: string;
      serviceType: string[];
      rating: number;
      totalJobsCompleted: number;
    };
    bookingData: {
      serviceId: string;
      serviceName: string;
      servicePrice: number;
      serviceCategory: string;
      pickup: {
        address: string;
        coordinates: {
          lat: number;
          lng: number;
        };
      };
      dropoff?: {
        address: string;
        coordinates: {
          lat: number;
          lng: number;
        };
      };
      vehicle: {
        type: string;
        makeModel: string;
        year: string;
        color: string;
        licensePlate: string;
      };
      urgency: string;
      issues: string[];
      description: string;
      payment: {
        totalAmount: number;
        selectedTip?: number;
        baseServiceFee: number;
      };
      isCarRental?: boolean;
      isFuelDelivery?: boolean;
      isSpareParts?: boolean;
      fuelType?: string;
      partDescription?: string;
      hasInsurance?: boolean;
    };
  };
}

interface TimerResponse {
  success: boolean;
  timer: {
    durationSeconds: number;
    isPaused: boolean;
    pausedAt: string | null;
    lastUpdated?: string | null;
  };
}

interface JobStatusResponse {
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'completed_confirmed' | 'completed_provider';
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  timeTracking?: {
    totalSeconds: number;
    isPaused: boolean;
  };
}

interface HasMessageResponse {
  success: boolean;
  hasAnyMessage: boolean;
}

const ServiceInProgressScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  usePreventBack(); // ✅ one line


  // State variables
  const [hasNavigatedToCompleted, setHasNavigatedToCompleted] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState<boolean>(false);
  const [hasShownProviderCompleteAlert, setHasShownProviderCompleteAlert] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const appState = useRef(AppState.currentState);

  // Timer state
  const [duration, setDuration] = useState('00:00');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetailsResponse['data'] | null>(null);

  // Polling state
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [jobStatus, setJobStatus] = useState('in_progress');
  const [isPolling, setIsPolling] = useState(true);
  const [hasShownCancelledAlert, setHasShownCancelledAlert] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Get data from params (as fallback)
  const bookingId = params.bookingId as string;
  const providerNameParam = params.providerName as string;
  const providerIdParam = params.providerId as string;
  const providerPhoneParam = params.providerPhone as string;
  const serviceTypeParam = params.serviceType as string;
  const vehicleTypeParam = params.vehicleType as string;
  const pickupLocationParam = params.pickupLocation as string;
  const pickupLat = params.pickupLat as string;
  const pickupLng = params.pickupLng as string;
  const totalAmountParam = params.totalAmount as string;

  // Check if provider has completed the service
  const isProviderComplete = jobStatus === 'completed_provider';

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    const logMessage = `🔍 [CustomerServiceInProgress] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // ===== FORMAT DURATION FROM SECONDS =====
  const formatDurationFromSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // ===== START LIVE TIMER =====
  const startLiveTimer = (initialSeconds: number, paused: boolean) => {
    addDebug(`⏱️ Starting live timer with ${initialSeconds}s, paused: ${paused}`);

    setDurationSeconds(initialSeconds);
    setDuration(formatDurationFromSeconds(initialSeconds));
    setIsPaused(paused);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (paused) {
      addDebug('⏸️ Timer is paused, not starting interval');
      return;
    }

    timerRef.current = setInterval(() => {
      setDurationSeconds(prev => {
        const newSeconds = prev + 1;
        setDuration(formatDurationFromSeconds(newSeconds));
        return newSeconds;
      });
    }, 1000);

    addDebug('▶️ Timer interval started');
  };

  // ===== FETCH TIMER FROM API =====
  const fetchTimerData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) {
        addDebug('❌ No token or bookingId for timer fetch');
        return null;
      }

      addDebug(`⏱️ Fetching timer for booking: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/api/jobs/${bookingId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addDebug(`❌ Timer fetch failed: ${response.status}`);
        return null;
      }

      const data: TimerResponse = await response.json();
      addDebug('✅ Timer data fetched:', data);

      if (data.success && data.timer) {
        return data.timer;
      }
      return null;
    } catch (error) {
      addDebug('❌ Error fetching timer:', error);
      return null;
    }
  };

  // ===== LOAD TIMER WITH ELAPSED TIME CALCULATION =====
  const loadTimerWithElapsedTime = async () => {
    try {
      const timerData = await fetchTimerData();

      if (timerData) {
        let serverSeconds = timerData.durationSeconds || 0;
        const serverPaused = timerData.isPaused || false;
        const lastUpdated = timerData.lastUpdated ? new Date(timerData.lastUpdated) : null;

        // If timer wasn't paused, calculate elapsed time since last sync
        if (!serverPaused && lastUpdated) {
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

          // Only add if reasonable (less than 1 hour)
          if (elapsedSeconds > 0 && elapsedSeconds < 3600) {
            serverSeconds = serverSeconds + elapsedSeconds;
            addDebug(`⏱️ Timer was running - added ${elapsedSeconds}s elapsed time`);
          }
        }

        startLiveTimer(serverSeconds, serverPaused);
        setLastSyncTime(new Date());
        addDebug(`✅ Timer loaded: ${serverSeconds}s, paused: ${serverPaused}`);
      } else {
        // No timer data, start fresh if service started
        if (startTime) {
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          startLiveTimer(elapsedSeconds, false);
        }
      }
    } catch (error) {
      addDebug('❌ Error loading timer:', error);
    }
  };

  // Check if there are any messages
  const checkForAnyMessage = async () => {
    if (!bookingId || chatVisible) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/chat/${bookingId}/has-message`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data: HasMessageResponse = await response.json();

      if (data.success) {
        setHasNewMessage(data.hasAnyMessage || false);

        if (data.hasAnyMessage) {
          addDebug(`📬 There is a message available`);
        }
      }
    } catch (error) {
      addDebug(`❌ Error checking messages: ${error}`);
    }
  };

  // Handle message button press
  const handleMessage = () => {
    addDebug(`💬 Opening chat popup with provider`);
    setHasNewMessage(false);
    setChatVisible(true);
  };

  // Handle chat close
  const handleChatClose = () => {
    setChatVisible(false);
    setTimeout(() => {
      checkForAnyMessage();
    }, 500);
  };

  // Handle customer marking service as complete
  const handleMarkComplete = async () => {
    if (!isProviderComplete) {
      Alert.alert(
        'Not Ready',
        'Please wait for the provider to complete the service before marking it as complete.'
      );
      return;
    }

    Alert.alert(
      'Confirm Completion',
      'Are you sure the service has been completed to your satisfaction?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            setIsMarkingComplete(true);

            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                throw new Error('Authentication failed');
              }

              addDebug(`📡 Marking service as completed_confirmed for booking:`, bookingId);

              const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/status`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'completed_confirmed',
                  action: 'customer_confirm',
                  confirmedAt: new Date().toISOString()
                }),
              });

              const data = await response.json();
              addDebug('📡 Status update response:', {
                status: response.status,
                data
              });

              if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to confirm completion');
              }

              addDebug('✅ Service marked as completed_confirmed successfully');

              Alert.alert(
                'Success!',
                'Thank you for confirming service completion. You will be redirected shortly.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      checkJobStatus();
                    }
                  }
                ]
              );

            } catch (error) {
              addDebug('❌ Error marking service as complete:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to confirm completion. Please try again.'
              );
            } finally {
              setIsMarkingComplete(false);
            }
          }
        }
      ]
    );
  };

  // Handle cancel service
  const handleCancelService = () => {
    Alert.alert(
      'Cancel Service',
      'Are you sure you want to cancel this service? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            addDebug(`❌ Cancelling service: ${bookingId}`);

            // Stop polling and timers
            setIsPolling(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (pollingTimerRef.current) {
              clearInterval(pollingTimerRef.current);
              pollingTimerRef.current = null;
            }

            try {
              const token = await AsyncStorage.getItem('userToken');
              if (token) {
                await fetch(`${API_BASE_URL}/api/customer/${bookingId}/cancel`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    cancelledBy: 'customer',
                    reason: 'Customer cancelled during service'
                  })
                });
              }

              // Clean up storage
              await AsyncStorage.removeItem('currentBookingId');
              await AsyncStorage.removeItem('currentBookingStatus');

              addDebug('✅ Service cancelled, navigating to Home');

              // Navigate to Home
              router.replace('/(customer)/Home');
            } catch (error) {
              addDebug('❌ Error during cancellation:', error);
              // Still navigate home even if API call fails
              router.replace('/(customer)/Home');
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  // Fetch job details on mount
  useEffect(() => {
    if (bookingId) {
      fetchJobDetails();
    }
    setHasNavigatedToCompleted(false);
    setHasShownProviderCompleteAlert(false);
  }, [bookingId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        addDebug('🧹 Timer cleaned up');
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        addDebug('🧹 Polling timer cleaned up');
      }
    };
  }, []);

  // Focus effect - reload timer when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        addDebug('📱 Screen focused - reloading timer');
        loadTimerWithElapsedTime();
        checkJobStatus();
        checkForAnyMessage();
      }
    }, [bookingId])
  );

  // Polling effect - check job status every 5 seconds
  useEffect(() => {
    if (!bookingId || !isPolling) {
      return;
    }

    addDebug('🔄 Starting polling for job status (every 5 seconds)');

    const pollInterval = setInterval(async () => {
      await Promise.all([
        checkJobStatus(),
        checkForAnyMessage(),
        loadTimerWithElapsedTime()
      ]);
      setPollingAttempts(prev => prev + 1);
    }, 5000);

    pollingTimerRef.current = pollInterval;

    return () => {
      addDebug('🧹 Stopping polling');
      clearInterval(pollInterval);
    };
  }, [bookingId, isPolling]);

  // App state change listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        addDebug('📱 App came to foreground - reloading timer');
        loadTimerWithElapsedTime();
        checkJobStatus();
        checkForAnyMessage();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // Check job status from backend
  const checkJobStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        return;
      }

      const url = `${API_BASE_URL}/api/jobs/${bookingId}/status`;
      addDebug(`📊 Polling #${pollingAttempts + 1} - Checking job status`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addDebug(`❌ Status check failed: ${response.status}`);
        return;
      }

      const data: JobStatusResponse = await response.json();
      addDebug(`📊 Job status: ${data.status}`);

      setJobStatus(data.status);

      // ===== SHOW ALERT WHEN PROVIDER COMPLETES SERVICE =====
      if (data.status === 'completed_provider' && !hasShownProviderCompleteAlert && !hasNavigatedToCompleted) {
        setHasShownProviderCompleteAlert(true);
      }

      // ===== HANDLE JOB COMPLETED =====
      const completedStatuses = ['completed', 'completed_confirmed', 'completed_by_provider'];
      const isJobCompleted = completedStatuses.includes(data.status);

      if (isJobCompleted && !hasNavigatedToCompleted) {
        addDebug('✅✅✅ JOB COMPLETED - Navigating to ServiceCompleted');

        setHasNavigatedToCompleted(true);
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }

        const finalDuration = duration;
        const finalDurationSeconds = durationSeconds;

        setTimeout(() => {
          router.replace({
            pathname: '/(customer)/ServiceCompleted',
            params: {
              bookingId,
              providerName: jobDetails?.provider?.name || providerNameParam || '',
              providerId: jobDetails?.provider?.id || providerIdParam || '',
              serviceType: jobDetails?.bookingData?.serviceName || serviceTypeParam || '',
              totalAmount: jobDetails?.bookingData?.payment?.totalAmount?.toString() || totalAmountParam || '0',
              duration: finalDuration,
              durationSeconds: finalDurationSeconds.toString(),
              pickupLocation: jobDetails?.bookingData?.pickup?.address || pickupLocationParam || '',
              pickupLat: jobDetails?.bookingData?.pickup?.coordinates?.lat?.toString() || pickupLat || '',
              pickupLng: jobDetails?.bookingData?.pickup?.coordinates?.lng?.toString() || pickupLng || '',
              completedAt: data.completedAt || new Date().toISOString(),
            }
          });
        }, 500);
      }

      // ===== HANDLE JOB CANCELLED =====
      if (data.status === 'cancelled' && !hasShownCancelledAlert && !hasNavigatedToCompleted) {
        addDebug('❌❌❌ JOB CANCELLED - Returning to home');

        setHasShownCancelledAlert(true);
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }

        await AsyncStorage.removeItem('currentBookingId');

        Alert.alert(
          'Service Cancelled',
          data.cancellationReason || 'The service has been cancelled by the provider.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(customer)/Home');
              }
            }
          ]
        );
      }

      // ===== HANDLE JOB STARTED =====
      if (data.status === 'in_progress' && !startTime) {
        addDebug('▶️ Service has started');
        setStartTime(data.startedAt ? new Date(data.startedAt) : new Date());
      }

    } catch (error) {
      addDebug('❌ Error checking job status:', error);
    }
  };

  // Fetch complete job details
  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        setError('Authentication required');
        return;
      }

      addDebug(`🔍 Fetching job details for bookingId: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/details_inprogress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }

      const data: JobDetailsResponse = await response.json();
      addDebug('✅ Job details fetched successfully');

      if (data.success) {
        setJobDetails(data.data);

        if (data.data.timeline.startedAt) {
          setStartTime(new Date(data.data.timeline.startedAt));
        }

        setJobStatus(data.data.status);

        // Load timer with elapsed time calculation
        await loadTimerWithElapsedTime();

        await checkForAnyMessage();
      }
    } catch (error) {
      addDebug('❌ Error fetching job details:', error);
      setError('Failed to load job details');

      // Fallback to params
      if (providerNameParam) {
        setStartTime(new Date());
        startLiveTimer(0, false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    const phone = jobDetails?.provider?.phone || providerPhoneParam;
    const name = jobDetails?.provider?.name || providerNameParam || 'Provider';

    if (phone) {
      Alert.alert('Call', `Calling ${name} at ${phone}...`);
    } else {
      Alert.alert('Call', `Calling ${name}...`);
    }
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Opening report form...');
  };

  const formatTime = (date: Date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  // Error state
  if (error && !jobDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use real data from API or fallback to params
  const providerName = jobDetails?.provider?.name || providerNameParam || 'Ahmed Al-Khalifa';
  const providerPhone = jobDetails?.provider?.phone || providerPhoneParam;
  const providerRating = jobDetails?.provider?.rating || 4.5;
  const providerJobs = jobDetails?.provider?.totalJobsCompleted || 1250;
  const serviceType = jobDetails?.bookingData?.serviceName || serviceTypeParam || 'Quick Tow (Flatbed)';
  const vehicleType = jobDetails?.bookingData?.vehicle?.type || vehicleTypeParam || 'SUV';
  const vehicleMakeModel = jobDetails?.bookingData?.vehicle?.makeModel || '';
  const vehicleLicense = jobDetails?.bookingData?.vehicle?.licensePlate || '';
  const pickupLocation = jobDetails?.bookingData?.pickup?.address || pickupLocationParam || '23 Main Street, Manama';
  const totalAmount = jobDetails?.bookingData?.payment?.totalAmount?.toString() || totalAmountParam || '99.75';
  const selectedTip = jobDetails?.bookingData?.payment?.selectedTip;
  const description = jobDetails?.bookingData?.description;
  const startedAtTime = startTime ? formatTime(startTime) : 'Just now';
  const showPaused = isPaused;

  return (
    <View style={styles.container}>
      {/* Polling Status Badge */}
      <View style={styles.pollingBadge}>
        <View style={[styles.pollingDot, showPaused && styles.pausedDot]} />
        <Text style={[styles.pollingText, showPaused && styles.pausedText]}>
          {showPaused ? 'Paused' : `Live • ${pollingAttempts}`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.clockIconContainer}>
            <View style={styles.clockIconOuter}>
              <Ionicons name="time-outline" size={40} color="#68bdee" />
            </View>
          </View>
          <Text style={styles.title}>Service In Progress</Text>
          <Text style={styles.subtitle}>Your service has started</Text>
        </View>

        {/* Duration Card */}
        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>DURATION</Text>
          <Text style={styles.durationTime}>{duration}</Text>

          {/* Live/Paused Indicator */}
          <View style={[styles.liveIndicator, showPaused && styles.pausedIndicator]}>
            <View style={[styles.liveDot, showPaused && styles.pausedDot]} />
            <Text style={styles.liveText}>{showPaused ? 'PAUSED' : 'LIVE'}</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={[styles.providerCard, styles.cardWithBorder]}>
          <View style={styles.providerHeader}>
            <View style={styles.providerTextContainer}>
              <Text style={styles.providerLabel}>Provider</Text>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.providerStats}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.ratingText}>{providerRating.toFixed(1)}</Text>
                </View>
                <Text style={styles.statsDivider}>•</Text>
                <Text style={styles.jobsText}>{providerJobs}+ jobs</Text>
              </View>
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={28} color="#68bdee" />
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
              <View style={styles.messageIconContainer}>
                <Ionicons name="chatbubble-outline" size={20} color="#68bdee" />
                {hasNewMessage && <View style={styles.messageDot} />}
              </View>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card */}
        <View style={[styles.detailsCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{serviceType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>
              {vehicleType}{vehicleMakeModel ? ` • ${vehicleMakeModel}` : ''}
            </Text>
          </View>

          {vehicleLicense ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Plate</Text>
              <Text style={styles.detailValue}>{vehicleLicense}</Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{pickupLocation}</Text>
          </View>

          {jobDetails?.bookingData?.dropoff?.address ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>{jobDetails.bookingData.dropoff.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>PROGRESS</Text>

          {/* Progress Item 1 - Provider Arrived */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconCompleted}>
              <View style={styles.progressDotCompleted} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextCompleted}>Provider Arrived</Text>
              <Text style={styles.progressTimeCompleted}>{startedAtTime}</Text>
            </View>
          </View>

          {/* Progress Item 2 - Service In Progress */}
          <View style={styles.progressItem}>
            <View style={[styles.progressIconActive, showPaused && styles.progressIconPaused]}>
              <View style={[styles.progressDotActive, showPaused && styles.progressDotPaused]} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressTextActive, showPaused && styles.progressTextPaused]}>
                {showPaused ? 'Service Paused' : 'Service In Progress'}
              </Text>
              <Text style={styles.progressTimeActive}>
                {duration} elapsed
              </Text>
            </View>
          </View>

          {/* Progress Item 3 - Service Complete */}
          <View style={styles.progressItem}>
            <View style={[styles.progressIconInactive, isProviderComplete && styles.progressIconCompleted]}>
              <View style={[styles.progressDotInactive, isProviderComplete && styles.progressDotCompleted]} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressTextInactive, isProviderComplete && styles.progressTextCompleted]}>
                {isProviderComplete ? 'Service Complete (Waiting for Your Confirmation)' : 'Service Complete'}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Update Card */}
        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#68bdee" />
            <Text style={styles.updateTitle}>Service Update</Text>
          </View>
          <Text style={styles.updateText}>
            {description ||
              `The provider is currently working on your ${serviceType.toLowerCase()}. You'll be notified when the service is complete.`}
          </Text>
        </View>

        {/* Estimated Cost Card */}
        <View style={[styles.costCard, styles.cardWithBorder]}>
          <View style={styles.costRow}>
            <View>
              <Text style={styles.costLabel}>Estimated Cost</Text>
              <Text style={styles.costNote}>Final cost may vary</Text>
            </View>
            <Text style={styles.costValue}>{totalAmount} BHD</Text>
          </View>
          {selectedTip && selectedTip > 0 ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipLabel}>Including tip</Text>
              <Text style={styles.tipValue}>{selectedTip} BHD</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons Footer */}
      <View style={styles.bottomContainer}>
        {/* Mark as Complete Button - Only shows when provider has completed */}
        {isProviderComplete && !hasNavigatedToCompleted && (
          <TouchableOpacity
            style={[styles.markCompleteButton, isMarkingComplete && styles.buttonDisabled]}
            onPress={handleMarkComplete}
            activeOpacity={0.7}
            disabled={isMarkingComplete}
          >
            {isMarkingComplete ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.markCompleteButtonText}>Mark as Complete</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Service Button */}
        <TouchableOpacity
          style={[styles.cancelServiceButton, isCancelling && styles.buttonDisabled]}
          onPress={handleCancelService}
          activeOpacity={0.7}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.cancelServiceButtonText}>Cancel Service</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Report Issue Button */}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportIssue}
          activeOpacity={0.7}
        >
          <Text style={styles.reportButtonText}>Report An Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Popup */}
      <ChatPopup
        visible={chatVisible}
        onClose={handleChatClose}
        bookingId={bookingId}
        providerName={providerName}
        onChatClosed={() => {
          setHasNewMessage(false);
        }}
      />
    </View>
  );
};

export default ServiceInProgressScreen;
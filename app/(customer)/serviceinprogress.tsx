import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ChatPopup from './components/ChatPopup'; // Import ChatPopup
import { styles } from './styles/ServiceInProgressStyles';
const { height } = Dimensions.get('window');

const API_BASE_URL = 'https://yhiw-backend.onrender.com';

interface JobDetailsResponse {
  success: boolean;
  data: {
    bookingId: string;
    status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'completed_confirmed';
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
  };
}

interface JobStatusResponse {
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'completed_confirmed';
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
  // Add with your other state variables
  const [hasNavigatedToCompleted, setHasNavigatedToCompleted] = useState(false);

  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState<boolean>(false);

  // Timer state
  const [duration, setDuration] = useState('00:00');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetailsResponse['data'] | null>(null);

  // Polling state
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [jobStatus, setJobStatus] = useState('in_progress');
  const [isPolling, setIsPolling] = useState(true);
  const [hasShownCancelledAlert, setHasShownCancelledAlert] = useState(false);

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

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    const logMessage = `🔍 [ServiceInProgress] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  };

  // Check if there are any messages
  const checkForAnyMessage = async () => {
    if (!bookingId || chatVisible) return; // Don't check if chat is open

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

  // Handle message button press - open chat popup
  const handleMessage = () => {
    addDebug(`💬 Opening chat popup with provider`);
    setHasNewMessage(false); // Reset indicator when opening
    setChatVisible(true);
  };

  // Handle chat close
  const handleChatClose = () => {
    setChatVisible(false);
    // Small delay to ensure chat is fully closed before checking
    setTimeout(() => {
      checkForAnyMessage();
    }, 500);
  };

  // ===== FETCH TIMER FROM API =====
  const fetchTimerData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) {
        console.log('❌ No token or bookingId for timer fetch');
        return null;
      }

      console.log(`⏱️ Fetching timer for booking: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/api/jobs/${bookingId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log(`❌ Timer fetch failed: ${response.status}`);
        return null;
      }

      const data: TimerResponse = await response.json();
      console.log('✅ Timer data fetched:', data);

      if (data.success && data.timer) {
        return data.timer;
      }
      return null;
    } catch (error) {
      console.log('❌ Error fetching timer:', error);
      return null;
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
    console.log(`⏱️ Starting live timer with ${initialSeconds}s, paused: ${paused}`);

    setDurationSeconds(initialSeconds);
    setDuration(formatDurationFromSeconds(initialSeconds));
    setIsPaused(paused);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Don't start interval if paused
    if (paused) {
      console.log('⏸️ Timer is paused, not starting interval');
      return;
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setDurationSeconds(prev => {
        const newSeconds = prev + 1;
        setDuration(formatDurationFromSeconds(newSeconds));
        return newSeconds;
      });
    }, 1000);

    console.log('▶️ Timer interval started');
  };

  // Fetch job details on mount
  useEffect(() => {
    if (bookingId) {
      fetchJobDetails();
    }
    setHasNavigatedToCompleted(false);

  }, [bookingId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        console.log('🧹 Timer cleaned up');
      }
    };
  }, []);

  // Polling effect - check job status every 5 seconds
  useEffect(() => {
    if (!bookingId || !isPolling) {
      console.log('❌ No bookingId or polling stopped');
      return;
    }

    console.log('🔄 Starting polling for job status (every 5 seconds)');

    const pollInterval = setInterval(async () => {
      await Promise.all([
        checkJobStatus(),
        checkForAnyMessage() // Check messages in polling
      ]);
      setPollingAttempts(prev => prev + 1);
    }, 5000);

    return () => {
      console.log('🧹 Stopping polling');
      clearInterval(pollInterval);
    };
  }, [bookingId, isPolling]);

  // Fetch complete job details
  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        setError('Authentication required');
        return;
      }

      console.log(`🔍 Fetching job details for bookingId: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/api/customer/${bookingId}/details_inprogress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }

      const data: JobDetailsResponse = await response.json();
      console.log('✅ Job details fetched successfully');

      if (data.success) {
        setJobDetails(data.data);

        // Set start time from backend if available
        if (data.data.timeline.startedAt) {
          setStartTime(new Date(data.data.timeline.startedAt));
        }

        // Update job status
        setJobStatus(data.data.status);

        // ===== FETCH TIMER DATA =====
        const timerData = await fetchTimerData();
        if (timerData) {
          // Start live timer with fetched data
          startLiveTimer(timerData.durationSeconds, timerData.isPaused);
        } else if (data.data.timeline.startedAt) {
          // Fallback: calculate from startedAt
          const startedAt = new Date(data.data.timeline.startedAt);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          startLiveTimer(elapsedSeconds, false);
        } else {
          // Final fallback: start from 0
          startLiveTimer(0, false);
        }

        // Check for messages after loading job details
        await checkForAnyMessage();
      }
    } catch (error) {
      console.log('❌ Error fetching job details:', error);
      setError('Failed to load job details');

      // Fallback to params if API fails
      if (providerNameParam) {
        setStartTime(new Date());
        // Start timer from 0 as fallback
        startLiveTimer(0, false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkJobStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const url = `${API_BASE_URL}/api/jobs/${bookingId}/status`;
      console.log(`📊 Polling #${pollingAttempts + 1} - Checking job status`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log(`❌ Status check failed: ${response.status}`);
        return;
      }

      const data: JobStatusResponse = await response.json();
      console.log(`📊 Job status: ${data.status}`);

      setJobStatus(data.status);

      // ===== HANDLE JOB COMPLETED - Check for ALL possible completed statuses =====
      const completedStatuses = ['completed', 'completed_confirmed', 'completed_by_provider'];
      const isJobCompleted = completedStatuses.includes(data.status);

      if (isJobCompleted && !hasNavigatedToCompleted) {
        console.log('✅✅✅ JOB COMPLETED - Navigating to ServiceCompleted');

        // Set flag to prevent multiple navigations
        setHasNavigatedToCompleted(true);

        // Stop polling and timer
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Get the final duration
        const finalDuration = duration; // This is already formatted
        const finalDurationSeconds = durationSeconds;

        // Navigate to ServiceCompleted screen
        setTimeout(() => {
          router.push({
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
        console.log('❌❌❌ JOB CANCELLED - Returning to home');

        setHasShownCancelledAlert(true);

        // Stop polling and timer
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Remove bookingId from storage
        await AsyncStorage.removeItem('currentBookingId');

        // Show alert
        Alert.alert(
          'Service Cancelled',
          data.cancellationReason || 'The service has been cancelled by the provider.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(customer)/home');
              }
            }
          ]
        );
      }

      // ===== HANDLE JOB STARTED (Optional - update UI when service starts) =====
      if (data.status === 'in_progress' && !startTime) {
        console.log('▶️ Service has started');
        setStartTime(data.startedAt ? new Date(data.startedAt) : new Date());
      }

    } catch (error) {
      console.log('❌ Error checking job status:', error);
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

  // Fixed formatTime function
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

  // Use real data from API or fallback to params with null checks
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

  // Format the started time
  const startedAtTime = startTime ? formatTime(startTime) : 'Just now';

  // Show pause indicator if timer is paused
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
          <Text style={styles.startedTime}>Started at {startedAtTime}</Text>

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

          {/* Action Buttons with Red Dot */}
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
            <View style={styles.progressIconInactive}>
              <View style={styles.progressDotInactive} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextInactive}>Service Complete</Text>
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

          {/* Polling status indicator */}
          <View style={styles.pollingIndicator}>
            <Ionicons
              name={showPaused ? "pause-circle-outline" : "sync-outline"}
              size={14}
              color={showPaused ? "#FFA500" : "#4CAF50"}
            />
            <Text style={[
              styles.pollingIndicatorText,
              showPaused && styles.pausedIndicatorText
            ]}>
              {showPaused ? 'Timer paused by provider' : 'Checking for updates every 5 seconds'}
            </Text>
          </View>
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
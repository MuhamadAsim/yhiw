import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const ServiceInProgressScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
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
      await checkJobStatus();
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

      // ===== HANDLE JOB COMPLETED =====
      if (data.status === 'completed' || data.status === 'completed_confirmed') {
        console.log('✅✅✅ JOB COMPLETED - Navigating to ServiceCompleted');
        
        // Stop polling and timer
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

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
              duration,
              pickupLocation: jobDetails?.bookingData?.pickup?.address || pickupLocationParam || '',
              pickupLat: jobDetails?.bookingData?.pickup?.coordinates?.lat?.toString() || pickupLat || '',
              pickupLng: jobDetails?.bookingData?.pickup?.coordinates?.lng?.toString() || pickupLng || '',
              completedAt: data.completedAt || new Date().toISOString(),
            }
          });
        }, 500);
      }

      // ===== HANDLE JOB CANCELLED =====
      if (data.status === 'cancelled' && !hasShownCancelledAlert) {
        console.log('❌❌❌ JOB CANCELLED - Returning to home');
        
        setHasShownCancelledAlert(true);
        
        // Stop polling and timer
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
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

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: { 
        providerName: jobDetails?.provider?.name || providerNameParam || '',
        providerId: jobDetails?.provider?.id || providerIdParam || '',
        bookingId 
      }
    });
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
              <Ionicons name="chatbubble-outline" size={20} color="#68bdee" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#8c8c8c',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#68bdee',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pollingBadge: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pausedDot: {
    backgroundColor: '#FFA500',
  },
  pausedText: {
    color: '#FFA500',
  },
  pollingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  pollingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
  },
  scrollContent: {
    paddingTop: height * 0.04,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  clockIconContainer: {
    marginBottom: 15,
  },
  clockIconOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Math.min(20, height * 0.026),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(12, height * 0.015),
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  durationCard: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
    position: 'relative',
  },
  durationLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  durationTime: {
    fontSize: 48,
    color: '#68bdee',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 2,
  },
  startedTime: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pausedIndicator: {
    backgroundColor: '#FFA500',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  providerTextContainer: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  providerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: '600',
    marginLeft: 2,
  },
  statsDivider: {
    fontSize: 12,
    color: '#d0d0d0',
    marginHorizontal: 4,
  },
  jobsText: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  profileIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  progressIconCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressIconPaused: {
    backgroundColor: '#FFA500',
  },
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressDotPaused: {
    backgroundColor: '#FFFFFF',
  },
  progressIconInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTextCompleted: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressTimeCompleted: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  progressTextActive: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressTextPaused: {
    color: '#FFA500',
  },
  progressTimeActive: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  progressTextInactive: {
    fontSize: 14,
    color: '#d0d0d0',
    fontWeight: '500',
  },
  updateCard: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  updateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  updateText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
    marginBottom: 12,
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pollingIndicatorText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 6,
  },
  pausedIndicatorText: {
    color: '#FFA500',
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: '#5c5c5c',
    fontWeight: '500',
    marginBottom: 4,
  },
  costNote: {
    fontSize: 10,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  costValue: {
    fontSize: 24,
    color: '#68bdee',
    fontWeight: 'bold',
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tipLabel: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  tipValue: {
    fontSize: 11,
    color: '#3c3c3c',
    fontWeight: '600',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  reportButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ServiceInProgressScreen;
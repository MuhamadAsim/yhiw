import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { styles } from './styles/ServiceCompletedScreenStyles';

const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ServiceCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get data passed from ServiceInProgressScreen
  const bookingId = params.bookingId as string;
  const earnings = params.earnings as string || '81';
  const serviceType = params.serviceType as string || 'Towing Service';
  const customerName = params.customerName as string || 'Mohammed A.';
  const customerPhone = params.customerPhone as string || '+973 3XXX XXXX';
  const vehicleType = params.vehicleType as string || 'Sedan';
  const licensePlate = params.licensePlate as string || 'ABC 1234';
  const vehicleModel = params.vehicleModel as string || 'Toyota Camry 2020';
  const durationParam = params.duration as string || '00:35:00';
  const durationSecondsParam = parseInt(params.durationSeconds as string) || 2100;
  const timerPausedParam = params.timerPaused === 'true';
  const timerLastSavedParam = params.timerLastSaved as string;

  // Local state
  const [notes, setNotes] = useState('');
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [ratingChecked, setRatingChecked] = useState(false);
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobStatus, setJobStatus] = useState<string>('completed_provider');
  const [finalDuration, setFinalDuration] = useState<string>(durationParam);
  const [finalDurationSeconds, setFinalDurationSeconds] = useState<number>(durationSecondsParam);

  // Polling interval ref
  const statusCheckInterval =  useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [ServiceComplete] ${message}`, data || '');
  };

  // Format duration from seconds
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds === 0) return '0 minutes';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      if (minutes > 0 && seconds > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (seconds > 0) {
        return `${hours}h ${seconds}s`;
      }
      return `${hours}h`;
    }
    
    if (minutes > 0 && seconds > 0) {
      return `${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format completion time
  const completionTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate fees correctly
  const totalAmount = parseFloat(earnings);
  const platformFee = totalAmount * 0.15;
  const providerEarnings = totalAmount - platformFee;

  // Check if both conditions are met for completion
  const canComplete = paymentChecked && customerConfirmed;

  // Fetch final timer data from backend
  const fetchFinalTimerData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      addDebug('⏱️ Fetching final timer data for booking:', bookingId);

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.timer) {
          let finalSeconds = data.timer.durationSeconds || 0;
          
          // If timer wasn't paused, calculate elapsed time since last sync
          if (!data.timer.isPaused && data.timer.lastUpdated) {
            const lastUpdated = new Date(data.timer.lastUpdated);
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
            
            if (elapsedSeconds > 0 && elapsedSeconds < 3600) {
              finalSeconds = finalSeconds + elapsedSeconds;
              addDebug(`⏱️ Added ${elapsedSeconds}s elapsed time to final duration`);
            }
          }
          
          const formattedDuration = formatDuration(finalSeconds);
          setFinalDuration(formattedDuration);
          setFinalDurationSeconds(finalSeconds);
          addDebug(`✅ Final duration from timer: ${finalSeconds}s (${formattedDuration})`);
        }
      }
    } catch (error) {
      addDebug('❌ Error fetching timer data:', error);
    }
  };

  // Clean up booking from AsyncStorage
  const cleanupBooking = async () => {
    try {
      addDebug('🧹 Cleaning up booking from storage:', bookingId);

      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
        addDebug('✅ Removed from activeBookings');
      }

      const currentId = await AsyncStorage.getItem('currentBookingId');
      if (currentId === bookingId) {
        await AsyncStorage.removeItem('currentBookingId');
        await AsyncStorage.removeItem('currentBookingStatus');
        addDebug('✅ Cleared current booking');
      }

      await AsyncStorage.removeItem(`job_${bookingId}`);

    } catch (error) {
      addDebug('❌ Error cleaning up booking:', error);
    }
  };

  // Check job status from backend (polling)
  const checkJobStatus = async () => {
    if (!bookingId || !isMounted.current) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      addDebug('📡 Checking job status for customer confirmation...');

      const response = await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && isMounted.current) {
        addDebug(`📊 Job status: ${data.status}`);
        setJobStatus(data.status);

        if (data.status === 'completed_confirmed' && !customerConfirmed) {
          addDebug('✅ Customer has confirmed service completion!');
          setCustomerConfirmed(true);
          setRatingChecked(true);
        }
      }
    } catch (error) {
      addDebug('❌ Error checking job status:', error);
    }
  };

  // Fetch provider's today's stats and job details on mount
  useEffect(() => {
    isMounted.current = true;

    const initializeData = async () => {
      await fetchFinalTimerData();
      await fetchTodayStats();
      await fetchJobDetails();
    };

    initializeData();

    // Start polling for customer confirmation (every 5 seconds)
    statusCheckInterval.current = setInterval(() => {
      if (isMounted.current && !customerConfirmed) {
        checkJobStatus();
      }
    }, 5000);

    checkJobStatus();

    return () => {
      isMounted.current = false;
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    };
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/provider/job/${bookingId}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          setJobData(data.job);
          addDebug('📦 Job details loaded:', data.job);
        }
      }
    } catch (error) {
      addDebug('Error fetching job details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch provider stats
  const fetchTodayStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        addDebug('❌ No token found');
        return;
      }

      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');
      if (!firebaseUserId) {
        addDebug('❌ No firebaseUserId found');
        return;
      }

      addDebug('📡 Fetching stats for provider:', firebaseUserId);

      const response = await fetch(`${API_BASE_URL}/provider/${firebaseUserId}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      addDebug('📦 Stats response:', data);

      if (data.success && data.data) {
        const performance = data.data.performance || {};

        setTodayEarnings(parseFloat(performance.earnings) || 0);
        setJobsCompleted(performance.jobs || 0);

        addDebug('✅ Stats updated:', {
          earnings: performance.earnings,
          jobs: performance.jobs,
          hours: performance.hours,
          rating: performance.rating
        });
      }
    } catch (error) {
      addDebug('❌ Error fetching stats:', error);
    }
  };

  const handleViewAll = () => {
    Alert.alert('Photos', 'Photo gallery coming soon');
  };

  // Handle final confirmation and completion
  const handleConfirm = async () => {
    if (!paymentChecked) {
      Alert.alert('Payment Required', 'Please confirm payment received to complete.');
      return;
    }

    if (!customerConfirmed) {
      Alert.alert('Waiting for Customer', 'Please wait for the customer to confirm service completion.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');

      if (!token || !firebaseUserId) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
        setIsSubmitting(false);
        return;
      }

      addDebug('📡 Completing service for booking:', bookingId);

      const checklistItems = [];
      if (paymentChecked) checklistItems.push('payment_received');
      if (ratingChecked) checklistItems.push('customer_confirmed');

      const issues = [];
      if (notes.toLowerCase().includes('issue') || notes.toLowerCase().includes('problem')) {
        issues.push({
          type: 'service-issue',
          description: notes.substring(0, 100),
          severity: 'medium'
        });
      }

      const requestBody = {
        completionNotes: notes,
        checklistCompleted: checklistItems,
        issuesFound: issues,
        timeTracking: {
          totalSeconds: finalDurationSeconds,
          isPaused: false
        },
        paymentReceived: paymentChecked,
        customerConfirmed: customerConfirmed,
        durationSeconds: finalDurationSeconds,
        status: 'completed'
      };

      addDebug('📦 Request body with correct duration:', {
        durationSeconds: finalDurationSeconds,
        durationFormatted: finalDuration
      });

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      addDebug('📡 Finalize response:', {
        status: response.status,
        data
      });

      if (!response.ok) {
        const errorMessage = data.error || data.message || data.details || 'Failed to complete service';
        throw new Error(errorMessage);
      }

      // Clean up all booking data from AsyncStorage on success
      await cleanupBooking();

      Alert.alert(
        '✅ Success!',
        `Service completed successfully!\n\n` +
        `Total: ${data.data?.earnings?.totalAmount?.toFixed(2) || earnings} BHD\n` +
        `Platform Fee: ${data.data?.earnings?.platformFee?.toFixed(2) || platformFee.toFixed(2)} BHD\n` +
        `Your Earnings: ${data.data?.earnings?.providerEarnings?.toFixed(2) || providerEarnings.toFixed(2)} BHD\n` +
        `Duration: ${finalDuration}\n\n` +
        `Thank you for your hard work!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(provider)/Home')
          }
        ]
      );

    } catch (error) {
      addDebug('❌ Complete service error:', error);

      Alert.alert(
        'Failed to Complete Service',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        [
          { text: 'Try Again', style: 'cancel' },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B9BD5" />
          <Text style={styles.loadingText}>Loading completion details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SUCCESS ICON + TITLE ── */}
        <View style={styles.heroSection}>
          <View style={styles.successCircle}>
            <Feather name="check-circle" size={48} color="#00C853" />
          </View>
          <Text style={styles.heroTitle}>Service Completed!</Text>
          <Text style={styles.heroSub}>Waiting for customer confirmation...</Text>
        </View>

        {/* ── SERVICE SUMMARY ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE SUMMARY</Text>
          <View style={styles.cardDivider} />
          {[
            { label: 'Booking ID:', value: bookingId?.slice(-8) || 'REQ-7891', bold: true },
            { label: 'Service Type:', value: serviceType, bold: false },
            { label: 'Customer:', value: customerName, bold: false },
            { label: 'Vehicle:', value: `${vehicleType} - ${licensePlate}`, bold: false },
            { label: 'Duration:', value: finalDuration, bold: false },
            { label: 'Completed:', value: completionTime, bold: false },
          ].map((row, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={[styles.detailValue, row.bold && styles.detailValueBold]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── PAYMENT DETAILS ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAYMENT DETAILS</Text>
          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Service Fee:</Text>
            <Text style={styles.detailValue}>{totalAmount.toFixed(2)} BHD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform Fee (15%):</Text>
            <Text style={styles.detailValue}>-{platformFee.toFixed(2)} BHD</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Your Earnings:</Text>
            <Text style={styles.earningsValue}>{providerEarnings.toFixed(2)} BHD</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Payment Received Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPaymentChecked(p => !p)}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, paymentChecked && styles.checkboxChecked]}>
              {paymentChecked && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.checkboxTextBlock}>
              <Text style={styles.checkboxTitle}>Payment Received</Text>
              <Text style={styles.checkboxSub}>
                Confirm you received {totalAmount.toFixed(2)} BHD in cash
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CUSTOMER CONFIRMATION ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CUSTOMER CONFIRMATION</Text>
          <View style={[styles.confirmInfoBox, customerConfirmed && styles.confirmInfoBoxConfirmed]}>
            <View style={[styles.checkbox, customerConfirmed && styles.checkboxChecked]}>
              {customerConfirmed && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.checkboxTextBlock}>
              <Text style={styles.checkboxTitle}>
                {customerConfirmed ? 'Customer Approved Service ✓' : 'Waiting for Customer Approval...'}
              </Text>
              <Text style={styles.checkboxSub}>
                {customerConfirmed
                  ? 'Customer has confirmed service completion'
                  : 'Please wait for the customer to confirm the service is complete'}
              </Text>
            </View>
          </View>
          {!customerConfirmed && (
            <View style={styles.waitingIndicator}>
              <ActivityIndicator size="small" color="#5B9BD5" />
              <Text style={styles.waitingText}>Waiting for customer confirmation...</Text>
            </View>
          )}
        </View>

        {/* ── SERVICE PHOTOS ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE PHOTOS</Text>
          <View style={styles.photosHeader}>
            <View style={styles.photosHeaderLeft}>
              <Feather name="camera" size={15} color="#888" />
              <Text style={styles.photosCount}>4 photos uploaded</Text>
            </View>
            <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photosGrid}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.photoThumb}>
                <Feather name="camera" size={22} color="#C0D8EC" />
              </View>
            ))}
          </View>
          <Text style={styles.photoHint}>Photo upload will be available soon</Text>
        </View>

        {/* ── SERVICE NOTES ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE NOTES (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about the service, issues, or special instructions"
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.notesHint}>These notes will be visible to the customer</Text>
        </View>

        {/* ── CUSTOMER RATING ── */}
        <View style={styles.card}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingStar}>☆</Text>
            <Text style={styles.ratingTitle}>Customer Rating</Text>
          </View>
          <Text style={styles.ratingSubText}>
            Customer will be asked to rate your service after completion
          </Text>
          <TouchableOpacity
            style={styles.ratingCheckRow}
            onPress={() => setRatingChecked(p => !p)}
            activeOpacity={0.8}
            disabled={isSubmitting || !customerConfirmed}
          >
            <View style={[styles.squareCheckbox, ratingChecked && styles.squareCheckboxChecked]}>
              {ratingChecked && <Feather name="check" size={11} color="#fff" />}
            </View>
            <Text style={styles.ratingCheckLabel}>
              {customerConfirmed
                ? 'Send rating notification to customer'
                : 'Waiting for customer confirmation before sending rating'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TODAY'S EARNINGS ── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsCardTopRow}>
            <View>
              <Text style={styles.earningsCardLabel}>Today's Total Earnings</Text>
              <Text style={styles.earningsCardValue}>{todayEarnings.toFixed(2)} BHD</Text>
            </View>
            <View style={styles.earningsCardRight}>
              <Text style={styles.earningsCardLabel}>Jobs Completed</Text>
              <Text style={styles.earningsCardJobs}>{jobsCompleted}</Text>
            </View>
          </View>
          <Text style={styles.earningsCardMotivation}>
            Great work! You're having a productive day.
          </Text>
        </View>

        {/* ── CONFIRM BUTTON ── */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (isSubmitting || !canComplete) && styles.buttonDisabled
          ]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={isSubmitting || !canComplete}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={17} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>
                {!paymentChecked
                  ? 'Confirm Payment First'
                  : !customerConfirmed
                    ? 'Waiting for Customer...'
                    : 'Confirm & Complete'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── PAYMENT WARNING ── */}
        {!paymentChecked && (
          <Text style={styles.paymentWarning}>Please confirm payment received to complete</Text>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
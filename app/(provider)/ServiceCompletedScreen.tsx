import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
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
  const duration = params.duration as string || '00:35:00';
  const durationSeconds = parseInt(params.durationSeconds as string) || 2100;

  // Local state
  const [notes, setNotes] = useState('');
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [ratingChecked, setRatingChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [ServiceComplete] ${message}`, data || '');
  };

  // Format completion time
  const completionTime = new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // FIXED: Calculate fees correctly
  const totalAmount = parseFloat(earnings); // This is the total paid by customer
  const platformFee = totalAmount * 0.15; // 15% platform fee
  const providerEarnings = totalAmount - platformFee; // Provider gets 85%

  // Clean up booking from AsyncStorage
  const cleanupBooking = async () => {
    try {
      addDebug('🧹 Cleaning up booking from storage:', bookingId);
      
      // Remove from activeBookings array
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
        addDebug('✅ Removed from activeBookings');
      }

      // Clear current booking if it matches
      const currentId = await AsyncStorage.getItem('currentBookingId');
      if (currentId === bookingId) {
        await AsyncStorage.removeItem('currentBookingId');
        await AsyncStorage.removeItem('currentBookingStatus');
        addDebug('✅ Cleared current booking');
      }

      // Also clear any other booking-related data
      await AsyncStorage.removeItem(`job_${bookingId}`);
      
    } catch (error) {
      addDebug('❌ Error cleaning up booking:', error);
    }
  };

  // Fetch provider's today's stats and job details on mount
  useEffect(() => {
    fetchTodayStats();
    fetchJobDetails();
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

  const fetchTodayStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');
      if (!firebaseUserId) return;

      const response = await fetch(`${API_BASE_URL}/provider/${firebaseUserId}/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setTodayEarnings(parseFloat(data.data.earnings) || 0);
        setJobsCompleted(data.data.jobs || 0);
      }
    } catch (error) {
      addDebug('Error fetching stats:', error);
    }
  };

  const handleViewAll = () => {
    Alert.alert('Photos', 'Photo gallery coming soon');
  };

  const handleConfirm = async () => {
    if (!paymentChecked) {
      Alert.alert('Payment Required', 'Please confirm payment received to complete.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication failed');
        setIsSubmitting(false);
        return;
      }

      addDebug('📡 Completing service for booking:', bookingId);

      // Call API to mark job as completed
      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          completionDetails: {
            notes,
            paymentReceived: paymentChecked,
            customerConfirmed: ratingChecked,
            completedAt: new Date().toISOString(),
            duration: durationSeconds,
          }
        }),
      });

      const data = await response.json();
      addDebug('📡 Complete response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete service');
      }

      // ✅ IMPORTANT: Clean up booking from storage BEFORE showing success
      await cleanupBooking();

      // Show success message
      Alert.alert(
        'Success!',
        'Service completed successfully. Thank you for your hard work!',
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
        'Error',
        error instanceof Error ? error.message : 'Failed to complete service. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual back to home with cleanup
  const handleBackToHome = async () => {
    Alert.alert(
      'Exit Completion',
      'Are you sure you want to go back to home? The service will be marked as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Go Home',
          onPress: async () => {
            await cleanupBooking();
            router.replace('/(provider)/HomePage');
          }
        }
      ]
    );
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
          <Text style={styles.heroSub}>Finalize the details below</Text>
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
            { label: 'Duration:', value: duration, bold: false },
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
          <View style={styles.confirmInfoBox}>
            <View style={[styles.checkbox, styles.checkboxChecked]}>
              <Feather name="check" size={12} color="#fff" />
            </View>
            <View style={styles.checkboxTextBlock}>
              <Text style={styles.checkboxTitle}>Customer Approved Service</Text>
              <Text style={styles.checkboxSub}>Customer has confirmed service completion</Text>
            </View>
          </View>
        </View>

        {/* ── SERVICE PHOTOS (Frontend only for now) ── */}
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
            disabled={isSubmitting}
          >
            <View style={[styles.squareCheckbox, ratingChecked && styles.squareCheckboxChecked]}>
              {ratingChecked && <Feather name="check" size={11} color="#fff" />}
            </View>
            <Text style={styles.ratingCheckLabel}>Send rating notification to customer</Text>
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
          style={[styles.confirmBtn, isSubmitting && styles.buttonDisabled]} 
          onPress={handleConfirm} 
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={17} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirm & Complete</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── PAYMENT WARNING ── */}
        {!paymentChecked && (
          <Text style={styles.paymentWarning}>Please confirm payment received to complete</Text>
        )}

        {/* ── BACK TO HOME ── */}
        <TouchableOpacity 
          style={styles.backHomeBtn} 
          onPress={handleBackToHome} 
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Feather name="home" size={15} color="#555" style={{ marginRight: 7 }} />
          <Text style={styles.backHomeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

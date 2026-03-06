import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

const { height } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

const ServiceCompletedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<any>(null);

  // Get data from params (as fallback)
  const bookingId = params.bookingId as string;
  const providerNameParam = params.providerName as string;
  const providerId = params.providerId as string;
  const serviceTypeParam = params.serviceType as string;
  const totalAmountParam = params.totalAmount as string;
  const durationParam = params.duration as string;
  const pickupLocationParam = params.pickupLocation as string;
  const completedAtParam = params.completedAt as string;
  
  // Generate booking reference
  const bookingRef = `#YHIW-${bookingId?.slice(-5) || '96931'}`;

  // Fetch job details on mount
  useEffect(() => {
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      // Fetch job details from backend
      const response = await fetch(`${API_BASE_URL}/customer/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns data.job, not data.data
        if (data.success && data.job) {
          setJobDetails(data.job);
          console.log('✅ Job details loaded:', data.job);
        }
      }

      // Also check for existing rating
      await checkExistingRating();
      
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingRating = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      const response = await fetch(`${API_BASE_URL}/job/${bookingId}/rating`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.rating) {
          setRating(data.data.rating);
        }
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate your experience before continuing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        setIsSubmitting(false);
        return;
      }

      console.log('📡 Submitting rating for booking:', bookingId);

      // Submit rating to backend
      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          providerId,
          bookingId,
        }),
      });

      const result = await response.json();
      console.log('📡 Rating response:', response.status, result);

      if (response.ok && result.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK' }]
        );
        // Update rating to disable further submissions
        setRating(rating);
      } else {
        if (response.status === 400 && result.message?.includes('already rated')) {
          Alert.alert('Already Rated', 'You have already rated this service.');
        } else {
          throw new Error(result.message || 'Failed to submit rating');
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download Receipt', 'Receipt will be downloaded to your device.');
  };

  const handleBackToHome = () => {
    router.push('/(customer)/Home');
  };

  // Calculate completion time - FIXED: Use correct path
  const completionTime = jobDetails?.timeline?.completedAt || completedAtParam
    ? new Date(jobDetails?.timeline?.completedAt || completedAtParam).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

  // FIXED: Use correct paths based on actual API response
  const providerName = jobDetails?.provider?.name || providerNameParam || 'Ahmed Al-Khalifa';
  const serviceType = jobDetails?.serviceName || serviceTypeParam || 'Quick Tow (Flatbed)';
  const totalAmount = jobDetails?.payment?.totalAmount?.toString() || totalAmountParam || '99.75';
  
  // Duration might need to be calculated from timeTracking or use param
  const duration = jobDetails?.timeTracking?.totalSeconds 
    ? `${Math.floor(jobDetails.timeTracking.totalSeconds / 60)} minutes`
    : durationParam || '35 minutes';
    
  const pickupLocation = jobDetails?.pickup?.address || pickupLocationParam || '23 Main Street, Manama';
  
  // Calculate receipt breakdown
  const baseFee = parseFloat(totalAmount) * 0.75;
  const distanceFee = parseFloat(totalAmount) * 0.15;
  const serviceFee = parseFloat(totalAmount) * 0.10;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.checkIconContainer}>
            <View style={styles.checkIconOuter}>
              <Image
                source={require('../../assets/customer/service_completed/tick.png')}
                style={styles.checkIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.title}>Service Completed!</Text>
          <Text style={styles.subtitle}>Thank you for using YHIW</Text>
        </View>

        {/* Service Summary Card */}
        <View style={[styles.summaryCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{serviceType}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Provider</Text>
            <Text style={styles.summaryValue}>{providerName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{duration}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{completionTime}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue}>{pickupLocation}</Text>
          </View>
        </View>

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <View style={styles.totalAmountRow}>
            <View style={styles.totalAmountLeft}>
              <Image
                source={require('../../assets/customer/dollar_icon.png')}
                style={styles.dollarIcon}
                resizeMode="contain"
              />
              <Text style={styles.totalAmountLabel}>Total Amount</Text>
            </View>
            <Text style={styles.totalAmountValue}>{parseFloat(totalAmount).toFixed(2)} BHD</Text>
          </View>

          <View style={styles.paymentDivider} />

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>Payment Method</Text>
            <Text style={styles.paymentDetailValue}>Cash</Text>
          </View>

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>Status</Text>
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark" size={14} color="#4CAF50" />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Rate Your Experience Card */}
        <View style={[styles.ratingCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>RATE YOUR EXPERIENCE</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                disabled={isSubmitting || rating > 0}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={42}
                  color={star <= rating ? '#FFD700' : '#d0d0d0'}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          {rating > 0 && !isSubmitting && (
            <TouchableOpacity
              style={styles.submitRatingButton}
              onPress={handleSubmitRating}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>
          )}

          {isSubmitting && (
            <ActivityIndicator size="small" color="#68bdee" style={{ marginTop: 15 }} />
          )}
        </View>

        {/* Receipt Card */}
        <View style={[styles.receiptCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>RECEIPT</Text>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Base Fee</Text>
            <Text style={styles.receiptValue}>{baseFee.toFixed(2)} BHD</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Distance Fee</Text>
            <Text style={styles.receiptValue}>{distanceFee.toFixed(2)} BHD</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Service Fee</Text>
            <Text style={styles.receiptValue}>{serviceFee.toFixed(2)} BHD</Text>
          </View>

          <View style={styles.receiptDivider} />

          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Total</Text>
            <Text style={styles.receiptTotalValue}>{parseFloat(totalAmount).toFixed(2)} BHD</Text>
          </View>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadReceipt}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color="#68bdee" />
            <Text style={styles.downloadButtonText}>Download Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Booking ID */}
        <Text style={styles.bookingId}>Booking ID: {bookingRef}</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Button Footer */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleBackToHome}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Image
            source={require('../../assets/customer/dollar_icon.png')}
            style={styles.homeButtonIcon}
            resizeMode="contain"
          />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  scrollContent: {
    paddingTop: height * 0.05,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  checkIconContainer: {
    marginBottom: 15,
  },
  checkIconOuter: {
    width: 75,
    height: 75,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: Math.min(22, height * 0.028),
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
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '500',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  paymentCard: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalAmountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dollarIcon: {
    width: 24,
    height: 24,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: '600',
  },
  totalAmountValue: {
    fontSize: 22,
    color: '#68bdee',
    fontWeight: 'bold',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
    marginHorizontal: -20,
    width: 'auto',
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentDetailLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
  },
  paymentDetailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  submitRatingButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 5,
  },
  submitRatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.5,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
    marginHorizontal: -20,
    width: 'auto',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  receiptTotalLabel: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  receiptTotalValue: {
    fontSize: 16,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 13,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingId: {
    fontSize: 11,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.3,
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
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
  },
  homeButtonIcon: {
    width: 20,
    height: 20,
  },
  homeButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ServiceCompletedScreen;
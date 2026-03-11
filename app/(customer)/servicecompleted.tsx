import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

import {styles} from './styles/ServiceCompletedStyles';

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

  // Format duration from seconds
  const formatDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds === 0) return '35 minutes'; // fallback
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  // Format time from ISO string
  const formatTime = (isoString: string): string => {
    if (!isoString) return new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Fetch job details on mount
  useEffect(() => {
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      console.log('📡 Fetching job details for booking:', bookingId);

      // Fetch job details from backend
      const response = await fetch(`${API_BASE_URL}/customer/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns data.job
        if (data.success && data.job) {
          setJobDetails(data.job);
          console.log('✅ Job details loaded:', {
            serviceName: data.job.serviceName,
            provider: data.job.provider?.name,
            timeTracking: data.job.timeTracking,
            duration: data.job.timeTracking?.totalSeconds
          });
        }
      } else {
        console.log('⚠️ Failed to fetch job details:', response.status);
      }

      // Also check for existing rating
      await checkExistingRating();
      
    } catch (error) {
      console.error('❌ Error fetching job details:', error);
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

  const cleanupBookingData = async () => {
    try {
      await AsyncStorage.removeItem('currentBookingId');
      console.log('✅ Current bookingId removed from storage');
    } catch (error) {
      console.error('Error removing bookingId:', error);
    }
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
        // Clean up the booking data after successful rating
        await cleanupBookingData();
        
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK' }]
        );
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

  const handleBackToHome = async () => {
    try {
      // Remove the current bookingId from AsyncStorage
      await AsyncStorage.removeItem('currentBookingId');
      console.log('✅ Current bookingId removed from storage');
      
      // Navigate to home screen
      router.push('/(customer)/Home');
    } catch (error) {
      console.error('Error removing bookingId:', error);
      // Still navigate even if removal fails
      router.push('/(customer)/Home');
    }
  };

  // Get data from jobDetails (API) or fallback to params
  const providerName = jobDetails?.provider?.name || providerNameParam || 'Ahmed Al-Khalifa';
  const serviceType = jobDetails?.serviceName || serviceTypeParam || 'Quick Tow (Flatbed)';
  const totalAmount = jobDetails?.payment?.totalAmount?.toString() || totalAmountParam || '99.75';
  
  // Get duration from timeTracking (saved by provider) or fallback to param
  const durationSeconds = jobDetails?.timeTracking?.totalSeconds || 0;
  const duration = formatDuration(durationSeconds);
  
  // Log the duration for debugging
  useEffect(() => {
    if (jobDetails?.timeTracking) {
      console.log('⏱️ Timer data from API:', {
        seconds: jobDetails.timeTracking.totalSeconds,
        formatted: duration,
        isPaused: jobDetails.timeTracking.isPaused
      });
    }
  }, [jobDetails]);
  
  const pickupLocation = jobDetails?.pickup?.address || pickupLocationParam || '23 Main Street, Manama';
  
  // Get completion time from timeline or use param
  const completionTime = jobDetails?.timeline?.completedAt || completedAtParam
    ? formatTime(jobDetails?.timeline?.completedAt || completedAtParam)
    : new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
  
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



export default ServiceCompletedScreen;
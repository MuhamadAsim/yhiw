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
import usePreventBack from '@/hooks/usePreventBack';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { height } = Dimensions.get('window');

import { styles } from './styles/ServiceCompletedStyles';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface TimerData {
  durationSeconds: number;
  isPaused: boolean;
  pausedAt: string | null;
  lastUpdated?: string | null;
}

interface JobDetailsResponse {
  success: boolean;
  job: {
    bookingId: string;
    serviceName?: string;
    provider?: {
      name: string;
      id: string;
    };
    payment?: {
      totalAmount: number;
    };
    pickup?: {
      address: string;
    };
    timeline?: {
      completedAt: string;
    };
    timeTracking?: {
      totalSeconds: number;
      isPaused: boolean;
    };
  };
}

const ServiceCompletedScreen = () => {
  usePreventBack(); // ✅ one line
  const router = useRouter();
  const params = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [finalDuration, setFinalDuration] = useState<string>('');

  // Get data from params (as fallback)
  const bookingId = params.bookingId as string;
  const providerNameParam = params.providerName as string;
  const providerId = params.providerId as string;
  const serviceTypeParam = params.serviceType as string;
  const totalAmountParam = params.totalAmount as string;
  const durationParam = params.duration as string;
  const durationSecondsParam = params.durationSeconds as string;
  const pickupLocationParam = params.pickupLocation as string;
  const completedAtParam = params.completedAt as string;
  const timerLastSavedParam = params.timerLastSaved as string;

  // Generate booking reference
  const bookingRef = `#YHIW-${bookingId?.slice(-5) || '96931'}`;

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

  // Format date for receipt
  const formatDate = (isoString: string): string => {
    if (!isoString) return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const fetchTimerData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return null;

      console.log('⏱️ Fetching final timer data for booking:', bookingId);

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.timer) {
          setTimerData(data.timer);

          // ✅ FIX: This is a COMPLETED job screen — never add elapsed time.
          // The provider's timer was frozen at completion. Adding seconds since
          // lastUpdated inflates the duration every time this screen loads.
          const finalSeconds = data.timer.durationSeconds || 0;

          const formattedDuration = formatDuration(finalSeconds);
          setFinalDuration(formattedDuration);
          console.log(`✅ Final duration from timer: ${finalSeconds}s (${formattedDuration})`);
          return { finalSeconds, formattedDuration };
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching timer data:', error);
      return null;
    }
  };

  // Fetch job details on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      await fetchJobDetails();
      await fetchTimerData();
      await checkExistingRating();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      console.log('📡 Fetching job details for booking:', bookingId);

      const response = await fetch(`${API_BASE_URL}/customer/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          setJobDetails(data.job);
          console.log('✅ Job details loaded');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching job details:', error);
    }
  };

  const checkExistingRating = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/rating`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.rating) {
          setRating(data.data.rating);
          setSelectedRating(data.data.rating);
          setHasExistingRating(true);
        }
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  const handleStarPress = (starIndex: number) => {
    if (hasExistingRating) {
      Alert.alert('Already Rated', 'You have already rated this service.');
      return;
    }
    setSelectedRating(starIndex);
  };

  const cleanupBookingData = async () => {
    try {
      await AsyncStorage.removeItem('currentBookingId');
    } catch (error) {
      console.error('Error removing bookingId:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before continuing.');
      return;
    }

    if (hasExistingRating) {
      Alert.alert('Already Rated', 'You have already rated this service.');
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

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: selectedRating,
          providerId,
          bookingId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRating(selectedRating);
        setHasExistingRating(true);
        await cleanupBookingData();

        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK' }]
        );
      } else {
        if (response.status === 400 && result.message?.includes('already rated')) {
          Alert.alert('Already Rated', 'You have already rated this service.');
          await checkExistingRating();
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

  const handleClearRating = () => {
    if (!hasExistingRating) {
      setSelectedRating(0);
    }
  };

  // Generate HTML for PDF receipt with correct duration
  const generateReceiptHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const baseFee = parseFloat(totalAmount) * 0.75;
    const distanceFee = parseFloat(totalAmount) * 0.15;
    const serviceFee = parseFloat(totalAmount) * 0.10;
    
    // Use final duration from timer or fallback to params
    const displayDuration = finalDuration || durationParam || '0 minutes';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>YHIW Receipt - ${bookingRef}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #68bdee;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .logo span {
              color: #68bdee;
            }
            .receipt-title {
              font-size: 24px;
              color: #333;
              margin: 10px 0;
            }
            .booking-ref {
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 10px;
              font-size: 16px;
              color: #666;
              text-align: center;
              margin: 15px 0;
            }
            .service-completed {
              background-color: #4CAF50;
              color: white;
              padding: 8px 15px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
              margin-bottom: 15px;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 15px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #68bdee;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
              border-bottom: 1px dashed #e0e0e0;
            }
            .info-label {
              color: #666;
              font-size: 14px;
            }
            .info-value {
              color: #333;
              font-weight: 500;
              font-size: 14px;
              text-align: right;
            }
            .payment-details {
              background-color: #e8f4fd;
              padding: 15px;
              border-radius: 15px;
              margin: 20px 0;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              text-align: right;
              margin: 10px 0;
            }
            .breakdown-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              color: #666;
              font-size: 14px;
            }
            .divider {
              height: 1px;
              background-color: #ddd;
              margin: 15px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
            .thank-you {
              font-size: 18px;
              color: #4CAF50;
              text-align: center;
              margin: 20px 0;
            }
            .provider-rating {
              text-align: center;
              margin: 15px 0;
              padding: 10px;
              background-color: #fff3cd;
              border-radius: 10px;
            }
            .star-rating {
              color: #FFD700;
              font-size: 20px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo">YHIW <span>Services</span></div>
              <div class="receipt-title">Service Receipt</div>
              <div class="service-completed">✓ Service Completed</div>
              <div class="booking-ref">Booking ID: ${bookingRef}</div>
            </div>

            <div class="info-section">
              <div class="section-title">Service Details</div>
              <div class="info-row">
                <span class="info-label">Service Type:</span>
                <span class="info-value">${serviceType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Provider:</span>
                <span class="info-value">${providerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Provider ID:</span>
                <span class="info-value">${providerId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${displayDuration}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${formatDate(completedAtParam)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Completion Time:</span>
                <span class="info-value">${completionTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${pickupLocation}</span>
              </div>
            </div>

            <div class="payment-details">
              <div class="section-title">Payment Summary</div>
              <div class="breakdown-row">
                <span>Base Fee:</span>
                <span>${baseFee.toFixed(2)} BHD</span>
              </div>
              <div class="breakdown-row">
                <span>Distance Fee:</span>
                <span>${distanceFee.toFixed(2)} BHD</span>
              </div>
              <div class="breakdown-row">
                <span>Service Fee:</span>
                <span>${serviceFee.toFixed(2)} BHD</span>
              </div>
              <div class="divider"></div>
              <div class="breakdown-row" style="font-weight: bold;">
                <span>Total Amount:</span>
                <span>${parseFloat(totalAmount).toFixed(2)} BHD</span>
              </div>
              <div class="info-row" style="margin-top: 10px;">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">Cash</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value" style="color: #4CAF50;">Paid ✓</span>
              </div>
            </div>

            ${hasExistingRating ? `
              <div class="provider-rating">
                <div class="section-title">Your Rating</div>
                <div class="star-rating">
                  ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                </div>
                <div style="margin-top: 5px;">${rating} out of 5 stars</div>
              </div>
            ` : ''}

            <div class="thank-you">
              Thank you for choosing YHIW!
            </div>

            <div class="footer">
              <p>Receipt generated on ${currentDate}</p>
              <p>For any inquiries, please contact support@yhiw.com</p>
              <p>This is a computer-generated receipt. No signature required.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadReceipt = async () => {
    try {
      setIsDownloading(true);

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: generateReceiptHTML(),
        base64: false
      });

      console.log('📄 PDF generated at:', uri);

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Receipt',
        UTI: 'com.adobe.pdf'
      });

      Alert.alert('Success', 'Receipt generated successfully!', [{ text: 'OK' }]);

    } catch (error) {
      console.error('❌ Error downloading receipt:', error);
      Alert.alert('Download Failed', 'Unable to generate receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTakeScreenshot = () => {
    Alert.alert(
      'Take Screenshot',
      'You can take a screenshot of this screen to save your receipt.\n\nPress Power + Volume Down buttons simultaneously on most devices.',
      [{ text: 'Got it' }]
    );
  };

  const handleBackToHome = async () => {
    try {
      await AsyncStorage.removeItem('currentBookingId');
      router.replace('/(customer)/Home');
    } catch (error) {
      console.error('Error removing bookingId:', error);
      router.replace('/(customer)/Home');
    }
  };

  // Get data from jobDetails (API) or fallback to params
  const providerName = jobDetails?.provider?.name || providerNameParam || 'Ahmed Al-Khalifa';
  const serviceType = jobDetails?.serviceName || serviceTypeParam || 'Quick Tow (Flatbed)';
  const totalAmount = jobDetails?.payment?.totalAmount?.toString() || totalAmountParam || '99.75';
  const pickupLocation = jobDetails?.pickup?.address || pickupLocationParam || '23 Main Street, Manama';
  
  // Determine final duration to display - priority: timer data > params > calculate from seconds
  let displayDuration = finalDuration;
  if (!displayDuration) {
    if (durationParam) {
      displayDuration = durationParam;
    } else if (durationSecondsParam) {
      displayDuration = formatDuration(parseInt(durationSecondsParam));
    } else {
      displayDuration = '0 minutes';
    }
  }

  const completionTime = jobDetails?.timeline?.completedAt || completedAtParam
    ? formatTime(jobDetails?.timeline?.completedAt || completedAtParam)
    : new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  const baseFee = parseFloat(totalAmount) * 0.75;
  const distanceFee = parseFloat(totalAmount) * 0.15;
  const serviceFee = parseFloat(totalAmount) * 0.10;

  const displayRating = hasExistingRating ? rating : selectedRating;

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
            <Text style={styles.summaryValue}>{displayDuration}</Text>
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
          <Text style={styles.cardTitle}>
            {hasExistingRating ? 'YOUR RATING' : 'RATE YOUR EXPERIENCE'}
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                disabled={hasExistingRating || isSubmitting}
              >
                <Ionicons
                  name={star <= displayRating ? 'star' : 'star-outline'}
                  size={42}
                  color={star <= displayRating ? '#FFD700' : '#d0d0d0'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {!hasExistingRating && selectedRating > 0 && (
            <Text style={styles.selectedRatingHint}>
              You selected {selectedRating} star{selectedRating > 1 ? 's' : ''}
            </Text>
          )}

          {!hasExistingRating && selectedRating > 0 && !isSubmitting && (
            <TouchableOpacity
              style={styles.submitRatingButton}
              onPress={handleSubmitRating}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitRatingText}>Submit {selectedRating}-Star Rating</Text>
            </TouchableOpacity>
          )}

          {!hasExistingRating && selectedRating > 0 && !isSubmitting && (
            <TouchableOpacity
              style={styles.clearRatingButton}
              onPress={handleClearRating}
              disabled={isSubmitting}
            >
              <Text style={styles.clearRatingText}>Clear Selection</Text>
            </TouchableOpacity>
          )}

          {isSubmitting && (
            <ActivityIndicator size="small" color="#68bdee" style={{ marginTop: 15 }} />
          )}

          {hasExistingRating && (
            <Text style={styles.alreadyRatedText}>
              Thank you for your feedback!
            </Text>
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
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={handleDownloadReceipt}
            activeOpacity={0.7}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#68bdee" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#68bdee" />
                <Text style={styles.downloadButtonText}>Download Receipt</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.screenshotHint}
            onPress={handleTakeScreenshot}
          >
            <Ionicons name="camera-outline" size={16} color="#999" />
            <Text style={styles.screenshotHintText}>Or take a screenshot</Text>
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
          disabled={isSubmitting || isDownloading}
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
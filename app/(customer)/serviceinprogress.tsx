import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

const API_BASE_URL = 'https://yhiw-backend.onrender.com';

interface JobStatusResponse {
  status: 'en-route' | 'arrived' | 'started' | 'completed' | 'cancelled';
  duration?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

const ServiceInProgressScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [duration, setDuration] = useState('00:00');
  const [startTime] = useState(new Date());
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [jobStatus, setJobStatus] = useState('started');
  const [isPolling, setIsPolling] = useState(true);
  const [hasShownCancelledAlert, setHasShownCancelledAlert] = useState(false);

  // Get data from params
  const bookingId = params.bookingId as string;
  const providerName = params.providerName as string || 'Ahmed Al-Khalifa';
  const providerId = params.providerId as string;
  const providerPhone = params.providerPhone as string;
  const serviceType = params.serviceType as string || 'Quick Tow (Flatbed)';
  const vehicleType = params.vehicleType as string || 'SUV';
  const pickupLocation = params.pickupLocation as string || '23 Main Street, Manama';
  const pickupLat = params.pickupLat as string;
  const pickupLng = params.pickupLng as string;
  const totalAmount = params.totalAmount as string || '99.75';

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Polling effect - check job status every 5 seconds
  useEffect(() => {
    if (!bookingId) {
      console.log('❌ No bookingId available for polling');
      return;
    }

    console.log('🔄 Starting polling for job status (every 5 seconds)');
    
    const pollInterval = setInterval(async () => {
      if (!isPolling) return;
      
      await checkJobStatus();
      setPollingAttempts(prev => prev + 1);
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount
    return () => {
      console.log('🧹 Stopping polling');
      clearInterval(pollInterval);
    };
  }, [bookingId, isPolling]);

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
      if (data.status === 'completed') {
        console.log('✅✅✅ JOB COMPLETED - Navigating to ServiceCompleted');
        
        // Stop polling
        setIsPolling(false);

        // Navigate to ServiceCompleted screen (keep bookingId in storage)
        setTimeout(() => {
          router.push({
            pathname: '/(customer)/ServiceCompleted',
            params: {
              bookingId,
              providerName,
              providerId,
              serviceType,
              totalAmount,
              duration,
              pickupLocation,
              pickupLat,
              pickupLng,
              completedAt: data.completedAt || new Date().toISOString(),
            }
          });
        }, 500);
      }

      // ===== HANDLE JOB CANCELLED =====
      if (data.status === 'cancelled' && !hasShownCancelledAlert) {
        console.log('❌❌❌ JOB CANCELLED - Returning to home');
        
        setHasShownCancelledAlert(true);
        
        // Stop polling
        setIsPolling(false);

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
                // Navigate to home screen
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
    if (providerPhone) {
      Alert.alert('Call', `Calling ${providerName} at ${providerPhone}...`);
    } else {
      Alert.alert('Call', `Calling ${providerName}...`);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: { 
        providerName, 
        providerId,
        bookingId 
      }
    });
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Opening report form...');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Polling Status Badge */}
      <View style={styles.pollingBadge}>
        <View style={styles.pollingDot} />
        <Text style={styles.pollingText}>Live • {pollingAttempts}</Text>
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
          <Text style={styles.startedTime}>Started at {formatTime(startTime)}</Text>
          
          {/* Live Indicator */}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={[styles.providerCard, styles.cardWithBorder]}>
          <View style={styles.providerHeader}>
            <View style={styles.providerTextContainer}>
              <Text style={styles.providerLabel}>Provider</Text>
              <Text style={styles.providerName}>{providerName}</Text>
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
            <Text style={styles.detailValue}>{vehicleType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{pickupLocation}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>PROGRESS</Text>

          {/* Progress Item 1 - Completed */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconCompleted}>
              <View style={styles.progressDotCompleted} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextCompleted}>Provider Arrived</Text>
              <Text style={styles.progressTimeCompleted}>{formatTime(startTime)}</Text>
            </View>
          </View>

          {/* Progress Item 2 - Active */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconActive}>
              <View style={styles.progressDotActive} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextActive}>Service In Progress</Text>
              <Text style={styles.progressTimeActive}>Currently working...</Text>
            </View>
          </View>

          {/* Progress Item 3 - Inactive */}
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
            The provider is currently working on your {serviceType.toLowerCase()}. 
            You'll be notified when the service is complete.
          </Text>
          
          {/* Polling status indicator */}
          <View style={styles.pollingIndicator}>
            <Ionicons name="sync-outline" size={14} color="#4CAF50" />
            <Text style={styles.pollingIndicatorText}>
              Checking for updates every 5 seconds
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
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons Footer - ONLY Report Issue button remains */}
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
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
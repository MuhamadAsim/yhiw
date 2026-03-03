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
import { customerWebSocket } from '../../services/websocket.service';

const { height } = Dimensions.get('window');

const ServiceInProgressScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [duration, setDuration] = useState('00:00');
  const [startTime] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

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

  // WebSocket setup
  useEffect(() => {
    console.log('📱 Customer ServiceInProgress - Setting up WebSocket');
    console.log('Booking ID:', bookingId);
    console.log('Provider ID:', providerId);
    
    // Check initial connection
    setWsConnected(customerWebSocket.isConnected());
    
    // Listen for connection changes
    customerWebSocket.onConnectionChange((isConnected) => {
      console.log('Connection changed:', isConnected);
      setWsConnected(isConnected);
      
      // Re-join room if connection restored
      if (isConnected && bookingId && !hasJoinedRoom) {
        joinJobRoom();
      }
    });
    
    // Listen for provider status updates
    customerWebSocket.on('provider_status_update', handleProviderStatus);
    customerWebSocket.on('job_completed', handleJobCompleted);
    
    // Join job room
    if (bookingId) {
      joinJobRoom();
    }

    // Cleanup
    return () => {
      customerWebSocket.off('provider_status_update', handleProviderStatus);
      customerWebSocket.off('job_completed', handleJobCompleted);
      
      // Leave job room
      if (bookingId && hasJoinedRoom) {
        customerWebSocket.send('leave_job_room', { bookingId });
      }
    };
  }, []);

  const joinJobRoom = () => {
    if (!bookingId || hasJoinedRoom) return;
    
    console.log('🚪 Customer joining job room:', bookingId);
    customerWebSocket.send('join_job_room', {
      bookingId,
      role: 'customer'
    });
    setHasJoinedRoom(true);
  };

  const handleProviderStatus = (data: any) => {
    console.log('📨 Provider status update:', data);
    const statusData = data.data || data;
    
    // You could update UI based on status if needed
    if (statusData.status === 'started') {
      // Service started - already on this screen
    } else if (statusData.status === 'en-route') {
      // Should not happen here, but handle gracefully
    }
  };

  const handleJobCompleted = (data: any) => {
    console.log('✅ Job completed event received:', data);
    
    // Auto-navigate to rating when provider completes
    Alert.alert(
      'Service Completed',
      'The provider has completed the service. Please rate your experience.',
      [
        {
          text: 'Rate Now',
          onPress: () => {
            router.push({
              pathname: '/(customer)/RateService',
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
              }
            });
          }
        }
      ]
    );
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
      {/* Connection Status Badge */}
      {wsConnected && hasJoinedRoom && (
        <View style={styles.connectionBadge}>
          <View style={styles.connectionDot} />
          <Text style={styles.connectionText}>Live Updates Active</Text>
        </View>
      )}

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
          
          {/* Real-time status indicator */}
          {wsConnected && (
            <View style={styles.realtimeIndicator}>
              <Ionicons name="radio-outline" size={14} color="#4CAF50" />
              <Text style={styles.realtimeText}>Real-time updates active</Text>
            </View>
          )}
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
  connectionBadge: {
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
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  connectionText: {
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
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  realtimeText: {
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
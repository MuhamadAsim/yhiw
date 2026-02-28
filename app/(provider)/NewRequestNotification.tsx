// NewRequestNotification.tsx - Real-time WebSocket version
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
  ScrollView,
  Alert,
  Vibration,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { providerWebSocket } from '../../services/websocket.service';

// Types
interface JobRequest {
  id: string;
  bookingId?: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  customerRating?: number;
  serviceType: string;
  serviceName: string;
  serviceId?: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  distance: string;
  estimatedDistance?: number;
  estimatedEarnings: number;
  price: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  timestamp: string;
  description?: string;
  vehicleDetails?: {
    type?: string;
    makeModel?: string;
    year?: string;
    color?: string;
    licensePlate?: string;
  };
  issues?: string[];
  photos?: string[];
}

interface JobUpdateData {
  jobId: string;
  bookingId?: string;
  status?: string;
  [key: string]: any;
}

const NewRequestNotification = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State for the incoming job request
  const [jobRequest, setJobRequest] = useState<JobRequest>({
    id: (params.jobId as string) || '',
    bookingId: params.bookingId as string || undefined,
    customerName: (params.customerName as string) || 'Customer',
    serviceType: (params.serviceType as string) || 'Service Request',
    serviceName: (params.serviceName as string) || '',
    pickupLocation: (params.pickupLocation as string) || 'Location pending',
    dropoffLocation: (params.dropoffLocation as string) || '',
    distance: (params.distance as string) || 'Calculating...',
    estimatedEarnings: parseFloat(params.estimatedEarnings as string) || 0,
    price: parseFloat(params.price as string) || 0,
    urgency: (params.urgency as 'normal' | 'urgent' | 'emergency') || 'normal',
    timestamp: (params.timestamp as string) || new Date().toISOString(),
  });

  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const [progress] = useState(new Animated.Value(1));
  const [isProcessing, setIsProcessing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [otherProviders, setOtherProviders] = useState(0); // Number of other providers viewing this job
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const responseSentRef = useRef(false);
  const wsListenersRef = useRef<{[key: string]: boolean}>({});

  useEffect(() => {
    // Setup WebSocket listeners for this specific job
    setupJobListeners();

    // Start countdown timer
    startTimer();

    // Vibrate on new request (optional)
    if (Platform.OS !== 'web') {
      Vibration.vibrate(500);
    }

    // Send "viewing" status to backend
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('job_viewing', { 
        jobId: jobRequest.id,
        bookingId: jobRequest.bookingId
      });
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      removeJobListeners();
    };
  }, []);

  const setupJobListeners = () => {
    // Check if listeners already set up
    if (wsListenersRef.current[jobRequest.id]) return;
    
    // Listen for updates on this specific job using both patterns
    providerWebSocket.on(`job_${jobRequest.id}_updated`, handleJobUpdate);
    providerWebSocket.on(`job_${jobRequest.bookingId || jobRequest.id}_updated`, handleJobUpdate);
    providerWebSocket.on(`job_${jobRequest.id}_cancelled`, handleJobCancelled);
    providerWebSocket.on(`job_${jobRequest.bookingId || jobRequest.id}_cancelled`, handleJobCancelled);
    providerWebSocket.on('job_update', handleJobUpdate);
    providerWebSocket.on('job_cancelled', handleJobCancelled);
    providerWebSocket.on('connection_change', handleConnectionChange);
    providerWebSocket.on('viewer_count', handleViewerCount);
    
    // Check WebSocket connection status
    setWsConnected(providerWebSocket.isConnected());
    
    wsListenersRef.current[jobRequest.id] = true;
  };

  const removeJobListeners = () => {
    providerWebSocket.off(`job_${jobRequest.id}_updated`, handleJobUpdate);
    providerWebSocket.off(`job_${jobRequest.bookingId || jobRequest.id}_updated`, handleJobUpdate);
    providerWebSocket.off(`job_${jobRequest.id}_cancelled`, handleJobCancelled);
    providerWebSocket.off(`job_${jobRequest.bookingId || jobRequest.id}_cancelled`, handleJobCancelled);
    providerWebSocket.off('job_update', handleJobUpdate);
    providerWebSocket.off('job_cancelled', handleJobCancelled);
    providerWebSocket.off('connection_change', handleConnectionChange);
    providerWebSocket.off('viewer_count', handleViewerCount);
    
    delete wsListenersRef.current[jobRequest.id];
  };

  const handleConnectionChange = (isConnected: boolean) => {
    setWsConnected(isConnected);
    if (!isConnected) {
      // Show warning but don't disconnect user
      console.log('WebSocket disconnected, but you can still respond');
    }
  };

  const handleJobUpdate = (data: JobUpdateData) => {
    console.log('Job updated:', data);
    
    // Check if this update is for our job
    const jobIdMatch = data.jobId === jobRequest.id || data.bookingId === jobRequest.bookingId;
    if (!jobIdMatch && data.jobId && data.bookingId) return;
    
    // Update job details if something changes
    setJobRequest(prev => ({
      ...prev,
      ...data
    }));
    
    // If job was accepted by another provider, show message
    if (data.status === 'accepted' && data.providerId) {
      Alert.alert(
        'Job Taken',
        'This job has been accepted by another provider.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    }
  };

  const handleJobCancelled = (data: { jobId?: string; bookingId?: string; reason?: string }) => {
    console.log('Job cancelled:', data);
    
    // Check if this cancellation is for our job
    const jobIdMatch = data.jobId === jobRequest.id || data.bookingId === jobRequest.bookingId;
    if (!jobIdMatch && data.jobId && data.bookingId) return;
    
    Alert.alert(
      'Request Cancelled',
      data.reason === 'customer_cancelled' 
        ? 'This service request has been cancelled by the customer.'
        : 'This service request is no longer available.',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleViewerCount = (data: { jobId: string; count: number }) => {
    if (data.jobId === jobRequest.id || data.jobId === jobRequest.bookingId) {
      setOtherProviders(data.count - 1); // Subtract ourselves
    }
  };

  const startTimer = () => {
    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          // Auto-decline when time runs out
          if (!responseSentRef.current) {
            handleAutoDecline();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Progress bar animation
    Animated.timing(progress, {
      toValue: 0,
      duration: 30000, // 30 seconds
      useNativeDriver: false,
    }).start();
  };

  const handleAutoDecline = () => {
    if (responseSentRef.current) return;
    
    responseSentRef.current = true;
    
    // Send decline via WebSocket
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('decline_job', { 
        jobId: jobRequest.id,
        bookingId: jobRequest.bookingId,
        reason: 'timeout'
      });
    }
    
    Alert.alert(
      'Request Expired',
      'You did not respond within 30 seconds. The request has been automatically declined.',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleAccept = () => {
    if (responseSentRef.current || isProcessing) return;
    
    setIsProcessing(true);
    responseSentRef.current = true;
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Stop animation
    progress.stopAnimation();

    // Send acceptance via WebSocket
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('accept_job', { 
        jobId: jobRequest.id,
        bookingId: jobRequest.bookingId,
        responseTime: 30 - timeLeft // How fast they responded
      });
      
      // Navigate to job details with full data
      setTimeout(() => {
        router.push({
          pathname: '/RequestDetailPage',
          params: {
            jobId: jobRequest.id,
            bookingId: jobRequest.bookingId || '',
            customerName: jobRequest.customerName,
            customerPhone: jobRequest.customerPhone || '',
            serviceType: jobRequest.serviceType,
            serviceName: jobRequest.serviceName,
            pickupLocation: jobRequest.pickupLocation,
            pickupLat: jobRequest.pickupLat?.toString() || '',
            pickupLng: jobRequest.pickupLng?.toString() || '',
            dropoffLocation: jobRequest.dropoffLocation || '',
            dropoffLat: jobRequest.dropoffLat?.toString() || '',
            dropoffLng: jobRequest.dropoffLng?.toString() || '',
            price: jobRequest.price.toString(),
            estimatedEarnings: jobRequest.estimatedEarnings.toString(),
            distance: jobRequest.distance,
            urgency: jobRequest.urgency,
            description: jobRequest.description || '',
            vehicleMakeModel: jobRequest.vehicleDetails?.makeModel || '',
            vehicleLicensePlate: jobRequest.vehicleDetails?.licensePlate || '',
            acceptedAt: new Date().toISOString()
          }
        });
      }, 500);
    } else {
      // Fallback if WebSocket not connected
      Alert.alert(
        'Connection Issue',
        'Unable to connect to server. Please check your internet and try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsProcessing(false);
              responseSentRef.current = false;
            }
          }
        ]
      );
    }
  };

  const handleDecline = () => {
    if (responseSentRef.current || isProcessing) return;
    
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this service request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Decline',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(true);
            responseSentRef.current = true;
            
            // Clear timer
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            
            // Stop animation
            progress.stopAnimation();

            // Send decline via WebSocket
            if (providerWebSocket.isConnected()) {
              providerWebSocket.send('decline_job', { 
                jobId: jobRequest.id,
                bookingId: jobRequest.bookingId,
                reason: 'provider_declined'
              });
            }
            
            // Go back
            router.back();
          }
        }
      ]
    );
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Format currency
  const formatPrice = (price: number): string => {
    return typeof price === 'number' ? price.toFixed(2) : parseFloat(price || '0').toFixed(2);
  };

  // Get urgency color
  const getUrgencyColor = (): string => {
    switch(jobRequest.urgency) {
      case 'emergency': return '#DC2626';
      case 'urgent': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Bell Icon with WebSocket indicator */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="bell" size={48} color="#87CEFA" />
            </View>
            {wsConnected && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>NEW REQUEST!</Text>
          <Text style={styles.subtitle}>A CUSTOMER NEEDS YOUR SERVICE</Text>

          {/* Other providers viewing indicator */}
          {otherProviders > 0 && (
            <View style={styles.viewerContainer}>
              <Feather name="users" size={14} color="#6B7280" />
              <Text style={styles.viewerText}>
                {otherProviders} other provider{otherProviders !== 1 ? 's' : ''} viewing
              </Text>
            </View>
          )}

          {/* Service Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>
                {jobRequest.serviceName || jobRequest.serviceType}
              </Text>
              <View style={[
                styles.urgentBadge,
                { backgroundColor: `${getUrgencyColor()}20` }
              ]}>
                <Text style={[styles.urgentText, { color: getUrgencyColor() }]}>
                  {jobRequest.urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Customer Name */}
            <View style={styles.infoRow}>
              <Feather name="user" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CUSTOMER</Text>
                <Text style={styles.infoValue}>{jobRequest.customerName}</Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PICKUP LOCATION</Text>
                <Text style={styles.infoValue}>{jobRequest.pickupLocation}</Text>
              </View>
            </View>

            {/* Dropoff Location (if available) */}
            {jobRequest.dropoffLocation ? (
              <View style={styles.infoRow}>
                <Feather name="flag" size={16} color="#87CEFA" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>DROPOFF LOCATION</Text>
                  <Text style={styles.infoValue}>{jobRequest.dropoffLocation}</Text>
                </View>
              </View>
            ) : null}

            {/* Price and Distance */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="dollar-sign" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>ESTIMATED</Text>
                  <Text style={styles.detailValue}>{formatPrice(jobRequest.price)} BHD</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Feather name="navigation" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>DISTANCE</Text>
                  <Text style={styles.detailValue}>{jobRequest.distance}</Text>
                </View>
              </View>
            </View>

            {/* Vehicle Details (if available) */}
            {jobRequest.vehicleDetails?.makeModel && (
              <View style={styles.vehicleContainer}>
                <Feather name="truck" size={14} color="#9CA3AF" />
                <Text style={styles.vehicleText}>
                  {jobRequest.vehicleDetails.makeModel}
                  {jobRequest.vehicleDetails.licensePlate && ` · ${jobRequest.vehicleDetails.licensePlate}`}
                </Text>
              </View>
            )}
          </View>

          {/* Timer Card */}
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <View style={styles.timerLeft}>
                <Feather name="clock" size={20} color="#EF4444" />
                <Text style={styles.timerText}>RESPOND WITHIN</Text>
              </View>
              <Text style={styles.timerValue}>{timeLeft}s</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[styles.progressBar, { width: progressWidth }]}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              disabled={isProcessing || responseSentRef.current}
            >
              <Text style={styles.declineButtonText}>DECLINE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isProcessing || responseSentRef.current}
            >
              <Text style={styles.acceptButtonText}>ACCEPT</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              router.push({
                pathname: '/RequestDetailPage',
                params: {
                  jobId: jobRequest.id,
                  bookingId: jobRequest.bookingId || '',
                  customerName: jobRequest.customerName,
                  customerPhone: jobRequest.customerPhone || '',
                  serviceType: jobRequest.serviceType,
                  serviceName: jobRequest.serviceName,
                  pickupLocation: jobRequest.pickupLocation,
                  pickupLat: jobRequest.pickupLat?.toString() || '',
                  pickupLng: jobRequest.pickupLng?.toString() || '',
                  dropoffLocation: jobRequest.dropoffLocation || '',
                  dropoffLat: jobRequest.dropoffLat?.toString() || '',
                  dropoffLng: jobRequest.dropoffLng?.toString() || '',
                  price: jobRequest.price.toString(),
                  distance: jobRequest.distance,
                  urgency: jobRequest.urgency,
                  description: jobRequest.description || '',
                  vehicleMakeModel: jobRequest.vehicleDetails?.makeModel || '',
                  vehicleLicensePlate: jobRequest.vehicleDetails?.licensePlate || '',
                  preview: 'true' // Mark as preview only
                }
              });
            }}
          >
            <Text style={styles.detailsButtonText}>VIEW FULL DETAILS</Text>
          </TouchableOpacity>

          {/* Auto-decline message */}
          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

          {/* Processing indicator */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#87CEFA",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  liveIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
    letterSpacing: 0.07,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  viewerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  serviceCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 20,
    marginBottom: 20,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
    letterSpacing: -0.15,
    flex: 1,
  },
  urgentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  detailContent: {
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  vehicleText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  timerCard: {
    width: "100%",
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fb2c36",
    padding: 20,
    marginBottom: 20,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fb2c36",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fb2c36",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#E7000B",
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: "#53b2e6",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  declineButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DC2626",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  detailsButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  autoDeclineText: {
    fontSize: 11,
    color: "#6A7282",
    letterSpacing: 0,
    textAlign: "center",
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#53b2e6',
  },
});

export default NewRequestNotification;
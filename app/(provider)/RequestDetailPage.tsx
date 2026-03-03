import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { providerWebSocket } from '../../services/websocket.service';

const API_BASE_URL = 'https://yhiw-backend.onrender.com';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RequestDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  useEffect(() => {
    console.log('📱 RequestDetails - Params received:', params);
    
    // Check if we have the required data
    const hasRequiredData = params.jobId || params.bookingId;
    
    if (!hasRequiredData) {
      console.log('❌ No job data found');
      Alert.alert(
        'Error',
        'No job data found',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    // Parse any JSON data if needed
    let issues: string[] = [];
    let photos: string[] = [];
    
    try {
      if (params.issues) {
        issues = JSON.parse(params.issues as string);
      }
    } catch (e) {
      console.log('Error parsing issues:', e);
    }
    
    try {
      if (params.photos) {
        photos = JSON.parse(params.photos as string);
      }
    } catch (e) {
      console.log('Error parsing photos:', e);
    }

    // Set job data from params
    setJobData({
      jobId: params.jobId as string,
      bookingId: params.bookingId as string,
      customerName: (params.customerName as string) || 'MOHAMMED A.',
      customerPhone: params.customerPhone as string,
      serviceType: (params.serviceType as string) || 'TOWING SERVICE',
      serviceName: (params.serviceName as string) || (params.serviceType as string) || 'TOWING SERVICE',
      price: parseFloat(params.price as string) || 0,
      estimatedEarnings: parseFloat(params.estimatedEarnings as string) || parseFloat(params.price as string) || 0,
      pickupLocation: (params.pickupLocation as string) || 'MAIN STREET, MANAMA',
      pickupLat: params.pickupLat as string,
      pickupLng: params.pickupLng as string,
      dropoffLocation: params.dropoffLocation as string,
      dropoffLat: params.dropoffLat as string,
      dropoffLng: params.dropoffLng as string,
      distance: (params.distance as string) || '2.5 KM',
      urgency: (params.urgency as string) || 'normal',
      description: params.description as string,
      vehicleMakeModel: (params.vehicleMakeModel as string) || 'TOYOTA CAMRY 2020',
      vehicleLicensePlate: (params.vehicleLicensePlate as string) || 'ABC 1234',
      vehicleColor: (params.vehicleColor as string) || 'WHITE',
      vehicleType: (params.vehicleType as string) || 'SEDAN',
      acceptedAt: params.acceptedAt as string,
      status: params.status as string || 'accepted',
      issues,
      photos,
    });

    // ✅ Join job room if not already joined
    joinJobRoom();

    setIsLoading(false);
  }, []);

  // ✅ NEW: Join job room for real-time updates
  const joinJobRoom = () => {
    const jobId = params.jobId as string || params.bookingId as string;
    if (jobId && !hasJoinedRoom && providerWebSocket.isConnected()) {
      console.log('🚪 Joining job room:', jobId);
      providerWebSocket.send('join_job_room', {
        jobId,
        role: 'provider'
      });
      setHasJoinedRoom(true);
    }
  };

  // Format price
  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  // Calculate provider earnings (85% of job price)
  const providerEarnings = jobData ? jobData.price * 0.85 : 0;

  // Format timestamp
  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const jobTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - jobTime.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    return `${Math.floor(diffMinutes / 60)} hours ago`;
  };

  // Get urgency color and text
  const getUrgencyDetails = () => {
    if (!jobData) return { color: '#6B7280', bgColor: '#F3F4F6', text: 'STANDARD' };
    
    switch(jobData.urgency?.toLowerCase()) {
      case 'emergency':
        return { color: '#DC2626', bgColor: '#FEE2E2', text: 'EMERGENCY' };
      case 'urgent':
        return { color: '#F59E0B', bgColor: '#FEF3C7', text: 'URGENT' };
      default:
        return { color: '#6B7280', bgColor: '#F3F4F6', text: 'STANDARD' };
    }
  };

  const urgencyDetails = getUrgencyDetails();

  // ✅ FIXED: Handle en-route (heading to customer)
  const handleEnRoute = () => {
    Alert.alert(
      'Start Journey',
      'Are you on your way to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Journey',
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              // Update via REST API
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/jobs/${jobData.jobId}/en-route`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              // Send en-route status via WebSocket
              if (providerWebSocket.isConnected()) {
                providerWebSocket.send('en_route', {
                  jobId: jobData.jobId,
                  bookingId: jobData.bookingId,
                  eta: '10-15 minutes'
                });
              }
              
              // Navigate to tracking screen
              router.push({
                pathname: '/(provider)/ActiveJobScreen',
                params: {
                  ...jobData,
                  status: 'en-route'
                }
              });
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status');
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // ✅ FIXED: Handle arrived at location
  const handleArrived = () => {
    Alert.alert(
      'Arrived at Location',
      'Have you arrived at the pickup location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/jobs/${jobData.jobId}/arrived`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (providerWebSocket.isConnected()) {
                providerWebSocket.send('arrived', {
                  jobId: jobData.jobId,
                  bookingId: jobData.bookingId
                });
              }
              
              // Update local state
              setJobData({...jobData, status: 'arrived'});
              setIsProcessing(false);
              
              Alert.alert('Success', 'Customer notified of your arrival');
            } catch (error) {
              console.error('Error:', error);
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // ✅ FIXED: Handle start service
  const handleStartService = () => {
    Alert.alert(
      'Start Service',
      'Are you ready to begin the service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Service',
          onPress: async () => {
            setIsProcessing(true);
            
            try {
              const token = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/api/jobs/${jobData.jobId}/start-service`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (providerWebSocket.isConnected()) {
                providerWebSocket.send('start_service', {
                  jobId: jobData.jobId,
                  bookingId: jobData.bookingId
                });
              }
              
              // Navigate to service screen
              router.push({
                pathname: '/(provider)/ServiceInProgress',
                params: { ...jobData }
              });
            } catch (error) {
              console.error('Error:', error);
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleCallCustomer = () => {
    if (jobData?.customerPhone) {
      Linking.openURL(`tel:${jobData.customerPhone}`);
    }
  };

  const handleNavigate = () => {
    if (jobData?.pickupLat && jobData?.pickupLng) {
      const url = Platform.select({
        ios: `maps://app?daddr=${jobData.pickupLat},${jobData.pickupLng}`,
        android: `google.navigation:q=${jobData.pickupLat},${jobData.pickupLng}`,
      });
      
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#87CEFA" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!jobData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#9CA3AF" />
          <Text style={styles.errorTitle}>No Job Data</Text>
          <Text style={styles.errorText}>Unable to load job details.</Text>
          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>JOB DETAILS</Text>
          <Text style={styles.requestId}>
            {jobData.bookingId ? jobData.bookingId.slice(-8) : jobData.jobId?.slice(-8) || 'REQ-7891'}
          </Text>
        </View>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { 
          backgroundColor: jobData.status === 'accepted' ? '#DBEAFE' : 
                          jobData.status === 'en-route' ? '#FEF3C7' : '#F3F4F6'
        }]}>
          <Text style={[styles.statusText, { 
            color: jobData.status === 'accepted' ? '#1E40AF' : 
                   jobData.status === 'en-route' ? '#92400E' : '#6B7280'
          }]}>
            {jobData.status?.toUpperCase() || 'ACCEPTED'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceIconContainer}>
              <Image
                source={require('../../assets/provider/car.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{jobData.serviceName}</Text>
              <Text style={styles.serviceSubtitle}>
                {getTimeAgo(jobData.acceptedAt)} • {jobData.serviceType}
              </Text>
            </View>
          </View>
          
          <View style={styles.earningsRow}>
            <View style={styles.earningsLeft}>
              <Feather name="dollar-sign" size={20} color="#000" />
              <Text style={styles.earningsLabel}>YOUR EARNINGS</Text>
            </View>
            <Text style={styles.earningsValue}>{formatPrice(providerEarnings)} BHD</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerLeft}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={24} color="#87CEFA" />
              </View>
              <View>
                <Text style={styles.customerName}>{jobData.customerName}</Text>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color="#000" />
                  <Text style={styles.ratingText}>4.5 CUSTOMER RATING</Text>
                </View>
              </View>
            </View>
            {jobData.customerPhone ? (
              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                <Image
                  source={require('../../assets/provider/callbutton.png')}
                  style={styles.callIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.callButton} />
            )}
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <Feather name="truck" size={20} color="#9CA3AF" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>TYPE & MODEL</Text>
                <Text style={styles.vehicleValue}>{jobData.vehicleMakeModel}</Text>
              </View>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>LICENSE PLATE:</Text>
                <Text style={styles.detailValue}>{jobData.vehicleLicensePlate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>COLOR:</Text>
                <Text style={styles.detailValue}>{jobData.vehicleColor}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Details */}
        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionTitle}>LOCATION DETAILS</Text>
            <TouchableOpacity onPress={handleNavigate}>
              <Text style={styles.navigateText}>
                <Feather name="navigation" size={12} color="#87CEFA" /> NAVIGATE
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationAddress}>{jobData.pickupLocation}</Text>
                {jobData.pickupLat && jobData.pickupLng && (
                  <Text style={styles.coordinates}>
                    📍 {parseFloat(jobData.pickupLat).toFixed(6)}, {parseFloat(jobData.pickupLng).toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
            
            {jobData.dropoffLocation && (
              <>
                <View style={styles.locationDivider} />
                
                <View style={styles.locationItem}>
                  <View style={[styles.locationDot, styles.locationDotOutline]} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>DROP-OFF LOCATION</Text>
                    <Text style={styles.locationAddress}>{jobData.dropoffLocation}</Text>
                    {jobData.dropoffLat && jobData.dropoffLng && (
                      <Text style={styles.coordinates}>
                        📍 {parseFloat(jobData.dropoffLat).toFixed(6)}, {parseFloat(jobData.dropoffLng).toFixed(6)}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
            
            <View style={styles.distanceCard}>
              <Feather name="navigation" size={16} color="#87CEFA" />
              <Text style={styles.distanceLabel}>DISTANCE FROM YOU</Text>
              <Text style={styles.distanceValue}>{jobData.distance}</Text>
            </View>
          </View>
        </View>

        {/* Customer Notes */}
        {jobData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOMER NOTES</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{jobData.description}</Text>
            </View>
          </View>
        )}

        {/* Issues (if available) */}
        {jobData.issues && jobData.issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ISSUES REPORTED</Text>
            <View style={styles.issuesCard}>
              {jobData.issues.map((issue: string, index: number) => (
                <View key={index} style={styles.issueItem}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.issueText}>{issue}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>PAYMENT METHOD:</Text>
              <Text style={styles.paymentValue}>CASH</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>SERVICE FEE:</Text>
              <Text style={styles.paymentValue}>{formatPrice(jobData.price)} BHD</Text>
            </View>
            <View style={[styles.paymentRow, styles.earningsHighlight]}>
              <Text style={styles.paymentLabelBold}>YOUR EARNINGS (85%):</Text>
              <Text style={styles.paymentValueBold}>{formatPrice(providerEarnings)} BHD</Text>
            </View>
          </View>
        </View>

        {/* Urgent Request Alert */}
        {(jobData.urgency?.toLowerCase() === 'urgent' || jobData.urgency?.toLowerCase() === 'emergency') && (
          <View style={[styles.urgentAlert, { backgroundColor: urgencyDetails.bgColor }]}>
            <Feather name="alert-circle" size={20} color={urgencyDetails.color} />
            <View style={styles.urgentAlertContent}>
              <Text style={[styles.urgentAlertTitle, { color: urgencyDetails.color }]}>
                {urgencyDetails.text} REQUEST
              </Text>
              <Text style={[styles.urgentAlertText, { color: urgencyDetails.color }]}>
                {jobData.urgency === 'emergency' 
                  ? 'EMERGENCY SITUATION - Immediate assistance required!'
                  : 'This is a priority request. Customer is waiting for immediate assistance.'}
              </Text>
            </View>
          </View>
        )}

        {/* ✅ FIXED: Action buttons based on status */}
        <View style={styles.actionButtonsContainer}>
          {jobData.status === 'accepted' && (
            <TouchableOpacity 
              style={styles.enRouteButton}
              onPress={handleEnRoute}
              disabled={isProcessing}
            >
              <Text style={styles.enRouteButtonText}>START JOURNEY TO CUSTOMER</Text>
            </TouchableOpacity>
          )}

          {jobData.status === 'en-route' && (
            <TouchableOpacity 
              style={styles.arrivedButton}
              onPress={handleArrived}
              disabled={isProcessing}
            >
              <Text style={styles.arrivedButtonText}>I'VE ARRIVED</Text>
            </TouchableOpacity>
          )}

          {jobData.status === 'arrived' && (
            <TouchableOpacity 
              style={styles.startServiceButton}
              onPress={handleStartService}
              disabled={isProcessing}
            >
              <Text style={styles.startServiceButtonText}>START SERVICE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Connection Status */}
        {!hasJoinedRoom && (
          <View style={styles.connectionWarning}>
            <Feather name="wifi-off" size={16} color="#DC2626" />
            <Text style={styles.connectionWarningText}>
              Not connected to real-time updates
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.homeButtonText}>BACK TO HOME</Text>
        </TouchableOpacity>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#87CEFA" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 38,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.77,
    borderBottomColor: '#dddfe5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  requestId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Service Card
  serviceCard: {
    backgroundColor: '#e2f5ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIcon: {
    width: 32,
    height: 32,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },

  // Section
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  // Customer Card
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  callButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    width: 48,
    height: 48,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Location
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigateText: {
    fontSize: 12,
    color: '#87CEFA',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#60A5FA',
    marginTop: 4,
    marginRight: 12,
  },
  locationDotOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 20,
  },
  coordinates: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 8,
  },
  distanceCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  distanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0891B2',
  },

  // Notes Card
  notesCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Issues Card
  issuesCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueText: {
    fontSize: 13,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },

  // Payment Card
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  earningsHighlight: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  paymentLabelBold: {
    fontSize: 13,
    color: '#000',
    fontWeight: '700',
  },
  paymentValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // Urgent Alert
  urgentAlert: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  urgentAlertContent: {
    flex: 1,
    marginLeft: 12,
  },
  urgentAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  urgentAlertText: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Action Buttons Container
  actionButtonsContainer: {
    marginBottom: 16,
  },

  // Status-based buttons
  enRouteButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  enRouteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  arrivedButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  arrivedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  startServiceButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  startServiceButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Connection Warning
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionWarningText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 8,
    fontWeight: '500',
  },

  homeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  errorBackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
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
    color: '#87CEFA',
    marginTop: 12,
  },
});

export default RequestDetails;
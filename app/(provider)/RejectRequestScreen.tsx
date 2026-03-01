import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { providerWebSocket } from '../../services/websocket.service';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JobData {
  jobId: string;
  bookingId: string;
  jobNumber: string;
  serviceType: string;
  title: string;
  price: number;
  estimatedEarnings: number;
  distance: string;
  customerName: string;
  pickupLocation: string;
  [key: string]: any;
}

// ─── Decline Reasons ─────────────────────────────────────────────────────────

const DECLINE_REASONS = [
  { id: 'too_far', label: 'Too far from current location' },
  { id: 'another_job', label: 'Already have another job' },
  { id: 'vehicle_type', label: 'Vehicle type not suitable' },
  { id: 'outside_hours', label: 'Outside service hours' },
  { id: 'other', label: 'Other reason' },
];

// ─── Icon components ─────────────────────────────────────────────────────────

const DollarIcon = () => (
  <View style={styles.iconWrap}>
    <Feather name="dollar-sign" size={24} color="#87CEFA" />
  </View>
);

const PinIcon = () => (
  <View style={styles.iconWrap}>
    <Feather name="map-pin" size={24} color="#87CEFA" />
  </View>
);

const ClockIcon = () => (
  <View style={styles.iconWrap}>
    <Feather name="clock" size={24} color="#87CEFA" />
  </View>
);

const CheckIcon = ({ size = 20, color = '#fff' }) => (
  <Text style={{ fontSize: size, color }}>✓</Text>
);

const CrossIcon = ({ size = 20, color = '#fff' }) => (
  <Text style={{ fontSize: size, color }}>✕</Text>
);

const WarningIcon = () => (
  <Text style={{ fontSize: 18, color: '#FFA000' }}>⚠</Text>
);

// ─── Sub-components ──────────────────────────────────────────────────────────

const RequestSummary = ({ jobData }: { jobData: JobData }) => {
  // Extract distance number from string (e.g., "2.5 KM" -> 2.5)
  const distanceNum = parseFloat(jobData.distance) || 2.5;
  
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.sectionLabel}>REQUEST SUMMARY</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <DollarIcon />
          <Text style={styles.summaryValue}>{jobData.price} BHD</Text>
          <Text style={styles.summarySubLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <PinIcon />
          <Text style={styles.summaryValue}>{distanceNum} KM</Text>
          <Text style={styles.summarySubLabel}>Distance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ClockIcon />
          <Text style={styles.summaryValue}>8-10</Text>
          <Text style={styles.summarySubLabel}>Minutes</Text>
        </View>
      </View>
    </View>
  );
};

const AcceptSection = ({ onAccept, loading }: { onAccept: () => void; loading: boolean }) => (
  <View style={styles.acceptCard}>
    <View style={styles.acceptSection}>
      <View style={styles.cardHeader}>
        <View style={styles.acceptIconCircle}>
          <CheckIcon size={18} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.acceptCardTitle}>Accept Request</Text>
          <Text style={styles.cardSubtitle}>Start earning immediately</Text>
        </View>
      </View>
    </View>

    <View style={styles.cardDividergreen} />
    
    <View style={styles.acceptSection}>
      <Text style={styles.nextLabel}>WHAT HAPPENS NEXT:</Text>
      <View style={styles.stepRow}>
        <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
        <Text style={styles.stepText}>Customer will be notified</Text>
      </View>
      <View style={styles.stepRow}>
        <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
        <Text style={styles.stepText}>Navigate to pickup location</Text>
      </View>
      <View style={styles.stepRow}>
        <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
        <Text style={styles.stepText}>Start the service</Text>
      </View>

      <TouchableOpacity
        style={styles.acceptBtn}
        onPress={onAccept}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.acceptBtnText}>Accept & Start Navigation</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Decline Section ─────────────────────────────────────────────────────────

const DeclineSection = ({ onDecline, onCancel, loading }: { 
  onDecline: (reason: string) => void; 
  onCancel: () => void;
  loading: boolean;
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConfirmDecline = () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason before declining.');
      return;
    }
    const reason = DECLINE_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
    onDecline(reason);
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setIsExpanded(false);
    if (onCancel) onCancel();
  };

  return (
    <View style={styles.declineCard}>
      {/* 🔴 Top Header Section - Clickable to expand */}
      <TouchableOpacity 
        style={styles.declineTop}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.declineIconCircle}>
            <CrossIcon size={16} color="#FFFFFF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.declineCardTitle}>Decline Request</Text>
            <Text style={styles.cardSubtitle}>Not available for this job</Text>
          </View>
          <Feather 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#F44336" 
          />
        </View>
      </TouchableOpacity>

      {/* 🔴 Full-width Divider - Only show when expanded */}
      {isExpanded && <View style={styles.cardDividerred} />}

      {/* ⚪ Bottom White Section — Reason Selection (only when expanded) */}
      {isExpanded && (
        <View style={styles.declineBottom}>
          <Text style={styles.reasonLabel}>SELECT A REASON (REQUIRED):</Text>

          {DECLINE_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.radioOption,
                selectedReason === reason.id && styles.radioOptionSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioCircle,
                selectedReason === reason.id && styles.radioCircleSelected,
              ]}>
                {selectedReason === reason.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={[
                styles.radioLabel,
                selectedReason === reason.id && styles.radioLabelSelected,
              ]}>
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Confirm Decline Button */}
          <TouchableOpacity
            style={[
              styles.confirmDeclineBtn,
              (!selectedReason || loading) && styles.confirmDeclineBtnDisabled,
            ]}
            onPress={handleConfirmDecline}
            disabled={!selectedReason || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ImportantWarning = ({ acceptanceRate = 98 }: { acceptanceRate?: number }) => (
  <View style={styles.warningCard}>
    <View style={styles.warningHeader}>
      <WarningIcon />
      <Text style={styles.warningTitle}> Important</Text>
    </View>
    <Text style={styles.warningText}>
      High rejection rate may affect your account standing and future request
      priority. Current acceptance rate:{' '}
      <Text style={styles.warningBold}>{acceptanceRate}%</Text>
    </Text>
  </View>
);

const ImpactStats = ({ price = 81 }: { price?: number }) => (
  <View style={styles.impactCard}>
    <Text style={styles.sectionLabel}>IMPACT ON YOUR STATS</Text>
    <View style={styles.impactRow}>
      <View style={styles.impactCol}>
        <Text style={styles.impactColHead}>If you Accept:</Text>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconGreen}>✓</Text>
          <Text style={styles.impactStatGreen}>+{price} BHD earnings</Text>
        </View>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconGreen}>✓</Text>
          <Text style={styles.impactStatGreen}>Maintain 98% rate</Text>
        </View>
      </View>

      <View style={styles.impactCol}>
        <Text style={styles.impactColHead}>If you Decline:</Text>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconRed}>✕</Text>
          <Text style={styles.impactStatRed}>-0 BHD earnings</Text>
        </View>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconRed}>✕</Text>
          <Text style={styles.impactStatRed}>Rate drops to 96%</Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MakeYourDecisionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Log all params when screen loads
  console.log('📱📱📱 ===== MAKE YOUR DECISION SCREEN LOADED =====');
  console.log('📱 Timestamp:', new Date().toISOString());
  console.log('📱 All params received:', JSON.stringify(params, null, 2));
  console.log('📱 jobId:', params.jobId);
  console.log('📱 bookingId:', params.bookingId);
  console.log('📱 customerName:', params.customerName);
  console.log('📱 serviceType:', params.serviceType);
  console.log('📱 price:', params.price);
  console.log('📱 pickupLocation:', params.pickupLocation);
  console.log('📱 distance:', params.distance);
  
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [acceptanceRate, setAcceptanceRate] = useState(98);
  
  // Use ref to track if we've already initialized
  const hasInitialized = useRef(false);

  // Extract job data from params
  const jobId = params.jobId as string;
  const bookingId = params.bookingId as string;

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    console.log('🔄 ===== MAKE YOUR DECISION USEFFECT TRIGGERED =====');
    console.log('🔄 hasInitialized:', hasInitialized.current);
    
    // Only run once
    if (!hasInitialized.current) {
      console.log('🔄 First initialization - loading job data from params');
      
      // Load job data from params (passed from previous screen)
      if (Object.keys(params).length > 0) {
        console.log('📦 Creating jobData from params');
        const newJobData = {
          jobId: jobId,
          bookingId: bookingId || jobId,
          jobNumber: params.jobNumber as string || 'REQ-7891',
          serviceType: params.serviceType as string || 'Towing',
          title: params.title as string || params.serviceType as string || 'Service',
          price: parseFloat(params.price as string) || 95,
          estimatedEarnings: parseFloat(params.estimatedEarnings as string) || 81,
          distance: params.distance as string || '2.5 KM',
          customerName: params.customerName as string || 'Mohammed A.',
          pickupLocation: params.pickupLocation as string || 'Main Street, Manama',
          ...params
        };
        
        console.log('📦 Job data created:', JSON.stringify(newJobData, null, 2));
        setJobData(newJobData);
      } else {
        console.log('⚠️ No params received!');
      }

      // Fetch provider stats
      console.log('📊 Fetching provider stats...');
      fetchProviderStats();
      
      hasInitialized.current = true;
      console.log('✅ Initialization complete');
    }
  }, []); // Empty dependency array - only runs once on mount

  const fetchProviderStats = async () => {
    console.log('📊 ===== FETCHING PROVIDER STATS =====');
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      console.log('📊 Token exists:', !!token);
      console.log('📊 Token length:', token?.length || 0);
      console.log('📊 User data exists:', !!userDataStr);
      
      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        const providerId = userData.firebaseUserId || userData.uid;
        
        console.log('📊 Provider ID:', providerId);
        
        // Fetch provider stats to get acceptance rate
        const url = `${API_BASE_URL}/provider/${providerId}/performance`;
        console.log('📊 Fetching from URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Provider stats response:', JSON.stringify(data, null, 2));
          
          if (data.success && data.data) {
            // Calculate acceptance rate from stats
            const total = data.data.totalJobsOffered || 100;
            const accepted = data.data.totalJobsAccepted || 98;
            const rate = Math.round((accepted / total) * 100);
            console.log('📊 Calculated acceptance rate:', rate);
            setAcceptanceRate(rate);
          }
        } else {
          console.log('📊 Failed to fetch provider stats, using default rate 98');
        }
      } else {
        console.log('📊 No token or user data, using default rate 98');
      }
    } catch (error) {
      console.error('📊 Error fetching provider stats:', error);
    }
  };

  const handleAccept = async () => {
    console.log('✅ ===== ACCEPT JOB BUTTON PRESSED =====');
    console.log('✅ Job data:', jobData);
    
    if (!jobData) {
      console.log('❌ No job data available, cannot accept');
      return;
    }
    
    setLoading(true);
    console.log('✅ Loading state set to true');
    
    try {
      console.log('✅ Sending accept_job via WebSocket');
      console.log('✅ WebSocket payload:', { 
        jobId: jobData.jobId,
        bookingId: jobData.bookingId,
        responseTime: 15
      });
      
      // Send acceptance via WebSocket
      const wsSent = providerWebSocket.send('accept_job', { 
        jobId: jobData.jobId,
        bookingId: jobData.bookingId,
        responseTime: 15
      });
      
      console.log('✅ WebSocket send result:', wsSent);

      // Also call API as backup
      const token = await AsyncStorage.getItem('userToken');
      console.log('✅ Token for API call:', !!token);
      
      if (token) {
        const apiUrl = `${API_BASE_URL}/jobs/provider/${jobData.jobId}/accept`;
        console.log('✅ Calling API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookingId: jobData.bookingId
          })
        });

        console.log('✅ API response status:', response.status);
        const result = await response.json();
        console.log('✅ API response data:', JSON.stringify(result, null, 2));
        
        if (result.success || wsSent) {
          console.log('✅ Job accepted successfully, navigating to NavigateToCustomerScreen');
          console.log('✅ Navigation params:', {
            jobId: jobData.jobId,
            bookingId: jobData.bookingId,
            customerName: jobData.customerName,
            pickupLocation: jobData.pickupLocation,
            price: jobData.price.toString()
          });
          
          // Navigate to NavigateToCustomer page on success
          router.push({
            pathname: '/NavigateToCustomerScreen',
            params: {
              jobId: jobData.jobId,
              bookingId: jobData.bookingId,
              customerName: jobData.customerName,
              pickupLocation: jobData.pickupLocation,
              price: jobData.price.toString()
            }
          });
          console.log('✅ Navigation command executed');
        } else {
          throw new Error(result.message || 'Failed to accept job');
        }
      } else {
        console.log('❌ No token available for API call');
        throw new Error('Authentication token not found');
      }
    } catch (error) {
      console.error('❌ Error accepting job:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'No stack');
      Alert.alert(
        'Error',
        'Failed to accept job. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('✅ Setting loading state to false');
      setLoading(false);
    }
  };

  const handleDecline = async (reason: string) => {
    console.log('❌ ===== DECLINE JOB BUTTON PRESSED =====');
    console.log('❌ Job data:', jobData);
    console.log('❌ Decline reason:', reason);
    
    if (!jobData) {
      console.log('❌ No job data available, cannot decline');
      return;
    }
    
    setLoading(true);
    console.log('❌ Loading state set to true');
    
    try {
      console.log('❌ Sending decline_job via WebSocket');
      console.log('❌ WebSocket payload:', { 
        jobId: jobData.jobId,
        bookingId: jobData.bookingId,
        reason: reason
      });
      
      // Send decline via WebSocket
      const wsSent = providerWebSocket.send('decline_job', { 
        jobId: jobData.jobId,
        bookingId: jobData.bookingId,
        reason: reason
      });
      
      console.log('❌ WebSocket send result:', wsSent);

      // Also call API as backup
      const token = await AsyncStorage.getItem('userToken');
      console.log('❌ Token for API call:', !!token);
      
      if (token) {
        const apiUrl = `${API_BASE_URL}/jobs/provider/${jobData.jobId}/decline`;
        console.log('❌ Calling API:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bookingId: jobData.bookingId,
              reason: reason
            })
          });
          
          console.log('❌ API response status:', response.status);
          const result = await response.json();
          console.log('❌ API response data:', JSON.stringify(result, null, 2));
        } catch (apiError) {
          console.error('❌ API decline failed, but WebSocket may have worked:', apiError);
        }
      }

      // Show success message and go back to home
      console.log('❌ Job declined successfully, showing success message');
      Alert.alert(
        'Request Declined',
        `You've declined this job. Reason: ${reason}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('❌ Navigating back to provider home');
              router.push('/(provider)/Home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error declining job:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'No stack');
      Alert.alert(
        'Error',
        'Failed to decline job. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('❌ Setting loading state to false');
      setLoading(false);
    }
  };

  const handleCancelDecline = () => {
    console.log('🔄 Decline cancelled by user');
  };

  // Show loading if no job data
  if (!jobData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#87CEFA" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('⬅️ Back button pressed');
            router.back();
          }}
          disabled={loading}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Make Your Decision</Text>
          <Text style={styles.headerSubtitle}>
            Choose to accept or decline this request
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RequestSummary jobData={jobData} />
        
        <AcceptSection onAccept={handleAccept} loading={loading} />
        
        <DeclineSection 
          onDecline={handleDecline} 
          onCancel={handleCancelDecline}
          loading={loading}
        />
        
        <ImportantWarning acceptanceRate={acceptanceRate} />
        
        <ImpactStats price={jobData.estimatedEarnings || jobData.price * 0.85} />
        
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Add loading styles
const loadingStyles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
};

// Merge with existing styles
const styles = StyleSheet.create({
  // ── Safe Area ──
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 3,
    letterSpacing: 0.2,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1.2,
    marginBottom: 14,
    textTransform: 'uppercase',
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F0F0F0',
  },
  iconWrap: {
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  summarySubLabel: {
    fontSize: 11,
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // ── Card Shared ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardDividergreen: {
    height: 2,
    backgroundColor: '#00C853',
    width: '100%',
  },
  cardDividerred: {
    height: 1.77,
    backgroundColor: '#fc454d',
    width: '100%',
  },

  // ── Accept Card ──
  acceptCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00C853',
    overflow: 'hidden',
  },
  acceptSection: {
    padding: 18,
  },
  acceptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  acceptCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#87CEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#87CEFA',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  acceptBtn: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Decline Card ──
  declineCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F44336',
    overflow: 'hidden',
  },
  declineTop: {
    backgroundColor: '#FFF5F5',
    padding: 14,
  },
  declineBottom: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  declineIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  declineCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
    letterSpacing: 0.2,
  },

  // ── Reason Selection ──
  reasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F44336',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    letterSpacing: 0.2,
  },
  radioLabelSelected: {
    color: '#F44336',
    fontWeight: '700',
  },

  // ── Confirm Decline Button ──
  confirmDeclineBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: '#4eafe4',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDeclineBtnDisabled: {
    backgroundColor: '#A8C8E8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmDeclineBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Cancel Button ──
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Warning Card ──
  warningCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFC107',
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57F17',
    letterSpacing: 0.3,
  },
  warningText: {
    fontSize: 13,
    color: '#F57F17',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  warningBold: {
    fontWeight: '800',
    fontStyle: 'normal',
  },

  // ── Impact Card ──
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 18,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactCol: {
    flex: 1,
  },
  impactColHead: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  impactStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  impactIconGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CAF50',
  },
  impactStatGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },
  impactIconRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F44336',
  },
  impactStatRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F44336',
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
});
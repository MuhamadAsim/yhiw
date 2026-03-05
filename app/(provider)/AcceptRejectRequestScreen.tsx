import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Decline Reasons ─────────────────────────────────────────────────────────
const DECLINE_REASONS = [
  { id: 'too_far', label: 'Too far from current location' },
  { id: 'another_job', label: 'Already have another job' },
  { id: 'vehicle_type', label: 'Vehicle type not suitable' },
  { id: 'outside_hours', label: 'Outside service hours' },
  { id: 'other', label: 'Other reason' },
];

// ─── Icon components ─────────────────────────────────────────────────────
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

interface RequestSummaryProps {
  earnings: number;
  distance: string;
  eta: string;
}

const RequestSummary = ({ earnings, distance, eta }: RequestSummaryProps) => (
  <View style={styles.summaryCard}>
    <Text style={styles.sectionLabel}>REQUEST SUMMARY</Text>
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <DollarIcon />
        <Text style={styles.summaryValue}>{earnings} BHD</Text>
        <Text style={styles.summarySubLabel}>Earnings</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <PinIcon />
        <Text style={styles.summaryValue}>{distance}</Text>
        <Text style={styles.summarySubLabel}>Distance</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <ClockIcon />
        <Text style={styles.summaryValue}>{eta}</Text>
        <Text style={styles.summarySubLabel}>Minutes</Text>
      </View>
    </View>
  </View>
);

interface AcceptSectionProps {
  onAccept: () => void;
  isLoading: boolean;
}

const AcceptSection = ({ onAccept, isLoading }: AcceptSectionProps) => (
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
        style={[styles.acceptBtn, isLoading && styles.buttonDisabled]}
        onPress={onAccept}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.acceptBtnText}>Accept & Start Navigation</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

interface DeclineSectionProps {
  onDecline: (reason: string) => void;
  isLoading: boolean;
}

const DeclineSection = ({ onDecline, isLoading }: DeclineSectionProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleConfirmDecline = () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason before declining.');
      return;
    }
    const reason = DECLINE_REASONS.find(r => r.id === selectedReason)?.label || '';
    onDecline(reason);
  };

  const handleCancel = () => {
    setSelectedReason(null);
  };

  return (
    <View style={styles.declineCard}>
      {/* 🔴 Top Header Section */}
      <View style={styles.declineTop}>
        <View style={styles.cardHeader}>
          <View style={styles.declineIconCircle}>
            <CrossIcon size={16} color="#FFFFFF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.declineCardTitle}>Decline Request</Text>
            <Text style={styles.cardSubtitle}>Not available for this job</Text>
          </View>
        </View>
      </View>

      {/* 🔴 Full-width Divider */}
      <View style={styles.cardDividerred} />

      {/* ⚪ Bottom White Section — Reason Selection */}
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
            disabled={isLoading}
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
            (!selectedReason || isLoading) && styles.confirmDeclineBtnDisabled,
          ]}
          onPress={handleConfirmDecline}
          disabled={!selectedReason || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ImportantWarningProps {
  acceptanceRate: number;
}

const ImportantWarning = ({ acceptanceRate }: ImportantWarningProps) => (
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

interface ImpactStatsProps {
  earnings: number;
  currentRate: number;
  newRate: number;
}

const ImpactStats = ({ earnings, currentRate, newRate }: ImpactStatsProps) => (
  <View style={styles.impactCard}>
    <Text style={styles.sectionLabel}>IMPACT ON YOUR STATS</Text>
    <View style={styles.impactRow}>
      <View style={styles.impactCol}>
        <Text style={styles.impactColHead}>If you Accept:</Text>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconGreen}>✓</Text>
          <Text style={styles.impactStatGreen}>+{earnings} BHD earnings</Text>
        </View>
        <View style={styles.impactStatRow}>
          <Text style={styles.impactIconGreen}>✓</Text>
          <Text style={styles.impactStatGreen}>Maintain {currentRate}% rate</Text>
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
          <Text style={styles.impactStatRed}>Rate drops to {newRate}%</Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MakeYourDecisionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState({
    earnings: 81,
    distance: '2.5 KM',
    eta: '8-10',
    acceptanceRate: 98,
  });

  // Fetch job data on mount
  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }
    fetchJobSummary();
  }, []);

  const fetchJobSummary = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          // Update with real data
          setJobData({
            earnings: Math.round(data.job.payment.totalAmount * 0.85),
            distance: data.job.distance || '2.5 KM',
            eta: data.job.estimatedArrival?.split(' ')[0] || '8-10',
            acceptanceRate: 98, // This would come from provider's stats
          });
        }
      }
    } catch (error) {
      console.error('Error fetching job summary:', error);
    }
  };

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/accept-job`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept job');
      }

      Alert.alert(
        'Request Accepted',
        'Navigate to pickup location now.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to navigation/tracking screen
              router.push({
                pathname: '/NavigationScreen',
                params: { bookingId }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Accept error:', error);
      Alert.alert(
        'Failed to Accept',
        error.message || 'Could not accept the job. It may have been taken by another provider.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async (reason: string) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      // Mock API call - replace with actual endpoint when ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Decline reason:', reason);

      Alert.alert(
        'Request Declined',
        reason ? `Reason: ${reason}` : 'The request has been declined.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Decline error:', error);
      Alert.alert('Error', 'Failed to decline the request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Make Your Decision</Text>
        <Text style={styles.headerSubtitle}>
          Choose to accept or decline this request
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RequestSummary 
          earnings={jobData.earnings}
          distance={jobData.distance}
          eta={jobData.eta}
        />
        
        <AcceptSection 
          onAccept={handleAccept}
          isLoading={isLoading}
        />
        
        <DeclineSection 
          onDecline={handleDecline}
          isLoading={isLoading}
        />
        
        <ImportantWarning acceptanceRate={jobData.acceptanceRate} />
        
        <ImpactStats 
          earnings={jobData.earnings}
          currentRate={jobData.acceptanceRate}
          newRate={jobData.acceptanceRate - 2}
        />
        
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles (keep exactly as provided) ─────────────────────────────────────
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  buttonDisabled: {
    opacity: 0.7,
  },
});
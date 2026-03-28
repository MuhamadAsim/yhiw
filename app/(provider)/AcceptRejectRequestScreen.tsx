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
import { styles } from './styles/AcceptRejectRequestScreenStyles';

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

      console.log('✅ Accepting job:', bookingId);
      console.log('📡 POST', `${API_BASE_URL}/provider/${bookingId}/accept-job`);

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/accept-job`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('📡 Accept response:', response.status, data);

      if (!response.ok) {
        if (response.status === 404 && data.message?.includes('already been taken')) {
          Alert.alert(
            'Job Already Taken',
            'This job has already been accepted by another provider.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/Home') 
              }
            ]
          );
          return;
        }
        throw new Error(data.message || 'Failed to accept job');
      }

      if (data.success) {
        Alert.alert(
          'Request Accepted',
          'Navigate to pickup location now.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Use replace to remove current screen from stack
                router.replace({
                  pathname: '/NavigateToCustomerScreen',
                  params: {
                    bookingId,
                    customerName: params.customerName,
                    customerPhone: params.customerPhone,
                    customerRating: params.customerRating,
                    serviceType: params.serviceType,
                    pickupLocation: params.pickupLocation,
                    pickupLat: params.pickupLat,
                    pickupLng: params.pickupLng,
                    dropoffLocation: params.dropoffLocation,
                    dropoffLat: params.dropoffLat,
                    dropoffLng: params.dropoffLng,
                    distance: params.distance,
                    estimatedEarnings: params.estimatedEarnings,
                    description: params.description,
                    eta: data.job?.estimatedArrival || params.eta,
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Accept error:', error);
      Alert.alert(
        'Failed to Accept',
        error.message || 'Could not accept the job. Please try again.',
        [{ text: 'OK' }]
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

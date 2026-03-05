import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Timer Hook ───────────────────────────────────────────────────────────────
const useTimer = (initialSeconds: number = 0) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [paused]);

  const format = (s: number): string => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return { display: format(seconds), seconds, paused, setPaused };
};

// ─── Checklist Items ──────────────────────────────────────────────────────────
const CHECKLIST: string[] = [
  'Inspect vehicle condition',
  'Secure vehicle on flatbed',
  'Document pre-service photos',
  'Check for personal items',
  'Verify drop-off location',
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface JobData {
  serviceType: string;
  vehicleType: string;
  licensePlate: string;
  vehicleModel: string;
  customerName: string;
  customerPhone: string;
  estimatedEarnings: number;
  startedAt: string | null;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ServiceInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [jobData, setJobData] = useState<JobData>({
    serviceType: 'Towing Service',
    vehicleType: 'Sedan',
    licensePlate: 'ABC 1234',
    vehicleModel: 'Toyota Camry 2020',
    customerName: 'Mohammed A.',
    customerPhone: '+973 3XXX XXXX',
    estimatedEarnings: 81,
    startedAt: null,
  });

  const { display, seconds, paused, setPaused } = useTimer(0);

  // Mark service as started when screen loads
  useEffect(() => {
    if (bookingId) {
      markServiceStarted();
      fetchJobDetails();
    }
  }, []);

  const markServiceStarted = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
          action: 'start'
        }),
      });
    } catch (error) {
      console.error('Error marking service started:', error);
    }
  };

  const fetchJobDetails = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/active-job`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.job) {
        setJobData({
          serviceType: data.job.serviceType || 'Towing Service',
          vehicleType: data.job.vehicleType || 'Sedan',
          licensePlate: data.job.licensePlate || 'ABC 1234',
          vehicleModel: data.job.vehicleModel || 'Toyota Camry 2020',
          customerName: data.job.customer?.name || 'Mohammed A.',
          customerPhone: data.job.customer?.phone || '+973 3XXX XXXX',
          estimatedEarnings: data.job.estimatedEarnings || 81,
          startedAt: data.job.startedAt,
        });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleCall = (): void => {
    if (jobData.customerPhone && jobData.customerPhone !== '+973 3XXX XXXX') {
      Linking.openURL(`tel:${jobData.customerPhone}`);
    } else {
      Alert.alert('Call', 'Calling customer...');
    }
  };

  const handleMessage = (): void => {
    if (jobData.customerPhone && jobData.customerPhone !== '+973 3XXX XXXX') {
      Linking.openURL(`sms:${jobData.customerPhone}`);
    } else {
      Alert.alert('Message', 'Opening message...');
    }
  };

  const handleAddPhoto = (): void => {
    Alert.alert('Add Photo', 'Camera functionality will be implemented');
  };

  const handleAddTime = (): void => {
    Alert.alert('Add Time', 'Request additional time?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'add_time',
                timeData: { minutes: 15, reason: 'Additional time needed' }
              }),
            });
            Alert.alert('Success', 'Time extension requested');
          } catch (error) {
            Alert.alert('Error', 'Failed to request time extension');
          }
        }
      }
    ]);
  };

  const handlePauseResume = async (): Promise<void> => {
    setPaused(!paused);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: paused ? 'resume' : 'pause'
        }),
      });
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  };

  const handleReportIssue = (): void => {
    Alert.alert('Report Issue', 'What issue would you like to report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Vehicle Issue',
        onPress: () => reportIssue('vehicle', 'Issue with vehicle')
      },
      {
        text: 'Customer Issue',
        onPress: () => reportIssue('customer', 'Issue with customer')
      },
      {
        text: 'Other',
        onPress: () => reportIssue('other', 'Other issue')
      }
    ]);
  };

  const reportIssue = async (type: string, description: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE_URL}/provider/job/${bookingId}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueType: type,
          description,
          severity: 'medium'
        }),
      });
      Alert.alert('Success', 'Issue reported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to report issue');
    }
  };

  const handleComplete = (): void => {
    Alert.alert(
      'Complete Service',
      'Have you completed all checklist items and taken required photos?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: () => {
            // Just navigate to next page with all the data - NO API CALL
            router.push({
              pathname: '/(provider)/ServiceComplete',
              params: {
                bookingId,
                earnings: jobData.estimatedEarnings.toString(),
                serviceType: jobData.serviceType,
                customerName: jobData.customerName,
                customerPhone: jobData.customerPhone,
                vehicleType: jobData.vehicleType,
                licensePlate: jobData.licensePlate,
                vehicleModel: jobData.vehicleModel,
                duration: display,
                durationSeconds: seconds.toString(),
              }
            });
          }
        }
      ]
    );
  };

  const formatStartTime = (dateString: string | null): string => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            Alert.alert(
              'Exit Service',
              'Are you sure you want to exit? Service will continue in background.',
              [
                { text: 'Stay', style: 'cancel' },
                { text: 'Exit', onPress: () => router.back() }
              ]
            );
          }} 
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={25} color="#1e2939" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Service In Progress</Text>
          <Text style={styles.headerSub}>{bookingId?.slice(-8) || 'REQ-7891'}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SERVICE ACTIVE BADGE ── */}
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>Service Active</Text>
        </View>

        {/* ── TIMER CARD ── */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>SERVICE DURATION</Text>
          <Text style={styles.timerDisplay}>{display}</Text>
          <Text style={styles.timerStarted}>
            Started at {formatStartTime(jobData.startedAt)}
          </Text>
          <View style={styles.timerBtnRow}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={handlePauseResume}
              activeOpacity={0.8}
            >
              <Feather name={paused ? 'play' : 'pause'} size={15} color="#C8960C" />
              <Text style={styles.pauseBtnText}>{paused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addTimeBtn} 
              onPress={handleAddTime} 
              activeOpacity={0.8}
            >
              <Feather name="clock" size={15} color="#1A1A2E" />
              <Text style={styles.addTimeBtnText}>Add Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SERVICE DETAILS ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SERVICE DETAILS</Text>
          <View style={styles.detailsDivider} />
          {[
            { label: 'Service Type:', value: jobData.serviceType },
            { label: 'Vehicle:', value: jobData.vehicleType },
            { label: 'License Plate:', value: jobData.licensePlate },
            { label: 'Model:', value: jobData.vehicleModel },
          ].map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* ── CUSTOMER CONTACT ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CUSTOMER CONTACT</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={24} color="#9dd7fb" />
            </View>
            <View style={styles.customerText}>
              <Text style={styles.customerName}>{jobData.customerName}</Text>
              <Text style={styles.customerPhone}>{jobData.customerPhone}</Text>
            </View>
          </View>
          <View style={styles.contactBtnRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleCall} activeOpacity={0.7}>
              <Feather name="phone" size={15} color="#9dd7fb" />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            <View style={styles.contactBtnSep} />
            <TouchableOpacity style={styles.contactBtn} onPress={handleMessage} activeOpacity={0.7}>
              <Feather name="message-square" size={15} color="#9dd7fb" />
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PHOTO DOCUMENTATION ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>PHOTO DOCUMENTATION</Text>
          <TouchableOpacity style={styles.photoAddBox} onPress={handleAddPhoto} activeOpacity={0.7}>
            <Feather name="camera" size={28} color="#AAAAAA" />
            <Text style={styles.photoAddText}>Add</Text>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Document before/after and any issues found</Text>
        </View>

        {/* ── SERVICE CHECKLIST ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>SERVICE CHECKLIST</Text>
          {CHECKLIST.map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={styles.checkIconWrap}>
                <Feather name="check-circle" size={20} color="#87cefa" />
              </View>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* ── EARNINGS CARD ── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsLabel}>Estimated Earnings</Text>
              <Text style={styles.earningsValue}>{jobData.estimatedEarnings} BHD</Text>
            </View>
            <View>
              <Text style={styles.earningsStatusLabel}>Status</Text>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>In Progress</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── REPORT ISSUE ── */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Feather name="alert-triangle" size={18} color="#d08700" style={{ marginRight: 8 }} />
            <Text style={styles.reportTitle}>Report an Issue</Text>
          </View>
          <Text style={styles.reportSubText}>
            Found a problem? Report it before completing the service.
          </Text>
          <TouchableOpacity 
            style={styles.reportBtn} 
            onPress={handleReportIssue} 
            activeOpacity={0.8}
          >
            <Text style={styles.reportBtnText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* ── COMPLETE BUTTON ── */}
        <TouchableOpacity 
          style={[styles.completeBtn, loading && styles.buttonDisabled]} 
          onPress={handleComplete} 
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.completeBtnText}>Complete Service</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.completeHint}>Make sure all checklist items are completed</Text>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 29,
    borderBottomWidth: 1.77,
    borderBottomColor: '#d1d5dc',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  headerRight: {
    width: 38,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  // ── Active Badge ──
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00C853',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C853',
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Timer Card ──
  timerCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: '#87cefa',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerStarted: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 6,
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#f0b100',
    backgroundColor: '#eff6ff',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0b100',
    letterSpacing: 0.5,
  },
  addTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    backgroundColor: '#eff6ff',
  },
  addTimeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f0f10',
    letterSpacing: 0.5,
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // ── Service Details ──
  detailsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#555f6f',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: 0.2,
  },

  // ── Customer Contact ──
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: { flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  customerPhone: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    fontWeight: '600',
  },
  contactBtnRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 7,
  },
  contactBtnSep: {
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9dd7fb',
    letterSpacing: 0.3,
  },

  // ── Photo Documentation ──
  photoAddBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    gap: 4,
  },
  photoAddText: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Checklist ──
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkIconWrap: {},
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
    flex: 1,
  },

  // ── Earnings Card ──
  earningsCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
  earningsStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'right',
  },
  inProgressBadge: {
    backgroundColor: '#00C853',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Report Issue ──
  reportCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d08700',
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.3,
  },
  reportSubText: {
    fontSize: 12,
    color: '#d08700',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  reportBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d08700',
    backgroundColor: 'transparent',
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Complete Button ──
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#2e9dd9',
    shadowColor: '#2e9dd9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  completeHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#737a8a',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
import React, { useState, useEffect, useRef } from 'react';
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
  AppState,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles/ServiceInProgressScreenStyles';

const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Timer Hook with Database Save ───────────────────────────────────────────
const useTimer = (initialSeconds: number = 0, bookingId: string) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [paused, setPaused] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [Timer] ${message}`, data || '');
  };

  // Timer increment effect - NO SAVE HERE (only local)
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [paused]);

  // Save timer to database - only called on pause/resume or navigation
  const saveTimerToDatabase = async (action: 'pause' | 'resume' | 'complete'): Promise<boolean> => {
    if (!bookingId) return false;

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('userToken');

      addDebug(`📡 Saving timer: ${seconds}s, action: ${action}`);

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          durationSeconds: seconds,
          paused: action === 'pause' ? true : (action === 'resume' ? false : paused),
          action: action
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        addDebug(`✅ Timer saved: ${seconds}s, action: ${action}`, responseData);
        return true;
      } else {
        addDebug(`⚠️ Failed to save timer: ${response.status}`, responseData);
        return false;
      }
    } catch (error) {
      addDebug('❌ Error saving timer:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced pause/resume with save
  const handlePauseResume = async () => {
    const newPausedState = !paused;
    const action = newPausedState ? 'pause' : 'resume';

    // Update local state first for immediate UI response
    setPaused(newPausedState);

    // Then save to database
    await saveTimerToDatabase(action);
  };

  // Format time
  const format = (s: number): string => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  // Load initial timer from database
  const loadTimerFromDatabase = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      addDebug(`📡 Loading timer for booking: ${bookingId}`);

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.timer) {
          setSeconds(data.timer.durationSeconds || 0);
          setPaused(data.timer.isPaused || false); // Changed from 'paused' to 'isPaused'
          addDebug(`✅ Timer loaded: ${data.timer.durationSeconds}s, paused: ${data.timer.isPaused}`);
        }
      } else {
        addDebug(`⚠️ Failed to load timer: ${response.status}`, data);
      }
    } catch (error) {
      addDebug('❌ Error loading timer:', error);
    }
  };

  return {
    display: format(seconds),
    seconds,
    paused,
    handlePauseResume,
    isSaving,
    loadTimerFromDatabase,
    saveTimerForCompletion: () => saveTimerToDatabase('complete')
  };
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
  status?: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ServiceInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const isMounted = useRef(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [cancellationAcknowledged, setCancellationAcknowledged] = useState(false);
  const [jobData, setJobData] = useState<JobData>({
    serviceType: 'Towing Service',
    vehicleType: 'Sedan',
    licensePlate: 'ABC 1234',
    vehicleModel: 'Toyota Camry 2020',
    customerName: 'Mohammed A.',
    customerPhone: '+973 3XXX XXXX',
    estimatedEarnings: 81,
    startedAt: null,
    status: 'in_progress',
  });

  // Initialize timer with bookingId for database saves
  const {
    display,
    seconds,
    paused,
    handlePauseResume,
    isSaving: timerSaving,
    loadTimerFromDatabase,
    saveTimerForCompletion
  } = useTimer(0, bookingId || '');

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [ServiceInProgress] ${message}`, data || '');
  };

  // Update local storage with current status
  const updateStorageStatus = async (status: string) => {
    try {
      // Update in activeBookings array
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        const bookingIndex = activeBookings.findIndex((b: any) => b.bookingId === bookingId);

        if (bookingIndex >= 0) {
          activeBookings[bookingIndex] = {
            ...activeBookings[bookingIndex],
            status,
            screen: 'ServiceInProgress',
            timestamp: new Date().toISOString(),
          };
          await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
        }
      }

      // Update current booking status
      await AsyncStorage.setItem('currentBookingStatus', status);

      addDebug(`✅ Storage updated with status: ${status}`);
    } catch (error) {
      addDebug('❌ Error updating storage:', error);
    }
  };

  // Mark service as started when screen loads
  const markServiceStarted = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Update local storage first
      await updateStorageStatus('in_progress');

      // Then update backend
      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/status`, {
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

      const data = await response.json();

      if (response.ok) {
        addDebug('✅ Service marked as started', data);
      } else {
        addDebug('⚠️ Failed to mark service started:', { status: response.status, data });
      }
    } catch (error) {
      addDebug('Error marking service started:', error);
    }
  };

  // Check job status from backend
  const checkJobStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId || !isMounted.current) return;

      addDebug('📡 Checking job status...');

      const response = await fetch(`${API_BASE_URL}/provider/job/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && isMounted.current) {
        addDebug(`📊 Job status: ${data.status}`);

        // Check if job is cancelled
        if (data.status === 'cancelled' && !cancellationAcknowledged) {
          handleJobCancelled(data.cancellationReason || 'Customer cancelled the service');
        }

        // Update job details if we have them
        if (data.job) {
          setJobData(prev => ({
            ...prev,
            ...data.job,
            status: data.status,
          }));
        }
      } else {
        addDebug(`⚠️ Status check failed: ${response.status}`, data);
      }
    } catch (error) {
      addDebug('❌ Error checking job status:', error);
    }
  };

  // Handle job cancellation
  const handleJobCancelled = (reason: string) => {
    // Prevent multiple alerts
    if (cancellationAcknowledged) return;

    setCancellationAcknowledged(true);

    // Stop timer if running
    if (!paused) {
      handlePauseResume();
    }

    // Stop status checking
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }

    // Show alert to provider
    Alert.alert(
      'Service Cancelled',
      `The customer has cancelled this service.\n\nReason: ${reason}`,
      [
        {
          text: 'OK',
          onPress: async () => {
            // Clean up storage
            await cleanupBooking();
            // Navigate to home
            router.replace('/(provider)/home');
          }
        }
      ],
      { cancelable: false }
    );
  };

  // Clean up booking from storage
  const cleanupBooking = async () => {
    try {
      // Remove from active bookings
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
      }

      // Clear current booking if it matches
      const currentId = await AsyncStorage.getItem('currentBookingId');
      if (currentId === bookingId) {
        await AsyncStorage.removeItem('currentBookingId');
        await AsyncStorage.removeItem('currentBookingStatus');
      }

      addDebug('✅ Booking cleaned up from storage');
    } catch (error) {
      addDebug('❌ Error cleaning up booking:', error);
    }
  };

  const fetchJobDetails = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !isMounted.current) return;

      addDebug('📡 Fetching job details...');

      const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/active-job`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.job && isMounted.current) {
        setJobData(prev => ({
          ...prev,
          serviceType: data.job.serviceType || prev.serviceType,
          vehicleType: data.job.vehicleType || prev.vehicleType,
          licensePlate: data.job.licensePlate || prev.licensePlate,
          vehicleModel: data.job.vehicleModel || prev.vehicleModel,
          customerName: data.job.customer?.name || prev.customerName,
          customerPhone: data.job.customer?.phone || prev.customerPhone,
          estimatedEarnings: data.job.estimatedEarnings || prev.estimatedEarnings,
          startedAt: data.job.startedAt || prev.startedAt,
          status: data.job.status || prev.status,
        }));
        addDebug('✅ Job details fetched', data.job);
      } else {
        addDebug('⚠️ Failed to fetch job details:', { status: response.status, data });
      }
    } catch (error) {
      addDebug('Error fetching job details:', error);
    }
  };

  // Initialize screen
  useEffect(() => {
    isMounted.current = true;

    if (!bookingId) {
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }

    addDebug('📦 ServiceInProgressScreen mounted with bookingId:', bookingId);

    const initializeScreen = async () => {
      // Load timer from database
      await loadTimerFromDatabase();

      // Mark service as started
      await markServiceStarted();

      // Fetch job details
      await fetchJobDetails();
    };

    initializeScreen();

    // Start status checking (every 10 seconds)
    statusCheckInterval.current = setInterval(() => {
      if (isMounted.current) {
        checkJobStatus();
      }
    }, 10000);

    // Check status immediately
    checkJobStatus();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - check status immediately
        checkJobStatus();
        // Also reload timer in case it was updated elsewhere
        loadTimerFromDatabase();
      }
      appState.current = nextAppState;
    });

    return () => {
      isMounted.current = false;
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
      subscription.remove();

      // Save timer when component unmounts (navigation away)
      if (bookingId) {
        saveTimerForCompletion();
      }

      addDebug('🧹 Cleanup complete');
    };
  }, []);

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
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/status`, {
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

            const data = await response.json();

            if (response.ok) {
              Alert.alert('Success', 'Time extension requested');
            } else {
              Alert.alert('Error', data.message || 'Failed to request time extension');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to request time extension');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
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
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/issues`, {
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

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Issue reported successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to report issue');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to report issue');
    } finally {
      setLoading(false);
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
          onPress: async () => {
            setLoading(true);

            try {
              // Save final timer state before navigating
              await saveTimerForCompletion();

              // Update status in storage
              await updateStorageStatus('completed');

              // Navigate to next page with timer data
              router.push({
                pathname: '/(provider)/ServiceCompletedScreen',
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
                  timerPaused: paused.toString(),
                  timerLastSaved: new Date().toISOString(),
                }
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to complete service');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelService = () => {
    Alert.alert(
      'Cancel Service',
      'Are you sure you want to cancel this service?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${API_BASE_URL}/provider/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'provider_cancelled' }),
              });

              const data = await response.json();

              // Clean up storage
              await cleanupBooking();

              if (response.ok) {
                Alert.alert('Success', data.message || 'Service cancelled');
              }

              // Navigate to home
              router.replace('/(provider)/Home');
            } catch (error) {
              console.log('Cancel API call failed:', error);
              // Still navigate home
              router.replace('/(provider)/Home');
            } finally {
              setLoading(false);
            }
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
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
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

          {/* Timer saving indicator */}
          {timerSaving && (
            <View style={styles.timerSavingIndicator}>
              <ActivityIndicator size="small" color="#87cefa" />
              <Text style={styles.timerSavingText}>Saving...</Text>
            </View>
          )}

          <Text style={styles.timerStarted}>
            Started at {formatStartTime(jobData.startedAt)}
          </Text>
          <View style={styles.timerBtnRow}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={handlePauseResume}
              activeOpacity={0.8}
              disabled={timerSaving}
            >
              <Feather name={paused ? 'play' : 'pause'} size={15} color="#C8960C" />
              <Text style={styles.pauseBtnText}>{paused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={handleAddTime}
              activeOpacity={0.8}
              disabled={loading}
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
            disabled={loading}
          >
            <Text style={styles.reportBtnText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* ── COMPLETE BUTTON ── */}
        <TouchableOpacity
          style={[styles.completeBtn, (loading || timerSaving) && styles.buttonDisabled]}
          onPress={handleComplete}
          activeOpacity={0.85}
          disabled={loading || timerSaving}
        >
          {loading || timerSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.completeBtnText}>Complete Service</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── CANCEL SERVICE LINK ── */}
        <TouchableOpacity
          style={styles.cancelLink}
          onPress={handleCancelService}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.cancelLinkText}>Cancel Service</Text>
        </TouchableOpacity>

        <Text style={styles.completeHint}>Make sure all checklist items are completed</Text>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ChatPopup from './components/ChatPopup';
import { styles } from './styles/ServiceInProgressScreenStyles';

const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// ─── Timer Hook with Continuous Sync (Every 10 seconds) ───────────────────
const useTimer = (initialSeconds: number = 0, bookingId: string) => {
  const [seconds, setSeconds]   = useState<number>(initialSeconds);
  const [paused, setPaused]     = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
 
  // ── THE FIX: keep a ref that always mirrors latest state ─────────────────
  // useEffect closures capture state at creation time (stale closure).
  // The sync interval was always sending the value of `seconds` from when
  // the interval was first set up — i.e. 0 — overwriting real progress.
  const secondsRef = useRef<number>(initialSeconds);
  const pausedRef  = useRef<boolean>(false);
 
  // Keep refs in sync every render
  secondsRef.current = seconds;
  pausedRef.current  = paused;
  // ─────────────────────────────────────────────────────────────────────────
 
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
 
  const log = (msg: string, data?: any) =>
    console.log(`🔍 [Timer] ${msg}`, data ?? '');
 
  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || paused) return;
 
    const interval = setInterval(() => {
      setSeconds(s => s + 1); // updater form — always correct, no closure needed
    }, 1000);
 
    return () => clearInterval(interval);
  }, [paused, isLoaded]);
 
  // ── Backend sync every 10 s ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || paused || !bookingId) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }
 
    log('🔄 Starting 10-second sync');
 
    // Sync immediately when we (re)start
    saveTimerToDatabase('sync');
 
    syncIntervalRef.current = setInterval(() => {
      saveTimerToDatabase('sync');
    }, 10000);
 
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isLoaded, paused, bookingId]);
 
  // ── Core save function — reads from REFS, not state ───────────────────────
  const saveTimerToDatabase = useCallback(
    async (
      action: 'pause' | 'resume' | 'complete' | 'add_time' | 'sync',
      additionalData?: Record<string, any>
    ): Promise<boolean> => {
      if (!bookingId) return false;
 
      // Read from refs so we always get the current value,
      // even when called from inside a setInterval closure.
      const currentSeconds = secondsRef.current;
      const currentPaused  = pausedRef.current;
 
      try {
        setIsSaving(true);
        const token = await AsyncStorage.getItem('userToken');
 
        log(`📡 Syncing — action: ${action}  seconds: ${currentSeconds}  paused: ${currentPaused}`);
 
        const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            durationSeconds: currentSeconds,   // ✅ always live value
            paused: currentPaused,             // ✅ always live value
            action,
            lastUpdated: new Date().toISOString(),
            ...additionalData,
          }),
        });
 
        const responseData = await response.json();
 
        if (response.ok) {
          log(`✅ Synced: ${currentSeconds}s`);
          return true;
        } else {
          log(`⚠️ Sync failed: ${response.status}`, responseData);
          return false;
        }
      } catch (error) {
        log('❌ Sync error:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [bookingId] // stable — reads live values via refs
  );
 
  // ── Pause / Resume ────────────────────────────────────────────────────────
  const handlePauseResume = async () => {
    const newPaused = !pausedRef.current;
    setPaused(newPaused);
    // pausedRef will update next render, but we need it now for the save
    pausedRef.current = newPaused;
    await saveTimerToDatabase(newPaused ? 'pause' : 'resume');
  };
 
  // ── Add time ──────────────────────────────────────────────────────────────
  const addTime = async (minutes: number): Promise<boolean> => {
    const added = minutes * 60;
    setSeconds(s => {
      secondsRef.current = s + added; // keep ref in sync immediately
      return s + added;
    });
    return saveTimerToDatabase('add_time', { addedMinutes: minutes });
  };
 
  // ── Format ────────────────────────────────────────────────────────────────
  const format = (s: number) => {
    const h   = String(Math.floor(s / 3600)).padStart(2, '0');
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };
 
  // ── Load from backend ─────────────────────────────────────────────────────
  const loadTimerFromDatabase = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      log(`📡 Loading timer for booking: ${bookingId}`);
 
      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/timer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
 
      const data = await response.json();
 
      if (response.ok && data.success && data.timer) {
        let serverSeconds = data.timer.durationSeconds || 0;
        const serverPaused  = data.timer.isPaused || false;
        const lastUpdated   = data.timer.lastUpdated
          ? new Date(data.timer.lastUpdated)
          : null;
 
        // If the timer was running when last saved, add elapsed time
        if (!serverPaused && lastUpdated) {
          const elapsedSeconds = Math.floor(
            (Date.now() - lastUpdated.getTime()) / 1000
          );
          if (elapsedSeconds > 0 && elapsedSeconds < 3600) {
            serverSeconds += elapsedSeconds;
            log(`⏱️ Added ${elapsedSeconds}s elapsed since last save`);
          }
        }
 
        setSeconds(serverSeconds);
        setPaused(serverPaused);
        secondsRef.current = serverSeconds; // sync ref immediately
        pausedRef.current  = serverPaused;
 
        log(`✅ Loaded: ${serverSeconds}s  paused: ${serverPaused}`);
      } else {
        log('ℹ️ No existing timer — starting fresh');
        setSeconds(0);
        setPaused(false);
        secondsRef.current = 0;
        pausedRef.current  = false;
        await saveTimerToDatabase('resume');
      }
    } catch (error) {
      log('❌ Load error:', error);
      setSeconds(0);
      setPaused(false);
      secondsRef.current = 0;
      pausedRef.current  = false;
    } finally {
      setIsLoaded(true);
    }
  };
 
  return {
    display:               format(seconds),
    seconds,
    paused,
    isSaving,
    handlePauseResume,
    addTime,
    loadTimerFromDatabase,
    saveTimerForCompletion: () => saveTimerToDatabase('complete'),
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

interface HasMessageResponse {
  success: boolean;
  hasAnyMessage: boolean;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ServiceInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  // Chat state
  const [chatVisible, setChatVisible] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState<boolean>(false);

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
    addTime,
    isSaving: timerSaving,
    loadTimerFromDatabase,
    saveTimerForCompletion
  } = useTimer(0, bookingId || '');

  // Debug logger
  const addDebug = (message: string, data?: any) => {
    console.log(`🔍 [ServiceInProgress] ${message}`, data || '');
  };

  // Check if there are any messages
  const checkForAnyMessage = async () => {
    if (!bookingId || chatVisible) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/chat/${bookingId}/has-message`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data: HasMessageResponse = await response.json();

      if (data.success) {
        setHasNewMessage(data.hasAnyMessage || false);
        if (data.hasAnyMessage) {
          addDebug('📬 There is a message available');
        }
      }
    } catch (error) {
      addDebug('❌ Error checking messages:', error);
    }
  };

  // Handle message button press
  const handleMessage = () => {
    addDebug('💬 Opening chat popup with customer');
    setHasNewMessage(false);
    setChatVisible(true);
  };

  // Handle chat close
  const handleChatClose = () => {
    setChatVisible(false);
    setTimeout(() => {
      checkForAnyMessage();
    }, 500);
  };

  // Update local storage with current status
  const updateStorageStatus = async (status: string) => {
    try {
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        const bookingIndex = activeBookings.findIndex((b: any) => b.bookingId === bookingId);

        if (bookingIndex >= 0) {
          activeBookings[bookingIndex] = {
            ...activeBookings[bookingIndex],
            status,
            screen: status === 'completed_provider' ? 'ServiceCompletedScreen' : 'ServiceInProgress',
            timestamp: new Date().toISOString(),
          };
          await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
        }
      }

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

      await updateStorageStatus('in_progress');

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

        if (data.status === 'cancelled' && !cancellationAcknowledged) {
          handleJobCancelled(data.cancellationReason || 'Customer cancelled the service');
        }

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
    if (cancellationAcknowledged) return;
    setCancellationAcknowledged(true);

    if (!paused) {
      handlePauseResume();
    }

    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }

    Alert.alert(
      'Service Cancelled',
      `The customer has cancelled this service.\n\nReason: ${reason}`,
      [
        {
          text: 'OK',
          onPress: async () => {
            await cleanupBooking();
            router.replace('/(provider)/Home');
          }
        }
      ],
      { cancelable: false }
    );
  };

  // Clean up booking from storage
  const cleanupBooking = async () => {
    try {
      const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
      if (activeBookingsJson) {
        let activeBookings = JSON.parse(activeBookingsJson);
        activeBookings = activeBookings.filter((b: any) => b.bookingId !== bookingId);
        await AsyncStorage.setItem('activeBookings', JSON.stringify(activeBookings));
      }

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

  // Focus effect - reload timer when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        addDebug('📱 Screen focused - reloading timer');
        loadTimerFromDatabase();
        checkJobStatus();
        checkForAnyMessage();
      }
    }, [bookingId])
  );

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
      await loadTimerFromDatabase();
      await markServiceStarted();
      await fetchJobDetails();
      await checkForAnyMessage();
    };

    initializeScreen();

    // Start status checking (every 10 seconds)
    statusCheckInterval.current = setInterval(() => {
      if (isMounted.current) {
        Promise.all([
          checkJobStatus(),
          checkForAnyMessage()
        ]);
      }
    }, 5000);

    checkJobStatus();
    checkForAnyMessage();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        addDebug('📱 App came to foreground - reloading timer');
        checkJobStatus();
        checkForAnyMessage();
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

  const handleAddPhoto = (): void => {
    Alert.alert('Add Photo', 'Camera functionality will be implemented');
  };

  const handleAddTime = (): void => {
    Alert.alert(
      'Add Time',
      'How much additional time do you need?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '+15 minutes',
          onPress: async () => {
            setLoading(true);
            const success = await addTime(15);
            if (success) {
              Alert.alert('Success', '15 minutes added to service time');
            } else {
              Alert.alert('Error', 'Failed to add time. Please try again.');
            }
            setLoading(false);
          }
        },
        {
          text: '+30 minutes',
          onPress: async () => {
            setLoading(true);
            const success = await addTime(30);
            if (success) {
              Alert.alert('Success', '30 minutes added to service time');
            } else {
              Alert.alert('Error', 'Failed to add time. Please try again.');
            }
            setLoading(false);
          }
        },
        {
          text: '+1 hour',
          onPress: async () => {
            setLoading(true);
            const success = await addTime(60);
            if (success) {
              Alert.alert('Success', '1 hour added to service time');
            } else {
              Alert.alert('Error', 'Failed to add time. Please try again.');
            }
            setLoading(false);
          }
        },
        {
          text: 'Custom',
          onPress: () => {
            Alert.alert(
              'Custom Time',
              'Enter custom minutes:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Add 45 min',
                  onPress: async () => {
                    setLoading(true);
                    const success = await addTime(45);
                    if (success) {
                      Alert.alert('Success', '45 minutes added to service time');
                    } else {
                      Alert.alert('Error', 'Failed to add time. Please try again.');
                    }
                    setLoading(false);
                  }
                }
              ]
            );
          }
        }
      ]
    );
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
              addDebug('🟢 STARTING COMPLETE SERVICE FLOW');
              addDebug(`📡 Booking ID: ${bookingId}`);
              addDebug(`📡 Current seconds: ${seconds}`);
              addDebug(`📡 Current paused state: ${paused}`);

              // Save final timer state before completing
              addDebug('💾 Saving timer before completion...');
              await saveTimerForCompletion();
              addDebug('✅ Timer saved successfully');

              const token = await AsyncStorage.getItem('userToken');
              addDebug(`🔑 Token exists: ${!!token}`);

              if (!token) {
                throw new Error('Authentication failed - no token found');
              }

              const url = `${API_BASE_URL}/provider/${bookingId}/status`;
              addDebug(`🌐 Making request to: ${url}`);

              const requestBody = {
                status: 'completed_provider',
                action: 'complete',
                durationSeconds: seconds,
                completedAt: new Date().toISOString()
              };
              addDebug(`📦 Request body:`, requestBody);

              addDebug('📡 Marking service as completed_provider for booking:', bookingId);

              const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              });

              addDebug(`📡 Response status: ${response.status}`);

              const data = await response.json();
              addDebug('📡 Status update response:', {
                status: response.status,
                ok: response.ok,
                data: data
              });

              if (!response.ok) {
                throw new Error(data.message || data.error || `Failed to complete service: ${response.status}`);
              }

              addDebug('✅ Service marked as completed_provider successfully');

              // Update status in storage
              await updateStorageStatus('completed_provider');
              addDebug('💾 Storage updated with completed_provider status');

              addDebug('🚀 Navigating to ServiceCompletedScreen...');

              // Navigate to completion screen
              router.replace({
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
              addDebug('❌ Error completing service:', error);
              addDebug('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to complete service. Please try again.',
                [
                  { text: 'Try Again', style: 'cancel' },
                  {
                    text: 'Go to Home',
                    onPress: async () => {
                      await cleanupBooking();
                      router.replace('/(provider)/Home');
                    }
                  }
                ]
              );
            } finally {
              setLoading(false);
              addDebug('🏁 Complete service flow finished');
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

              await cleanupBooking();

              if (response.ok) {
                Alert.alert('Success', 'Service cancelled');
              }

              router.replace('/(provider)/Home');
            } catch (error) {
              console.log('Cancel API call failed:', error);
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
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>Service Active</Text>
        </View>

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>SERVICE DURATION</Text>
          <Text style={styles.timerDisplay}>{display}</Text>

          {/* {timerSaving && (
            <View style={styles.timerSavingIndicator}>
              <ActivityIndicator size="small" color="#87cefa" />
              <Text style={styles.timerSavingText}>Syncing...</Text>
            </View>
          )} */}

          {/* <Text style={styles.timerStarted}>
            Started at {formatStartTime(jobData.startedAt)}
          </Text> */}
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
              disabled={loading || timerSaving}
            >
              <Feather name="clock" size={15} color="#1A1A2E" />
              <Text style={styles.addTimeBtnText}>Add Time</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <View style={styles.messageIconContainer}>
                <Feather name="message-square" size={15} color="#9dd7fb" />
                {hasNewMessage && <View style={styles.messageDot} />}
              </View>
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>PHOTO DOCUMENTATION</Text>
          <TouchableOpacity style={styles.photoAddBox} onPress={handleAddPhoto} activeOpacity={0.7}>
            <Feather name="camera" size={28} color="#AAAAAA" />
            <Text style={styles.photoAddText}>Add</Text>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Document before/after and any issues found</Text>
        </View>

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

      <ChatPopup
        visible={chatVisible}
        onClose={handleChatClose}
        bookingId={bookingId || ''}
        customerName={jobData.customerName}
        onChatClosed={() => {
          setHasNewMessage(false);
        }}
      />
    </SafeAreaView>
  );
}
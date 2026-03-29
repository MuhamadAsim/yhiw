import { Feather } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from './styles/NewRequestNotificationScreenStyles';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface JobData {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  serviceType: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  distance: string;
  estimatedEarnings: number;
  price: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  timestamp: string;
  description?: string;
  vehicleType?: string;
  vehicleMakeModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleLicensePlate?: string;
  issues?: string[];
  photos?: string[];
}

const NewRequestNotification = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appState = useRef(AppState.currentState);

  // Job Queue State
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Timer State
  const RESPONSE_TIME = 30;
  const [timeLeft, setTimeLeft] = useState(RESPONSE_TIME);
  const [progress] = useState(new Animated.Value(1));

  // Refs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Current job derived from state
  const currentJob = jobs[currentIndex];
  const jobsRemaining = jobs.length - currentIndex - 1;
  const jobsRef = useRef<JobData[]>([]);


  // ------------------ EFFECTS ------------------

  // 1. Parse jobs from params on mount
  useEffect(() => {
    if (params.jobs) {
      try {
        const parsedJobs: JobData[] = JSON.parse(params.jobs as string);
        if (parsedJobs && parsedJobs.length > 0) {
          console.log(`📋 Loaded ${parsedJobs.length} job(s)`);
          setJobs(parsedJobs);
          jobsRef.current = parsedJobs;
          setIsInitialized(true);
        } else {
          console.log('⚠️ No valid jobs, going back');
          router.back();
        }
      } catch (error) {
        console.error('❌ Error parsing jobs:', error);
        router.back();
      }
    } else {
      console.log('⚠️ No jobs param, going back');
      router.back();
    }
  }, [params.jobs]);

  // 2. Setup Timer & Status Check when Current Job Changes
  useEffect(() => {
    if (!isInitialized || !currentJob) return;

    console.log(`🚀 Displaying Job ${currentIndex + 1}/${jobs.length}: ${currentJob.bookingId}`);

    // Reset Timer for new job
    setTimeLeft(RESPONSE_TIME);
    progress.setValue(1);

    // Cleanup previous intervals
    cleanupTimers();

    // Start Countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleJobExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start Progress Animation
    animationRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: RESPONSE_TIME * 1000,
      useNativeDriver: false,
    });
    animationRef.current.start();

    // Start Status Check (every 10s)
    statusCheckRef.current = setInterval(() => {
      checkJobStatus(currentJob.bookingId);
    }, 10000);

    // Cleanup on unmount or index change
    return () => {
      cleanupTimers();
    };
  }, [currentIndex, isInitialized]);


  useEffect(() => {
    return () => {
      // Use ref instead of state
      const markSeen = async () => {
        const seenJobsStr = await AsyncStorage.getItem('seenJobs');
        let seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];
        jobsRef.current.forEach(job => {
          const jobId = job.bookingId || job.id;
          if (jobId && !seenJobs.includes(jobId)) seenJobs.unshift(jobId);
        });
        if (seenJobs.length > 50) seenJobs = seenJobs.slice(0, 50);
        await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
      };
      markSeen();
    };
  }, []);

  // 4. App State Listener (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - timer continues from where it was
        // (State is preserved in React, so timeLeft is accurate)
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ------------------ FUNCTIONS ------------------

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
  };

  // Mark all jobs in the local list as seen
  const markAllJobsAsSeen = async () => {
    try {
      const seenJobsStr = await AsyncStorage.getItem('seenJobs');
      let seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];

      jobs.forEach(job => {
        const jobId = job.bookingId || job.id;
        if (jobId && !seenJobs.includes(jobId)) {
          seenJobs.unshift(jobId);
        }
      });

      if (seenJobs.length > 50) seenJobs = seenJobs.slice(0, 50);
      await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
    } catch (error) {
      console.error('Error marking jobs as seen:', error);
    }
  };

  // Check if job is still available in backend
  const checkJobStatus = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !bookingId) return;

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Job not found, silently skip
        console.log(`❌ Job ${bookingId} not found, skipping`);
        handleNextJob();
        return;
      }

      const data = await response.json();

      // If job is no longer available/pending
      if (data.status !== 'searching' && data.status !== 'pending') {
        console.log(`⚠️ Job ${bookingId} status: ${data.status}, skipping`);
        handleNextJob();
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      // Don't skip on network error, let timer handle it
    }
  };

  // Handle Timer Expiry -> Silent Transition
  const handleJobExpired = () => {
    console.log(`⏰ Job ${currentJob?.bookingId} expired`);
    handleNextJob();
  };

  // Move to next job or exit
  const handleNextJob = () => {
    // Clean up current timers first
    cleanupTimers();

    if (currentIndex < jobs.length - 1) {
      // Move to next job
      setCurrentIndex(prev => prev + 1);
    } else {
      // Last job, go back to home
      router.back();
    }
  };

  // User Actions
  const handleViewFullDetails = () => {
    if (!currentJob) return;

    console.log('🛑 Viewing details, stopping timers');
    cleanupTimers();

    // Navigate to details with the current job's booking ID
    router.push({
      pathname: "/RequestDetailScreen",
      params: {
        bookingId: currentJob.bookingId,
      }
    });
  };

  const handleBackPress = () => {
    console.log('🔙 Back pressed');
    cleanupTimers();
    markAllJobsAsSeen();
    router.back();
  };

  // ------------------ UI HELPERS ------------------

  const getUrgencyBadge = () => {
    if (!currentJob) return null;
    const urgency = currentJob.urgency?.toLowerCase() || 'normal';

    if (urgency === 'urgent' || urgency === 'emergency') {
      return (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>{currentJob.urgency?.toUpperCase() || 'URGENT'}</Text>
        </View>
      );
    }
    return null;
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ------------------ RENDER ------------------

  if (!isInitialized || !currentJob) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          {/* Bell Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="bell" size={48} color="#87CEFA" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>NEW REQUEST!</Text>
          <Text style={styles.subtitle}>A CUSTOMER NEEDS YOUR SERVICE</Text>

          {/* Queue Counter */}
          {jobs.length > 1 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
                {currentIndex + 1} / {jobs.length}
              </Text>
            </View>
          )}

          {/* Service Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>
                {currentJob.serviceType?.toUpperCase() || 'SERVICE'}
              </Text>
              {getUrgencyBadge()}
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PICKUP LOCATION</Text>
                <Text style={styles.infoValue}>{currentJob.pickupLocation}</Text>
              </View>
            </View>

            {/* Price and Distance */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="dollar-sign" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>ESTIMATED</Text>
                  <Text style={styles.detailValue}>{currentJob.price} BHD</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Feather name="navigation" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>DISTANCE</Text>
                  <Text style={styles.detailValue}>{currentJob.distance}</Text>
                </View>
              </View>
            </View>
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

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={handleViewFullDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>VIEW FULL DETAILS</Text>
          </TouchableOpacity>

          {/* Auto-decline message */}
          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

          {/* Queue Waiting Info */}
          {jobsRemaining > 0 && (
            <Text style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
              {jobsRemaining} more request(s) waiting
            </Text>
          )}

          {/* Notification Icon Image */}
          <View style={styles.notificationIconContainer}>
            <Image
              source={require("../../assets/provider/notification.png")}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NewRequestNotification;
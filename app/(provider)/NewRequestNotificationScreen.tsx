import { Feather } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface JobData {
  jobId: string;
  bookingId: string;
  customerName: string;
  serviceType: string;
  pickupLocation: string;
  price: string;
  distance: string;
  urgency: string;
  queueSize?: string;
  isLastInQueue?: string;
}

const NewRequestNotification = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appState = useRef(AppState.currentState);
  const [hasMarkedAsSeen, setHasMarkedAsSeen] = useState(false);

  // Parse the job data from params
  const jobData: JobData = {
    jobId: params.jobId as string || '',
    bookingId: params.bookingId as string || params.jobId as string || '',
    customerName: params.customerName as string || 'Customer',
    serviceType: params.serviceType as string || 'SERVICE',
    pickupLocation: params.pickupLocation as string || 'Pickup location',
    price: params.price as string || params.estimatedEarnings as string || '0',
    distance: params.distance as string || '2.5 km',
    urgency: params.urgency as string || 'normal',
    queueSize: params.queueSize as string || '0',
    isLastInQueue: params.isLastInQueue as string || 'true',
  };

  const RESPONSE_TIME = 30; // 30 seconds total response time

  // Always start from 30 seconds when landing on page
  const [timeLeft, setTimeLeft] = useState(RESPONSE_TIME);
  const [progress] = useState(new Animated.Value(1)); // Start at 100%
  const [isExpired, setIsExpired] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - restart timer with remaining time
        if (!isExpired && timeLeft > 0) {
          restartTimer(timeLeft);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isExpired, timeLeft]);

  // Mark job as seen when component unmounts (leaving page)
  useEffect(() => {
    return () => {
      // Only mark as seen when actually leaving the page (not when expired)
      if (!isExpired && !hasMarkedAsSeen) {
        markJobAsSeen();
      }

      // Clear all timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
      }
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
    };
  }, [isExpired, hasMarkedAsSeen]);

  // Handle job expiration - SILENTLY hide without alert
  const handleExpire = (silent: boolean = false) => {
    if (isExpired) return;

    console.log(`⏰ Job expired (${silent ? 'silent' : 'timer'})`);
    setIsExpired(true);

    // Mark as seen when expired
    if (!hasMarkedAsSeen) {
      markJobAsSeen();
      setHasMarkedAsSeen(true);
    }

    // Only show alert if it's a timer expiration (not status check)
    if (!silent && !hasShownExpiredAlert) {
      setHasShownExpiredAlert(true);
      Alert.alert(
        'Request Expired',
        'The time to respond to this request has expired.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } else {
      // Silent expiration - just go back without alert
      router.back();
    }
  };

  // Restart timer with new time
  const restartTimer = (remainingTime: number) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Start new countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleExpire(false); // Timer expiration - show alert
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start new animation
    progress.setValue(remainingTime / RESPONSE_TIME);
    animationRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: remainingTime * 1000,
      useNativeDriver: false,
    });
    animationRef.current.start();
  };

  // Mark job as seen in AsyncStorage (only called when leaving or expired)
  const markJobAsSeen = async () => {
    try {
      const bookingId = jobData.bookingId;
      if (!bookingId) return;

      const seenJobsStr = await AsyncStorage.getItem('seenJobs');
      let seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];

      // Add to seen jobs if not already there
      if (!seenJobs.includes(bookingId)) {
        seenJobs.unshift(bookingId); // Add to beginning

        // Keep only last 20
        if (seenJobs.length > 20) {
          seenJobs = seenJobs.slice(0, 20);
        }

        await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
        console.log(`✅ Job ${bookingId} marked as seen. Total seen: ${seenJobs.length}`);
        setHasMarkedAsSeen(true);
      }
    } catch (error) {
      console.error('Error marking job as seen:', error);
    }
  };

  // Check if job still exists in backend - SILENTLY handle
  const checkJobStatus = async () => {
    // Don't check if already expired
    if (isExpired) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const bookingId = jobData.bookingId;
      if (!bookingId) {
        console.log('❌ No booking ID');
        return;
      }

      console.log(`🔍 Checking job status for ${bookingId}...`);

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 API Response status: ${response.status}`);

      if (!response.ok) {
        console.log('❌ Job not found - silently removing');
        handleExpire(true); // Silent expiration
        return;
      }

      const data = await response.json();
      console.log('📦 Job status data:', data);

      // If job status is 'accepted' or other non-available status, silently hide
      // Don't interfere with provider experience
      if (data.status !== 'searching' && data.status !== 'pending') {
        console.log(`❌ Job no longer available - status: ${data.status} - silently hiding`);
        handleExpire(true); // Silent expiration
        return;
      } else {
        console.log(`✅ Job still available - status: ${data.status}`);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      // Don't expire on network errors - let the timer handle it
    }
  };

  // Check status periodically - but SILENTLY handle
  useEffect(() => {
    // Wait 2 seconds before first status check
    initialDelayRef.current = setTimeout(() => {
      checkJobStatus();
    }, 2000);

    statusCheckRef.current = setInterval(checkJobStatus, 10000); // Check every 10 seconds

    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
      }
    };
  }, []);

  // Initial timer setup - starts from 30 seconds when page loads
  useEffect(() => {
    console.log('⏱️ Timer started: 30 seconds');

    // Start timer from 30 seconds
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        console.log(`⏱️ Time left: ${prev - 1}s`);
        if (prev <= 1) {
          console.log('⏱️ Timer reached zero');
          clearInterval(timerRef.current!);
          handleExpire(false); // Timer expiration - show alert
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start progress animation from 100% to 0% over 30 seconds
    animationRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: RESPONSE_TIME * 1000,
      useNativeDriver: false,
    });
    animationRef.current.start();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []); // Empty dependency array - runs once when component mounts

  const handleViewFullDetails = () => {
    if (isExpired) {
      Alert.alert('Expired', 'This job is no longer available.');
      return;
    }

    // CRITICAL: Stop ALL timers and polling before navigating
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    // Clear status check interval
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }

    // Clear initial delay
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }

    console.log('🛑 All timers stopped - navigating to details');

    // Navigate to details page
    router.push({
      pathname: "/RequestDetailScreen",
      params: {
        bookingId: jobData.bookingId,
      }
    });
  };

  const handleBackPress = () => {
    // Mark as seen when manually going back
    if (!isExpired && !hasMarkedAsSeen) {
      markJobAsSeen();
    }
    router.back();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Format urgency display
  const getUrgencyBadge = () => {
    const urgency = jobData.urgency?.toLowerCase() || 'normal';

    if (urgency === 'urgent' || urgency === 'emergency') {
      return (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>{jobData.urgency?.toUpperCase() || 'URGENT'}</Text>
        </View>
      );
    }
    return null;
  };

  // If expired, don't render anything
  if (isExpired) {
    return null;
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

          {/* Service Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>
                {jobData.serviceType?.toUpperCase() || 'SERVICE'}
              </Text>
              {getUrgencyBadge()}
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PICKUP LOCATION</Text>
                <Text style={styles.infoValue}>{jobData.pickupLocation}</Text>
              </View>
            </View>

            {/* Price and Distance */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="dollar-sign" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>ESTIMATED</Text>
                  <Text style={styles.detailValue}>{jobData.price} BHD</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Feather name="navigation" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>DISTANCE</Text>
                  <Text style={styles.detailValue}>{jobData.distance}</Text>
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
            style={[styles.detailsButton, isExpired && styles.disabledButton]}
            onPress={handleViewFullDetails}
            disabled={isExpired}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>VIEW FULL DETAILS</Text>
          </TouchableOpacity>

          {/* Auto-decline message */}
          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

          {/* Queue info */}
          {parseInt(jobData.queueSize || '0') > 0 && (
            <Text style={styles.queueText}>
              {parseInt(jobData.isLastInQueue || 'false')
                ? 'Last request in queue'
                : `${jobData.queueSize} more request(s) in queue`}
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 32,
    marginTop: 20,
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
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  serviceCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 20,
    marginBottom: 20,
    position: "relative",
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
    backgroundColor: "#ffe2e2",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  urgentText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
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
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
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
  detailsButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#53b2e6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  autoDeclineText: {
    fontSize: 11,
    color: "#6A7282",
    letterSpacing: 0,
    textAlign: "center",
    marginBottom: 16,
  },
  queueText: {
    fontSize: 12,
    color: "#68bdee",
    marginBottom: 16,
    textAlign: "center",
  },
  notificationIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 35.92,
    height: 26.98,
    marginTop: 8,
  },
  notificationIcon: {
    width: 35,
    height: 35,
    opacity: 0.3,
    resizeMode: "contain",
  },
});

export default NewRequestNotification;
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [timeLeft, setTimeLeft] = useState(30);
  const [progress] = useState(new Animated.Value(1));
  const [isExpired, setIsExpired] = useState(false);

  // Mark job as seen and check status on mount
  useEffect(() => {
    markJobAsSeen();
    checkJobStatus();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true); // Mark as expired but don't navigate
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Progress bar animation
    Animated.timing(progress, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, []);

  // Mark job as seen in AsyncStorage
  const markJobAsSeen = async () => {
    try {
      const bookingId = jobData.bookingId;
      if (!bookingId) return;

      const seenJobsStr = await AsyncStorage.getItem('seenJobs');
      let seenJobs: string[] = seenJobsStr ? JSON.parse(seenJobsStr) : [];

      // Add to seen jobs if not already there
      if (!seenJobs.includes(bookingId)) {
        seenJobs.unshift(bookingId); // Add to beginning

        // Keep only last 10
        if (seenJobs.length > 10) {
          seenJobs = seenJobs.slice(0, 10);
        }

        await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
        console.log(`✅ Job ${bookingId} marked as seen. Total seen: ${seenJobs.length}`);
      }
    } catch (error) {
      console.error('Error marking job as seen:', error);
    }
  };

  // Check if job still exists in backend
  const checkJobStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const bookingId = jobData.bookingId;
      if (!bookingId) return;

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If job not found, it's expired
        setIsExpired(true);
        return;
      }

      const data = await response.json();

      // If job status is not 'searching' or 'pending', it's no longer available
      if (data.status !== 'searching' && data.status !== 'pending') {
        setIsExpired(true);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      // On error, still show the job but let timer handle it
    }
  };

  const handleViewFullDetails = () => {
    if (isExpired) {
      Alert.alert('Expired', 'This job is no longer available.');
      return;
    }

    // Navigate to next page with ONLY bookingId
    router.push({
      pathname: "/RequestDetailScreen",
      params: {
        bookingId: jobData.bookingId,
      }
    });
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
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
          <View style={[styles.serviceCard, isExpired && styles.expiredCard]}>
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

            {/* Expired overlay */}
            {isExpired && (
              <View style={styles.expiredOverlay}>
                <Text style={styles.expiredText}>EXPIRED</Text>
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

          <TouchableOpacity
            style={[styles.detailsButton, isExpired && styles.buttonDisabled]}
            onPress={handleViewFullDetails}
            disabled={isExpired}
          >
            <Text style={styles.detailsButtonText}>VIEW FULL DETAILS</Text>
          </TouchableOpacity>

          {/* Auto-decline message */}
          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

          {/* Queue info */}
          {parseInt(jobData.queueSize || '0') > 0 && !isExpired && (
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
  },

  // Icon
  iconContainer: {
    marginBottom: 32,
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

  // Title
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

  // Service Card
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
  expiredCard: {
    opacity: 0.6,
  },
  expiredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  expiredText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#EF4444",
    transform: [{ rotate: "-15deg" }],
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

  // Info Row
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

  // Details Row
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

  // Timer Card
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

  // Details Button
  detailsButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#53b2e6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  // Auto-decline text
  autoDeclineText: {
    fontSize: 11,
    color: "#6A7282",
    letterSpacing: 0,
    textAlign: "center",
    marginBottom: 16,
  },

  // Queue text
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
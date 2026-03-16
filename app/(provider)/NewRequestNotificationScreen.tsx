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
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from './styles/NewRequestNotificationScreenStyles';

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

interface QueueData {
  jobs: JobData[];
  currentIndex: number;
  totalJobs: number;
}

const NewRequestNotification = () => {

  const router = useRouter();
  const params = useLocalSearchParams();
  const appState = useRef(AppState.currentState);

  const RESPONSE_TIME = 30;

  const [queueData, setQueueData] = useState<QueueData>({
    jobs: [],
    currentIndex: 0,
    totalJobs: 0
  });

  const [currentJob, setCurrentJob] = useState<JobData | null>(null);
  const [timeLeft, setTimeLeft] = useState(RESPONSE_TIME);
  const [progress] = useState(new Animated.Value(1));
  const [isExpired, setIsExpired] = useState(false);
  const [hasMarkedAsSeen, setHasMarkedAsSeen] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);

  // guards
  const isNavigatedAwayRef = useRef(false);
  const expireLockRef = useRef(false);

  /* ------------------ QUEUE INITIALIZATION ------------------ */

  useEffect(() => {

    isNavigatedAwayRef.current = false;

    const initializeQueue = () => {
      try {

        if (params.remainingJobs) {

          const parsedQueue = JSON.parse(params.remainingJobs as string);
          setQueueData(parsedQueue);
          setCurrentJob(parsedQueue.jobs[0] || null);

        } else {

          const singleJob: JobData = {
            jobId: params.jobId as string || '',
            bookingId: params.bookingId as string || '',
            customerName: params.customerName as string || 'Customer',
            serviceType: params.serviceType as string || 'SERVICE',
            pickupLocation: params.pickupLocation as string || 'Pickup location',
            price: params.price as string || '0',
            distance: params.distance as string || '2.5 km',
            urgency: params.urgency as string || 'normal',
          };

          const newQueue: QueueData = {
            jobs: [singleJob],
            currentIndex: 0,
            totalJobs: 1
          };

          setQueueData(newQueue);
          setCurrentJob(singleJob);
        }

      } catch (err) {
        console.error("Queue parse error", err);
      }
    };

    initializeQueue();

  }, [params]);

  /* ------------------ TIMER CLEANUP ------------------ */

  const clearAllTimers = () => {

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

    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }

    progress.setValue(1);
  };

  /* ------------------ TIMER START ------------------ */

  const startTimer = () => {

    timerRef.current = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    animationRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: RESPONSE_TIME * 1000,
      useNativeDriver: false,
    });

    animationRef.current.start();
  };

  /* ------------------ TIMER OWNER ------------------ */

  useEffect(() => {

    if (currentJob && !isExpired) {

      expireLockRef.current = false;

      setTimeLeft(RESPONSE_TIME);
      progress.setValue(1);
      startTimer();
    }

    return () => clearAllTimers();

  }, [currentJob]);

  /* ------------------ TIMER EXPIRATION ------------------ */

  useEffect(() => {

    if (timeLeft === 0 && !isExpired && currentJob && !isNavigatedAwayRef.current) {
      handleExpire(false);
    }

  }, [timeLeft]);

  /* ------------------ EXPIRE HANDLER ------------------ */

  const handleExpire = (silent = false) => {

    if (
      expireLockRef.current ||
      isExpired ||
      !currentJob ||
      isNavigatedAwayRef.current
    ) return;

    expireLockRef.current = true;

    console.log("⏰ Job expired:", currentJob.bookingId);

    setIsExpired(true);

    if (!hasMarkedAsSeen) {
      markJobAsSeen(currentJob.bookingId);
      setHasMarkedAsSeen(true);
    }

    if (!silent && !hasShownExpiredAlert) {

      setHasShownExpiredAlert(true);

      Alert.alert(
        "Request Expired",
        "The time to respond to this request has expired.",
        [{ text: "OK", onPress: moveToNextJob }]
      );

    } else {
      moveToNextJob();
    }
  };

  /* ------------------ MOVE TO NEXT JOB ------------------ */

  const moveToNextJob = () => {

    if (isNavigatedAwayRef.current) return;

    clearAllTimers();

    const remainingJobs = queueData.jobs.filter(
      (_, i) => i !== queueData.currentIndex
    );

    if (remainingJobs.length > 0) {

      const newQueue = {
        jobs: remainingJobs,
        currentIndex: 0,
        totalJobs: remainingJobs.length
      };

      setQueueData(newQueue);
      setCurrentJob(remainingJobs[0]);

      setIsExpired(false);
      setHasMarkedAsSeen(false);
      setHasShownExpiredAlert(false);

    } else {

      router.back();

    }
  };

  /* ------------------ MARK JOB SEEN ------------------ */

  const markJobAsSeen = async (bookingId: string) => {

    try {

      const seenJobsStr = await AsyncStorage.getItem('seenJobs');
      let seenJobs = seenJobsStr ? JSON.parse(seenJobsStr) : [];

      if (!seenJobs.includes(bookingId)) {

        seenJobs.unshift(bookingId);

        if (seenJobs.length > 20)
          seenJobs = seenJobs.slice(0, 20);

        await AsyncStorage.setItem('seenJobs', JSON.stringify(seenJobs));
      }

    } catch (err) {
      console.log("Seen job error", err);
    }
  };

  /* ------------------ POLLING ------------------ */

  const checkJobStatus = async () => {

    if (isExpired || !currentJob || isNavigatedAwayRef.current) return;

    try {

      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(
        `${API_BASE_URL}/jobs/${currentJob.bookingId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        handleExpire(true);
        return;
      }

      const data = await res.json();

      if (data.status !== "searching" && data.status !== "pending") {
        handleExpire(true);
      }

    } catch (err) {
      console.log("Status check error", err);
    }
  };

  useEffect(() => {

    if (!currentJob) return;

    initialDelayRef.current = setTimeout(checkJobStatus, 2000);
    statusCheckRef.current = setInterval(checkJobStatus, 10000);

    return () => {
      if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };

  }, [currentJob]);

  /* ------------------ NAVIGATION ------------------ */

  const handleViewFullDetails = () => {

    if (isExpired || !currentJob) return;

    isNavigatedAwayRef.current = true;

    clearAllTimers();

    const remainingJobs = queueData.jobs.filter(
      (_, i) => i !== queueData.currentIndex
    );

    router.push({
      pathname: "/RequestDetailScreen",
      params: {
        bookingId: currentJob.bookingId,
        remainingJobs: JSON.stringify({
          jobs: remainingJobs,
          currentIndex: 0,
          totalJobs: remainingJobs.length
        })
      }
    });
  };

  const handleBackPress = () => {

    isNavigatedAwayRef.current = true;

    clearAllTimers();

    router.back();
  };

  if (!currentJob || isExpired) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  /* ------------------ UI ------------------ */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.container}>

          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="bell" size={48} color="#87CEFA" />
            </View>
          </View>

          <Text style={styles.title}>NEW REQUEST!</Text>
          <Text style={styles.subtitle}>A CUSTOMER NEEDS YOUR SERVICE</Text>

          <View style={styles.serviceCard}>

            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>
                {currentJob.serviceType?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PICKUP LOCATION</Text>
                <Text style={styles.infoValue}>{currentJob.pickupLocation}</Text>
              </View>
            </View>

          </View>

          <View style={styles.timerCard}>

            <View style={styles.timerHeader}>
              <Feather name="clock" size={20} color="#EF4444" />
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
          >
            <Text style={styles.detailsButtonText}>
              VIEW FULL DETAILS
            </Text>
          </TouchableOpacity>

          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

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
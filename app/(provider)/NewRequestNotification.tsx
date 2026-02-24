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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const NewRequestNotification = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(27);
  const [progress] = useState(new Animated.Value(1));

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Progress bar animation
    Animated.timing(progress, {
      toValue: 0,
      duration: 27000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>TOWING SERVICE</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color="#87CEFA" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PICKUP LOCATION</Text>
                <Text style={styles.infoValue}>Main Street, Manama</Text>
              </View>
            </View>

            {/* Price and Distance */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="dollar-sign" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>ESTIMATED</Text>
                  <Text style={styles.detailValue}>95 BHD</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Feather name="navigation" size={16} color="#87CEFA" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>DISTANCE</Text>
                  <Text style={styles.detailValue}>2.5 KM AWAY</Text>
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
            onPress={() => router.push("/RequestDetailPage")}
          >
            <Text style={styles.detailsButtonText}>VIEW FULL DETAILS</Text>
          </TouchableOpacity>

          {/* Auto-decline message */}
          <Text style={styles.autoDeclineText}>
            REQUEST WILL AUTO-DECLINE IN {timeLeft} SECONDS
          </Text>

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
  },
  urgentBadge: {
    backgroundColor: "#ffe2e2",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
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

  // Auto-decline text
  autoDeclineText: {
    fontSize: 11,
    color: "#6A7282",
    letterSpacing: 0,
    textAlign: "center",
    marginBottom: 32,
  },

  notificationIconContainer: {
    flexDirection: "row", // Horizontal flow
    alignItems: "center",
    justifyContent: "center",
    gap: 4, // 3.99px ≈ 4
    width: 35.92,
    height: 26.98,
  },

  notificationIcon: {
    width: 35, // icon ko container ke height ke equal
    height: 35,
    opacity: 0.3,
    resizeMode: "contain",
  },
});

export default NewRequestNotification;

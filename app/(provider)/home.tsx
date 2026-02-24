import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from 'expo-router';
import Sidebar from "./components/sidebar";

const HomePage = () => {
  const router = useRouter(); 
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const openSidebar = () => {
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Sidebar visible={sidebarVisible} onClose={closeSidebar} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Container */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.providerIdContainer}>
            <Text style={styles.providerIdLabel}>PROVIDER ID</Text>
            <Text style={styles.providerIdValue}>PRV-001234</Text>
          </View>

         <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/NewRequestNotification')}
          >
            <Feather name="bell" size={24} color="#000" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Container */}
        <View style={styles.profileContainer}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={require("../../assets/provider/avatar.png")} // Use your uploaded image or default silhouette
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>AHMED AL-KHALIFA</Text>
              <View style={styles.profileStats}>
                <Ionicons name="star" size={13} color="#000" />
                <Text style={styles.rating}>4.8</Text>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.jobCount}>234 Jobs</Text>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.verified}>VERIFIED</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Status Container */}
        <View style={styles.statusContainer}>
          <View style={styles.statusLeft}>
            <View style={styles.statusIndicator} />
            <View>
              <Text style={styles.statusText}>OFFLINE</Text>
              <Text style={styles.statusSubtext}>NOT ACCEPTING</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.toggleSwitch}>
            <View style={styles.toggleThumb} />
          </TouchableOpacity>
        </View>

        {/* Performance Container */}
        <View style={styles.performanceContainer}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>TODAY'S PERFORMANCE</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.performanceCards}>
            <View style={styles.performanceCard}>
              <Feather name="dollar-sign" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>245</Text>
              <Text style={styles.performanceLabel}>BHD</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="trending-up" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>8</Text>
              <Text style={styles.performanceLabel}>JOBS</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="clock" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>5.5</Text>
              <Text style={styles.performanceLabel}>HOURS</Text>
            </View>

            <View style={styles.performanceCard}>
              <Feather name="star" size={24} color="#87CEFA" />
              <Text style={styles.performanceValue}>4.8</Text>
              <Text style={styles.performanceLabel}>RATING</Text>
            </View>
          </View>
        </View>

        {/* Recent Jobs Container */}
        <View style={styles.recentJobsContainer}>
          <View style={styles.recentJobsHeader}>
            <Text style={styles.recentJobsTitle}>RECENT JOBS</Text>
            <TouchableOpacity>
              <Text style={styles.historyText}>HISTORY</Text>
            </TouchableOpacity>
          </View>

          {/* Job Card 1 */}
          <View style={styles.jobCard}>
            <View style={styles.jobCardContent}>
              <View>
                <Text style={styles.jobTitle}>TOWING SERVICE</Text>
                <Text style={styles.jobTime}>2 HOURS AGO</Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobPrice}>75</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>COMPLETED</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Job Card 2 */}
          <View style={styles.jobCard}>
            <View style={styles.jobCardContent}>
              <View>
                <Text style={styles.jobTitle}>BATTERY JUMP</Text>
                <Text style={styles.jobTime}>4 HOURS AGO</Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobPrice}>35</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>COMPLETED</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Job Card 3 */}
          <View style={styles.jobCard}>
            <View style={styles.jobCardContent}>
              <View>
                <Text style={styles.jobTitle}>FUEL DELIVERY</Text>
                <Text style={styles.jobTime}>6 HOURS AGO</Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobPrice}>25</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>COMPLETED</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <Feather name="map-pin" size={20} color="#000" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>CURRENT LOCATION</Text>
              <Text style={styles.locationAddress}>
                Al Seef District, Manama
              </Text>
              <TouchableOpacity>
                <Text style={styles.updateLocationText}>UPDATE LOCATION</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>VIEW EARNINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>MY SCHEDULE</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header Container
  headerContainer: {
    paddingTop: 35,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  providerIdContainer: {
    alignItems: "center",
  },
  providerIdLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  providerIdValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Profile Container
  profileContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    // borderBottomWidth: 1,
    // borderBottomColor: '#d1d5dc',
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F9FAFB", // light gray background like your image
    borderWidth: 2,
    borderColor: "#87CEFA", // light blue border
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: {
    width: 36, // adjust as needed to fit inside the circle
    height: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  rating: {
    fontSize: 13,
    color: "#000",
    marginLeft: 4,
    marginRight: 4,
    fontWeight: "600",
  },
  plus: {
    fontSize: 10,
    color: "#9CA3AF",
    marginHorizontal: 2, // IMAGE me spacing zyada hai
    fontWeight: "400",
  },
  jobCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  verified: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#d1d5dc",
    justifyContent: "center",
    alignItems: "center",
  },

  // Status Container
  statusContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D1D5DB",
    marginRight: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.3,
  },
  statusSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "#FFFFFF",
  },

  // Performance Container
  performanceContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },
  viewAllText: {
    fontSize: 13,
    color: "#87CEFA",
    fontWeight: "600",
    letterSpacing: 0,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  performanceCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  performanceCard: {
    width: "24%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    letterSpacing: 0,
  },

  // Recent Jobs Container
  recentJobsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.77,
    borderBottomColor: "#d1d5dc",
  },
  recentJobsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentJobsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },
  historyText: {
    fontSize: 13,
    color: "#87CEFA",
    fontWeight: "600",
    letterSpacing: 0,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  jobCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.15,
  },
  jobTime: {
    fontSize: 12,
    color: "#87CEFA",
    fontWeight: "500",
    letterSpacing: 0,
  },
  jobRight: {
    alignItems: "flex-end",
  },
  jobPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    letterSpacing: -0.15,
  },
  completedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "700",
    letterSpacing: 0,
  },
  locationCard: {
    backgroundColor: "#e2f5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 16,
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a0a0a",
    marginBottom: 4,
    letterSpacing: -0.15,
  },
  locationAddress: {
    fontSize: 13,
    color: "#4a5565",
    marginBottom: 8,
  },
  updateLocationText: {
    fontFamily: Platform.select({
      ios: "Copperplate", // iOS only
      android: "serif", // fallback
      web: "serif",
    }),
    fontSize: 12,
    fontWeight: "400", // Regular
    lineHeight: 16,
    letterSpacing: 0,
    color: "#4a5565",
    // textAlign: "center",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },

  // Bottom Buttons
  bottomButtons: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#87cefa",
    letterSpacing: -0.15,
  },
});

export default HomePage;

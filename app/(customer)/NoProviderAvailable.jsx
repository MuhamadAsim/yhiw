import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NoProvidersAvailableScreen() {
  const router = useRouter();

  const handleSchedule = () => {
    Alert.alert(
      "Schedule Service",
      "Opening scheduler...",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Schedule", onPress: () => router.push("/(customer)/ScheduleServices") }
      ]
    );
  };

  const handleViewAllServices = () => {
    router.push("/(customer)/PopularServices");
  };

  const handleGoHome = () => {
    router.replace("/(customer)/Home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#3c3c3c" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle" size={64} color="#f0b100" />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Providers Available</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          All service providers are currently busy.{"\n"}
          Please try again in a few minutes or{"\n"}
          schedule for later.
        </Text>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.scheduleBtn}
            onPress={handleSchedule}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#68bdee', '#4a9fd6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.scheduleBtnText}>Schedule Service</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={handleViewAllServices}
            activeOpacity={0.8}
          >
            <Ionicons name="apps-outline" size={18} color="#68bdee" style={styles.btnIcon} />
            <Text style={styles.viewAllBtnText}>View All Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color="#8c8c8c" style={styles.btnIcon} />
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>

        {/* High Demand Card */}
        <View style={styles.demandCard}>
          <View style={styles.demandHeader}>
            <Ionicons name="time-outline" size={18} color="#f0b100" />
            <Text style={styles.demandTitle}>High Demand Period</Text>
          </View>
          <Text style={styles.demandText}>
            We're experiencing high demand.{"\n"}
            Average wait time is currently 25-30{"\n"}
            minutes.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEF9EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#f0b100",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3c3c3c",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  description: {
    fontSize: 15,
    color: "#8c8c8c",
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 32,
  },
  btnGroup: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  scheduleBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#68bdee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  scheduleBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#68bdee",
    backgroundColor: "#FFFFFF",
  },
  viewAllBtnText: {
    color: "#68bdee",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#FFFFFF",
  },
  homeBtnText: {
    color: "#8c8c8c",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  btnIcon: {
    marginRight: 8,
  },
  demandCard: {
    width: "100%",
    backgroundColor: "#FEF9EC",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f0b100",
    padding: 16,
  },
  demandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  demandTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f0b100",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  demandText: {
    fontSize: 13,
    color: "#f0b100",
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
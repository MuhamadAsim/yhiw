import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function NoProvidersAvailableScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reason = params.reason as string || 'timeout';

  const handleViewAllServices = () => {
    // Go to PopularServices
    router.replace("/(customer)/PopularServices");
  };

  const handleGoHome = () => {
    // Go to Home
    router.replace("/(customer)/Home");
  };

  const handleBack = () => {
    // Back button goes to PopularServices
    router.replace("/(customer)/PopularServices");
  };

  // Determine which icon to show based on reason
  const getIconName = () => {
    switch(reason) {
      case 'no_providers':
        return "people-outline";
      case 'cancelled':
        return "close-circle-outline";
      case 'timeout':
      default:
        return "alert-circle";
    }
  };

  // Determine title based on reason
  const getTitle = () => {
    switch(reason) {
      case 'no_providers':
        return 'No Providers Available';
      case 'cancelled':
        return 'Search Cancelled';
      case 'timeout':
      default:
        return 'No Provider Found';
    }
  };

  // Determine description based on reason
  const getDescription = () => {
    switch(reason) {
      case 'no_providers':
        return "All service providers are currently busy. Please try again in a few minutes.";
      case 'cancelled':
        return "Your provider search was cancelled. Please try again or choose a different service.";
      case 'timeout':
      default:
        return "We couldn't find a provider within the expected time. Please try again.";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>
        {/* Back Button - Goes to PopularServices */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#3c3c3c" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons 
            name={getIconName()} 
            size={64} 
            color="#f0b100" 
          />
        </View>

        {/* Title - Dynamic based on reason */}
        <Text style={styles.title}>
          {getTitle()}
        </Text>
        
        {/* Description - Dynamic based on reason */}
        <Text style={styles.description}>
          {getDescription()}
        </Text>

        {/* Buttons - Only Two Buttons */}
        <View style={styles.btnGroup}>
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
            Average wait time is currently 5-10{"\n"}
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
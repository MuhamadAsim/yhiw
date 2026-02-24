import Feather from "@expo/vector-icons/Feather";
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
  const handleSchedule = () =>
    Alert.alert("Schedule Service", "Opening scheduler...");
  // const handleViewAll = () => Alert.alert('View All Services', 'Opening services list...');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>
        {/* ── TOP SPACER ── */}
        <View style={styles.topSpacer} />

        {/* ── ICON ── */}
        <View style={styles.iconCircle}>
          <Feather name="alert-circle" size={52} color="#f0b100" />
        </View>

        {/* ── TITLE + DESCRIPTION ── */}
        <Text style={styles.title}>No Providers Available</Text>
        <Text style={styles.description}>
          All service providers are currently busy.{"\n"}
          Please try again in a few minutes or{"\n"}
          schedule for later.
        </Text>

        {/* ── BUTTONS ── */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.scheduleBtn}
            onPress={handleSchedule}
            activeOpacity={0.85}
          >
            <Feather
              name="refresh-cw"
              size={17}
              color="#fff"
              style={styles.btnIcon}
            />
            <Text style={styles.scheduleBtnText}>Schedule Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather
              name="home"
              size={17}
              color="#555"
              style={styles.btnIcon}
            />
            <Text style={styles.viewAllBtnText}>View All Services</Text>
          </TouchableOpacity>
        </View>

        {/* ── MIDDLE SPACER ── */}
        <View style={styles.middleSpacer} />

        {/* ── HIGH DEMAND CARD ── */}
        <View style={styles.demandCard}>
          <View style={styles.demandHeader}>
            <Feather
              name="alert-circle"
              size={17}
              color="#C8960C"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.demandTitle}>High Demand Period</Text>
          </View>
          <Text style={styles.demandText}>
            We're experiencing high demand.{"\n"}
            Average wait time is currently 25-30{"\n"}
            minutes.
          </Text>
        </View>

        {/* ── BOTTOM SPACER ── */}
        <View style={styles.bottomSpacer} />
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
  },

  topSpacer: { flex: 1.2 },
  middleSpacer: { flex: 1.4 },
  bottomSpacer: { flex: 0.5 },

  // ── Icon ──
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEF9EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },

  // ── Title ──
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: 0.3,
    marginBottom: 14,
    textAlign: "center",
  },

  // ── Description ──
  description: {
    fontSize: 14,
    color: "#6a7282",
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 32,
  },

  // ── Buttons ──
  btnGroup: {
    width: "100%",
    gap: 12,
  },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: "#45a9e1",
    shadowColor: "#45a9e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  viewAllBtnText: {
    color: "#6a7282",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginRight: 9,
  },

  // ── High Demand Card ──
  demandCard: {
    width: "100%",
    backgroundColor: "#FFFDE7",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#f0b100",
    padding: 16,
  },
  demandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  demandTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f0b100",
    letterSpacing: 0.3,
  },
  demandText: {
    fontSize: 13,
    color: "#f0b100",
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});

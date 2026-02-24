import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
// import { router } from 'expo-router';
import { useRouter } from 'expo-router';

export default function NoRequestsAvailableScreen() {
   const router = useRouter();
  const handleRefresh = () => Alert.alert('Refresh', 'Checking for new requests...');
  // const handleBackToHome = () => router.replace('./HomePage');
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>

        {/* ── TOP SPACER ── */}
        <View style={styles.topSpacer} />

        {/* ── ICON ── */}
        <View style={styles.iconCircle}>
          <Feather name="search" size={52} color="#E53935" />
        </View>

        {/* ── TITLE ── */}
        <Text style={styles.title}>No Requests Available</Text>

        {/* ── DESCRIPTION ── */}
        <Text style={styles.description}>
          There are currently no service requests in{'\n'}
          your area. Stay online to receive new{'\n'}
          requests.
        </Text>

        {/* ── BUTTONS ── */}
        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.85}>
            <Feather name="refresh-cw" size={17} color="#fff" style={styles.btnIcon} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="home" size={17} color="#555" style={styles.btnIcon} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  topSpacer: { flex: 1.4 },
  bottomSpacer: { flex: 2 },

  // ── Icon ──
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  // ── Title ──
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.3,
    marginBottom: 14,
    textAlign: 'center',
  },

  // ── Description ──
  description: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 32,
  },

  // ── Buttons ──
  btnGroup: {
    width: '100%',
    gap: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: '#45a9e1',
    shadowColor: '#45a9e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  homeBtnText: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginRight: 9,
  },
});
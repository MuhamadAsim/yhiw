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
  // const handleBackToHome = () => router.replace('./Home');
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

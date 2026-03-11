import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { styles } from './styles/CancelRequestScreenStyles';

export default function CancelRequestScreen() {
  const router = useRouter();

  const handleYesCancel = () => Alert.alert('Cancelled', 'Your request has been cancelled.');
  const handleNoKeep = () => router.back();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={18} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CANCEL REQUEST</Text>
      </View>

      <View style={styles.divider} />

      {/* ── BODY ── */}
      <View style={styles.body}>

        {/* Warning Icon */}
        <View style={styles.iconWrap}>
          <Feather name="alert-triangle" size={40} color="#E53935" />
        </View>

        {/* Title */}
        <Text style={styles.title}>ARE YOU SURE?</Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>CURRENT ORDER STATUS</Text>
          <Text style={styles.infoCardValue}>Provider accepted and is on the way</Text>

          <View style={styles.infoCardDivider} />

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>CANCELLATION FEE:</Text>
            <Text style={styles.feeValue}>50%</Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Based on the current order status, cancellation{'\n'}fee: 50% of the total service value.
        </Text>

      </View>

      {/* ── FOOTER BUTTONS ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleYesCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>YES, CANCEL REQUEST</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.keepBtn} onPress={handleNoKeep} activeOpacity={0.85}>
          <Text style={styles.keepBtnText}>NO, KEEP REQUEST</Text>
          <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

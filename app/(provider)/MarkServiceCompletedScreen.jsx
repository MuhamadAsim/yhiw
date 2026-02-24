import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MarkServiceCompletedScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [ratingChecked, setRatingChecked] = useState(false);

  const handleViewAll = () => Alert.alert('Photos', 'Viewing all photos...');
  const handleConfirm = () => {
    if (!paymentChecked) {
      Alert.alert('Payment Required', 'Please confirm payment received to complete.');
      return;
    }
    Alert.alert('Confirmed', 'Service marked as completed!');
  };
  // const handleBackToHome = () => Alert.alert('Home', 'Going back to home...');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SUCCESS ICON + TITLE ── */}
        <View style={styles.heroSection}>
          <View style={styles.successCircle}>
            <Feather name="check-circle" size={48} color="#00C853" />
          </View>
          <Text style={styles.heroTitle}>Service Completed!</Text>
          <Text style={styles.heroSub}>Finalize the details below</Text>
        </View>

        {/* ── SERVICE SUMMARY ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE SUMMARY</Text>
          <View style={styles.cardDivider} />
          {[
            { label: 'Service ID:', value: 'REQ-7891', bold: true },
            { label: 'Service Type:', value: 'Towing Service', bold: false },
            { label: 'Customer:', value: 'Mohammed A.', bold: false },
            { label: 'Duration:', value: '35 minutes', bold: false },
            { label: 'Completed:', value: '3:20 PM', bold: false },
          ].map((row, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={[styles.detailValue, row.bold && styles.detailValueBold]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── PAYMENT DETAILS ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAYMENT DETAILS</Text>
          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Service Fee:</Text>
            <Text style={styles.detailValue}>95 BHD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform Fee (15%):</Text>
            <Text style={styles.detailValue}>-14 BHD</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Your Earnings:</Text>
            <Text style={styles.earningsValue}>81 BHD</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Payment Received Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPaymentChecked(p => !p)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, paymentChecked && styles.checkboxChecked]}>
              {paymentChecked && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.checkboxTextBlock}>
              <Text style={styles.checkboxTitle}>Payment Received</Text>
              <Text style={styles.checkboxSub}>Confirm you received 95 BHD in cash</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CUSTOMER CONFIRMATION ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CUSTOMER CONFIRMATION</Text>
          <View style={styles.confirmInfoBox}>
            <View style={[styles.checkbox, styles.checkboxChecked]}>
              <Feather name="check" size={12} color="#fff" />
            </View>
            <View style={styles.checkboxTextBlock}>
              <Text style={styles.checkboxTitle}>Customer Approved Service</Text>
              <Text style={styles.checkboxSub}>Customer confirms service completion</Text>
            </View>
          </View>
        </View>

        {/* ── SERVICE PHOTOS ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE PHOTOS</Text>
          <View style={styles.photosHeader}>
            <View style={styles.photosHeaderLeft}>
              <Feather name="camera" size={15} color="#888" />
              <Text style={styles.photosCount}>4 photos uploaded</Text>
            </View>
            <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photosGrid}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.photoThumb}>
                <Feather name="camera" size={22} color="#C0D8EC" />
              </View>
            ))}
          </View>
        </View>

        {/* ── SERVICE NOTES ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SERVICE NOTES (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about the service, issues"
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
          <Text style={styles.notesHint}>These notes will be visible to the customer</Text>
        </View>

        {/* ── CUSTOMER RATING ── */}
        <View style={styles.card}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingStar}>☆</Text>
            <Text style={styles.ratingTitle}>Customer Rating</Text>
          </View>
          <Text style={styles.ratingSubText}>
            Customer will be asked to rate your service after completion
          </Text>
          <TouchableOpacity
            style={styles.ratingCheckRow}
            onPress={() => setRatingChecked(p => !p)}
            activeOpacity={0.8}
          >
            <View style={[styles.squareCheckbox, ratingChecked && styles.squareCheckboxChecked]}>
              {ratingChecked && <Feather name="check" size={11} color="#fff" />}
            </View>
            <Text style={styles.ratingCheckLabel}>Rating notification will be sent</Text>
          </TouchableOpacity>
        </View>

        {/* ── TODAY'S EARNINGS ── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsCardTopRow}>
            <View>
              <Text style={styles.earningsCardLabel}>Today's Total Earnings</Text>
              <Text style={styles.earningsCardValue}>326 BHD</Text>
            </View>
            <View style={styles.earningsCardRight}>
              <Text style={styles.earningsCardLabel}>Jobs Completed</Text>
              <Text style={styles.earningsCardJobs}>9</Text>
            </View>
          </View>
          <Text style={styles.earningsCardMotivation}>Great work! You're having a productive day.</Text>
        </View>

        {/* ── CONFIRM BUTTON ── */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Feather name="check-circle" size={17} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.confirmBtnText}>Confirm & Complete</Text>
        </TouchableOpacity>

        {/* ── PAYMENT WARNING ── */}
        <Text style={styles.paymentWarning}>Please confirm payment received to complete</Text>

        {/* ── BACK TO HOME ── */}
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="home" size={15} color="#555" style={{ marginRight: 7 }} />
          <Text style={styles.backHomeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  successCircle: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },

  // ── Detail Rows ──
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  detailValueBold: {
    fontWeight: '900',
  },

  // ── Earnings Row ──
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
  },

  // ── Checkbox Row ──
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EBF5FD',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  confirmInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EBF5FD',
    borderRadius: 10,
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
  },
  checkboxTextBlock: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  checkboxSub: {
    fontSize: 12,
    color: '#5B9BD5',
    fontWeight: '500',
    lineHeight: 17,
  },

  // ── Photos ──
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  photosCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B9BD5',
    letterSpacing: 0.3,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    borderWidth: 1,
    borderColor: '#BDE0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Notes ──
  notesInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1A1A2E',
    minHeight: 90,
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
    marginBottom: 8,
  },
  notesHint: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Rating ──
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingStar: {
    fontSize: 20,
    color: '#F5B800',
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  ratingSubText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 12,
  },
  ratingCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  squareCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCheckboxChecked: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
  },
  ratingCheckLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },

  // ── Today's Earnings Card ──
  earningsCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 16,
  },
  earningsCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  earningsCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  earningsCardValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  earningsCardRight: {
    alignItems: 'flex-end',
  },
  earningsCardJobs: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'right',
  },
  earningsCardMotivation: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Confirm Button ──
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#1b93d1',
    shadowColor: '#1b93d1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Payment Warning ──
  paymentWarning: {
    textAlign: 'center',
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: -4,
  },

  // ── Back to Home ──
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backHomeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 0.5,
  },
});
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function NavigateToCustomerScreen() {
  const router = useRouter();

  const handleCompass = () => Alert.alert('Compass', 'Recenter map');
  const handleCall = () => Alert.alert('Call', 'Calling Mohammed A...');
  const handleMessage = () => Alert.alert('Message', 'Opening message...');
  
  const handleArrived = () => {
    // Navigate to Service In Progress screen when arrived
    router.push('/ServiceInProgressScreen');
  };
  
  const handleReportIssue = () => Alert.alert('Report Issue', 'Opening report form...');
  const handleCancelService = () => Alert.alert('Cancel Service', 'Are you sure you want to cancel?');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F4FB" />

      {/* ── MAP AREA ── */}
      <View style={styles.mapArea}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={25} color="#1e2939" />
        </TouchableOpacity>

        {/* Compass Button */}
        <TouchableOpacity style={styles.compassBtn} onPress={handleCompass} activeOpacity={0.8}>
          <Feather name="navigation" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        {/* Navigation Card */}
        <View style={styles.navCard}>
          <View style={styles.navCardTop}>
            <View style={styles.navIconWrap}>
              <Feather name="navigation" size={18} color="#8fd1fb" />
            </View>
            <View style={styles.navCardTextBlock}>
              <Text style={styles.navCardLabel}>NEXT TURN</Text>
              <Text style={styles.navCardTurn}>Turn right on Main Street</Text>
            </View>
          </View>
          <View style={styles.navCardDivider} />
          <View style={styles.navCardBottom}>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>ETA</Text>
              <Text style={styles.navStatValue}>8 minutes</Text>
            </View>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>DISTANCE</Text>
              <Text style={styles.navStatValue}>2.5 km</Text>
            </View>
          </View>
        </View>

        {/* Navigation Active Badge */}
        <View style={styles.navActiveBadge}>
          <View style={styles.navActiveTextBlock}>
            <Text style={styles.navActiveTitle}>Navigation Active</Text>
            <Text style={styles.navActiveSub}>Following GPS route</Text>
          </View>
          <View style={styles.navActiveIcon}>
            <Feather name="map-pin" size={20} color="#ffffff" />
          </View>
        </View>

      </View>

      {/* ── BOTTOM SHEET ── */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetSectionLabel}>CUSTOMER DETAILS</Text>

          {/* Customer Card */}
          <View style={styles.customerCard}>
            {/* Customer Info */}
            <View style={styles.customerInfo}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={26} color="#8fd1fb" />
              </View>
              <View style={styles.customerText}>
                <Text style={styles.customerName}>Mohammed A.</Text>
                <Text style={styles.customerRating}>⭐ 4.5 Customer Rating</Text>
              </View>
            </View>

            <View style={styles.customerDivider} />

            {/* Call / Message Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.7}>
                <Feather name="phone" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <View style={styles.actionBtnDivider} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleMessage} activeOpacity={0.7}>
                <Feather name="message-square" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pickup Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color="#5B9BD5" style={styles.locationIcon} />
              <View>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationValue}>Main Street, Manama, near City Mall</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsRow}>
              <View style={styles.tipsIconWrap}>
                <Feather name="alert-circle" size={18} color="#5B9BD5" />
              </View>
              <View style={styles.tipsTextBlock}>
                <Text style={styles.tipsTitle}>Navigation Tips</Text>
                <Text style={styles.tipsText}>
                  Located in underground parking.{'\n'}
                  Call customer upon arrival for exact location.
                </Text>
              </View>
            </View>
          </View>

          {/* Arrived Button */}
          <TouchableOpacity style={styles.arrivedBtn} onPress={handleArrived} activeOpacity={0.85}>
            <Feather name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.arrivedBtnText}>I've Arrived at Location</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={handleReportIssue} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Report Issue</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>+</Text>
            <TouchableOpacity onPress={handleCancelService} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Cancel Service</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D6EAF8',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    position: 'relative',
    minHeight: 260,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 27,
    left: 16,
     width: 45,
     height: 45,
     borderRadius: 10,
     borderWidth: 1.5,
     borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
  },
  compassBtn: {
    position: 'absolute',
    top: 27,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  navCard: {
    position: 'absolute',
    top: 88,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
     borderWidth: 1.5,
  borderColor: '#87cefa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  navCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardTextBlock: {
    flex: 1,
  },
  navCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1,
    marginBottom: 2,
  },
  navCardTurn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  navCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  navCardBottom: {
    flexDirection: 'row',
    gap: 24,
  },
  navCardStat: {
    flexDirection: 'column',
  },
  navStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7d8492',
    letterSpacing: 1,
  },
  navStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  navActiveBadge: {
    position: 'absolute',
    bottom: 24,
    left: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  navActiveTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  navActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#737a8a',
    letterSpacing: 0.3,
  },
  navActiveSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  navActiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#87cefa',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: '62%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  customerRating: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  customerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 7,
  },
  actionBtnDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8fd1fb',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  tipsCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
    padding: 14,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipsIconWrap: {
    marginTop: 1,
  },
  tipsTextBlock: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E86C1',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#5B9BD5',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#1d94d2',
    shadowColor: '#1d94d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  arrivedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
  footerDot: {
    fontSize: 14,
    color: '#6a7282',
  },
});
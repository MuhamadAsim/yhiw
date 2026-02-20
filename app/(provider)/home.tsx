import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const providerHomePage = () => {
  const [isAccepting, setIsAccepting] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.providerIdContainer}>
          <Text style={styles.providerIdLabel}>PROVIDER ID</Text>
          <Text style={styles.providerId}>PRV-001234</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color="#87cefa" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>AHMED AL-KHALIFA</Text>
              <View style={styles.statsRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>4.8</Text>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.jobCount}>234 Jobs</Text>
                <Text style={styles.statDivider}>•</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Status Toggle */}
        <View style={styles.statusContainer}>
          <View>
            <Text style={styles.statusLabel}>OFFLINE</Text>
            <Text style={styles.statusSubtext}>NOT ACCEPTING</Text>
          </View>
          <Switch
            value={isAccepting}
            onValueChange={setIsAccepting}
            trackColor={{ false: '#D0D0D0', true: '#87cefa' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Today's Performance */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TODAY'S PERFORMANCE</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllButton}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.performanceGrid}>
        <View style={styles.performanceCard}>
          <Ionicons name="add-circle-outline" size={24} color="#87cefa" />
          <Text style={styles.performanceValue}>245</Text>
          <Text style={styles.performanceLabel}>KM</Text>
        </View>

        <View style={styles.performanceCard}>
          <Ionicons name="trending-up-outline" size={24} color="#87cefa" />
          <Text style={styles.performanceValue}>8</Text>
          <Text style={styles.performanceLabel}>JOBS</Text>
        </View>

        <View style={styles.performanceCard}>
          <Ionicons name="time-outline" size={24} color="#87cefa" />
          <Text style={styles.performanceValue}>5.5</Text>
          <Text style={styles.performanceLabel}>HOURS</Text>
        </View>

        <View style={styles.performanceCard}>
          <Ionicons name="star-outline" size={24} color="#87cefa" />
          <Text style={styles.performanceValue}>4.8</Text>
          <Text style={styles.performanceLabel}>RATING</Text>
        </View>
      </View>

      {/* Recent Jobs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT JOBS</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllButton}>HISTORY</Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <View style={styles.jobsList}>
        {/* Towing Service */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View>
              <Text style={styles.jobTitle}>TOWING SERVICE</Text>
              <Text style={styles.jobTime}>2 HOURS AGO</Text>
            </View>
            <View style={styles.jobPriceContainer}>
              <Text style={styles.jobPrice}>75</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>COMPLETED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Battery Jump */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View>
              <Text style={styles.jobTitle}>BATTERY JUMP</Text>
              <Text style={styles.jobTime}>5 HOURS AGO</Text>
            </View>
            <View style={styles.jobPriceContainer}>
              <Text style={styles.jobPrice}>35</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>COMPLETED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fuel Delivery */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View>
              <Text style={styles.jobTitle}>FUEL DELIVERY</Text>
              <Text style={styles.jobTime}>8 HOURS AGO</Text>
            </View>
            <View style={styles.jobPriceContainer}>
              <Text style={styles.jobPrice}>25</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>COMPLETED</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Current Location */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={20} color="#87cefa" />
          <Text style={styles.locationTitle}>CURRENT LOCATION</Text>
        </View>
        <Text style={styles.locationAddress}>AL SEEF DISTRICT, MANAMA</Text>
        <TouchableOpacity>
          <Text style={styles.updateLocationButton}>UPDATE LOCATION</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.earningsButton}>
          <Text style={styles.earningsButtonText}>VIEW EARNINGS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleButton}>
          <Text style={styles.scheduleButtonText}>MY SCHEDULE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  providerIdContainer: {
    alignItems: 'center',
  },
  providerIdLabel: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  providerId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.5,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  statDivider: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  jobCount: {
    fontSize: 13,
    color: '#666',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },
  statusSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  viewAllButton: {
    fontSize: 11,
    color: '#87cefa',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#fff',
    width: (width - 50) / 4,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  performanceLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  jobsList: {
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  jobTime: {
    fontSize: 11,
    color: '#87cefa',
    letterSpacing: 0.3,
  },
  jobPriceContainer: {
    alignItems: 'flex-end',
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  updateLocationButton: {
    fontSize: 11,
    color: '#87cefa',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  earningsButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#87cefa',
  },
  earningsButtonText: {
    color: '#87cefa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scheduleButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default providerHomePage;
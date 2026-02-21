
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

const ServiceInProgressScreen = () => {
  const [duration, setDuration] = useState('18:24');

  const handleCall = () => {
    console.log('Call provider');
  };

  const handleMessage = () => {
    console.log('Message provider');
  };

  const handleMarkComplete = () => {
    console.log('Mark as complete');
  };

  const handleReportIssue = () => {
    console.log('Report issue');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.clockIconContainer}>
            <View style={styles.clockIconOuter}>
              <Ionicons name="time-outline" size={40} color="#68bdee" />
            </View>
          </View>
          <Text style={styles.title}>Service In Progress</Text>
          <Text style={styles.subtitle}>Your service has started</Text>
        </View>

        {/* Duration Card */}
        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>DURATION</Text>
          <Text style={styles.durationTime}>{duration}</Text>
          <Text style={styles.startedTime}>Started at 2:45 PM</Text>
        </View>

        {/* Provider Card - Added light black border */}
        <View style={[styles.providerCard, styles.cardWithBorder]}>
          <View style={styles.providerHeader}>
            <View style={styles.providerTextContainer}>
              <Text style={styles.providerLabel}>Provider</Text>
              <Text style={styles.providerName}>Ahmed Al-Khalifa</Text>
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={28} color="#68bdee" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#68bdee" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#68bdee" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card - Added light black border */}
        <View style={[styles.detailsCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>Quick Tow (Flatbed)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>SUV</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>23 Main Street, Manama</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination</Text>
            <Text style={styles.detailValue}>Bahrain</Text>
          </View>
        </View>

        {/* Progress Card - Added light black border */}
        <View style={[styles.progressCard, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>PROGRESS</Text>

          {/* Progress Item 1 - Completed */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconCompleted}>
              <View style={styles.progressDotCompleted} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextCompleted}>Provider Arrived</Text>
              <Text style={styles.progressTimeCompleted}>2:45 PM</Text>
            </View>
          </View>

          {/* Progress Item 2 - Completed */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconCompleted}>
              <View style={styles.progressDotCompleted} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextCompleted}>Service Started</Text>
              <Text style={styles.progressTimeCompleted}>2 min ago</Text>
            </View>
          </View>

          {/* Progress Item 3 - Active */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconActive}>
              <View style={styles.progressDotActive} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextActive}>Service In Progress</Text>
              <Text style={styles.progressTimeActive}>Currently working...</Text>
            </View>
          </View>

          {/* Progress Item 4 - Inactive */}
          <View style={styles.progressItem}>
            <View style={styles.progressIconInactive}>
              <View style={styles.progressDotInactive} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextInactive}>Service Complete</Text>
            </View>
          </View>
        </View>

        {/* Service Update Card */}
        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#68bdee" />
            <Text style={styles.updateTitle}>Service Update</Text>
          </View>
          <Text style={styles.updateText}>
            The provider is currently working on your quick tow (flatbed). You'll be
            notified when the service is complete.
          </Text>
        </View>

        {/* Estimated Cost Card - Added light black border */}
        <View style={[styles.costCard, styles.cardWithBorder]}>
          <View style={styles.costRow}>
            <View>
              <Text style={styles.costLabel}>Estimated Cost</Text>
              <Text style={styles.costNote}>Final cost may vary</Text>
            </View>
            <Text style={styles.costValue}>99.75 BHD</Text>
          </View>
        </View>

        {/* Add some spacing at the bottom of scroll content */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons Footer */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleMarkComplete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#68bdee', '#4a9fd6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.completeButtonText}>
              Mark as Complete (For Demo)
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleReportIssue}
          activeOpacity={0.7}
        >
          <Text style={styles.reportButtonText}>Report An Issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingTop: height * 0.04,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  clockIconContainer: {
    marginBottom: 15,
  },
  clockIconOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Math.min(20, height * 0.026),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(12, height * 0.015),
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  durationCard: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  durationLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  durationTime: {
    fontSize: 48,
    color: '#68bdee',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 2,
  },
  startedTime: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0', // Light black border
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  providerTextContainer: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  progressIconCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressIconInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTextCompleted: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressTimeCompleted: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  progressTextActive: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressTimeActive: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  progressTextInactive: {
    fontSize: 14,
    color: '#d0d0d0',
    fontWeight: '500',
  },
  updateCard: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  updateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  updateText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: '#5c5c5c',
    fontWeight: '500',
    marginBottom: 4,
  },
  costNote: {
    fontSize: 10,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  costValue: {
    fontSize: 24,
    color: '#68bdee',
    fontWeight: 'bold',
  },
  // Bottom Container Styles (Footer)
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  completeButton: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ServiceInProgressScreen;
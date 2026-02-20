import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
interface ServiceTimeOption {
  id: string;
  icon: any;
  title: string;
  description: string;
}

const ScheduleServiceScreen = () => {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<string>('schedule_later');

  const serviceTimeOptions: ServiceTimeOption[] = [
    {
      id: 'right_now',
      icon: require('../../assets/customer/right_now.png'),
      title: 'Right Now',
      description: 'ASAP (15-20 min)',
    },
    {
      id: 'schedule_later',
      icon: require('../../assets/customer/sec_later.png'),
      title: 'Schedule Later',
      description: 'Pick date & time',
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    console.log('Continue pressed');
    // Navigate to price summary
  };

  const handleSelectTime = (timeId: string) => {
    setSelectedTime(timeId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image
            source={require('../../assets/customer/back_button.png')}
            style={styles.backButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Schedule Service</Text>
          <Text style={styles.headerSubtitle}>Step 7 of 10</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '70%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When do you need service?</Text>

          <View style={styles.timeOptionsContainer}>
            {serviceTimeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeOptionCard,
                  selectedTime === option.id && styles.timeOptionCardSelected,
                ]}
                onPress={() => handleSelectTime(option.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.timeIconContainer,
                    selectedTime === option.id && styles.timeIconContainerSelected,
                  ]}
                >
                  <Image
                    source={option.icon}
                    style={styles.timeIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.timeOptionTitle}>{option.title}</Text>
                <Text style={styles.timeOptionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Arrival Time */}
        <View style={styles.estimatedTimeBox}>
          <View style={styles.estimatedTimeHeader}>
            <Ionicons name="time-outline" size={24} color="#68bdee" />
            <Text style={styles.estimatedTimeTitle}>
              Estimated Arrival Time
            </Text>
          </View>
          <Text style={styles.estimatedTimeDescription}>
            Based on current availability and your location
          </Text>
          <View style={styles.waitTimeContainer}>
            <View style={styles.waitTimeBadge}>
              <Text style={styles.waitTimeNumber}>15</Text>
            </View>
            <Text style={styles.waitTimeText}>minutes average wait time</Text>
          </View>
        </View>

        {/* Service Hours */}
        <View style={styles.serviceHoursCard}>
          <Text style={styles.serviceHoursTitle}>Service Hours</Text>

          <View style={styles.hoursRow}>
            <Text style={styles.dayText}>Monday - Friday</Text>
            <Text style={styles.hoursText}>8:00 AM - 9:00 PM</Text>
          </View>

          <View style={styles.hoursRow}>
            <Text style={styles.dayText}>Saturday</Text>
            <Text style={styles.hoursText}>8:00 AM - 6:00 PM</Text>
          </View>

          <View style={styles.hoursRow}>
            <Text style={styles.dayText}>Sunday</Text>
            <Text style={styles.closedText}>Closed</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.emergencyNote}>
            Emergency services available 24/7 with additional fees
          </Text>
        </View>

        {/* Rescheduling Policy */}
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>Rescheduling Policy</Text>
          <Text style={styles.policyText}>
            You can reschedule or cancel your appointment free of charge up to 2
            hours before the scheduled time. Late cancellations may incur a fee.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continue to Price Summary
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonImage: {
    width: 46,
    height: 46,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#68bdee',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  timeOptionCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#e3f5ff', // Light blue background
  },
  timeOptionCardSelected: {
    borderColor: '#3c3c3c',
    borderWidth: 3,
  },
  timeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    // Removed white background - now transparent to show the card's background
    backgroundColor: 'transparent', // Changed from '#FFFFFF' to 'transparent'
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeIconContainerSelected: {
    backgroundColor: 'transparent', // Changed from '#FFFFFF' to 'transparent'
  },
  timeIcon: {
    width: 40,
    height: 40,
    // Removed tintColor to preserve original icon colors
  },
  timeOptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  timeOptionDescription: {
    fontSize: 10,
    color: '#5c5c5c',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estimatedTimeBox: {
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
  },
  estimatedTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  estimatedTimeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estimatedTimeDescription: {
    fontSize: 12,
    color: '#5c5c5c',
    marginBottom: 15,
    lineHeight: 18,
  },
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waitTimeBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitTimeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#68bdee',
  },
  waitTimeText: {
    fontSize: 12,
    color: '#3c3c3c',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  serviceHoursCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3c3c3c',
  },
  serviceHoursTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dayText: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  closedText: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  emergencyNote: {
    fontSize: 11,
    color: '#8c8c8c',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  policyBox: {
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  policyText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
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
  continueButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ScheduleServiceScreen;
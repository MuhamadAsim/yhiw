import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Type definitions
interface ServiceTimeOption {
  id: string;
  icon: any;
  title: string;
  description: string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

const ScheduleServiceScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedTime, setSelectedTime] = useState<string>('right_now');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(false);

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely parse JSON from params
  const getParsedArray = (param: string | string[] | undefined): any[] => {
    const value = getStringParam(param);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  // Get service info
  const serviceId = getStringParam(params.serviceId);
  const serviceName = getStringParam(params.serviceName) || 'Quick Tow (Flatbed)';
  const servicePrice = getStringParam(params.servicePrice) || '75 BHD';
  const serviceCategory = getStringParam(params.serviceCategory) || 'Towing';
  
  // Check if this is Car Rental
  const isCarRental = serviceId === '11';

  // Get all data from previous screens
  const pickupAddress = getStringParam(params.pickupAddress);
  const pickupLat = getStringParam(params.pickupLat);
  const pickupLng = getStringParam(params.pickupLng);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const dropoffLat = getStringParam(params.dropoffLat);
  const dropoffLng = getStringParam(params.dropoffLng);
  
  // Vehicle data
  const vehicleType = getStringParam(params.vehicleType);
  const makeModel = getStringParam(params.makeModel);
  const year = getStringParam(params.year);
  const color = getStringParam(params.color);
  const licensePlate = getStringParam(params.licensePlate);
  const selectedVehicle = getStringParam(params.selectedVehicle);
  
  // Contact data
  const fullName = getStringParam(params.fullName);
  const phoneNumber = getStringParam(params.phoneNumber);
  const email = getStringParam(params.email);
  const emergencyContact = getStringParam(params.emergencyContact);
  const saveVehicle = getStringParam(params.saveVehicle) === 'true';
  
  // NEW FIELDS from VehicleContactInfo
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);
  
  // Additional details data
  const urgency = getStringParam(params.urgency) || 'moderate';
  const issues = getParsedArray(params.issues);
  const description = getStringParam(params.description);
  const photos = getParsedArray(params.photos);
  const hasInsurance = getStringParam(params.hasInsurance) === 'true';
  const needSpecificTruck = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications = getStringParam(params.hasModifications) === 'true';
  const needMultilingual = getStringParam(params.needMultilingual) === 'true';
  
  // Location skipped flag
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

  // Mock time slots for the next 7 days
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 21; // 9 PM
    
    for (let hour = startHour; hour <= endHour; hour += 2) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      // Random availability for demo
      const available = Math.random() > 0.3;
      slots.push({
        id: `${date.toDateString()}-${timeString}`,
        time: timeString,
        available,
      });
    }
    return slots;
  };

  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>(
    generateTimeSlots(new Date())
  );

  useEffect(() => {
    // For Car Rental, force "Schedule Later" selection
    if (isCarRental) {
      setSelectedTime('schedule_later');
    }
  }, [isCarRental]);

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
    // Validate for Car Rental
    if (isCarRental) {
      if (!selectedDate) {
        Alert.alert('Required', 'Please select a date for your rental');
        return;
      }
      if (!selectedTimeSlot) {
        Alert.alert('Required', 'Please select a time slot');
        return;
      }
    }

    // Navigate to price summary screen with ALL collected data
    router.push({
      pathname: '/(customer)/PriceSummary',
      params: {
        // Location data
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        
        // Service data
        serviceId,
        serviceName,
        servicePrice,
        serviceCategory,
        
        // Vehicle data
        vehicleType,
        makeModel,
        year,
        color,
        licensePlate,
        selectedVehicle,
        
        // Contact data
        fullName,
        phoneNumber,
        email,
        emergencyContact,
        saveVehicle: String(saveVehicle),
        
        // NEW FIELDS from VehicleContactInfo
        licenseFront,
        licenseBack,
        fuelType,
        partDescription,
        
        // Additional details
        urgency,
        issues: JSON.stringify(issues),
        description,
        photos: JSON.stringify(photos),
        hasInsurance: String(hasInsurance),
        needSpecificTruck: String(needSpecificTruck),
        hasModifications: String(hasModifications),
        needMultilingual: String(needMultilingual),
        
        // Location skipped flag
        locationSkipped: String(locationSkipped),
        
        // Schedule data
        serviceTime: selectedTime,
        scheduledDate: isCarRental ? selectedDate.toISOString() : '',
        scheduledTimeSlot: isCarRental ? selectedTimeSlot : '',
      }
    });
  };

  const handleSelectTime = (timeId: string) => {
    // For Car Rental, prevent selecting "Right Now"
    if (isCarRental && timeId === 'right_now') {
      Alert.alert(
        'Not Available', 
        'Car rental requires advance scheduling. Please select a date and time.'
      );
      return;
    }
    setSelectedTime(timeId);
    if (timeId === 'schedule_later') {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setAvailableTimeSlots(generateTimeSlots(date));
      setShowTimeSlots(true);
    }
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedTimeSlot(slot.time);
      setShowTimeSlots(false);
    } else {
      Alert.alert('Not Available', 'This time slot is not available. Please select another.');
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get step number based on service
  const getStepNumber = () => {
    if (isCarRental) return 5; // Location (1) → Vehicle+License (2) → Additional (3) → Schedule (4) → Price Summary (5)
    return 4; // Normal flow: Location (1) → Vehicle (2) → Additional (3) → Schedule (4)
  };

  // Get total steps
  const getTotalSteps = () => {
    return 7;
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const step = getStepNumber();
    const total = getTotalSteps();
    return `${(step / total) * 100}%`;
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
          <Text style={styles.headerSubtitle}>Step {getStepNumber()} of {getTotalSteps()}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: getProgressPercentage() as any}]} />
        </View>
      </View>

      {/* Service Banner for Car Rental */}
      {isCarRental && (
        <View style={styles.serviceBanner}>
          <Ionicons name="car" size={20} color="#FFFFFF" />
          <Text style={styles.serviceBannerText}>
            Car Rental requires advance scheduling. Please select a date and time.
          </Text>
        </View>
      )}

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
                  (isCarRental && option.id === 'right_now') && styles.timeOptionCardDisabled,
                ]}
                onPress={() => handleSelectTime(option.id)}
                activeOpacity={0.7}
                disabled={isCarRental && option.id === 'right_now'}
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
                <Text style={[
                  styles.timeOptionTitle,
                  (isCarRental && option.id === 'right_now') && styles.textDisabled
                ]}>
                  {option.title}
                </Text>
                <Text style={[
                  styles.timeOptionDescription,
                  (isCarRental && option.id === 'right_now') && styles.textDisabled
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection - Show when Schedule Later is selected */}
        {selectedTime === 'schedule_later' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isCarRental ? 'Select Rental Date & Time' : 'Select Date & Time'}
            </Text>

            {/* Selected Date Display */}
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color="#68bdee" />
              <Text style={styles.dateSelectorText}>
                {selectedDate ? formatDate(selectedDate) : 'Select a date'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8c8c8c" />
            </TouchableOpacity>

            {/* Time Slots */}
            {selectedDate && (
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
                <View style={styles.timeSlotsGrid}>
                  {availableTimeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlotButton,
                        selectedTimeSlot === slot.time && styles.timeSlotButtonSelected,
                        !slot.available && styles.timeSlotButtonDisabled,
                      ]}
                      onPress={() => handleSelectTimeSlot(slot)}
                      disabled={!slot.available}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                        !slot.available && styles.timeSlotTextDisabled,
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Estimated Arrival Time - Hide for Car Rental */}
        {!isCarRental && (
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
        )}

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

          {!isCarRental && (
            <>
              <View style={styles.divider} />
              <Text style={styles.emergencyNote}>
                Emergency services available 24/7 with additional fees
              </Text>
            </>
          )}
        </View>

        {/* Rescheduling Policy */}
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>
            {isCarRental ? 'Rental Cancellation Policy' : 'Rescheduling Policy'}
          </Text>
          <Text style={styles.policyText}>
            {isCarRental 
              ? 'You can cancel your rental up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a fee.'
              : 'You can reschedule or cancel your appointment free of charge up to 2 hours before the scheduled time. Late cancellations may incur a fee.'
            }
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
    paddingTop: 45,
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
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  serviceBannerText: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
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
    backgroundColor: '#e3f5ff',
  },
  timeOptionCardSelected: {
    borderColor: '#3c3c3c',
    borderWidth: 3,
  },
  timeOptionCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  timeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeIconContainerSelected: {
    backgroundColor: 'transparent',
  },
  timeIcon: {
    width: 40,
    height: 40,
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
  textDisabled: {
    color: '#b0b0b0',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
  },
  timeSlotsContainer: {
    marginTop: 20,
  },
  timeSlotsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotButton: {
    width: '23%',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timeSlotButtonSelected: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  timeSlotButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d0d0d0',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#68bdee',
    fontWeight: 'bold',
  },
  timeSlotTextDisabled: {
    color: '#b0b0b0',
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
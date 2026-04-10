import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './styles/ScheduleServicesStyles';

// ─────────────────────────────────────────────
//  Type definitions
// ─────────────────────────────────────────────

interface ServiceTimeOption {
  id: string;
  icon: any;
  title: string;
  description: string;
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

const ScheduleServiceScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ── Picker state ────────────────────────────────────────────────────────
  const [selectedTime, setSelectedTime]         = useState<string>('right_now');
  const [showDatePicker, setShowDatePicker]     = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker]     = useState<boolean>(false);
  const [selectedDate, setSelectedDate]         = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);

  // ── Param helpers ───────────────────────────────────────────────────────
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  const getParsedArray = (param: string | string[] | undefined): any[] => {
    const value = getStringParam(param);
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  };

  // ── Service params ──────────────────────────────────────────────────────
  const serviceId       = getStringParam(params.serviceId);
  const serviceName     = getStringParam(params.serviceName)     || 'Quick Tow (Flatbed)';
  const servicePrice    = getStringParam(params.servicePrice)    || '75 BHD';
  const serviceCategory = getStringParam(params.serviceCategory) || 'Towing';
  const isCarRental     = serviceId === '11';

  // ── Location params ─────────────────────────────────────────────────────
  const pickupAddress   = getStringParam(params.pickupAddress);
  const pickupLat       = getStringParam(params.pickupLat);
  const pickupLng       = getStringParam(params.pickupLng);
  const dropoffAddress  = getStringParam(params.dropoffAddress);
  const dropoffLat      = getStringParam(params.dropoffLat);
  const dropoffLng      = getStringParam(params.dropoffLng);

  // ── Vehicle params ──────────────────────────────────────────────────────
  const vehicleType     = getStringParam(params.vehicleType);
  const makeModel       = getStringParam(params.makeModel);
  const year            = getStringParam(params.year);
  const color           = getStringParam(params.color);
  const licensePlate    = getStringParam(params.licensePlate);
  const selectedVehicle = getStringParam(params.selectedVehicle);

  // ── Contact params ──────────────────────────────────────────────────────
  const fullName          = getStringParam(params.fullName);
  const phoneNumber       = getStringParam(params.phoneNumber);
  const email             = getStringParam(params.email);
  const emergencyContact  = getStringParam(params.emergencyContact);
  const saveVehicle       = getStringParam(params.saveVehicle) === 'true';
  const licenseFront      = getStringParam(params.licenseFront);
  const licenseBack       = getStringParam(params.licenseBack);
  const fuelType          = getStringParam(params.fuelType);
  const partDescription   = getStringParam(params.partDescription);

  // ── Additional params ───────────────────────────────────────────────────
  const urgency           = getStringParam(params.urgency) || 'moderate';
  const issues            = getParsedArray(params.issues);
  const description       = getStringParam(params.description);
  const photos            = getParsedArray(params.photos);
  const hasInsurance      = getStringParam(params.hasInsurance)      === 'true';
  const needSpecificTruck = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications  = getStringParam(params.hasModifications)  === 'true';
  const needMultilingual  = getStringParam(params.needMultilingual)  === 'true';
  const locationSkipped   = getStringParam(params.locationSkipped)   === 'true';

  // ── Force schedule_later for Car Rental ─────────────────────────────────
  useEffect(() => {
    if (isCarRental) setSelectedTime('schedule_later');
  }, [isCarRental]);

  // ── Display helpers ──────────────────────────────────────────────────────

  /**
   * Format: Wednesday, 9 April 2025
   */
  const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    });

  /**
   * Format: 02:30 PM
   */
  const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-US', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  /**
   * Combined for confirmation display: Wednesday, 9 April 2025 at 02:30 PM
   */
  const formatDateTime = (date: Date, time: Date): string =>
    `${formatDate(date)} at ${formatTime(time)}`;

  // ── Picker handlers ──────────────────────────────────────────────────────

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      // Reset time whenever date changes so user always re-confirms both
      setSelectedTimeSlot(null);
      // Immediately open time picker after date is chosen
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) setSelectedTimeSlot(date);
  };

  // ── Option select ────────────────────────────────────────────────────────

  const handleSelectTime = (timeId: string) => {
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
    } else {
      // Reset schedule selections when switching back to Right Now
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    }
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleBack = () => router.back();

  const handleContinue = () => {
    if (selectedTime === 'schedule_later' || isCarRental) {
      if (!selectedDate) {
        Alert.alert('Required', 'Please select a date for your scheduled service');
        return;
      }
      if (!selectedTimeSlot) {
        Alert.alert('Required', 'Please select a time for your scheduled service');
        return;
      }
    }

    // Combine date + time into one ISO timestamp
    // e.g. user picked 9 Apr 2025 as date and 14:30 as time
    // → merge into a single Date: 2025-04-09T14:30:00
    let scheduledAt = '';
    if (selectedDate && selectedTimeSlot) {
      const merged = new Date(selectedDate);
      merged.setHours(selectedTimeSlot.getHours(), selectedTimeSlot.getMinutes(), 0, 0);
      scheduledAt = merged.toISOString();
    }

    router.push({
      pathname: '/(customer)/PriceSummary',
      params: {
        // Location
        pickupAddress, pickupLat, pickupLng,
        dropoffAddress, dropoffLat, dropoffLng,
        // Service
        serviceId, serviceName, servicePrice, serviceCategory,
        // Vehicle
        vehicleType, makeModel, year, color, licensePlate, selectedVehicle,
        // Contact
        fullName, phoneNumber, email, emergencyContact,
        saveVehicle:       String(saveVehicle),
        licenseFront,      licenseBack,
        fuelType,          partDescription,
        // Additional
        urgency,
        issues:            JSON.stringify(issues),
        description,
        photos:            JSON.stringify(photos),
        hasInsurance:      String(hasInsurance),
        needSpecificTruck: String(needSpecificTruck),
        hasModifications:  String(hasModifications),
        needMultilingual:  String(needMultilingual),
        locationSkipped:   String(locationSkipped),
        // Schedule  ← single merged ISO string replaces the old two-field approach
        serviceTime:       selectedTime,
        scheduledAt,       // "2025-04-09T14:30:00.000Z"  or "" for right_now
      },
    });
  };

  // ── Static data ──────────────────────────────────────────────────────────

  const serviceTimeOptions: ServiceTimeOption[] = [
    {
      id:          'right_now',
      icon:        require('../../assets/customer/right_now.png'),
      title:       'Right Now',
      description: 'ASAP (15-20 min)',
    },
    {
      id:          'schedule_later',
      icon:        require('../../assets/customer/sec_later.png'),
      title:       'Schedule Later',
      description: 'Pick date & time',
    },
  ];

  // ── Progress ─────────────────────────────────────────────────────────────

  const stepNumber         = isCarRental ? 5 : 4;
  const totalSteps         = 7;
  const progressPercentage = `${(stepNumber / totalSteps) * 100}%`;

  // ── Render ───────────────────────────────────────────────────────────────

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
          <Text style={styles.headerSubtitle}>Step {stepNumber} of {totalSteps}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressPercentage as any }]} />
        </View>
      </View>

      {/* Car Rental banner */}
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

        {/* ── When do you need service? ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When do you need service?</Text>

          <View style={styles.timeOptionsContainer}>
            {serviceTimeOptions.map((option) => {
              const isDisabled = isCarRental && option.id === 'right_now';
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.timeOptionCard,
                    selectedTime === option.id && styles.timeOptionCardSelected,
                    isDisabled && styles.timeOptionCardDisabled,
                  ]}
                  onPress={() => handleSelectTime(option.id)}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                >
                  <View style={[
                    styles.timeIconContainer,
                    selectedTime === option.id && styles.timeIconContainerSelected,
                  ]}>
                    <Image source={option.icon} style={styles.timeIcon} resizeMode="contain" />
                  </View>
                  <Text style={[styles.timeOptionTitle,       isDisabled && styles.textDisabled]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.timeOptionDescription, isDisabled && styles.textDisabled]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Schedule Later: date + time pickers ──────────────────────── */}
        {selectedTime === 'schedule_later' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isCarRental ? 'Select Rental Date & Time' : 'Select Date & Time'}
            </Text>

            {/* Date selector button */}
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color="#68bdee" />
              <Text style={styles.dateSelectorText}>
                {selectedDate ? formatDate(selectedDate) : 'Tap to choose a date'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8c8c8c" />
            </TouchableOpacity>

            {/* Time selector button — only shown once a date is picked */}
            {selectedDate && (
              <TouchableOpacity
                style={[styles.dateSelector, { marginTop: 12 }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={24} color="#68bdee" />
                <Text style={styles.dateSelectorText}>
                  {selectedTimeSlot ? formatTime(selectedTimeSlot) : 'Tap to choose a time'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8c8c8c" />
              </TouchableOpacity>
            )}

            {/* Confirmation pill — shown only when both are selected */}
            {selectedDate && selectedTimeSlot && (
              <View style={localStyles.confirmPill}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={localStyles.confirmPillText}>
                  {formatDateTime(selectedDate, selectedTimeSlot)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Native date picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate ?? new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* Native time picker */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedTimeSlot ?? new Date()}
            mode="time"
            display="default"
            minuteInterval={1}
            onChange={handleTimeChange}
          />
        )}

        {/* ── Estimated arrival — hidden for Car Rental ────────────────── */}
        {!isCarRental && (
          <View style={styles.estimatedTimeBox}>
            <View style={styles.estimatedTimeHeader}>
              <Ionicons name="time-outline" size={24} color="#68bdee" />
              <Text style={styles.estimatedTimeTitle}>Estimated Arrival Time</Text>
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

        {/* ── Service Hours ─────────────────────────────────────────────── */}
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

        {/* ── Policy box ───────────────────────────────────────────────── */}
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>
            {isCarRental ? 'Rental Cancellation Policy' : 'Rescheduling Policy'}
          </Text>
          <Text style={styles.policyText}>
            {isCarRental
              ? 'You can cancel your rental up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a fee.'
              : 'You can reschedule or cancel your appointment free of charge up to 2 hours before the scheduled time. Late cancellations may incur a fee.'}
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Price Summary</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

// ─────────────────────────────────────────────
//  Local-only styles (additions only)
// ─────────────────────────────────────────────

const localStyles = StyleSheet.create({
  confirmPill: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginTop:      14,
    paddingVertical:  10,
    paddingHorizontal: 14,
    backgroundColor: '#f0fff4',
    borderRadius:    10,
    borderWidth:     1,
    borderColor:    '#4CAF50',
  },
  confirmPillText: {
    color:      '#2e7d32',
    fontSize:   14,
    fontWeight: '600',
    flexShrink: 1,
  },
});

export default ScheduleServiceScreen;
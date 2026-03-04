import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Type definitions
interface UrgencyOption {
  id: string;
  label: string;
  description: string;
  color: string;
  backgroundColor: string;
}

interface Waypoint {
  address: string;
  lat: string;
  lng: string;
  order: number;
}

const AdditionalDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedUrgency, setSelectedUrgency] = useState<string>('moderate');
  const [description, setDescription] = useState<string>('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Get data from previous screens
  const pickupAddress = getStringParam(params.pickupAddress);
  const pickupLat = getStringParam(params.pickupLat);
  const pickupLng = getStringParam(params.pickupLng);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const dropoffLat = getStringParam(params.dropoffLat);
  const dropoffLng = getStringParam(params.dropoffLng);
  
  // Get waypoints from previous screen
  const waypointsParam = getStringParam(params.waypoints);
  const hasWaypoints = getStringParam(params.hasWaypoints) === 'true';
  
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);
  const serviceId = getStringParam(params.serviceId);
  
  // Vehicle data from VehicleContactInfoScreen
  const vehicleType = getStringParam(params.vehicleType);
  const makeModel = getStringParam(params.makeModel);
  const year = getStringParam(params.year);
  const color = getStringParam(params.color);
  const licensePlate = getStringParam(params.licensePlate);
  const selectedVehicle = getStringParam(params.selectedVehicle);
  
  // Contact data from VehicleContactInfoScreen
  const fullName = getStringParam(params.fullName);
  const phoneNumber = getStringParam(params.phoneNumber);
  const email = getStringParam(params.email);
  const emergencyContact = getStringParam(params.emergencyContact);
  const saveVehicle = getStringParam(params.saveVehicle) === 'true';
  
  // Special fields from VehicleContactInfoScreen
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);
  
  // Flag for location skipped
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';
  const isTowing = serviceId === '1';

  // Parse waypoints from params
  useEffect(() => {
    if (hasWaypoints && waypointsParam) {
      try {
        const parsedWaypoints = JSON.parse(waypointsParam);
        setWaypoints(parsedWaypoints);
        console.log('Loaded waypoints:', parsedWaypoints);
      } catch (error) {
        console.error('Error parsing waypoints:', error);
        setWaypoints([]);
      }
    }
  }, [waypointsParam, hasWaypoints]);

  useEffect(() => {
  // Log ALL received data for debugging
  console.log('=====================================');
  console.log('📱 AdditionalDetails - RECEIVED DATA:');
  console.log('=====================================');
  
  // Service Info
  console.log('📦 SERVICE INFO:');
  console.log('  • serviceId:', serviceId);
  console.log('  • serviceName:', serviceName);
  console.log('  • servicePrice:', servicePrice);
  console.log('  • serviceCategory:', serviceCategory);
  
  // Location Data - WITH COORDINATES
  console.log('📍 LOCATION DATA:');
  console.log('  • pickupAddress:', pickupAddress);
  console.log('  • pickupLat:', pickupLat);
  console.log('  • pickupLng:', pickupLng);
  console.log('  • dropoffAddress:', dropoffAddress || '(not provided)');
  console.log('  • dropoffLat:', dropoffLat || '(not provided)');
  console.log('  • dropoffLng:', dropoffLng || '(not provided)');
  
  // Waypoints Data
  console.log('🛑 WAYPOINTS DATA:');
  console.log('  • hasWaypoints:', hasWaypoints);
  console.log('  • waypointsParam raw:', waypointsParam);
  console.log('  • parsed waypoints:', waypoints);
  if (waypoints.length > 0) {
    waypoints.forEach((wp, index) => {
      console.log(`    Stop ${index + 1}:`);
      console.log(`      address: ${wp.address}`);
      console.log(`      lat: ${wp.lat}`);
      console.log(`      lng: ${wp.lng}`);
      console.log(`      order: ${wp.order}`);
    });
  }
  
  // Vehicle Data
  console.log('🚗 VEHICLE DATA:');
  console.log('  • vehicleType:', vehicleType);
  console.log('  • makeModel:', makeModel);
  console.log('  • year:', year);
  console.log('  • color:', color);
  console.log('  • licensePlate:', licensePlate);
  console.log('  • selectedVehicle:', selectedVehicle);
  
  // Contact Data
  console.log('👤 CONTACT DATA:');
  console.log('  • fullName:', fullName);
  console.log('  • phoneNumber:', phoneNumber);
  console.log('  • email:', email);
  console.log('  • emergencyContact:', emergencyContact);
  console.log('  • saveVehicle:', saveVehicle);
  
  // Special Fields
  console.log('🔧 SPECIAL FIELDS:');
  console.log('  • hasLicenseFront:', !!licenseFront);
  console.log('  • hasLicenseBack:', !!licenseBack);
  console.log('  • fuelType:', fuelType || '(not provided)');
  console.log('  • partDescription:', partDescription ? partDescription.substring(0, 50) + '...' : '(not provided)');
  
  // Service Types
  console.log('⚙️ SERVICE TYPES:');
  console.log('  • isCarRental:', isCarRental);
  console.log('  • isFuelDelivery:', isFuelDelivery);
  console.log('  • isSpareParts:', isSpareParts);
  console.log('  • isTowing:', isTowing);
  console.log('  • locationSkipped:', locationSkipped);
  
  console.log('=====================================');
  
}, [waypoints]);

  const urgencyOptions: UrgencyOption[] = [
    {
      id: 'not_urgent',
      label: 'Not Urgent',
      description: 'Can wait 30+ minutes',
      color: '#4CAF50',
      backgroundColor: '#e8f5e9',
    },
    {
      id: 'moderate',
      label: 'Moderate',
      description: '15-30 minutes',
      color: '#FFC107',
      backgroundColor: '#fff9e6',
    },
    {
      id: 'urgent',
      label: 'Urgent',
      description: 'ASAP (< 15 min)',
      color: '#F44336',
      backgroundColor: '#ffebee',
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    // Validate required fields
    if (!selectedUrgency) {
      Alert.alert('Required Field', 'Please select the urgency level');
      return;
    }

    // Build params object with ALL data including new fields
    const paramsToSend: Record<string, string> = {
      // Location data
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      
      // Waypoints data
      waypoints: waypointsParam,
      hasWaypoints: hasWaypoints ? 'true' : 'false',
      
      // Service data
      serviceName,
      servicePrice,
      serviceCategory,
      serviceId,
      
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
      
      // Special fields from VehicleContactInfo
      licenseFront,
      licenseBack,
      fuelType,
      partDescription,
      
      // Location skipped flag
      locationSkipped: String(locationSkipped),
      
      // Additional details from this screen
      urgency: selectedUrgency,
      description,
    };

    // Navigate to schedule service screen
    router.push({
      pathname: '/(customer)/ScheduleServices',
      params: paramsToSend
    });
  };

  const handleSkip = () => {
    // Build params object with minimal data but include all required fields
    const paramsToSend: Record<string, string> = {
      // Location data
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      
      // Waypoints data
      waypoints: waypointsParam,
      hasWaypoints: hasWaypoints ? 'true' : 'false',
      
      // Service data
      serviceName,
      servicePrice,
      serviceCategory,
      serviceId,
      
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
      
      // Special fields from VehicleContactInfo
      licenseFront,
      licenseBack,
      fuelType,
      partDescription,
      
      // Location skipped flag
      locationSkipped: String(locationSkipped),
      
      // Default values for skipped step
      urgency: 'moderate',
      description: '',
    };

    router.push({
      pathname: '/(customer)/ScheduleServices',
      params: paramsToSend
    });
  };

  const handleSelectUrgency = (urgencyId: string) => {
    setSelectedUrgency(urgencyId);
  };

  // Get step number based on service
  const getStepNumber = () => {
    if (isCarRental) return 4;
    if (isFuelDelivery) return 4;
    if (isSpareParts) return 4;
    return 3;
  };

  // Get total steps based on service
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
          <Text style={styles.headerTitle}>Additional Details</Text>
          <Text style={styles.headerSubtitle}>Step {getStepNumber()} of {getTotalSteps()}</Text>
        </View>
      </View>


      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: getProgressPercentage()  as any}]} />
        </View>
      </View>

      {/* Summary of previous selections */}
      {(isCarRental || isFuelDelivery || isSpareParts) && (
        <View style={styles.summaryBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.summaryText} numberOfLines={1}>
            {isCarRental && 'License uploaded • '}
            {isFuelDelivery && `Fuel: ${fuelType === 'petrol' ? 'Petrol' : fuelType === 'diesel' ? 'Diesel' : 'Premium'} • `}
            {isSpareParts && 'Part details provided • '}
            Ready for additional info
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            How urgent is this? <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.urgencyContainer}>
            {urgencyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.urgencyCard,
                  selectedUrgency === option.id && {
                    backgroundColor: option.backgroundColor,
                    borderColor: option.color,
                  },
                ]}
                onPress={() => handleSelectUrgency(option.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.urgencyCircle,
                    { 
                      borderColor: option.color,
                      backgroundColor: option.backgroundColor,
                    },
                    selectedUrgency === option.id && {
                      backgroundColor: option.color,
                    },
                  ]}
                >
                  {selectedUrgency === option.id && (
                    <View
                      style={[
                        styles.urgencyCircleInner,
                        { backgroundColor: '#FFFFFF' },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.urgencyLabel}>{option.label}</Text>
                <Text style={styles.urgencyDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Describe the situation (Optional)</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Please provide any additional details that might help the provider prepare better."
              placeholderTextColor="#b0b0b0"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.textAreaFooter}>
            <Text style={styles.textAreaHelper}>
              Be as detailed as possible for better service
            </Text>
            <Text style={styles.characterCount}>
              {description.length} / 500
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBoxWrapper}>
          <View style={styles.infoBox}>
            <Ionicons name="document-text-outline" size={20} color="#5c5c5c" />
            <View style={styles.infoBoxTextContainer}>
              <Text style={styles.infoBoxTitle}>
                Why we ask for this information
              </Text>
              <Text style={styles.infoBoxText}>
                These details help us assign the right provider with proper
                equipment and expertise for your specific situation.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip This Step</Text>
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
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 1,
    gap: 10,
  },
  summaryText: {
    fontSize: 12,
    color: '#2E7D32',
    flex: 1,
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
    paddingVertical: 20,
    marginBottom: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#ff4444',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  urgencyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyCircleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  urgencyLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  urgencyDescription: {
    fontSize: 10,
    color: '#8c8c8c',
    textAlign: 'center',
  },
  textAreaContainer: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  textArea: {
    padding: 15,
    fontSize: 12,
    color: '#3c3c3c',
    lineHeight: 18,
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  textAreaHelper: {
    fontSize: 10,
    color: '#8c8c8c',
  },
  characterCount: {
    fontSize: 10,
    color: '#8c8c8c',
  },
  infoBoxWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginTop: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  infoBoxTextContainer: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBoxText: {
    fontSize: 11,
    color: '#5c5c5c',
    lineHeight: 16,
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
    marginBottom: 10,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  skipButtonText: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '600',
  },
});

export default AdditionalDetailsScreen;
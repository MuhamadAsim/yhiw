import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Type definitions
interface UrgencyOption {
  id: string;
  label: string;
  description: string;
  color: string;
  backgroundColor: string;
}

interface IssueOption {
  id: string;
  label: string;
  icon: any;
}

const AdditionalDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedUrgency, setSelectedUrgency] = useState<string>('moderate');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasInsurance, setHasInsurance] = useState<boolean>(false);
  const [needSpecificTruck, setNeedSpecificTruck] = useState<boolean>(false);
  const [hasModifications, setHasModifications] = useState<boolean>(false);
  const [needMultilingual, setNeedMultilingual] = useState<boolean>(false);

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
  
  // NEW FIELDS from VehicleContactInfoScreen
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
  const isCarWash = serviceId === '9' || serviceId === '10';

  useEffect(() => {
    // Log received data for debugging
    console.log('AdditionalDetails - Received data:', {
      pickupAddress,
      dropoffAddress,
      serviceName,
      serviceId,
      vehicleType,
      makeModel,
      licensePlate,
      fullName,
      phoneNumber,
      // New fields
      hasLicense: !!licenseFront,
      fuelType,
      partDescription,
      locationSkipped
    });
  }, []);

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

  const issueOptions: IssueOption[] = [
    {
      id: 'wont_start',
      label: "Vehicle won't start",
      icon: require('../../assets/customer/battery_icon.png'),
    },
    {
      id: 'flat_tire',
      label: 'Flat tire',
      icon: require('../../assets/customer/tire_icon.png'),
    },
    {
      id: 'out_of_fuel',
      label: 'Out of fuel',
      icon: require('../../assets/customer/fuel_icon.png'),
    },
    {
      id: 'battery_dead',
      label: 'Battery dead',
      icon: require('../../assets/customer/wrench_icon.png'),
    },
    {
      id: 'engine_overheating',
      label: 'Engine overheating',
      icon: require('../../assets/customer/temp_icon.png'),
    },
    {
      id: 'locked_out',
      label: 'Locked out',
      icon: require('../../assets/customer/lock_icon.png'),
    },
    {
      id: 'accident',
      label: 'Accident',
      icon: require('../../assets/customer/warning_icon.png'),
    },
    {
      id: 'other',
      label: 'Other issue',
      icon: require('../../assets/customer/question_icon.png'),
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
    const paramsToSend: any = {
      // Location data
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      
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
      
      // NEW FIELDS - Pass through from VehicleContactInfo
      licenseFront,
      licenseBack,
      fuelType,
      partDescription,
      
      // Location skipped flag
      locationSkipped: String(locationSkipped),
      
      // Additional details from this screen
      urgency: selectedUrgency,
      issues: JSON.stringify(selectedIssues),
      description,
      photos: JSON.stringify(photos),
      hasInsurance: String(hasInsurance),
      needSpecificTruck: String(needSpecificTruck),
      hasModifications: String(hasModifications),
      needMultilingual: String(needMultilingual),
    };

    // Navigate to schedule service screen
    router.push({
      pathname: '/(customer)/ScheduleServices',
      params: paramsToSend
    });
  };

  const handleSkip = () => {
    // Build params object with minimal data but include all required fields
    const paramsToSend: any = {
      // Location data
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      
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
      
      // NEW FIELDS - Pass through from VehicleContactInfo
      licenseFront,
      licenseBack,
      fuelType,
      partDescription,
      
      // Location skipped flag
      locationSkipped: String(locationSkipped),
      
      // Default values for skipped step
      urgency: 'moderate',
      issues: JSON.stringify([]),
      description: '',
      photos: JSON.stringify([]),
      hasInsurance: 'false',
      needSpecificTruck: 'false',
      hasModifications: 'false',
      needMultilingual: 'false',
    };

    router.push({
      pathname: '/(customer)/ScheduleServices',
      params: paramsToSend
    });
  };

  const handleSelectUrgency = (urgencyId: string) => {
    setSelectedUrgency(urgencyId);
  };

  const handleToggleIssue = (issueId: string) => {
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(selectedIssues.filter((id) => id !== issueId));
    } else {
      setSelectedIssues([...selectedIssues, issueId]);
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Maximum Photos', 'You can only upload up to 3 photos');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant access to your photo library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Get step number based on service
  const getStepNumber = () => {
    if (isCarRental) return 4; // Location (1) → Vehicle+License (2) → Additional (3) → Schedule (4)
    if (isFuelDelivery) return 4;
    if (isSpareParts) return 4;
    return 3; // Normal flow: Location (1) → Vehicle (2) → Additional (3)
  };

  // Get total steps based on service
  const getTotalSteps = () => {
    if (isCarRental) return 7;
    if (isFuelDelivery) return 7;
    if (isSpareParts) return 7;
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

      {/* Summary of previous selections (optional) */}
      {(isCarRental || isFuelDelivery || isSpareParts) && (
        <View style={styles.summaryBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.summaryText}>
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

        {/* Issues Section - Hide for certain services */}
        {!isCarWash && !isCarRental && !isFuelDelivery && !isSpareParts && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              What's the issue? (Select all that apply)
            </Text>

            <View style={styles.issuesGrid}>
              {issueOptions.map((issue) => (
                <TouchableOpacity
                  key={issue.id}
                  style={[
                    styles.issueCard,
                    selectedIssues.includes(issue.id) && styles.issueCardSelected,
                  ]}
                  onPress={() => handleToggleIssue(issue.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.issueContentRow}>
                    <View style={styles.issueCheckbox}>
                      {selectedIssues.includes(issue.id) && (
                        <Ionicons name="checkmark" size={16} color="#3c3c3c" />
                      )}
                    </View>
                    <Image
                      source={issue.icon}
                      style={styles.issueIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.issueLabel}>{issue.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Description Section - Show for all except maybe some services */}
        {!isCarRental && !isFuelDelivery && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Describe the situation (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Please provide any additional details that might help the provider prepare better. For example: location details, specific symptoms, what you've already tried, etc."
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
        )}

        {/* Photos Section - Show for all except maybe some services */}
        {!isCarRental && !isFuelDelivery && !isSpareParts && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add photos (Optional)</Text>

            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 3 && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={handleAddPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={32} color="#b0b0b0" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.photoHelper}>
              Upload up to 3 photos of the issue
            </Text>
          </View>
        )}

        {/* Insurance Coverage - Show for relevant services */}
        {isCarRental && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Insurance Coverage</Text>

            <TouchableOpacity
              style={styles.insuranceCard}
              onPress={() => setHasInsurance(!hasInsurance)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {hasInsurance && (
                  <Ionicons name="checkmark" size={18} color="#3c3c3c" />
                )}
              </View>
              <View style={styles.insuranceTextContainer}>
                <Text style={styles.insuranceTitle}>
                  I have rental insurance
                </Text>
                <Text style={styles.insuranceDescription}>
                  Check if you have insurance coverage
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Special Requirements - Show for towing and other relevant services */}
        {isTowing && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Special Requirements (Optional)</Text>

            <TouchableOpacity
              style={styles.requirementItem}
              onPress={() => setNeedSpecificTruck(!needSpecificTruck)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {needSpecificTruck && (
                  <Ionicons name="checkmark" size={18} color="#3c3c3c" />
                )}
              </View>
              <Text style={styles.requirementText}>
                Need a specific type of tow truck
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.requirementItem}
              onPress={() => setHasModifications(!hasModifications)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {hasModifications && (
                  <Ionicons name="checkmark" size={18} color="#3c3c3c" />
                )}
              </View>
              <Text style={styles.requirementText}>
                Vehicle has modifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.requirementItem}
              onPress={() => setNeedMultilingual(!needMultilingual)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {needMultilingual && (
                  <Ionicons name="checkmark" size={18} color="#3c3c3c" />
                )}
              </View>
              <Text style={styles.requirementText}>
                Require multilingual provider
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
                equipment and expertise for your specific situation, ensuring
                faster and more efficient service.
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  urgencyDescription: {
    fontSize: 10,
    color: '#8c8c8c',
    textAlign: 'center',
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  issueCard: {
    width: '48%',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  issueCardSelected: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  issueContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  issueCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  issueIcon: {
    width: 30,
    height: 30,
  },
  issueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
  },
  textAreaContainer: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
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
  photosContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoItem: {
    position: 'relative',
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#b0b0b0',
    marginTop: 4,
  },
  photoHelper: {
    fontSize: 10,
    color: '#8c8c8c',
  },
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  insuranceTextContainer: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insuranceDescription: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  requirementText: {
    fontSize: 12,
    color: '#3c3c3c',
    flex: 1,
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
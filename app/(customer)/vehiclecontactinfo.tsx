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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
interface SavedVehicle {
  id: number;
  name: string;
  type: string;
  plate: string;
  color: string;
  make?: string;
  model?: string;
  year?: string;
}

// Update the Omit type to make name optional for creation
type NewVehicle = Omit<SavedVehicle, 'id'>;

interface VehicleTypeOption {
  id: string;
  label: string;
  icon: string;
}

interface FuelTypeOption {
  id: string;
  label: string;
  icon: string;
}

interface UserData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  firebaseUserId?: string;
  uid?: string;
  displayName?: string; // Common in Firebase
  fullName?: string; // Alternative field name
  firstName?: string;
  lastName?: string;
}

const VehicleContactInfoScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('');
  const [makeModel, setMakeModel] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [saveVehicle, setSaveVehicle] = useState<boolean>(false);
  const [locationSkipped, setLocationSkipped] = useState<boolean>(false);
  
  // License upload for Car Rental only
  const [licenseFront, setLicenseFront] = useState<string>('');
  const [licenseBack, setLicenseBack] = useState<string>('');
  
  // Fuel Delivery specific
  const [fuelType, setFuelType] = useState<string>('');
  
  // Spare Parts specific
  const [partDescription, setPartDescription] = useState<string>('');

  // Saved vehicles state
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Get data from previous screen
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
  const locationSkippedParam = getStringParam(params.locationSkipped);
  
  // Get service-specific requirements
  const requiresFuelType = getStringParam(params.requiresFuelType) === 'true';
  const requiresLicense = getStringParam(params.requiresLicense) === 'true';
  const requiresTextDescription = getStringParam(params.requiresTextDescription) === 'true';

  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';

  // Load user data from AsyncStorage
  useEffect(() => {
    loadUserData();
    loadSavedVehicles();
  }, []);

  useEffect(() => {
    // Check if location was skipped
    if (locationSkippedParam === 'true') {
      setLocationSkipped(true);
    }

    // Log received data for debugging
    console.log('VehicleContactInfo - Received data:', {
      pickupAddress,
      dropoffAddress,
      serviceName,
      servicePrice,
      serviceId,
      isCarRental,
      isFuelDelivery,
      isSpareParts,
      requiresFuelType,
      requiresLicense,
      requiresTextDescription,
      locationSkipped: locationSkippedParam
    });
  }, []);

  // FIXED: Load user data from AsyncStorage with better name extraction
  const loadUserData = async () => {
    try {
      // Try to get userData first
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        console.log('Loaded user data:', userData);
        
        // Try multiple possible name fields
        let name = '';
        if (userData.name) {
          name = userData.name;
        } else if (userData.displayName) {
          name = userData.displayName;
        } else if (userData.fullName) {
          name = userData.fullName;
        } else if (userData.firstName && userData.lastName) {
          name = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.firstName) {
          name = userData.firstName;
        }
        
        if (name) {
          setFullName(name);
        }
        
        // Try to get email
        if (userData.email) {
          setEmail(userData.email);
        }
        
        // Try to get phone
        if (userData.phoneNumber) {
          setPhoneNumber(userData.phoneNumber);
        }
      }
      
      // Also try to get user profile data from common keys
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (userProfileStr && !fullName) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.name || userProfile.displayName) {
          setFullName(userProfile.name || userProfile.displayName);
        }
        if (userProfile.email && !email) {
          setEmail(userProfile.email);
        }
        if (userProfile.phone && !phoneNumber) {
          setPhoneNumber(userProfile.phone);
        }
      }
      
      // Try to get phone from separate key if not found
      if (!phoneNumber) {
        const phoneStr = await AsyncStorage.getItem('userPhone');
        if (phoneStr) {
          setPhoneNumber(phoneStr);
        }
      }
      
      // Try to get user from auth key
      const authUserStr = await AsyncStorage.getItem('authUser');
      if (authUserStr && !fullName) {
        const authUser = JSON.parse(authUserStr);
        if (authUser.name || authUser.displayName) {
          setFullName(authUser.name || authUser.displayName);
        }
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Load saved vehicles from AsyncStorage
  const loadSavedVehicles = async () => {
    try {
      setIsLoading(true);
      const savedVehiclesStr = await AsyncStorage.getItem('savedVehicles');
      if (savedVehiclesStr) {
        const vehicles = JSON.parse(savedVehiclesStr);
        setSavedVehicles(vehicles);
        console.log('Loaded saved vehicles:', vehicles);
      } else {
        setSavedVehicles([]);
      }
    } catch (error) {
      console.error('Error loading saved vehicles:', error);
      setSavedVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Check for duplicate vehicle before saving
  const isVehicleDuplicate = (vehicleData: {
    type: string;
    make: string;
    model: string;
    year: string;
    color: string;
    plate: string;
  }, existingVehicles: SavedVehicle[]): boolean => {
    return existingVehicles.some(v => 
      v.type.toLowerCase() === vehicleData.type.toLowerCase() &&
      v.make?.toLowerCase() === vehicleData.make.toLowerCase() &&
      v.model?.toLowerCase() === vehicleData.model.toLowerCase() &&
      v.year === vehicleData.year &&
      v.color.toLowerCase() === vehicleData.color.toLowerCase() &&
      v.plate.toLowerCase() === vehicleData.plate.toLowerCase()
    );
  };

  // Save vehicle to AsyncStorage - FIXED: Now checks for duplicates
  const saveVehicleToStorage = async (vehicleData: {
    type: string;
    make: string;
    model: string;
    year: string;
    color: string;
    plate: string;
  }) => {
    try {
      const savedVehiclesStr = await AsyncStorage.getItem('savedVehicles');
      let vehicles: SavedVehicle[] = savedVehiclesStr ? JSON.parse(savedVehiclesStr) : [];
      
      // Check if vehicle already exists
      if (isVehicleDuplicate(vehicleData, vehicles)) {
        console.log('Vehicle already exists, not saving duplicate');
        Alert.alert('Info', 'This vehicle is already saved');
        return false;
      }
      
      // Create vehicle name from make and model
      const vehicleName = `${vehicleData.make} ${vehicleData.model}`.trim() || 'My Vehicle';
      
      // Create new vehicle with all required fields
      const newVehicle: SavedVehicle = {
        id: Date.now(), // Simple ID generation
        name: vehicleName,
        type: vehicleData.type,
        plate: vehicleData.plate,
        color: vehicleData.color,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
      };
      
      vehicles.push(newVehicle);
      await AsyncStorage.setItem('savedVehicles', JSON.stringify(vehicles));
      setSavedVehicles(vehicles);
      
      console.log('Vehicle saved successfully:', newVehicle);
      
      // Optionally show a success message
      Alert.alert('Success', 'Vehicle saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle. Please try again.');
      return false;
    }
  };

  const vehicleTypes: VehicleTypeOption[] = [
    { id: 'sedan', label: 'Sedan', icon: '🚗' },
    { id: 'suv', label: 'SUV', icon: '🚙' },
    { id: 'truck', label: 'Truck', icon: '🚚' },
    { id: 'van', label: 'Van', icon: '🚐' },
    { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
    { id: 'other', label: 'Other', icon: '🚘' },
  ];

  const fuelTypes: FuelTypeOption[] = [
    { id: 'petrol', label: 'Petrol', icon: '⛽' },
    { id: 'diesel', label: 'Diesel', icon: '⛽' },
    { id: 'premium', label: 'Premium', icon: '⭐' },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleLicenseUpload = async (type: 'front' | 'back') => {
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
      if (type === 'front') {
        setLicenseFront(result.assets[0].uri);
      } else {
        setLicenseBack(result.assets[0].uri);
      }
    }
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your phone number');
      return;
    }

    // If no saved vehicle selected, validate manual vehicle fields
    if (!selectedVehicle) {
      if (!selectedVehicleType) {
        Alert.alert('Required Field', 'Please select a vehicle type');
        return;
      }
    }

    // For Car Rental, validate license upload
    if (isCarRental || requiresLicense) {
      if (!licenseFront || !licenseBack) {
        Alert.alert('Required', 'Please upload both front and back of your driver\'s license');
        return;
      }
    }

    // For Fuel Delivery, validate fuel type
    if (isFuelDelivery || requiresFuelType) {
      if (!fuelType) {
        Alert.alert('Required Field', 'Please select fuel type');
        return;
      }
    }

    // For Spare Parts, validate part description
    if (isSpareParts || requiresTextDescription) {
      if (!partDescription.trim()) {
        Alert.alert('Required Field', 'Please describe the spare part you need');
        return;
      }
    }

    // Save vehicle if checkbox is checked and no existing vehicle selected
    if (saveVehicle && !selectedVehicle) {
      // Parse make and model from makeModel string
      const makeModelParts = makeModel.trim().split(' ');
      const make = makeModelParts[0] || '';
      const model = makeModelParts.slice(1).join(' ') || '';
      
      await saveVehicleToStorage({
        type: selectedVehicleType,
        make: make,
        model: model,
        year: year,
        color: color,
        plate: licensePlate,
      });
    }

    // Navigate to additional details screen with all collected data
    router.push({
      pathname: '/(customer)/AdditionalDetails',
      params: {
        // Location data from previous screen (or placeholder if skipped)
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        
        // Service data from previous screen
        serviceName,
        servicePrice,
        serviceCategory,
        serviceId,
        
        // Vehicle data
        vehicleType: selectedVehicleType,
        makeModel,
        year,
        color,
        licensePlate,
        selectedVehicle: selectedVehicle ? String(selectedVehicle) : '',
        
        // Contact data
        fullName,
        phoneNumber,
        email,
        emergencyContact,
        saveVehicle: String(saveVehicle),
        
        // License data for Car Rental
        licenseFront,
        licenseBack,
        
        // Fuel type for Fuel Delivery
        fuelType,
        
        // Part description for Spare Parts
        partDescription,
        
        // Flag for location skipped
        locationSkipped: locationSkipped ? 'true' : 'false',
      }
    });
  };

  const handleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicle(vehicleId);
    // Populate fields with selected vehicle data
    const vehicle = savedVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicleType(vehicle.type.toLowerCase());
      setMakeModel(vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim());
      setColor(vehicle.color || '');
      setLicensePlate(vehicle.plate || '');
      setYear(vehicle.year || '');
    }
  };

  const handleSelectVehicleType = (typeId: string) => {
    // Clear saved vehicle selection when manually entering
    setSelectedVehicle(null);
    setSelectedVehicleType(typeId);
  };

  const handleManualInput = () => {
    // Clear saved vehicle selection when user starts typing in manual fields
    setSelectedVehicle(null);
  };

  // Get service-specific helper text
  const getServiceHelperText = () => {
    if (serviceId === '11') { // Car Rental
      return "Driver's license upload required";
    } else if (serviceId === '12') { // Spare Parts
      return "Please describe the part you need";
    } else if (serviceId === '3') { // Fuel Delivery
      return "Select fuel type";
    } else if (serviceId === '9' || serviceId === '10') { // Car Wash/Detailing
      return "This helps us identify your vehicle for the appointment";
    }
    return "This helps the provider identify your vehicle";
  };

  // Get button text based on service
  const getButtonText = () => {
    return 'Continue to Additional Details';
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
          <Text style={styles.headerTitle}>Vehicle & Contact Info</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 7</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '28.6%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saved Vehicles - Only show if there are saved vehicles */}
        {savedVehicles.length > 0 && !isLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Saved Vehicles</Text>
            
            {savedVehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.savedVehicleCard,
                  selectedVehicle === vehicle.id && styles.savedVehicleCardSelected
                ]}
                onPress={() => handleSelectVehicle(vehicle.id)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../assets/customer/saved_vehicle.png')}
                  style={styles.savedVehicleIcon}
                  resizeMode="contain"
                />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleDetails}>
                    {vehicle.type} • {vehicle.plate || 'No plate'} • {vehicle.color || 'No color'}
                  </Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedVehicle === vehicle.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.orDivider}>or add new vehicle</Text>
          </View>
        )}

        {/* Vehicle Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-outline" size={20} color="#3c3c3c" />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>

          {/* Vehicle Type */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Vehicle Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.vehicleTypeGrid}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.vehicleTypeCard,
                    selectedVehicleType === type.id &&
                      styles.vehicleTypeCardActive,
                  ]}
                  onPress={() => handleSelectVehicleType(type.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.vehicleTypeEmoji}>{type.icon}</Text>
                  <Text style={styles.vehicleTypeLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Make & Model */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Make & Model (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#b0b0b0" />
              <TextInput
                style={styles.input}
                placeholder="E.g., Toyota Camry"
                placeholderTextColor="#b0b0b0"
                value={makeModel}
                onChangeText={(text) => {
                  setMakeModel(text);
                  handleManualInput();
                }}
              />
            </View>
          </View>

          {/* Year and Color */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputSection, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Year (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="2020"
                  placeholderTextColor="#b0b0b0"
                  value={year}
                  onChangeText={(text) => {
                    setYear(text);
                    handleManualInput();
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={[styles.inputSection, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Color (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="White"
                  placeholderTextColor="#b0b0b0"
                  value={color}
                  onChangeText={(text) => {
                    setColor(text);
                    handleManualInput();
                  }}
                />
              </View>
            </View>
          </View>

          {/* License Plate */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>License Plate Number (Optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="ABC 1234"
                placeholderTextColor="#b0b0b0"
                value={licensePlate}
                onChangeText={(text) => {
                  setLicensePlate(text);
                  handleManualInput();
                }}
              />
            </View>
            <Text style={styles.helperText}>
              {getServiceHelperText()}
            </Text>
          </View>

          {/* LICENSE UPLOAD - ONLY FOR CAR RENTAL */}
          {(isCarRental || requiresLicense) && (
            <View style={styles.specialSection}>
              <Text style={styles.specialSectionLabel}>
                Driver's License <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.licenseContainer}>
                {/* Front License */}
                <View style={styles.licenseItem}>
                  <Text style={styles.licenseLabel}>Front</Text>
                  {licenseFront ? (
                    <View style={styles.licenseImageContainer}>
                      <Image source={{ uri: licenseFront }} style={styles.licenseImage} />
                      <TouchableOpacity 
                        style={styles.licenseRemoveButton}
                        onPress={() => setLicenseFront('')}
                      >
                        <Ionicons name="close-circle" size={24} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.licenseUploadButton}
                      onPress={() => handleLicenseUpload('front')}
                    >
                      <Ionicons name="camera-outline" size={32} color="#b0b0b0" />
                      <Text style={styles.licenseUploadText}>Upload Front</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Back License */}
                <View style={styles.licenseItem}>
                  <Text style={styles.licenseLabel}>Back</Text>
                  {licenseBack ? (
                    <View style={styles.licenseImageContainer}>
                      <Image source={{ uri: licenseBack }} style={styles.licenseImage} />
                      <TouchableOpacity 
                        style={styles.licenseRemoveButton}
                        onPress={() => setLicenseBack('')}
                      >
                        <Ionicons name="close-circle" size={24} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.licenseUploadButton}
                      onPress={() => handleLicenseUpload('back')}
                    >
                      <Ionicons name="camera-outline" size={32} color="#b0b0b0" />
                      <Text style={styles.licenseUploadText}>Upload Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.helperText}>
                Upload clear images of your driver's license (front and back)
              </Text>
            </View>
          )}

          {/* FUEL TYPE - ONLY FOR FUEL DELIVERY */}
          {(isFuelDelivery || requiresFuelType) && (
            <View style={styles.specialSection}>
              <Text style={styles.specialSectionLabel}>
                Fuel Type <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.fuelTypeContainer}>
                {fuelTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.fuelTypeCard,
                      fuelType === type.id && styles.fuelTypeCardActive,
                    ]}
                    onPress={() => setFuelType(type.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fuelTypeEmoji}>{type.icon}</Text>
                    <Text style={styles.fuelTypeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperText}>
                Select the type of fuel you need
              </Text>
            </View>
          )}

          {/* SPARE PARTS DESCRIPTION - ONLY FOR SPARE PARTS */}
          {(isSpareParts || requiresTextDescription) && (
            <View style={styles.specialSection}>
              <Text style={styles.specialSectionLabel}>
                Part Description <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe the spare part you need. Include part number if available, make, model, and year of your vehicle."
                  placeholderTextColor="#b0b0b0"
                  value={partDescription}
                  onChangeText={setPartDescription}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.textAreaFooter}>
                <Text style={styles.helperText}>
                  Include part number, make, model, and year if possible
                </Text>
                <Text style={styles.characterCount}>
                  {partDescription.length}/300
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#3c3c3c" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          {/* Full Name - Auto-filled from AsyncStorage */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#68bdee" />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#b0b0b0"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Phone Number - Auto-filled from AsyncStorage */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#68bdee" />
              <TextInput
                style={styles.input}
                placeholder="+973 3333 4444"
                placeholderTextColor="#b0b0b0"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.helperText}>
              We'll notify you when the provider is on the way
            </Text>
          </View>

          {/* Email Address - Auto-filled from AsyncStorage */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#b0b0b0" />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#b0b0b0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Emergency Contact (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#b0b0b0" />
              <TextInput
                style={styles.input}
                placeholder="+973 3X XX XXXX"
                placeholderTextColor="#b0b0b0"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Save Vehicle Checkbox */}
        <View style={styles.infoBoxContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setSaveVehicle(!saveVehicle)}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {saveVehicle && (
                <Ionicons name="checkmark" size={18} color="#3c3c3c" />
              )}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxTitle}>Save this vehicle</Text>
              <Text style={styles.checkboxDescription}>
                Save vehicle details for faster booking next time
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="information-circle-outline" size={20} color="#5c5c5c" />
          <Text style={styles.privacyText}>
            Your information is kept private and only shared with the assigned
            service provider for this request.
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
            {getButtonText()}
          </Text>
        </TouchableOpacity>
        <Text style={styles.requiredNote}>
          Fields marked with * are required
        </Text>
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
  locationSkippedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f5ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 1,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#68bdee',
  },
  locationSkippedText: {
    fontSize: 12,
    color: '#3c3c3c',
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
    paddingVertical: 20,
    marginBottom: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specialSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  specialSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // License upload styles
  licenseContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  licenseItem: {
    flex: 1,
  },
  licenseLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  licenseUploadButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  licenseUploadText: {
    fontSize: 11,
    color: '#b0b0b0',
    marginTop: 8,
  },
  licenseImageContainer: {
    position: 'relative',
    height: 120,
  },
  licenseImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  licenseRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  // Fuel type styles
  fuelTypeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  fuelTypeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fuelTypeCardActive: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  fuelTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  fuelTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
  },
  // Text area styles
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
  characterCount: {
    fontSize: 10,
    color: '#8c8c8c',
  },
  savedVehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 15,
  },
  savedVehicleCardSelected: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  savedVehicleIcon: {
    width: 50,
    height: 50,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3c3c3c',
  },
  orDivider: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#ff4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 10,
    color: '#8c8c8c',
    marginTop: 8,
    lineHeight: 14,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleTypeCard: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  vehicleTypeCardActive: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  vehicleTypeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  vehicleTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  infoBoxContainer: {
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxDescription: {
    fontSize: 11,
    color: '#5c5c5c',
    lineHeight: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  privacyText: {
    flex: 1,
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
    marginBottom: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requiredNote: {
    fontSize: 10,
    color: '#8c8c8c',
    textAlign: 'center',
  },
});

export default VehicleContactInfoScreen;
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
import { styles } from './styles/VehicleContactInfoStyles';

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

// New type for waypoints
interface Waypoint {
  address: string;
  lat: string;
  lng: string;
  order: number;
}

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
  displayName?: string;
  fullName?: string;
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

  // Waypoints state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  // ========== HELPER FUNCTIONS ==========
  
  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely parse boolean
  const getBooleanParam = (param: string | string[] | undefined): boolean => {
    const value = getStringParam(param);
    return value === 'true' || value === 'True' || value === '1';
  };

  // Helper function to safely parse number
  const getNumberParam = (param: string | string[] | undefined): number => {
    const value = getStringParam(param);
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to get error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error occurred';
  };

  // ========== PARAMS ==========
  
  // Get data from previous screen
  const pickupAddress = getStringParam(params.pickupAddress);
  const pickupLat = getStringParam(params.pickupLat);
  const pickupLng = getStringParam(params.pickupLng);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const dropoffLat = getStringParam(params.dropoffLat);
  const dropoffLng = getStringParam(params.dropoffLng);
  
  // Get waypoints from previous screen
  const waypointsParam = getStringParam(params.waypoints);
  const hasWaypoints = getBooleanParam(params.hasWaypoints);
  
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);
  const serviceId = getStringParam(params.serviceId);
  const locationSkippedParam = getBooleanParam(params.locationSkipped);
  
  // Get service-specific requirements
  const requiresFuelType = getBooleanParam(params.requiresFuelType);
  const requiresLicense = getBooleanParam(params.requiresLicense);
  const requiresTextDescription = getBooleanParam(params.requiresTextDescription);
  const requiresDestination = getBooleanParam(params.requiresDestination);
  const hasBooking = getBooleanParam(params.hasBooking);

  // Additional params from previous screens
  const serviceDescription = getStringParam(params.serviceDescription);
  const serviceRating = getStringParam(params.serviceRating);
  const serviceDistance = getStringParam(params.serviceDistance);
  const serviceTime = getStringParam(params.serviceTime);
  const comingFrom = getStringParam(params.comingFrom);

  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';

  // ========== EFFECTS ==========

  // Parse waypoints from params
  useEffect(() => {
    try {
      if (hasWaypoints && waypointsParam) {
        const parsedWaypoints = JSON.parse(waypointsParam);
        setWaypoints(parsedWaypoints);
        console.log('Loaded waypoints:', parsedWaypoints);
      }
    } catch (error) {
      console.error('Error parsing waypoints:', getErrorMessage(error));
      setWaypoints([]);
    }
  }, [waypointsParam, hasWaypoints]);

  // Load user data from AsyncStorage
  useEffect(() => {
    loadUserData();
    loadSavedVehicles();
  }, []);

  // Debug logging on mount
  useEffect(() => {
    console.log('=====================================');
    console.log('📱 VehicleContactInfo - RECEIVED DATA:');
    console.log('=====================================');
    
    // Service Info
    console.log('📦 SERVICE INFO:');
    console.log('  • serviceId:', serviceId);
    console.log('  • serviceName:', serviceName);
    console.log('  • servicePrice:', servicePrice);
    console.log('  • serviceCategory:', serviceCategory);
    
    // Location Data
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
    console.log('  • parsed waypoints:', waypoints);
    
    // Service Requirements
    console.log('⚙️ SERVICE REQUIREMENTS:');
    console.log('  • requiresFuelType:', requiresFuelType);
    console.log('  • requiresLicense:', requiresLicense);
    console.log('  • requiresTextDescription:', requiresTextDescription);
    console.log('  • isCarRental:', isCarRental);
    console.log('  • isFuelDelivery:', isFuelDelivery);
    console.log('  • isSpareParts:', isSpareParts);
    console.log('  • locationSkipped:', locationSkippedParam);
    
    console.log('=====================================');
    
    // Set location skipped flag
    if (locationSkippedParam) {
      setLocationSkipped(true);
    }
  }, []);

  // ========== DATA LOADING FUNCTIONS ==========

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
        
        if (name) setFullName(name);
        if (userData.email) setEmail(userData.email);
        if (userData.phoneNumber) setPhoneNumber(userData.phoneNumber);
      }
      
      // Try other storage keys if needed
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (userProfileStr && !fullName) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.name || userProfile.displayName) {
          setFullName(userProfile.name || userProfile.displayName);
        }
        if (userProfile.email && !email) setEmail(userProfile.email);
        if (userProfile.phone && !phoneNumber) setPhoneNumber(userProfile.phone);
      }
      
      if (!phoneNumber) {
        const phoneStr = await AsyncStorage.getItem('userPhone');
        if (phoneStr) setPhoneNumber(phoneStr);
      }
      
      const authUserStr = await AsyncStorage.getItem('authUser');
      if (authUserStr && !fullName) {
        const authUser = JSON.parse(authUserStr);
        if (authUser.name || authUser.displayName) {
          setFullName(authUser.name || authUser.displayName);
        }
      }
      
    } catch (error) {
      console.error('Error loading user data:', getErrorMessage(error));
      // Don't show alert - just log
    }
  };

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
      console.error('Error loading saved vehicles:', getErrorMessage(error));
      setSavedVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== VEHICLE FUNCTIONS ==========

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
        id: Date.now(),
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
      Alert.alert('Success', 'Vehicle saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving vehicle:', getErrorMessage(error));
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

  // ========== HANDLER FUNCTIONS ==========

  const handleBack = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Back navigation error:', getErrorMessage(error));
    }
  };

  const handleLicenseUpload = async (type: 'front' | 'back') => {
    try {
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'front') {
          setLicenseFront(result.assets[0].uri);
        } else {
          setLicenseBack(result.assets[0].uri);
        }
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error uploading license:', errorMessage);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleContinue = async () => {
    try {
      console.log('📱 ===== CONTINUE CLICKED =====');
      
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

      // Prepare navigation params with safe values
      const navigationParams: Record<string, string> = {
        // Location data from previous screen
        pickupAddress: String(pickupAddress || ''),
        pickupLat: String(pickupLat || '0'),
        pickupLng: String(pickupLng || '0'),
        dropoffAddress: String(dropoffAddress || ''),
        dropoffLat: String(dropoffLat || '0'),
        dropoffLng: String(dropoffLng || '0'),
        
        // Waypoints data
        waypoints: waypointsParam || '[]',
        hasWaypoints: String(hasWaypoints),
        
        // Service data from previous screen
        serviceName: String(serviceName || ''),
        servicePrice: String(servicePrice || '0'),
        serviceCategory: String(serviceCategory || ''),
        serviceId: String(serviceId || ''),
        
        // Additional service data to pass through
        serviceDescription: String(serviceDescription || ''),
        serviceRating: String(serviceRating || '4.8'),
        serviceDistance: String(serviceDistance || ''),
        serviceTime: String(serviceTime || ''),
        comingFrom: String(comingFrom || ''),
        
        // Vehicle data
        vehicleType: String(selectedVehicleType || ''),
        makeModel: String(makeModel || ''),
        year: String(year || ''),
        color: String(color || ''),
        licensePlate: String(licensePlate || ''),
        selectedVehicle: selectedVehicle ? String(selectedVehicle) : '',
        
        // Contact data
        fullName: String(fullName || ''),
        phoneNumber: String(phoneNumber || ''),
        email: String(email || ''),
        emergencyContact: String(emergencyContact || ''),
        saveVehicle: String(saveVehicle),
        
        // License data for Car Rental
        licenseFront: String(licenseFront || ''),
        licenseBack: String(licenseBack || ''),
        
        // Fuel type for Fuel Delivery
        fuelType: String(fuelType || ''),
        
        // Part description for Spare Parts
        partDescription: String(partDescription || ''),
        
        // Service requirements (pass through for next screens)
        requiresDestination: String(requiresDestination),
        requiresFuelType: String(requiresFuelType),
        requiresLicense: String(requiresLicense),
        hasBooking: String(hasBooking),
        requiresTextDescription: String(requiresTextDescription),
        
        // Flag for location skipped
        locationSkipped: String(locationSkippedParam),
      };

      console.log('✅ Navigation params prepared:', Object.keys(navigationParams).length, 'params');

      // Navigate to additional details screen with all collected data
      router.push({
        pathname: '/(customer)/AdditionalDetails',
        params: navigationParams
      });
      
      console.log('✅ Navigation successful');
      console.log('===== CONTINUE COMPLETED =====\n');
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('❌===== NAVIGATION ERROR =====');
      console.error('Error:', errorMessage);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('===== ERROR END =====\n');
      
      Alert.alert(
        'Navigation Error',
        `Unable to proceed to next step.\n\nDebug: ${errorMessage}\n\nPlease try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSelectVehicle = (vehicleId: number) => {
    try {
      setSelectedVehicle(vehicleId);
      const vehicle = savedVehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicleType(vehicle.type.toLowerCase());
        setMakeModel(vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim());
        setColor(vehicle.color || '');
        setLicensePlate(vehicle.plate || '');
        setYear(vehicle.year || '');
      }
    } catch (error) {
      console.error('Error selecting vehicle:', getErrorMessage(error));
    }
  };

  const handleSelectVehicleType = (typeId: string) => {
    setSelectedVehicle(null);
    setSelectedVehicleType(typeId);
  };

  const handleManualInput = () => {
    setSelectedVehicle(null);
  };

  const getServiceHelperText = () => {
    if (serviceId === '11') {
      return "Driver's license upload required";
    } else if (serviceId === '12') {
      return "Please describe the part you need";
    } else if (serviceId === '3') {
      return "Select fuel type";
    } else if (serviceId === '9' || serviceId === '10') {
      return "This helps us identify your vehicle for the appointment";
    }
    return "This helps the provider identify your vehicle";
  };

  const getButtonText = () => {
    return 'Continue to Additional Details';
  };

  // ========== RENDER ==========

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

      {/* Location Skipped Banner - Show if location was skipped */}
      {locationSkippedParam && (
        <View style={styles.locationSkippedBanner}>
          <Ionicons name="information-circle" size={20} color="#3c3c3c" />
          <Text style={styles.locationSkippedText}>
            Location was not required for this service. You can proceed without entering a location.
          </Text>
        </View>
      )}

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


export default VehicleContactInfoScreen;
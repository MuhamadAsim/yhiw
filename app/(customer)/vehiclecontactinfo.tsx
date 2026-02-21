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

// Type definitions
interface SavedVehicle {
  id: number;
  name: string;
  type: string;
  plate: string;
  color: string;
}

interface VehicleTypeOption {
  id: string;
  label: string;
  icon: string;
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

  useEffect(() => {
    // Log received data for debugging
    console.log('VehicleContactInfo - Received data:', {
      pickupAddress,
      dropoffAddress,
      serviceName,
      servicePrice
    });
  }, []);

  const savedVehicles: SavedVehicle[] = [
    {
      id: 1,
      name: 'Toyota Camry 2020',
      type: 'Sedan',
      plate: 'ABC 1234',
      color: 'White',
    },
    {
      id: 2,
      name: 'Honda CR-V 2019',
      type: 'SUV',
      plate: 'XYZ 6678',
      color: 'Black',
    },
  ];

  const vehicleTypes: VehicleTypeOption[] = [
    { id: 'sedan', label: 'Sedan', icon: '🚗' },
    { id: 'suv', label: 'SUV', icon: '🚙' },
    { id: 'truck', label: 'Truck', icon: '🚚' },
    { id: 'van', label: 'Van', icon: '🚐' },
    { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
    { id: 'other', label: 'Other', icon: '🚘' },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
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

    // Navigate to additional details screen with all collected data
    router.push({
      pathname: '/(customer)/additionaldetails',
      params: {
        // Location data from previous screen
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
      }
    });
  };

  const handleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicle(vehicleId);
    // Populate fields with selected vehicle data
    const vehicle = savedVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicleType(vehicle.type.toLowerCase());
      setMakeModel(vehicle.name.split(' ').slice(0, 2).join(' '));
      setColor(vehicle.color);
      setLicensePlate(vehicle.plate);
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
        {/* Saved Vehicles */}
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
                  {vehicle.type} • {vehicle.plate} • {vehicle.color}
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
              This helps the provider identify your vehicle
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#3c3c3c" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          {/* Full Name */}
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

          {/* Phone Number */}
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

          {/* Email Address */}
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
            Continue to Additional Details
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
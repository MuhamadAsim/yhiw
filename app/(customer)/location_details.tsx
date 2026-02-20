

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
interface SavedLocation {
  id: number;
  icon?: any;
  title: string;
  address: string;
}

const LocationDetailsScreen = () => {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [region, setRegion] = useState<Region>({
    latitude: 26.2285,
    longitude: 50.5860,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const savedLocations: SavedLocation[] = [
    {
      id: 1,
      icon: require('../../assets/customer/home.png'), // You'll need to add this
      title: 'Home',
      address: '123 Main Street, Manama',
    },
    {
      id: 2,
      icon: require('../../assets/customer/work.png'), // You'll need to add this
      title: 'Work',
      address: 'Seef Mall, Bahrain',
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    console.log('Continue pressed');
    // Navigate to next step
  };

  const handleLocationPress = () => {
    console.log('Center on user location');
  };

  const handleAddLocation = (location: SavedLocation) => {
    console.log('Add location:', location);
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
          <Text style={styles.headerTitle}>Location Details</Text>
          <Text style={styles.headerSubtitle}>Step 1 of 7</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '14.3%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
            />
          </MapView>
          
          {/* Map View Label */}
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>MAP VIEW</Text>
          </View>

          {/* Location Button */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleLocationPress}
          >
            <Ionicons name="navigate" size={24} color="#3c3c3c" />
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Pickup Location */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Pickup Location <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.locationDot} />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup location"
                placeholderTextColor="#b0b0b0"
                value={pickupLocation}
                onChangeText={setPickupLocation}
              />
              <TouchableOpacity style={styles.inputIcon}>
                <Ionicons name="navigate-outline" size={20} color="#68bdee" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Drop-off Location */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Drop-off Location (Optional)</Text>
            <View style={styles.inputContainer}>
              <View style={[styles.locationDot, styles.locationDotEmpty]} />
              <TextInput
                style={styles.input}
                placeholder="Enter drop-off location (optional)"
                placeholderTextColor="#b0b0b0"
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
              />
              <TouchableOpacity style={styles.inputIcon}>
                <Ionicons name="add" size={24} color="#b0b0b0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Another Stop Button */}
          <TouchableOpacity style={styles.addStopButton}>
            <Ionicons name="add" size={20} color="#68bdee" />
            <Text style={styles.addStopText}>Add Another Stop</Text>
          </TouchableOpacity>

          {/* Saved Locations */}
          <View style={styles.savedLocationsSection}>
            <View style={styles.savedLocationsHeader}>
              <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {savedLocations.map((location) => (
              <View key={location.id} style={styles.savedLocationCard}>
                <View style={styles.savedLocationIconContainer}>
                  <View style={styles.savedLocationIconCircle}>
                    {location.title === 'Home' ? (
                      <Text style={styles.savedLocationEmoji}>🏠</Text>
                    ) : (
                      <Text style={styles.savedLocationEmoji}>💼</Text>
                    )}
                  </View>
                </View>
                <View style={styles.savedLocationInfo}>
                  <Text style={styles.savedLocationTitle}>
                    {location.title}
                  </Text>
                  <Text style={styles.savedLocationAddress}>
                    {location.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addLocationButton}
                  onPress={() => handleAddLocation(location)}
                >
                  <Ionicons name="add" size={24} color="#b0b0b0" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    marginRight: 16,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  mapContainer: {
    height: 400,
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 12,
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
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#68bdee',
    marginRight: 12,
  },
  locationDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#b0b0b0',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
    paddingVertical: 0,
  },
  inputIcon: {
    marginLeft: 10,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 30,
  },
  addStopText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#68bdee',
    marginLeft: 8,
  },
  savedLocationsSection: {
    marginTop: 10,
  },
  savedLocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  savedLocationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  savedLocationIconContainer: {
    marginRight: 15,
  },
  savedLocationIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLocationEmoji: {
    fontSize: 24,
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  savedLocationAddress: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  addLocationButton: {
    marginLeft: 10,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default LocationDetailsScreen;
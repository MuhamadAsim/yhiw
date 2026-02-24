import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Mock location data for Bahrain
const MOCK_LOCATIONS = [
  {
    id: '1',
    title: 'Manama Souq',
    address: 'Manama Souq, Manama, Bahrain',
    latitude: 26.2285,
    longitude: 50.5860,
  },
  {
    id: '2',
    title: 'Seef Mall',
    address: 'Seef Mall, Seef, Bahrain',
    latitude: 26.2350,
    longitude: 50.5420,
  },
  {
    id: '3',
    title: 'Bahrain International Airport',
    address: 'Bahrain International Airport, Muharraq, Bahrain',
    latitude: 26.2708,
    longitude: 50.6336,
  },
  {
    id: '4',
    title: 'City Centre Bahrain',
    address: 'City Centre Bahrain, Manama, Bahrain',
    latitude: 26.2325,
    longitude: 50.5525,
  },
  {
    id: '5',
    title: 'Bahrain Financial Harbour',
    address: 'Bahrain Financial Harbour, Manama, Bahrain',
    latitude: 26.2408,
    longitude: 50.5747,
  },
  {
    id: '6',
    title: 'The Avenues Bahrain',
    address: 'The Avenues, Bahrain',
    latitude: 26.2108,
    longitude: 50.6036,
  },
  {
    id: '7',
    title: 'Bahrain Fort',
    address: 'Qal\'at al-Bahrain, Bahrain',
    latitude: 26.2333,
    longitude: 50.5206,
  },
  {
    id: '8',
    title: 'Juffair',
    address: 'Juffair, Manama, Bahrain',
    latitude: 26.2186,
    longitude: 50.6031,
  },
];

const LocationDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [pickupCoordinates, setPickupCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<typeof MOCK_LOCATIONS>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<typeof MOCK_LOCATIONS>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [focusedInput, setFocusedInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 26.2285,
    longitude: 50.5860,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Get all service info from params
  const serviceId = getStringParam(params.serviceId);
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);
  
  // Get service-specific requirements
  const requiresDestination = getStringParam(params.requiresDestination);
  const requiresFuelType = getStringParam(params.requiresFuelType);
  const requiresLicense = getStringParam(params.requiresLicense);
  const hasBooking = getStringParam(params.hasBooking);
  const requiresTextDescription = getStringParam(params.requiresTextDescription);

  const savedLocations = [
    {
      id: 1,
      title: 'Home',
      address: '123 Main Street, Manama',
      latitude: 26.2285,
      longitude: 50.5860,
    },
    {
      id: 2,
      title: 'Work',
      address: 'Seef Mall, Bahrain',
      latitude: 26.2350,
      longitude: 50.5420,
    },
  ];

  useEffect(() => {
    getCurrentLocationAndSetDefault();
  }, []);

  const getCurrentLocationAndSetDefault = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied', 
          'Please enable location services to automatically set your current location. You can manually enter a location instead.'
        );
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      // Get address from coordinates (reverse geocoding)
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Format the address
      const formattedAddress = address ? 
        `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '') 
        : 'Current Location';

      // Set pickup location to current location
      setPickupLocation(formattedAddress || 'Current Location');
      setPickupCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Update map region
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error', 
        'Failed to get your current location. Please enter your pickup location manually.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location services to use this feature.');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address ? 
        `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '') 
        : 'Current Location';

      // Update pickup location if it's empty, otherwise just update the map
      if (!pickupCoordinates) {
        setPickupLocation(formattedAddress || 'Current Location');
        setPickupCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const searchLocation = (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 2) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
      return;
    }

    setIsLoading(true);
    
    // Filter mock locations based on query
    const filtered = MOCK_LOCATIONS.filter(loc => 
      loc.title.toLowerCase().includes(query.toLowerCase()) ||
      loc.address.toLowerCase().includes(query.toLowerCase())
    );

    setTimeout(() => {
      if (type === 'pickup') {
        setPickupSuggestions(filtered);
        setShowPickupSuggestions(filtered.length > 0);
      } else {
        setDropoffSuggestions(filtered);
        setShowDropoffSuggestions(filtered.length > 0);
      }
      setIsLoading(false);
    }, 500);
  };

  const handlePickupChange = (text: string) => {
    setPickupLocation(text);
    searchLocation(text, 'pickup');
  };

  const handleDropoffChange = (text: string) => {
    setDropoffLocation(text);
    searchLocation(text, 'dropoff');
  };

  const handleSelectLocation = (location: typeof MOCK_LOCATIONS[0], type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickupLocation(location.address);
      setPickupCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      setFocusedInput(null);
      
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      setDropoffLocation(location.address);
      setDropoffCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setDropoffSuggestions([]);
      setShowDropoffSuggestions(false);
      setFocusedInput(null);
      
      if (pickupCoordinates) {
        fitMapToCoordinates(pickupCoordinates, {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } else {
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    }
  };

  const fitMapToCoordinates = (coord1: {latitude: number, longitude: number}, coord2: {latitude: number, longitude: number}) => {
    const latitudes = [coord1.latitude, coord2.latitude];
    const longitudes = [coord1.longitude, coord2.longitude];
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;
    
    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };
    
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const handleAddSavedLocation = (location: typeof savedLocations[0]) => {
    if (!pickupCoordinates) {
      setPickupLocation(location.address);
      setPickupCoordinates({
        latitude: location.latitude!,
        longitude: location.longitude!,
      });
      
      const newRegion = {
        latitude: location.latitude!,
        longitude: location.longitude!,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else if (!dropoffCoordinates) {
      setDropoffLocation(location.address);
      setDropoffCoordinates({
        latitude: location.latitude!,
        longitude: location.longitude!,
      });
      
      fitMapToCoordinates(pickupCoordinates, {
        latitude: location.latitude!,
        longitude: location.longitude!,
      });
    } else {
      Alert.alert('Maximum locations', 'You can only add pickup and dropoff locations. Please clear one to add another.');
    }
  };

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleContinue = () => {
    if (!pickupCoordinates) {
      Alert.alert('Required field', 'Please select a pickup location');
      return;
    }

    // Navigate to next step with ALL params from previous screen
    router.push({
      pathname: '/(customer)/VehicleContactInfo',
      params: {
        // Location data
        pickupAddress: pickupLocation,
        pickupLat: pickupCoordinates?.latitude?.toString() || '',
        pickupLng: pickupCoordinates?.longitude?.toString() || '',
        dropoffAddress: dropoffLocation || '',
        dropoffLat: dropoffCoordinates?.latitude?.toString() || '',
        dropoffLng: dropoffCoordinates?.longitude?.toString() || '',
        
        // Service data (passed from ServiceDetails)
        serviceId: serviceId,
        serviceName: serviceName,
        servicePrice: servicePrice,
        serviceCategory: serviceCategory,
        
        // IMPORTANT: Pass all service-specific requirements
        requiresDestination: requiresDestination || 'false',
        requiresFuelType: requiresFuelType || 'false',
        requiresLicense: requiresLicense || 'false',
        hasBooking: hasBooking || 'false',
        requiresTextDescription: requiresTextDescription || 'false',
        
        // Flag for location (not skipped in this case)
        locationSkipped: 'false'
      }
    });
  };

  const clearLocation = (type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickupLocation('');
      setPickupCoordinates(null);
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
    } else {
      setDropoffLocation('');
      setDropoffCoordinates(null);
      setDropoffSuggestions([]);
      setShowDropoffSuggestions(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
        {isGettingLocation && (
          <ActivityIndicator size="small" color="#68bdee" />
        )}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Map View */}
        <View style={styles.mapContainer}>
          {isGettingLocation && (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="large" color="#68bdee" />
              <Text style={styles.mapLoaderText}>Getting your location...</Text>
            </View>
          )}
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {pickupCoordinates && (
              <Marker
                coordinate={pickupCoordinates}
                title="Pickup Location"
                description={pickupLocation}
                pinColor="#68bdee"
              />
            )}
            {dropoffCoordinates && (
              <Marker
                coordinate={dropoffCoordinates}
                title="Dropoff Location"
                description={dropoffLocation}
                pinColor="#ff4444"
              />
            )}
            {pickupCoordinates && dropoffCoordinates && (
              <Polyline
                coordinates={[pickupCoordinates, dropoffCoordinates]}
                strokeColor="#68bdee"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
          
          {/* Map View Label */}
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>MAP VIEW</Text>
          </View>

          {/* Location Button */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleLocationPress}
            disabled={isGettingLocation}
          >
            <Ionicons 
              name="navigate" 
              size={24} 
              color={isGettingLocation ? "#b0b0b0" : "#3c3c3c"} 
            />
          </TouchableOpacity>
        </View>

        {/* Current Location Indicator */}
        {pickupCoordinates && !isGettingLocation && (
          <View style={styles.currentLocationIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.currentLocationText}>
              Pickup location set to your current location
            </Text>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Pickup Location - with higher z-index when focused */}
          <View style={[
            styles.inputSection, 
            focusedInput === 'pickup' && styles.inputSectionFocused
          ]}>
            <Text style={styles.inputLabel}>
              Pickup Location <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <View style={[styles.locationDot, pickupCoordinates && styles.locationDotActive]} />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup location"
                placeholderTextColor="#b0b0b0"
                value={pickupLocation}
                onChangeText={handlePickupChange}
                onFocus={() => {
                  setFocusedInput('pickup');
                  if (pickupSuggestions.length > 0) {
                    setShowPickupSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setFocusedInput(null);
                    setShowPickupSuggestions(false);
                  }, 200);
                }}
                editable={!isGettingLocation}
              />
              {pickupLocation ? (
                <TouchableOpacity 
                  style={styles.inputIcon}
                  onPress={() => clearLocation('pickup')}
                >
                  <Ionicons name="close-circle" size={20} color="#b0b0b0" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.inputIcon}
                  onPress={() => getCurrentLocation()}
                  disabled={isGettingLocation}
                >
                  <Ionicons 
                    name="navigate-outline" 
                    size={20} 
                    color={isGettingLocation ? "#b0b0b0" : "#68bdee"} 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Pickup Suggestions */}
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
                ) : (
                  pickupSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(suggestion, 'pickup')}
                    >
                      <Ionicons name="location" size={20} color="#68bdee" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {suggestion.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Drop-off Location - with higher z-index when focused */}
          <View style={[
            styles.inputSection,
            focusedInput === 'dropoff' && styles.inputSectionFocused
          ]}>
            <Text style={styles.inputLabel}>Drop-off Location (Optional)</Text>
            <View style={styles.inputContainer}>
              <View style={[styles.locationDot, styles.locationDotEmpty, dropoffCoordinates && styles.locationDotActive]} />
              <TextInput
                style={styles.input}
                placeholder="Enter drop-off location (optional)"
                placeholderTextColor="#b0b0b0"
                value={dropoffLocation}
                onChangeText={handleDropoffChange}
                onFocus={() => {
                  setFocusedInput('dropoff');
                  if (dropoffSuggestions.length > 0) {
                    setShowDropoffSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setFocusedInput(null);
                    setShowDropoffSuggestions(false);
                  }, 200);
                }}
              />
              {dropoffLocation ? (
                <TouchableOpacity 
                  style={styles.inputIcon}
                  onPress={() => clearLocation('dropoff')}
                >
                  <Ionicons name="close-circle" size={20} color="#b0b0b0" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="add" size={24} color="#b0b0b0" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Dropoff Suggestions */}
            {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
                ) : (
                  dropoffSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(suggestion, 'dropoff')}
                    >
                      <Ionicons name="location" size={20} color="#ff4444" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {suggestion.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
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
              <TouchableOpacity
                key={location.id}
                style={styles.savedLocationCard}
                onPress={() => handleAddSavedLocation(location)}
              >
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
                <View style={styles.addLocationButton}>
                  <Ionicons name="add" size={24} color="#b0b0b0" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!pickupCoordinates || isGettingLocation) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!pickupCoordinates || isGettingLocation}
          activeOpacity={0.8}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
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
  mapLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLoaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#3c3c3c',
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
  currentLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 1,
  },
  currentLocationText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 25,
    position: 'relative',
    zIndex: 1,
  },
  inputSectionFocused: {
    zIndex: 1000,
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
  locationDotActive: {
    borderWidth: 2,
    borderColor: '#68bdee',
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
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 2000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loader: {
    padding: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#8c8c8c',
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
  continueButtonDisabled: {
    backgroundColor: '#b0b0b0',
    opacity: 0.5,
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
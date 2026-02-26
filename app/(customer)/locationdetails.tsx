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
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Region, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// Types
interface LocationSuggestion {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

interface SavedLocation {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'other';
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const LocationDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<Coordinates | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoadingSavedLocations, setIsLoadingSavedLocations] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // Save location modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedLocationForSave, setSelectedLocationForSave] = useState<{
    address: string;
    latitude: number;
    longitude: number;
    type: 'pickup' | 'dropoff';
  } | null>(null);
  const [saveLocationTitle, setSaveLocationTitle] = useState('');
  const [saveLocationType, setSaveLocationType] = useState<'home' | 'work' | 'other'>('home');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  
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

  // Load user token and saved locations on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get user token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        // Load saved locations after getting token
        await fetchSavedLocations(token);
      } else {
        console.log('No user token found - continuing without saved locations');
        // Still set isGettingLocation to false even without token
        setIsGettingLocation(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't show alert, just continue without saved locations
    } finally {
      setIsLoadingSavedLocations(false);
      setIsGettingLocation(false);
    }
  };

  const fetchSavedLocations = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Just log error and continue with empty saved locations
        console.log('Could not fetch saved locations, continuing with empty list');
        setSavedLocations([]);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSavedLocations(data.data);
      } else {
        setSavedLocations([]);
      }
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      // Silently fail and set empty array
      setSavedLocations([]);
    }
  };

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

  const searchLocation = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
      return;
    }

    setIsSearching(true);
    
    try {
      // Try backend search first if token exists
      if (userToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              const suggestions = data.data.map((item: any) => ({
                id: item.id || item.placeId,
                title: item.title || item.name,
                address: item.address,
                latitude: item.latitude,
                longitude: item.longitude,
                placeId: item.placeId,
              }));

              if (type === 'pickup') {
                setPickupSuggestions(suggestions);
                setShowPickupSuggestions(suggestions.length > 0);
              } else {
                setDropoffSuggestions(suggestions);
                setShowDropoffSuggestions(suggestions.length > 0);
              }
              setIsSearching(false);
              return;
            }
          }
        } catch (backendError) {
          console.log('Backend search failed, falling back to device geocoding');
        }
      }

      // Fallback to device geocoding
      const geocodeResults = await Location.geocodeAsync(query);
      
      if (geocodeResults.length > 0) {
        const suggestions: LocationSuggestion[] = [];
        
        // Get addresses for first 5 results
        for (let i = 0; i < Math.min(geocodeResults.length, 5); i++) {
          const result = geocodeResults[i];
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            
            const formattedAddress = address ? 
              `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.replace(/^, |, $/g, '') 
              : `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`;

            suggestions.push({
              id: `geo-${i}-${Date.now()}`,
              title: address?.street || address?.name || query,
              address: formattedAddress,
              latitude: result.latitude,
              longitude: result.longitude,
            });
          } catch (reverseError) {
            // If reverse geocoding fails, just use coordinates
            suggestions.push({
              id: `geo-${i}-${Date.now()}`,
              title: query,
              address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
              latitude: result.latitude,
              longitude: result.longitude,
            });
          }
        }

        if (type === 'pickup') {
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(suggestions.length > 0);
        } else {
          setDropoffSuggestions(suggestions);
          setShowDropoffSuggestions(suggestions.length > 0);
        }
      } else {
        // No results found
        if (type === 'pickup') {
          setPickupSuggestions([]);
          setShowPickupSuggestions(false);
        } else {
          setDropoffSuggestions([]);
          setShowDropoffSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      // Clear suggestions on error
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickupChange = (text: string) => {
    setPickupLocation(text);
    searchLocation(text, 'pickup');
  };

  const handleDropoffChange = (text: string) => {
    setDropoffLocation(text);
    searchLocation(text, 'dropoff');
  };

  const handleSelectLocation = (location: LocationSuggestion, type: 'pickup' | 'dropoff') => {
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

      // Show save location option
      setTimeout(() => {
        Alert.alert(
          'Save Location',
          'Would you like to save this location for future use?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Save', onPress: () => openSaveLocationModal(location, type) }
          ]
        );
      }, 500);
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

      // Show save location option
      setTimeout(() => {
        Alert.alert(
          'Save Location',
          'Would you like to save this location for future use?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Save', onPress: () => openSaveLocationModal(location, type) }
          ]
        );
      }, 500);
    }

    // Try to save to recent locations (silently fail if it doesn't work)
    if (userToken) {
      saveRecentLocation(location).catch(() => {});
    }
  };

  const openSaveLocationModal = (location: LocationSuggestion, type: 'pickup' | 'dropoff') => {
    setSelectedLocationForSave({
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      type: type,
    });
    setSaveLocationTitle(location.title || 'My Location');
    setSaveLocationType('home');
    setShowSaveModal(true);
  };

  const saveLocationToBackend = async () => {
    if (!selectedLocationForSave || !userToken) {
      Alert.alert('Error', 'You need to be signed in to save locations');
      setShowSaveModal(false);
      return;
    }

    if (!saveLocationTitle.trim()) {
      Alert.alert('Error', 'Please enter a name for this location');
      return;
    }

    setIsSavingLocation(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: saveLocationTitle,
          address: selectedLocationForSave.address,
          latitude: selectedLocationForSave.latitude,
          longitude: selectedLocationForSave.longitude,
          type: saveLocationType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save location');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Add the new location to saved locations list
        setSavedLocations(prev => [data.data, ...prev]);
        
        Alert.alert(
          'Success',
          'Location saved successfully!',
          [{ text: 'OK' }]
        );
        
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert(
        'Error',
        'Failed to save location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSavingLocation(false);
    }
  };

  const saveRecentLocation = async (location: LocationSuggestion) => {
    if (!userToken) return;

    try {
      await fetch(`${API_BASE_URL}/users/recent-locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: location.title,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          placeId: location.placeId,
        }),
      });
    } catch (error) {
      // Silently fail - don't show error to user
      console.log('Failed to save recent location');
    }
  };

  const fitMapToCoordinates = (coord1: Coordinates, coord2: Coordinates) => {
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

  const handleAddSavedLocation = (location: SavedLocation) => {
    if (!pickupCoordinates) {
      setPickupLocation(location.address);
      setPickupCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else if (!dropoffCoordinates) {
      setDropoffLocation(location.address);
      setDropoffCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      
      fitMapToCoordinates(pickupCoordinates, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } else {
      Alert.alert('Maximum locations', 'You can only add pickup and dropoff locations. Please clear one to add another.');
    }
  };

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleContinue = async () => {
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

  // Get icon for saved location type
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home':
        return '🏠';
      case 'work':
        return '💼';
      default:
        return '📍';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
        bounces={false}
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
              size={Math.min(24, width * 0.06)} 
              color={isGettingLocation ? "#b0b0b0" : "#3c3c3c"} 
            />
          </TouchableOpacity>
        </View>

        {/* Current Location Indicator */}
        {pickupCoordinates && !isGettingLocation && (
          <View style={styles.currentLocationIndicator}>
            <Ionicons name="checkmark-circle" size={Math.min(20, width * 0.05)} color="#4CAF50" />
            <Text style={styles.currentLocationText} numberOfLines={1}>
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
                  <Ionicons name="close-circle" size={Math.min(20, width * 0.05)} color="#b0b0b0" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.inputIcon}
                  onPress={() => getCurrentLocation()}
                  disabled={isGettingLocation}
                >
                  <Ionicons 
                    name="navigate-outline" 
                    size={Math.min(20, width * 0.05)} 
                    color={isGettingLocation ? "#b0b0b0" : "#68bdee"} 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Pickup Suggestions */}
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
                ) : (
                  pickupSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(suggestion, 'pickup')}
                    >
                      <Ionicons name="location" size={Math.min(20, width * 0.05)} color="#68bdee" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>{suggestion.title}</Text>
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
                  <Ionicons name="close-circle" size={Math.min(20, width * 0.05)} color="#b0b0b0" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="add" size={Math.min(24, width * 0.06)} color="#b0b0b0" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Dropoff Suggestions */}
            {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
                ) : (
                  dropoffSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(suggestion, 'dropoff')}
                    >
                      <Ionicons name="location" size={Math.min(20, width * 0.05)} color="#ff4444" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>{suggestion.title}</Text>
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
            <Ionicons name="add" size={Math.min(20, width * 0.05)} color="#68bdee" />
            <Text style={styles.addStopText}>Add Another Stop</Text>
          </TouchableOpacity>

          {/* Saved Locations */}
          <View style={styles.savedLocationsSection}>
            <View style={styles.savedLocationsHeader}>
              <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
              {userToken && savedLocations.length > 0 && (
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoadingSavedLocations ? (
              <ActivityIndicator size="small" color="#68bdee" style={styles.loader} />
            ) : savedLocations.length > 0 ? (
              savedLocations.slice(0, 3).map((location) => ( // Show only first 3
                <TouchableOpacity
                  key={location.id}
                  style={styles.savedLocationCard}
                  onPress={() => handleAddSavedLocation(location)}
                >
                  <View style={styles.savedLocationIconContainer}>
                    <View style={styles.savedLocationIconCircle}>
                      <Text style={styles.savedLocationEmoji}>
                        {getLocationIcon(location.type)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.savedLocationInfo}>
                    <Text style={styles.savedLocationTitle} numberOfLines={1}>
                      {location.title}
                    </Text>
                    <Text style={styles.savedLocationAddress} numberOfLines={1}>
                      {location.address}
                    </Text>
                  </View>
                  <View style={styles.addLocationButton}>
                    <Ionicons name="add" size={Math.min(24, width * 0.06)} color="#b0b0b0" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptySavedContainer}>
                <Text style={styles.emptySavedText}>
                  {userToken ? 'No saved locations yet' : 'Sign in to save locations'}
                </Text>
              </View>
            )}
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

      {/* Save Location Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Location</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="close" size={Math.min(24, width * 0.06)} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Location Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Home, Work, Gym"
                  placeholderTextColor="#b0b0b0"
                  value={saveLocationTitle}
                  onChangeText={setSaveLocationTitle}
                />

                <Text style={styles.modalLabel}>Location Type</Text>
                <View style={styles.locationTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.locationTypeButton,
                      saveLocationType === 'home' && styles.locationTypeButtonActive
                    ]}
                    onPress={() => setSaveLocationType('home')}
                  >
                    <Text style={styles.locationTypeEmoji}>🏠</Text>
                    <Text style={[
                      styles.locationTypeText,
                      saveLocationType === 'home' && styles.locationTypeTextActive
                    ]}>Home</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.locationTypeButton,
                      saveLocationType === 'work' && styles.locationTypeButtonActive
                    ]}
                    onPress={() => setSaveLocationType('work')}
                  >
                    <Text style={styles.locationTypeEmoji}>💼</Text>
                    <Text style={[
                      styles.locationTypeText,
                      saveLocationType === 'work' && styles.locationTypeTextActive
                    ]}>Work</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.locationTypeButton,
                      saveLocationType === 'other' && styles.locationTypeButtonActive
                    ]}
                    onPress={() => setSaveLocationType('other')}
                  >
                    <Text style={styles.locationTypeEmoji}>📍</Text>
                    <Text style={[
                      styles.locationTypeText,
                      saveLocationType === 'other' && styles.locationTypeTextActive
                    ]}>Other</Text>
                  </TouchableOpacity>
                </View>

                {selectedLocationForSave && (
                  <View style={styles.modalAddressPreview}>
                    <Ionicons name="location" size={Math.min(20, width * 0.05)} color="#68bdee" />
                    <Text style={styles.modalAddressText} numberOfLines={2}>
                      {selectedLocationForSave.address}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, isSavingLocation && styles.modalSaveButtonDisabled]}
                onPress={saveLocationToBackend}
                disabled={isSavingLocation}
              >
                {isSavingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? height * 0.06 : height * 0.03,
    paddingBottom: height * 0.02,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: width * 0.04,
  },
  backButtonImage: {
    width: width * 0.12,
    height: width * 0.12,
    maxWidth: 46,
    maxHeight: 46,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: Math.min(11, width * 0.03),
    color: '#8c8c8c',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
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
    paddingBottom: height * 0.02,
  },
  mapContainer: {
    height: height * 0.35,
    maxHeight: 400,
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
    fontSize: Math.min(14, width * 0.035),
    color: '#3c3c3c',
  },
  mapLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 20,
  },
  mapLabelText: {
    fontSize: Math.min(12, width * 0.03),
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  locationButton: {
    position: 'absolute',
    bottom: height * 0.02,
    right: width * 0.05,
    width: width * 0.12,
    height: width * 0.12,
    maxWidth: 50,
    maxHeight: 50,
    borderRadius: (width * 0.12) / 2,
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
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    marginTop: 1,
  },
  currentLocationText: {
    fontSize: Math.min(12, width * 0.03),
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.02,
  },
  inputSection: {
    marginBottom: height * 0.03,
    position: 'relative',
    zIndex: 1,
  },
  inputSectionFocused: {
    zIndex: 1000,
  },
  inputLabel: {
    fontSize: Math.min(12, width * 0.03),
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: height * 0.015,
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
    paddingHorizontal: width * 0.04,
    paddingVertical: Platform.OS === 'ios' ? height * 0.015 : 0,
    minHeight: 50,
    backgroundColor: '#FFFFFF',
  },
  locationDot: {
    width: width * 0.03,
    height: width * 0.03,
    maxWidth: 12,
    maxHeight: 12,
    borderRadius: (width * 0.03) / 2,
    backgroundColor: '#68bdee',
    marginRight: width * 0.03,
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
    fontSize: Math.min(14, width * 0.035),
    color: '#3c3c3c',
    paddingVertical: Platform.OS === 'ios' ? height * 0.015 : 0,
  },
  inputIcon: {
    marginLeft: width * 0.02,
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
    maxHeight: height * 0.3,
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
    padding: height * 0.02,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  suggestionTitle: {
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: Math.min(12, width * 0.03),
    color: '#8c8c8c',
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 12,
    paddingVertical: height * 0.018,
    marginBottom: height * 0.035,
  },
  addStopText: {
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
    color: '#68bdee',
    marginLeft: width * 0.02,
  },
  savedLocationsSection: {
    marginTop: height * 0.01,
  },
  savedLocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.018,
  },
  savedLocationsTitle: {
    fontSize: Math.min(12, width * 0.03),
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: Math.min(12, width * 0.03),
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
    padding: width * 0.04,
    marginBottom: height * 0.015,
    backgroundColor: '#FFFFFF',
  },
  savedLocationIconContainer: {
    marginRight: width * 0.04,
  },
  savedLocationIconCircle: {
    width: width * 0.12,
    height: width * 0.12,
    maxWidth: 50,
    maxHeight: 50,
    borderRadius: (width * 0.12) / 2,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLocationEmoji: {
    fontSize: Math.min(24, width * 0.06),
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationTitle: {
    fontSize: Math.min(14, width * 0.035),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  savedLocationAddress: {
    fontSize: Math.min(12, width * 0.03),
    color: '#8c8c8c',
  },
  addLocationButton: {
    marginLeft: width * 0.02,
  },
  emptySavedContainer: {
    padding: height * 0.03,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  emptySavedText: {
    fontSize: Math.min(14, width * 0.035),
    color: '#8c8c8c',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
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
    paddingVertical: height * 0.02,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#b0b0b0',
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: width * 0.05,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  modalTitle: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  modalBody: {
    flex: 1,
  },
  modalLabel: {
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: height * 0.01,
    marginTop: height * 0.02,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: width * 0.03,
    fontSize: Math.min(14, width * 0.035),
    color: '#3c3c3c',
  },
  locationTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
  },
  locationTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: width * 0.03,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: width * 0.01,
  },
  locationTypeButtonActive: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  locationTypeEmoji: {
    fontSize: Math.min(24, width * 0.06),
    marginBottom: 4,
  },
  locationTypeText: {
    fontSize: Math.min(12, width * 0.03),
    color: '#8c8c8c',
  },
  locationTypeTextActive: {
    color: '#68bdee',
    fontWeight: '600',
  },
  modalAddressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: width * 0.03,
    borderRadius: 8,
    marginTop: height * 0.02,
  },
  modalAddressText: {
    flex: 1,
    fontSize: Math.min(12, width * 0.03),
    color: '#3c3c3c',
    marginLeft: width * 0.02,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.03,
    paddingTop: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    flex: 1,
    padding: height * 0.018,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginRight: width * 0.02,
  },
  modalCancelButtonText: {
    fontSize: Math.min(14, width * 0.035),
    color: '#8c8c8c',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: height * 0.018,
    borderRadius: 8,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    marginLeft: width * 0.02,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  modalSaveButtonText: {
    fontSize: Math.min(14, width * 0.035),
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LocationDetailsScreen;
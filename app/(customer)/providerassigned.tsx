import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { customerWebSocket } from '../../services/websocket.service';

const { height, width } = Dimensions.get('window');

// Google Maps API Keys
const ANDROID_API_KEY = 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A';
const IOS_API_KEY = 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU';

interface ProviderLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  lastUpdate?: string;
}

const ProviderAssignedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely get number from params
  const getNumberParam = (param: string | string[] | undefined): number | null => {
    if (!param) return null;
    const value = Array.isArray(param) ? param[0] : param;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  // Get provider data from params
  const providerName = getStringParam(params.providerName) || 'Ahmed Al-Khalifa';
  const providerRating = getStringParam(params.providerRating) || '4.8';
  const providerImage = getStringParam(params.providerImage);
  const providerPhone = getStringParam(params.providerPhone) || '+973 3312 4567';
  const vehicleDetails = getStringParam(params.vehicleDetails) || 'White Flatbed Truck';
  const licensePlate = getStringParam(params.licensePlate) || 'BHR 5432';
  const estimatedArrival = getStringParam(params.estimatedArrival) || '15';
  
  // Get booking data from params
  const bookingId = getStringParam(params.bookingId);
  const serviceName = getStringParam(params.serviceName) || 'Roadside Towing';
  const vehicleType = getStringParam(params.vehicleType) || 'Sedan';
  const pickupAddress = getStringParam(params.pickupAddress) || '123 Main Street, Manama';
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const totalAmount = getStringParam(params.totalAmount) || '89.25';
  
  // Get coordinates
  const pickupLat = getNumberParam(params.pickupLat) || 26.2285;
  const pickupLng = getNumberParam(params.pickupLng) || 50.5860;
  const providerLat = getNumberParam(params.providerLat);
  const providerLng = getNumberParam(params.providerLng);
  const dropoffLat = getNumberParam(params.dropoffLat);
  const dropoffLng = getNumberParam(params.dropoffLng);
  const API_BASE_URL = 'https://yhiw-backend.onrender.com';

  // Check if this is a "no providers" scenario
  const noProviders = getStringParam(params.noProviders) === 'true';

  useEffect(() => {
    if (!noProviders && bookingId) {
      setupWebSocketListeners();
      startEtaCountdown();
    }

    return () => {
      removeWebSocketListeners();
    };
  }, [bookingId]);

  const setupWebSocketListeners = () => {
    // Listen for provider location updates
    customerWebSocket.on('provider_location', handleProviderLocationUpdate);
    customerWebSocket.on('provider_status_update', handleProviderStatusUpdate);
    customerWebSocket.on('connection_change', handleConnectionChange);

    // Request initial provider location
    customerWebSocket.send('request_provider_location', { bookingId });
  };

  const removeWebSocketListeners = () => {
    customerWebSocket.off('provider_location', handleProviderLocationUpdate);
    customerWebSocket.off('provider_status_update', handleProviderStatusUpdate);
    customerWebSocket.off('connection_change', handleConnectionChange);
  };

  const handleProviderLocationUpdate = (data: any) => {
    console.log('Provider location update:', data);
    
    if (data.latitude && data.longitude) {
      const newLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        lastUpdate: data.timestamp || new Date().toISOString(),
      };
      
      setProviderLocation(newLocation);
      
      // Center map to show both provider and pickup
      if (mapRef.current && providerLat && providerLng) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: newLocation.latitude, longitude: newLocation.longitude },
            { latitude: pickupLat, longitude: pickupLng }
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
      
      setIsLoading(false);
    }
  };

  const handleProviderStatusUpdate = (data: any) => {
    console.log('Provider status update:', data);
    
    if (data.status === 'arrived') {
      Alert.alert(
        'Provider Arrived',
        `${providerName} has arrived at your location.`,
        [{ text: 'OK' }]
      );
    } else if (data.status === 'en-route') {
      // Update ETA if provided
      if (data.estimatedArrival) {
        setTimeRemaining(parseInt(data.estimatedArrival) * 60);
      }
    }
  };

  const handleConnectionChange = (isConnected: boolean) => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    
    if (!isConnected) {
      // Try to reconnect
      setTimeout(() => {
        setConnectionStatus('reconnecting');
        customerWebSocket.connect('customer');
      }, 3000);
    }
  };

  const startEtaCountdown = () => {
    const etaMinutes = parseInt(estimatedArrival);
    if (isNaN(etaMinutes)) return;

    setTimeRemaining(etaMinutes * 60);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Error', 'Provider phone number not available');
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: {
        providerName,
        bookingId,
        providerId: getStringParam(params.providerId),
      }
    });
  };

  const handleTrackProvider = () => {
    if (providerLocation) {
      router.push({
        pathname: '/(customer)/LiveTracking',
        params: {
          bookingId,
          providerName,
          providerLat: providerLocation.latitude.toString(),
          providerLng: providerLocation.longitude.toString(),
          pickupLat: pickupLat.toString(),
          pickupLng: pickupLng.toString(),
          estimatedArrival: timeRemaining.toString(),
        }
      });
    } else {
      Alert.alert('Tracking', 'Provider location is being updated...');
    }
  };

  const handleOpenInMaps = () => {
    if (providerLocation) {
      const url = Platform.select({
        ios: `maps://app?saddr=${providerLocation.latitude},${providerLocation.longitude}&daddr=${pickupLat},${pickupLng}`,
        android: `google.navigation:q=${pickupLat},${pickupLng}`,
      });
      
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            // Send cancellation via WebSocket
            customerWebSocket.send('cancel_booking', { bookingId });
            
            // API call to cancel booking
            fetch(`${API_BASE_URL}/api/jobs/customer/${bookingId}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getStringParam(params.token)}`,
                'Content-Type': 'application/json',
              },
            }).catch(err => console.error('Cancel error:', err));

            router.back();
          }
        }
      ]
    );
  };

  // If no providers found, show appropriate message
  if (noProviders) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle-outline" size={80} color="#ff4444" />
          </View>
          <Text style={styles.title}>No Providers Available</Text>
          <Text style={styles.subtitle}>
            We couldn't find any providers in your area at this time. Please try again later.
          </Text>
          
          <TouchableOpacity
            style={[styles.trackButton, { marginTop: 30 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.trackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/provider_assigned/tick.png')}
            style={styles.tickIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Provider Assigned!</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Your service provider is on the way</Text>

        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <View style={[
            styles.connectionStatus,
            connectionStatus === 'reconnecting' ? styles.reconnectingStatus : styles.disconnectedStatus
          ]}>
            <ActivityIndicator size="small" color={connectionStatus === 'reconnecting' ? '#F59E0B' : '#EF4444'} />
            <Text style={[
              styles.connectionText,
              connectionStatus === 'reconnecting' ? styles.reconnectingText : styles.disconnectedText
            ]}>
              {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Connection lost - Using last known location'}
            </Text>
          </View>
        )}

        {/* Map Section - Google Maps Integration */}
        <View style={styles.mapContainer}>
          {/* ETA Badge */}
          <View style={styles.etaBadge}>
            <Text style={styles.etaLabel}>ARRIVAL IN</Text>
            <Text style={styles.etaTime}>
              {timeRemaining > 0 ? formatTime(timeRemaining) : `${estimatedArrival} min`}
            </Text>
          </View>

          {/* Google Maps */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (providerLat || pickupLat),
              longitude: (providerLng || pickupLng),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsTraffic={true}
          >
            {/* Pickup Location Marker */}
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              title="Pickup Location"
              description={pickupAddress}
            >
              <View style={styles.pickupMarkerContainer}>
                <View style={styles.pickupMarkerDot} />
              </View>
            </Marker>

            {/* Provider Location Marker */}
            {providerLocation && (
              <Marker
                coordinate={providerLocation}
                title={providerName}
                description="Your provider"
              >
                <View style={styles.providerMarkerContainer}>
                  <Ionicons name="car" size={24} color="#68bdee" />
                </View>
              </Marker>
            )}

            {/* Dropoff Location Marker (if available) */}
            {dropoffLat && dropoffLng && (
              <Marker
                coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
                title="Dropoff Location"
                description={dropoffAddress}
              >
                <View style={styles.dropoffMarkerContainer}>
                  <Ionicons name="flag" size={20} color="#10B981" />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Map Overlay Buttons */}
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={() => {
              if (providerLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: providerLocation.latitude,
                  longitude: providerLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }
            }}
          >
            <Ionicons name="locate" size={20} color="#68bdee" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={handleOpenInMaps}
          >
            <Ionicons name="navigate-outline" size={20} color="#68bdee" />
          </TouchableOpacity>
        </View>

        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              {providerImage ? (
                <Image source={{ uri: providerImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={40} color="#68bdee" />
              )}
            </View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>{providerRating}</Text>
                <Text style={styles.reviewsText}>• {getStringParam(params.totalRatings) || '127'} reviews</Text>
              </View>
              <Text style={styles.vehicleInfo}>{vehicleDetails}</Text>
              <Text style={styles.plateNumber}>{licensePlate}</Text>
            </View>
          </View>

          {/* Provider Location Info */}
          {providerLocation && (
            <View style={styles.locationInfoContainer}>
              <Ionicons name="location" size={14} color="#68bdee" />
              <Text style={styles.locationInfoText}>
                Last updated: {new Date(providerLocation.lastUpdate || '').toLocaleTimeString()}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#68bdee" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#68bdee" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>
          
          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingId?.slice(-8) || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{vehicleType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {pickupAddress}
            </Text>
          </View>

          {dropoffAddress ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {dropoffAddress}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Cost</Text>
            <Text style={styles.detailValueHighlight}>{totalAmount} BHD</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>JOB STATUS</Text>
          
          <View style={styles.cardDivider} />

          {/* Status Item 1 - Active */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxActive}>
              <View style={styles.statusDotActive} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextActive}>Provider Assigned</Text>
              <Text style={styles.statusTimeActive}>Just now</Text>
            </View>
          </View>

          {/* Status Item 2 - In progress (current) */}
          <View style={styles.statusItem}>
            <View style={[styles.statusCheckboxInactive, providerLocation && styles.statusCheckboxActive]}>
              {providerLocation && <View style={styles.statusDotActive} />}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTextInactive, providerLocation && styles.statusTextActive]}>
                Provider On the Way
              </Text>
              <Text style={[styles.statusTimeInactive, providerLocation && styles.statusTimeActive]}>
                {providerLocation ? 'Live tracking active' : `ETA: ${estimatedArrival} minutes`}
              </Text>
            </View>
          </View>

          {/* Status Item 3 - Waiting */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxInactive} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextInactive}>Service In Progress</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrackProvider}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.trackButtonText}>Track Provider Live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: height * 0.04,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: Math.min(80, height * 0.1),
    height: Math.min(80, height * 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
    backgroundColor: 'transparent',
  },
  tickIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Math.min(22, height * 0.028),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: height * 0.01,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(12, height * 0.015),
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: height * 0.025,
    letterSpacing: 0.3,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    width: '100%',
  },
  disconnectedStatus: {
    backgroundColor: '#FEE2E2',
  },
  reconnectingStatus: {
    backgroundColor: '#FEF3C7',
  },
  connectionText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  disconnectedText: {
    color: '#DC2626',
  },
  reconnectingText: {
    color: '#F59E0B',
  },
  mapContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  etaBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    zIndex: 10,
    elevation: 5,
  },
  etaLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  etaTime: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  recenterButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
    elevation: 5,
  },
  openMapsButton: {
    position: 'absolute',
    top: 70,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10,
    elevation: 5,
  },
  pickupMarkerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  pickupMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  providerMarkerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  dropoffMarkerContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  providerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#68bdee',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#5c5c5c',
    marginBottom: 4,
  },
  plateNumber: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '600',
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationInfoText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardWithBorder: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 0,
    marginTop: 5,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 0.6,
    textAlign: 'right',
  },
  detailValueHighlight: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    flex: 0.6,
    textAlign: 'right',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusCheckboxActive: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 9,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  statusDotActive: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  statusCheckboxInactive: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    borderRadius: 9,
    marginRight: 12,
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTextActive: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusTimeActive: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusTextInactive: {
    fontSize: 14,
    color: '#b0b0b0',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusTimeInactive: {
    fontSize: 11,
    color: '#d0d0d0',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
  trackButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ProviderAssignedScreen;
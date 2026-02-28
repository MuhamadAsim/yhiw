import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { customerWebSocket } from '../../services/websocket.service';

const { height, width } = Dimensions.get('window');

// Google Maps API Keys
const ANDROID_API_KEY = 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A';
const IOS_API_KEY = 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ProviderLocation extends Coordinates {
  heading?: number;
  speed?: number;
  lastUpdate?: string;
}

interface UpdateEvent {
  id: string;
  type: 'accepted' | 'en-route' | 'arrived' | 'started' | 'completed';
  message: string;
  timestamp: Date;
}

const TrackProviderScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<Coordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [eta, setEta] = useState<string>('5 min');
  const [distance, setDistance] = useState<string>('1.2 km');
  const [providerName, setProviderName] = useState<string>('Ahmed Al-Khalifa');
  const [providerPhone, setProviderPhone] = useState<string>('');
  const [updates, setUpdates] = useState<UpdateEvent[]>([
    {
      id: '1',
      type: 'accepted',
      message: 'Provider accepted request',
      timestamp: new Date(Date.now() - 2 * 60000),
    },
    {
      id: '2',
      type: 'en-route',
      message: 'Provider started journey',
      timestamp: new Date(Date.now() - 1 * 60000),
    },
  ]);

  const [region, setRegion] = useState<Region>({
    latitude: 26.2285,
    longitude: 50.5860,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Extract params
  const bookingId = params.bookingId as string;
  const providerLat = parseFloat(params.providerLat as string);
  const providerLng = parseFloat(params.providerLng as string);
  const pickupLat = parseFloat(params.pickupLat as string);
  const pickupLng = parseFloat(params.pickupLng as string);
  const dropoffLat = parseFloat(params.dropoffLat as string);
  const dropoffLng = parseFloat(params.dropoffLng as string);
  const providerNameParam = params.providerName as string;
  const estimatedArrival = params.estimatedArrival as string;

  useEffect(() => {
    if (providerNameParam) setProviderName(providerNameParam);
    
    // Set initial locations from params
    if (!isNaN(providerLat) && !isNaN(providerLng)) {
      setProviderLocation({
        latitude: providerLat,
        longitude: providerLng,
        lastUpdate: new Date().toISOString(),
      });
    }

    if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
      setPickupLocation({ latitude: pickupLat, longitude: pickupLng });
    }

    if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
      setDropoffLocation({ latitude: dropoffLat, longitude: dropoffLng });
    }

    if (estimatedArrival) {
      setEta(estimatedArrival);
    }

    // Setup WebSocket listeners
    setupWebSocketListeners();

    // Get current user location
    getUserLocation();

    return () => {
      removeWebSocketListeners();
    };
  }, []);

  const setupWebSocketListeners = () => {
    customerWebSocket.on('provider_location', handleProviderLocationUpdate);
    customerWebSocket.on('provider_status_update', handleProviderStatusUpdate);
    customerWebSocket.on('connection_change', handleConnectionChange);
    customerWebSocket.on('eta_update', handleEtaUpdate);

    // Request initial provider location
    if (bookingId) {
      customerWebSocket.send('request_provider_location', { bookingId });
    }
  };

  const removeWebSocketListeners = () => {
    customerWebSocket.off('provider_location', handleProviderLocationUpdate);
    customerWebSocket.off('provider_status_update', handleProviderStatusUpdate);
    customerWebSocket.off('connection_change', handleConnectionChange);
    customerWebSocket.off('eta_update', handleEtaUpdate);
  };

  const handleProviderLocationUpdate = (data: any) => {
    console.log('Provider location update:', data);
    
    if (data.latitude && data.longitude) {
      const newLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        lastUpdate: data.timestamp || new Date().toISOString(),
      };
      
      setProviderLocation(newLocation);
      
      // Update route between provider and pickup
      if (pickupLocation) {
        getRoute(newLocation, pickupLocation);
      }

      // Fit map to show both provider and pickup
      fitMapToCoordinates(newLocation, pickupLocation || newLocation);
      
      setIsLoading(false);
    }
  };

  const handleProviderStatusUpdate = (data: any) => {
    console.log('Provider status update:', data);
    
    // Add new update to the list
    const newUpdate: UpdateEvent = {
      id: Date.now().toString(),
      type: data.status,
      message: data.message || getStatusMessage(data.status),
      timestamp: new Date(),
    };
    
    setUpdates(prev => [newUpdate, ...prev]);
    
    // Update ETA if provided
    if (data.eta) {
      setEta(data.eta);
    }
    
    // Update distance if provided
    if (data.distance) {
      setDistance(data.distance);
    }
    
    // Show alert for important status changes
    if (data.status === 'arrived') {
      Alert.alert(
        'Provider Arrived',
        `${providerName} has arrived at your location.`,
        [{ text: 'OK' }]
      );
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

  const handleEtaUpdate = (data: any) => {
    if (data.eta) setEta(data.eta);
    if (data.distance) setDistance(data.distance);
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'accepted': return 'Provider accepted your request';
      case 'en-route': return 'Provider is on the way';
      case 'arrived': return 'Provider has arrived';
      case 'started': return 'Service started';
      case 'completed': return 'Service completed';
      default: return `Provider ${status}`;
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for tracking');
        return;
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
    }
  };

  const getRoute = async (origin: Coordinates, destination: Coordinates) => {
    try {
      const apiKey = Platform.select({
        android: ANDROID_API_KEY,
        ios: IOS_API_KEY,
      });

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
        
        // Update ETA and distance from route
        if (data.routes[0].legs.length > 0) {
          const leg = data.routes[0].legs[0];
          setEta(leg.duration.text);
          setDistance(leg.distance.text);
        }
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  const decodePolyline = (t: string, e: number = 5) => {
    let points = [];
    let lat = 0;
    let lng = 0;
    let index = 0;
    let shift = 0;
    let result = 0;

    while (index < t.length) {
      let b = 0;
      shift = 0;
      result = 0;
      
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    
    return points;
  };

  const fitMapToCoordinates = (coord1: Coordinates, coord2: Coordinates) => {
    if (!mapRef.current) return;
    
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
    mapRef.current.animateToRegion(newRegion, 1000);
  };

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Call', `Calling ${providerName}...`);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/(customer)/Chat',
      params: {
        providerName,
        bookingId,
      }
    });
  };

  const handleStartService = () => {
    Alert.alert(
      'Start Service',
      'Have you arrived at the location and are you ready to start the service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start',
          onPress: () => {
            // Send start service via WebSocket
            customerWebSocket.send('start_service', { bookingId });
            
            // Navigate to service in progress screen
            router.push({
              pathname: '/(customer)/ServiceInProgress',
              params: {
                bookingId,
                providerName,
              }
            });
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => Linking.openURL('tel:+97312345678') },
        { text: 'Chat Support', onPress: () => console.log('Open chat support') },
      ]
    );
  };

  const handleRecenter = () => {
    if (providerLocation && pickupLocation) {
      fitMapToCoordinates(providerLocation, pickupLocation);
    } else if (providerLocation) {
      mapRef.current?.animateToRegion({
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleOpenInMaps = () => {
    if (providerLocation && pickupLocation) {
      const url = Platform.select({
        ios: `maps://app?saddr=${providerLocation.latitude},${providerLocation.longitude}&daddr=${pickupLocation.latitude},${pickupLocation.longitude}`,
        android: `google.navigation:q=${pickupLocation.latitude},${pickupLocation.longitude}`,
      });
      
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  // Format time for updates
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} min ago`;
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapSection}>
        {isLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color="#68bdee" />
            <Text style={styles.mapLoaderText}>Loading provider location...</Text>
          </View>
        )}

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
          showsCompass={true}
        >
          {/* Provider Marker */}
          {providerLocation && (
            <Marker
              coordinate={providerLocation}
              title={providerName}
              description="Your provider"
            >
              <View style={styles.providerMarker}>
                <Ionicons name="car" size={24} color="#68bdee" />
              </View>
            </Marker>
          )}

          {/* Pickup Marker */}
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              title="Your Location"
              description="Pickup point"
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={24} color="#ff4444" />
              </View>
            </Marker>
          )}

          {/* Dropoff Marker (if available) */}
          {dropoffLocation && (
            <Marker
              coordinate={dropoffLocation}
              title="Destination"
              description="Dropoff point"
              pinColor="#10B981"
            />
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#68bdee"
            />
          )}
        </MapView>

        {/* Arriving Badge */}
        <View style={styles.arrivingBadge}>
          <Ionicons name="time-outline" size={18} color="#3c3c3c" />
          <View>
            <Text style={styles.arrivingLabel}>Arriving in</Text>
            <Text style={styles.arrivingTime}>{eta}</Text>
          </View>
        </View>

        {/* Map Controls */}
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={20} color="#68bdee" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapsButton} onPress={handleOpenInMaps}>
          <Ionicons name="navigate-outline" size={20} color="#68bdee" />
        </TouchableOpacity>

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

        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceLabel}>Distance</Text>
          <Text style={styles.distanceValue}>{distance}</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Provider Info */}
          <View style={styles.providerSection}>
            <View style={styles.providerTextContainer}>
              <Text style={styles.providerName}>{providerName}</Text>
              <Text style={styles.providerStatus}>
                {providerLocation ? 'Moving towards your location' : 'Waiting for location...'}
              </Text>
              {providerLocation?.lastUpdate && (
                <Text style={styles.lastUpdate}>
                  Last updated: {new Date(providerLocation.lastUpdate).toLocaleTimeString()}
                </Text>
              )}
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={32} color="#68bdee" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
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

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationDotContainer}>
                <View style={styles.locationDotOuter} />
                <View style={styles.locationDotInner} />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Provider Current Location</Text>
                <Text style={styles.locationValue}>
                  {providerLocation 
                    ? `${providerLocation.latitude.toFixed(4)}, ${providerLocation.longitude.toFixed(4)}`
                    : 'Loading...'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.locationConnector} />

            <View style={styles.locationItem}>
              <View style={styles.locationDotOutline} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your Location</Text>
                <Text style={styles.locationValue}>
                  {pickupLocation 
                    ? `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`
                    : 'Loading...'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Updates Card */}
          <View style={styles.updatesCard}>
            <Text style={styles.updatesTitle}>UPDATES</Text>

            {updates.map((update) => (
              <View key={update.id} style={styles.updateItem}>
                <View style={[
                  styles.updateDot,
                  update.type === 'accepted' || update.type === 'en-route' 
                    ? styles.updateDotGreen 
                    : styles.updateDotGray
                ]} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>{update.message}</Text>
                  <Text style={styles.updateTime}>{formatTime(update.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Start Service Button */}
          <TouchableOpacity
            style={styles.startServiceButton}
            onPress={handleStartService}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#68bdee', '#4a9fd6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.startServiceText}>
                Provider Arrived - Start Service
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Contact Support Button */}
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
  },
  mapSection: {
    height: height * 0.5,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLoaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#3c3c3c',
  },
  providerMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  pickupMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  arrivingBadge: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  arrivingLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrivingTime: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  recenterButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  mapsButton: {
    position: 'absolute',
    top: 115,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  connectionStatus: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 5,
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
  distanceBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  distanceLabel: {
    fontSize: 9,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 80,
    height: 4,
    backgroundColor: '#d0d0d0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  providerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  providerTextContainer: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerStatus: {
    fontSize: 13,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
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
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotContainer: {
    position: 'relative',
    width: 20,
    height: 20,
    marginRight: 12,
    marginTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDotOuter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#68bdee',
    opacity: 0.3,
  },
  locationDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#68bdee',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  locationDotOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: 'transparent',
    marginTop: 3,
    marginRight: 12,
  },
  locationConnector: {
    width: 2,
    height: 30,
    backgroundColor: '#d0d0d0',
    marginLeft: 7,
    marginVertical: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  locationValue: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  updatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  updatesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  updateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 3,
  },
  updateDotGreen: {
    backgroundColor: '#4CAF50',
  },
  updateDotGray: {
    backgroundColor: '#b0b0b0',
  },
  updateContent: {
    flex: 1,
  },
  updateText: {
    fontSize: 13,
    color: '#5c5c5c',
    marginBottom: 2,
  },
  updateTime: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  startServiceButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startServiceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default TrackProviderScreen;
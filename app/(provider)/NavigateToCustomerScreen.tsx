import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { providerWebSocket } from '../../services/websocket.service';

// Google Maps API Keys
const ANDROID_API_KEY = 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A';
const IOS_API_KEY = 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU';

// Select API key based on platform
const GOOGLE_MAPS_API_KEY = Platform.select({
  android: ANDROID_API_KEY,
  ios: IOS_API_KEY,
});

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function NavigateToCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [providerLocation, setProviderLocation] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [nextTurn, setNextTurn] = useState<RouteStep | null>(null);
  const [eta, setEta] = useState('-- min');
  const [distance, setDistance] = useState('-- km');
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Get data from params
  const customerName = params.customerName as string || 'Mohammed A.';
  const customerPhone = params.customerPhone as string || '';
  const jobId = params.jobId as string;
  const bookingId = params.bookingId as string;
  
  // Destination (pickup location)
  const destination = {
    latitude: parseFloat(params.pickupLat as string) || 26.2285,
    longitude: parseFloat(params.pickupLng as string) || 50.5860,
    address: params.pickupLocation as string || 'Main Street, Manama',
  };

  // Initial provider location (if passed)
  const initialProviderLat = parseFloat(params.providerLat as string);
  const initialProviderLng = parseFloat(params.providerLng as string);

  useEffect(() => {
    console.log('🗺️ NavigateToCustomerScreen mounted');
    console.log('Destination:', destination);
    
    // Initialize
    getUserLocation();
    setupWebSocket();
    
    // Set initial provider location if available
    if (initialProviderLat && initialProviderLng) {
      setProviderLocation({
        latitude: initialProviderLat,
        longitude: initialProviderLng,
      });
    }

    return () => {
      // Cleanup location subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      // Disconnect WebSocket
      providerWebSocket.disconnect();
    };
  }, []);

  // Update route when locations change
  useEffect(() => {
    if (userLocation && destination) {
      getRoute(userLocation, destination);
    }
  }, [userLocation]);

  // Fit map to show both points
  useEffect(() => {
    if (mapReady && userLocation && destination && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [userLocation, destination],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  }, [mapReady, userLocation, destination]);

  const setupWebSocket = () => {
    // Listen for provider location updates
    providerWebSocket.on('provider_location', handleProviderLocation);
    providerWebSocket.on('connection_change', (connected) => {
      setWsConnected(connected);
    });

    // Request provider location
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('request_provider_location', { jobId, bookingId });
    }
  };

  const handleProviderLocation = (data: any) => {
    console.log('📍 Provider location update:', data);
    
    const location = data.data || data;
    
    if (location.latitude && location.longitude) {
      const newLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      
      setProviderLocation(newLocation);
      
      // If we have both provider and destination, show route from provider
      if (newLocation && destination) {
        getRoute(newLocation, destination);
      }
      
      // Fit map to show all points
      if (mapRef.current && userLocation) {
        mapRef.current.fitToCoordinates(
          [newLocation, userLocation, destination],
          {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          }
        );
      }
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for navigation',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('📍 User location:', userLoc);
      setUserLocation(userLoc);

      // Start watching position for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const updatedLoc = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setUserLocation(updatedLoc);
          
          // Update provider with our location
          if (providerWebSocket.isConnected()) {
            providerWebSocket.send('provider_location_update', {
              jobId,
              bookingId,
              latitude: updatedLoc.latitude,
              longitude: updatedLoc.longitude,
            });
          }
        }
      );
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoute = async (origin: Coordinates, dest: Coordinates) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&alternatives=false`;
      
      console.log('📍 Fetching route...');
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const route = data.routes[0];
        
        // Decode polyline points
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Get next turn instruction
        if (route.legs.length > 0 && route.legs[0].steps.length > 0) {
          const firstStep = route.legs[0].steps[0];
          setNextTurn({
            instruction: firstStep.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: firstStep.distance.text,
            duration: firstStep.duration.text,
          });
        }

        // Update ETA and distance
        if (route.legs.length > 0) {
          setEta(route.legs[0].duration.text);
          setDistance(route.legs[0].distance.text);
        }
        
        console.log('📍 Route found:', route.legs[0].duration.text);
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  // Function to decode Google Maps polyline
  const decodePolyline = (t: string, precision: number = 5) => {
    let points = [];
    let lat = 0;
    let lng = 0;
    let index = 0;
    let shift = 0;
    let result = 0;
    let factor = Math.pow(10, precision);

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
        latitude: lat / factor,
        longitude: lng / factor
      });
    }
    
    return points;
  };

  const handleCompass = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleFitAll = () => {
    if (mapRef.current && userLocation && destination) {
      const coordinates = [userLocation, destination];
      if (providerLocation) coordinates.push(providerLocation);
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const handleCall = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    } else {
      Alert.alert('Call', `Calling ${customerName}...`);
    }
  };

  const handleMessage = () => {
    Alert.alert('Message', 'Opening message...');
  };

  const handleOpenMaps = () => {
    if (userLocation && destination) {
      const url = Platform.select({
        ios: `maps://app?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${destination.latitude},${destination.longitude}`,
        android: `google.navigation:q=${destination.latitude},${destination.longitude}`,
      });
      
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const handleArrived = () => {
    // Notify backend via WebSocket
    if (providerWebSocket.isConnected()) {
      providerWebSocket.send('provider_arrived', {
        jobId,
        bookingId,
        location: userLocation,
      });
    }

    router.push({
      pathname: '/ServiceInProgressScreen',
      params: {
        jobId,
        bookingId,
        customerName,
        pickupLocation: destination.address,
      }
    });
  };

  const handleReportIssue = () => Alert.alert('Report Issue', 'Opening report form...');
  const handleCancelService = () => {
    Alert.alert(
      'Cancel Service',
      'Are you sure you want to cancel this service?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            if (providerWebSocket.isConnected()) {
              providerWebSocket.send('cancel_job', { jobId, bookingId });
            }
            router.back();
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4eafe4" />
          <Text style={styles.loadingText}>Loading navigation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F4FB" />

      {/* ── MAP AREA ── */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || destination.latitude,
            longitude: userLocation?.longitude || destination.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
          onMapReady={() => setMapReady(true)}
        >
          {/* User/Provider Location Marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="You are here"
            >
              <View style={styles.userMarker}>
                <Feather name="navigation" size={20} color="#4eafe4" />
              </View>
            </Marker>
          )}

          {/* Provider Location Marker (if available) */}
          {providerLocation && (
            <Marker
              coordinate={providerLocation}
              title="Provider Location"
              description="Other provider"
            >
              <View style={styles.providerMarker}>
                <Feather name="truck" size={20} color="#F59E0B" />
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          <Marker
            coordinate={destination}
            title="Pickup Location"
            description={destination.address}
          >
            <View style={styles.destinationMarker}>
              <Feather name="map-pin" size={24} color="#EF4444" />
            </View>
          </Marker>

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4eafe4"
              lineDashPattern={[0]}
            />
          )}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={25} color="#1e2939" />
        </TouchableOpacity>

        {/* Compass Button */}
        <TouchableOpacity style={styles.compassBtn} onPress={handleCompass} activeOpacity={0.8}>
          <Feather name="navigation" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        {/* Fit All Button */}
        <TouchableOpacity style={styles.fitAllBtn} onPress={handleFitAll} activeOpacity={0.8}>
          <Feather name="maximize-2" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        {/* Open in Google Maps Button */}
        <TouchableOpacity style={styles.mapsBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
          <Feather name="external-link" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        {/* WebSocket Status */}
        <View style={[
          styles.wsStatus,
          wsConnected ? styles.wsConnected : styles.wsDisconnected
        ]}>
          <View style={[
            styles.wsDot,
            wsConnected ? styles.wsDotConnected : styles.wsDotDisconnected
          ]} />
          <Text style={styles.wsText}>
            {wsConnected ? 'Live' : 'Reconnecting...'}
          </Text>
        </View>

        {/* Navigation Card */}
        {nextTurn && (
          <View style={styles.navCard}>
            <View style={styles.navCardTop}>
              <View style={styles.navIconWrap}>
                <Feather name="navigation" size={18} color="#8fd1fb" />
              </View>
              <View style={styles.navCardTextBlock}>
                <Text style={styles.navCardLabel}>NEXT TURN</Text>
                <Text style={styles.navCardTurn} numberOfLines={1}>
                  {nextTurn.instruction}
                </Text>
              </View>
            </View>
            <View style={styles.navCardDivider} />
            <View style={styles.navCardBottom}>
              <View style={styles.navCardStat}>
                <Text style={styles.navStatLabel}>ETA</Text>
                <Text style={styles.navStatValue}>{eta}</Text>
              </View>
              <View style={styles.navCardStat}>
                <Text style={styles.navStatLabel}>DISTANCE</Text>
                <Text style={styles.navStatValue}>{distance}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation Active Badge */}
        <View style={styles.navActiveBadge}>
          <View style={styles.navActiveTextBlock}>
            <Text style={styles.navActiveTitle}>Navigation Active</Text>
            <Text style={styles.navActiveSub}>Following GPS route</Text>
          </View>
          <View style={styles.navActiveIcon}>
            <Feather name="map-pin" size={20} color="#ffffff" />
          </View>
        </View>

      </View>

      {/* ── BOTTOM SHEET ── */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetSectionLabel}>CUSTOMER DETAILS</Text>

          {/* Customer Card */}
          <View style={styles.customerCard}>
            {/* Customer Info */}
            <View style={styles.customerInfo}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={26} color="#8fd1fb" />
              </View>
              <View style={styles.customerText}>
                <Text style={styles.customerName}>{customerName}</Text>
                <Text style={styles.customerRating}>⭐ 4.5 Customer Rating</Text>
              </View>
            </View>

            <View style={styles.customerDivider} />

            {/* Call / Message Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.7}>
                <Feather name="phone" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <View style={styles.actionBtnDivider} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleMessage} activeOpacity={0.7}>
                <Feather name="message-square" size={16} color="#8fd1fb" />
                <Text style={styles.actionBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pickup Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color="#5B9BD5" style={styles.locationIcon} />
              <View>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationValue}>{destination.address}</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsRow}>
              <View style={styles.tipsIconWrap}>
                <Feather name="alert-circle" size={18} color="#5B9BD5" />
              </View>
              <View style={styles.tipsTextBlock}>
                <Text style={styles.tipsTitle}>Navigation Tips</Text>
                <Text style={styles.tipsText}>
                  Located in underground parking.{'\n'}
                  Call customer upon arrival for exact location.
                </Text>
              </View>
            </View>
          </View>

          {/* Arrived Button */}
          <TouchableOpacity style={styles.arrivedBtn} onPress={handleArrived} activeOpacity={0.85}>
            <Feather name="check-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.arrivedBtnText}>I've Arrived at Location</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={handleReportIssue} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Report Issue</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>+</Text>
            <TouchableOpacity onPress={handleCancelService} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Cancel Service</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D6EAF8',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    position: 'relative',
    minHeight: 260,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 27,
    left: 16,
    width: 45,
    height: 45,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e2939',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
  },
  compassBtn: {
    position: 'absolute',
    top: 27,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  fitAllBtn: {
    position: 'absolute',
    top: 87,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  mapsBtn: {
    position: 'absolute',
    top: 147,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  wsStatus: {
    position: 'absolute',
    top: 27,
    left: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  wsConnected: {
    backgroundColor: '#E8F5E9',
  },
  wsDisconnected: {
    backgroundColor: '#FFEBEE',
  },
  wsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  wsDotConnected: {
    backgroundColor: '#4CAF50',
  },
  wsDotDisconnected: {
    backgroundColor: '#F44336',
  },
  wsText: {
    fontSize: 10,
    fontWeight: '600',
  },
  navCard: {
    position: 'absolute',
    top: 207,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#87cefa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
  },
  navCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardTextBlock: {
    flex: 1,
  },
  navCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1,
    marginBottom: 2,
  },
  navCardTurn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  navCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  navCardBottom: {
    flexDirection: 'row',
    gap: 24,
  },
  navCardStat: {
    flexDirection: 'column',
  },
  navStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7d8492',
    letterSpacing: 1,
  },
  navStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  navActiveBadge: {
    position: 'absolute',
    bottom: 24,
    left: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  navActiveTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  navActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#737a8a',
    letterSpacing: 0.3,
  },
  navActiveSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  navActiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#87cefa',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: '62%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  customerRating: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  customerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 7,
  },
  actionBtnDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8fd1fb',
    letterSpacing: 0.5,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },
  tipsCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
    padding: 14,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipsIconWrap: {
    marginTop: 1,
  },
  tipsTextBlock: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E86C1',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#5B9BD5',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#1d94d2',
    shadowColor: '#1d94d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  arrivedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
  footerDot: {
    fontSize: 14,
    color: '#6a7282',
  },
  userMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4eafe4',
  },
  providerMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  destinationMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
});
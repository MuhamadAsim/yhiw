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
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function NavigateToCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const mapRef = useRef<MapView>(null);
  
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [destination, setDestination] = useState({
    latitude: parseFloat(params.pickupLat as string) || 26.2285,
    longitude: parseFloat(params.pickupLng as string) || 50.5860,
    address: params.pickupLocation as string || 'Main Street, Manama',
  });
  
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [nextTurn, setNextTurn] = useState<RouteStep | null>(null);
  const [eta, setEta] = useState('8 min');
  const [distance, setDistance] = useState('2.5 km');
  const [isLoading, setIsLoading] = useState(true);

  // Get customer info from params
  const customerName = params.customerName as string || 'Mohammed A.';
  const customerPhone = params.customerPhone as string || '';
  const jobId = params.jobId as string;

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userLoc);
      
      // Get route after we have user location
      if (destination) {
        await getRoute(userLoc, destination);
      }

      // Center map on user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...userLoc,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      // Start location tracking
      startLocationTracking();
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = () => {
    // Update location every 5 seconds
    const interval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setUserLocation(newLocation);
        
        // Update route in real-time
        if (destination) {
          await getRoute(newLocation, destination);
        }
        
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const getRoute = async (origin: { latitude: number; longitude: number }, dest: { latitude: number; longitude: number }) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      
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
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  // Function to decode Google Maps polyline
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

  const handleCompass = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
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
    router.push({
      pathname: '/ServiceInProgressScreen',
      params: {
        jobId,
        customerName,
        pickupLocation: destination.address,
      }
    });
  };

  const handleReportIssue = () => Alert.alert('Report Issue', 'Opening report form...');
  const handleCancelService = () => Alert.alert('Cancel Service', 'Are you sure you want to cancel?');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
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
            latitude: userLocation?.latitude || 26.2285,
            longitude: userLocation?.longitude || 50.5860,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
        >
          {/* Destination Marker */}
          {destination && (
            <Marker
              coordinate={destination}
              title="Pickup Location"
              description={destination.address}
            >
              <View style={styles.destinationMarker}>
                <Feather name="map-pin" size={24} color="#EF4444" />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4eafe4"
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

        {/* Open in Google Maps Button */}
        <TouchableOpacity style={styles.mapsBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
          <Feather name="external-link" size={20} color="#8fd1fb" />
        </TouchableOpacity>

        {/* Navigation Card */}
        {nextTurn && (
          <View style={styles.navCard}>
            <View style={styles.navCardTop}>
              <View style={styles.navIconWrap}>
                <Feather name="navigation" size={18} color="#8fd1fb" />
              </View>
              <View style={styles.navCardTextBlock}>
                <Text style={styles.navCardLabel}>NEXT TURN</Text>
                <Text style={styles.navCardTurn}>{nextTurn.instruction}</Text>
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
            <Feather name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
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

// Add these new styles
const additionalStyles = {
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  destinationMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  mapsBtn: {
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
};

// Merge with existing styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D6EAF8',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    position: 'relative',
    minHeight: 260,
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
  mapsBtn: {
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
  navCard: {
    position: 'absolute',
    top: 88,
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
  // Additional styles
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  destinationMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
});
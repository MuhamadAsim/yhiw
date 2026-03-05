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
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = Platform.select({
  ios: 'AIzaSyCLcr19qyM9b65watbgznqLtDAvrbQXMNU',
  android: 'AIzaSyDYrX8rOSmDJ4tcsnjRU1yK3IjWoIiJ67A',
});

interface JobDetails {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  distance: string;
  eta: string;
  navigationTips?: string;
}

export default function NavigateToCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const mapRef = useRef<MapView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  // Fetch job details on mount
  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking ID provided');
      router.back();
      return;
    }
    fetchJobDetails();
    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();

      if (data.success && data.job) {
        setJobDetails({
          bookingId: data.job.bookingId,
          customerName: data.job.customer?.name || 'Mohammed A.',
          customerPhone: data.job.customer?.phone || '+973 1234 5678',
          customerRating: data.job.customer?.rating || 4.5,
          pickupLocation: data.job.pickup?.address || 'Main Street, Manama',
          pickupLat: data.job.pickup?.coordinates?.lat,
          pickupLng: data.job.pickup?.coordinates?.lng,
          dropoffLocation: data.job.dropoff?.address,
          dropoffLat: data.job.dropoff?.coordinates?.lat,
          dropoffLng: data.job.dropoff?.coordinates?.lng,
          distance: data.job.distance || '2.5 km',
          eta: data.job.estimatedArrival || '8-10 minutes',
          navigationTips: data.job.description || 'Located in underground parking. Call customer upon arrival.',
        });

        // If we have pickup coordinates and current location, get route
        if (data.job.pickup?.coordinates && currentLocation) {
          fetchRoute(currentLocation, {
            latitude: data.job.pickup.coordinates.lat,
            longitude: data.job.pickup.coordinates.lng,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation');
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(currentLoc);

      // Center map on current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...currentLoc,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Update every 5 seconds
        },
        (newLocation) => {
          const newLoc = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setCurrentLocation(newLoc);

          // Update route if we have destination
          if (jobDetails?.pickupLat && jobDetails?.pickupLng) {
            fetchRoute(newLoc, {
              latitude: jobDetails.pickupLat,
              longitude: jobDetails.pickupLng,
            });
          }

          // Send location to backend
          updateProviderLocation(newLoc);
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const updateProviderLocation = async (location: { latitude: number; longitude: number }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const firebaseUserId = await AsyncStorage.getItem('firebaseUserId');

      await fetch(`${API_BASE_URL}/provider/${firebaseUserId}/location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchRoute = async (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Decode polyline function for Google Maps
  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  const handleCompass = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleCall = () => {
    if (jobDetails?.customerPhone) {
      Linking.openURL(`tel:${jobDetails.customerPhone}`);
    } else {
      Alert.alert('Call', 'Calling Mohammed A...');
    }
  };

  const handleMessage = () => {
    if (jobDetails?.customerPhone) {
      Linking.openURL(`sms:${jobDetails.customerPhone}`);
    } else {
      Alert.alert('Message', 'Opening message...');
    }
  };

  const handleArrived = () => {
    Alert.alert(
      'Arrived at Location',
      'Have you arrived at the pickup location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: () => {
            // Update job status to 'arrived'
            router.push({
              pathname: '/ServiceInProgressScreen',
              params: { bookingId }
            });
          }
        }
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Opening report form...');
  };
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
            // Just navigate to home screen for now
            router.replace('/(provider)/HomePage');

            // Optionally try API in background without awaiting
            const cancelApi = async () => {
              try {
                const token = await AsyncStorage.getItem('userToken');
                await fetch(`${API_BASE_URL}/jobs/${bookingId}/cancel`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ reason: 'provider_cancelled' }),
                });
              } catch (error) {
                console.log('Background API call failed (expected):', error);
              }
            };

            cancelApi(); // Fire and forget
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading navigation...</Text>
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
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: currentLocation?.latitude || 26.2285,
            longitude: currentLocation?.longitude || 50.5860,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={true}
        >
          {/* Pickup Marker */}
          {jobDetails?.pickupLat && jobDetails?.pickupLng && (
            <Marker
              coordinate={{
                latitude: jobDetails.pickupLat,
                longitude: jobDetails.pickupLng,
              }}
              title="Pickup Location"
              description={jobDetails.pickupLocation}
            >
              <View style={styles.pickupMarker}>
                <Feather name="map-pin" size={24} color="#00C853" />
              </View>
            </Marker>
          )}

          {/* Dropoff Marker (if exists) */}
          {jobDetails?.dropoffLat && jobDetails?.dropoffLng && (
            <Marker
              coordinate={{
                latitude: jobDetails.dropoffLat,
                longitude: jobDetails.dropoffLng,
              }}
              title="Dropoff Location"
              description={jobDetails.dropoffLocation}
            >
              <View style={styles.dropoffMarker}>
                <Feather name="flag" size={24} color="#F44336" />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4285F4"
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

        {/* Navigation Card */}
        <View style={styles.navCard}>
          <View style={styles.navCardTop}>
            <View style={styles.navIconWrap}>
              <Feather name="navigation" size={18} color="#8fd1fb" />
            </View>
            <View style={styles.navCardTextBlock}>
              <Text style={styles.navCardLabel}>NEXT TURN</Text>
              <Text style={styles.navCardTurn}>Turn right on Main Street</Text>
            </View>
          </View>
          <View style={styles.navCardDivider} />
          <View style={styles.navCardBottom}>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>ETA</Text>
              <Text style={styles.navStatValue}>{jobDetails?.eta || '8 min'}</Text>
            </View>
            <View style={styles.navCardStat}>
              <Text style={styles.navStatLabel}>DISTANCE</Text>
              <Text style={styles.navStatValue}>{jobDetails?.distance || '2.5 km'}</Text>
            </View>
          </View>
        </View>

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
            <View style={styles.customerInfo}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={26} color="#8fd1fb" />
              </View>
              <View style={styles.customerText}>
                <Text style={styles.customerName}>{jobDetails?.customerName || 'Mohammed A.'}</Text>
                <Text style={styles.customerRating}>⭐ {jobDetails?.customerRating || 4.5} Customer Rating</Text>
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
                <Text style={styles.locationValue}>{jobDetails?.pickupLocation || 'Main Street, Manama'}</Text>
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
                  {jobDetails?.navigationTips || 'Located in underground parking. Call customer upon arrival.'}
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

// Add these styles to the existing styles object
const additionalStyles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupMarker: {
    padding: 5,
  },
  dropoffMarker: {
    padding: 5,
  },
};

// Merge with existing styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D6EAF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  pickupMarker: {
    padding: 5,
  },
  dropoffMarker: {
    padding: 5,
  },
});
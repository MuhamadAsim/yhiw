import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

const ProviderAssignedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
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
  
  // Get coordinates for map (if available)
  const pickupLat = getStringParam(params.pickupLat);
  const pickupLng = getStringParam(params.pickupLng);
  const providerLat = getStringParam(params.providerLat);
  const providerLng = getStringParam(params.providerLng);

  // Check if this is a "no providers" scenario
  const noProviders = getStringParam(params.noProviders) === 'true';

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Error', 'Provider phone number not available');
    }
  };

  const handleMessage = () => {
    // Navigate to chat screen with provider
    router.push({
      pathname: '/(customer)/Chat',
      params: {
        providerName,
        bookingId,
      }
    });
  };

  const handleTrackProvider = () => {
    if (pickupLat && pickupLng && providerLat && providerLng) {
      // Navigate to live tracking screen with coordinates
      router.push({
        pathname: '/(customer)/LiveTracking',
        params: {
          pickupLat,
          pickupLng,
          providerLat,
          providerLng,
          providerName,
          estimatedArrival,
        }
      });
    } else {
      Alert.alert('Coming Soon', 'Live tracking will be available shortly');
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
            // API call to cancel booking
            console.log('Cancelling booking:', bookingId);
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

        {/* Map Section - Google Maps Integration */}
        <View style={styles.mapContainer}>
          {/* ETA Badge */}
          <View style={styles.etaBadge}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaTime}>{estimatedArrival} minutes</Text>
          </View>

          {/* Google Maps Placeholder - Replace with actual MapView */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapIconContainer}>
              <Ionicons name="navigate-outline" size={48} color="#68bdee" />
            </View>
            <Text style={styles.mapLabel}>Live Tracking Map</Text>
            <Text style={styles.mapSubLabel}>
              Provider arriving from {getStringParam(params.distance) || '2.3'} km away
            </Text>
            
            {/* Location Markers */}
            <View style={styles.locationMarkers}>
              <View style={styles.pickupMarker}>
                <View style={styles.markerDot} />
                <Text style={styles.markerText} numberOfLines={1}>
                  Pickup: {pickupAddress}
                </Text>
              </View>
              <View style={styles.providerMarker}>
                <Ionicons name="car" size={16} color="#68bdee" />
                <Text style={styles.markerText} numberOfLines={1}>
                  {providerName} is on the way
                </Text>
              </View>
            </View>
          </View>
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
                <Ionicons name="star" size={16} color="#3c3c3c" />
                <Text style={styles.ratingText}>{providerRating}</Text>
                <Text style={styles.reviewsText}>• {getStringParam(params.totalRatings) || '127'} reviews</Text>
              </View>
              <Text style={styles.vehicleInfo}>{vehicleDetails}</Text>
              <Text style={styles.plateNumber}>{licensePlate}</Text>
            </View>
          </View>

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
            <Text style={styles.detailValue}>{bookingId || 'N/A'}</Text>
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
          <Text style={styles.cardTitle}>STATUS</Text>
          
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

          {/* Status Item 2 - Inactive (current) */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxInactive} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextInactive}>Provider On the Way</Text>
              <Text style={styles.statusTimeInactive}>ETA: {estimatedArrival} minutes</Text>
            </View>
          </View>

          {/* Status Item 3 - Inactive */}
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
          <Text style={styles.trackButtonText}>Track Provider</Text>
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
    paddingTop: height * 0.06,
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
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#d0e8f0',
  },
  mapLabel: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mapSubLabel: {
    fontSize: 11,
    color: '#68bdee',
    fontWeight: '600',
    marginBottom: 20,
  },
  locationMarkers: {
    width: '100%',
    marginTop: 10,
  },
  pickupMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  providerMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(104, 189, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#68bdee',
    marginRight: 8,
  },
  markerText: {
    fontSize: 11,
    color: '#3c3c3c',
    fontWeight: '500',
    maxWidth: width * 0.6,
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
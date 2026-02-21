import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

const ProviderAssignedScreen = () => {
  const handleCall = () => {
    console.log('Call provider');
  };

  const handleMessage = () => {
    console.log('Message provider');
  };

  const handleTrackProvider = () => {
    console.log('Track provider');
  };

  const handleCancelRequest = () => {
    console.log('Cancel request');
  };

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
            <Text style={styles.etaTime}>15 minutes</Text>
          </View>

          {/* Google Maps Placeholder - Replace with actual MapView */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapIconContainer}>
              <Ionicons name="navigate-outline" size={48} color="#68bdee" />
            </View>
            <Text style={styles.mapLabel}>Live Tracking Map</Text>
            <Text style={styles.mapSubLabel}>
              Provider arriving from 2.3 km away
            </Text>
            
            {/* Location Markers */}
            <View style={styles.locationMarkers}>
              <View style={styles.pickupMarker}>
                <View style={styles.markerDot} />
                <Text style={styles.markerText}>Pickup: 123 Main St</Text>
              </View>
              <View style={styles.providerMarker}>
                <Ionicons name="car" size={16} color="#68bdee" />
                <Text style={styles.markerText}>Provider is moving</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Provider Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              <Ionicons name="person" size={40} color="#68bdee" />
            </View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Ahmed Al-Khalifa</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#3c3c3c" />
                <Text style={styles.ratingText}>4.8</Text>
                <Text style={styles.reviewsText}>• 127 reviews</Text>
              </View>
              <Text style={styles.vehicleInfo}>White Flatbed Truck</Text>
              <Text style={styles.plateNumber}>BHR 5432</Text>
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

        {/* Service Details Card - With light black border and divider */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>SERVICE DETAILS</Text>
          
          {/* Divider line with margins */}
          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>Roadside Towing</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>Sedan</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue}>23 Main Street, Manama</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Cost</Text>
            <Text style={styles.detailValueHighlight}>89.25 BHD</Text>
          </View>
        </View>

        {/* Status Card - With light black border and divider */}
        <View style={[styles.card, styles.cardWithBorder]}>
          <Text style={styles.cardTitle}>STATUS</Text>
          
          {/* Divider line with margins */}
          <View style={styles.cardDivider} />

          {/* Status Item 1 - Active (like checked checkbox) */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxActive}>
              {true && <View style={styles.statusDotActive} />}
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextActive}>Provider Assigned</Text>
              <Text style={styles.statusTimeActive}>Just now</Text>
            </View>
          </View>

          {/* Status Item 2 - Inactive (like unchecked checkbox) */}
          <View style={styles.statusItem}>
            <View style={styles.statusCheckboxInactive} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTextInactive}>Provider On the Way</Text>
              <Text style={styles.statusTimeInactive}>ETA: 15 minutes</Text>
            </View>
          </View>

          {/* Status Item 3 - Inactive (like unchecked checkbox) */}
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
  // New card style with border
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
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  detailValueHighlight: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  // Status Item Styles - Matching remember me checkbox
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
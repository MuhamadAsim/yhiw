
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height, width } = Dimensions.get('window');

const TrackProviderScreen = () => {
  const handleCall = () => {
    console.log('Call provider');
  };

  const handleMessage = () => {
    console.log('Message provider');
  };

  const handleStartService = () => {
    console.log('Start service');
  };

  const handleContactSupport = () => {
    console.log('Contact support');
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapSection}>
        {/* Arriving Badge */}
        <View style={styles.arrivingBadge}>
          <Ionicons name="time-outline" size={18} color="#3c3c3c" />
          <View>
            <Text style={styles.arrivingLabel}>Arriving in</Text>
            <Text style={styles.arrivingTime}>5 minutes</Text>
          </View>
        </View>

        {/* Map Icons */}
        <View style={styles.mapContent}>
          {/* Location Pin */}
          <View style={styles.locationPin}>
            <Ionicons name="location" size={32} color="#FFFFFF" />
          </View>

          {/* Navigation Icon (Center) */}
          <View style={styles.navigationIcon}>
            <Ionicons name="navigate" size={48} color="#68bdee" />
          </View>

          {/* Vehicle Icon */}
          <View style={styles.vehicleIcon}>
            <Ionicons name="car" size={24} color="#FFFFFF" />
          </View>

          {/* Distance Badge */}
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceLabel}>Distance</Text>
            <Text style={styles.distanceValue}>1.2 km away</Text>
          </View>
        </View>

        {/* Map Labels */}
        <View style={styles.mapLabels}>
          <Text style={styles.mapTitle}>Live Tracking</Text>
          <Text style={styles.mapSubtitle}>Provider is on the way</Text>
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
              <Text style={styles.providerName}>Ahmed Al-Khalifa</Text>
              <Text style={styles.providerStatus}>
                Is on the way to your location
              </Text>
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
                <Text style={styles.locationValue}>Al Seef District, Manama</Text>
              </View>
            </View>

            <View style={styles.locationConnector} />

            <View style={styles.locationItem}>
              <View style={styles.locationDotOutline} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your Location</Text>
                <Text style={styles.locationValue}>123 Main Street, Manama</Text>
              </View>
            </View>
          </View>

          {/* Updates Card */}
          <View style={styles.updatesCard}>
            <Text style={styles.updatesTitle}>UPDATES</Text>

            <View style={styles.updateItem}>
              <View style={styles.updateDotGreen} />
              <Text style={styles.updateText}>
                Provider accepted request - 2 min ago
              </Text>
            </View>

            <View style={styles.updateItem}>
              <View style={styles.updateDotGreen} />
              <Text style={styles.updateText}>
                Provider started journey - 1 min ago
              </Text>
            </View>

            <View style={styles.updateItem}>
              <View style={styles.updateDotGray} />
              <Text style={styles.updateText}>Provider is 1.2 km away</Text>
            </View>
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
    backgroundColor: '#e8f4f8',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivingBadge: {
    position: 'absolute',
    top: 60,
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
  mapContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locationPin: {
    position: 'absolute',
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#d0e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleIcon: {
    position: 'absolute',
    right: 40,
    top: -20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8c8c8c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceBadge: {
    position: 'absolute',
    right: 30,
    bottom: -40,
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
  mapLabels: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  mapSubtitle: {
    fontSize: 12,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  updateDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  updateDotGray: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b0b0b0',
    marginRight: 12,
  },
  updateText: {
    fontSize: 13,
    color: '#5c5c5c',
    flex: 1,
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
    fontSize: 12, // Reduced from 14 to 12
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
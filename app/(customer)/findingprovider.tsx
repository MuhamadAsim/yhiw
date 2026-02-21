import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

const { height } = Dimensions.get('window');

const FindingProviderScreen = () => {
  const [spinValue] = useState(new Animated.Value(0));
  const params = useLocalSearchParams();

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Get data from previous screen
  const pickupAddress = getStringParam(params.pickupAddress);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const serviceName = getStringParam(params.serviceName);
  const serviceTime = getStringParam(params.serviceTime);
  const totalAmount = getStringParam(params.totalAmount);
  const vehicleType = getStringParam(params.vehicleType);
  const licensePlate = getStringParam(params.licensePlate);
  const fullName = getStringParam(params.fullName);
  const phoneNumber = getStringParam(params.phoneNumber);

  useEffect(() => {
    // Spinning animation for the searching indicator
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Log received data for debugging
    console.log('FindingProvider - Received data:', {
      pickupAddress,
      dropoffAddress,
      serviceName,
      serviceTime,
      totalAmount,
      vehicleType,
      licensePlate,
      fullName,
      phoneNumber,
    });
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Format schedule display text
  const getScheduleDisplay = () => {
    if (serviceTime === 'right_now') {
      return 'ASAP Service';
    } else if (serviceTime === 'schedule_later') {
      return 'Scheduled Service';
    } else {
      return 'Not specified';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon at the top */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/customer/finding_provider.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Finding a Provider</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          WE'RE MATCHING YOU WITH THE BEST{'\n'}
          AVAILABLE PROVIDER IN YOUR AREA...
        </Text>

        {/* Booking Summary Card - NEW */}
        <View style={styles.bookingSummaryCard}>
          <Text style={styles.bookingSummaryTitle}>Booking Summary</Text>
          
          <View style={styles.bookingSummaryRow}>
            <Text style={styles.bookingSummaryLabel}>Service:</Text>
            <Text style={styles.bookingSummaryValue}>{serviceName || 'Roadside Assistance'}</Text>
          </View>
          
          <View style={styles.bookingSummaryRow}>
            <Text style={styles.bookingSummaryLabel}>Schedule:</Text>
            <Text style={styles.bookingSummaryValue}>{getScheduleDisplay()}</Text>
          </View>
          
          <View style={styles.bookingSummaryRow}>
            <Text style={styles.bookingSummaryLabel}>Vehicle:</Text>
            <Text style={styles.bookingSummaryValue}>{vehicleType || 'Not specified'}</Text>
          </View>
          
          {licensePlate && (
            <View style={styles.bookingSummaryRow}>
              <Text style={styles.bookingSummaryLabel}>License Plate:</Text>
              <Text style={styles.bookingSummaryValue}>{licensePlate}</Text>
            </View>
          )}
          
          <View style={styles.bookingSummaryDivider} />
          
          <View style={styles.bookingSummaryRow}>
            <Text style={styles.bookingSummaryLabel}>Pickup:</Text>
            <Text style={styles.bookingSummaryAddress} numberOfLines={2}>
              {pickupAddress || 'Not specified'}
            </Text>
          </View>
          
          {dropoffAddress && (
            <View style={styles.bookingSummaryRow}>
              <Text style={styles.bookingSummaryLabel}>Dropoff:</Text>
              <Text style={styles.bookingSummaryAddress} numberOfLines={2}>
                {dropoffAddress}
              </Text>
            </View>
          )}
          
          <View style={styles.bookingSummaryDivider} />
          
          <View style={styles.bookingSummaryTotal}>
            <Text style={styles.bookingSummaryTotalLabel}>Total Amount:</Text>
            <Text style={styles.bookingSummaryTotalValue}>
              {totalAmount ? `${parseFloat(totalAmount).toFixed(2)} BHD` : 'Calculating...'}
            </Text>
          </View>
          
          <View style={styles.bookingSummaryContact}>
            <Ionicons name="person-outline" size={14} color="#8c8c8c" />
            <Text style={styles.bookingSummaryContactText}>
              {fullName || 'Customer'} • {phoneNumber || 'Phone not provided'}
            </Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {/* Step 1: Request received */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerCompleted}>
              <Ionicons name="checkmark-circle" size={24} color="#68bdee" />
            </View>
            <Text style={styles.stepTextCompleted}>Request received</Text>
          </View>

          {/* Step 2: Searching for providers (Active) */}
          <View style={[styles.stepCard, styles.stepCardActive]}>
            <Animated.View
              style={[
                styles.stepIconContainerActive,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Ionicons name="sync-outline" size={24} color="#3c3c3c" />
            </Animated.View>
            <Text style={styles.stepTextActive}>Searching for providers...</Text>
          </View>

          {/* Step 3: Assigning provider */}
          <View style={styles.stepCard}>
            <View style={styles.stepIconContainerInactive}>
              <View style={styles.emptyCircle} />
            </View>
            <Text style={styles.stepTextInactive}>Assigning provider</Text>
          </View>
        </View>

        {/* Did You Know Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>DID YOU KNOW?</Text>
          <Text style={styles.infoText}>
            YHIW connects you with verified and rated service providers. Average
            response time is under 2 minutes.
          </Text>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
          <View style={styles.dotInactive} />
        </View>
      </ScrollView>
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
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: Math.min(160, height * 0.2),
    height: Math.min(160, height * 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.03,
    backgroundColor: 'transparent',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Math.min(24, height * 0.032),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: height * 0.015,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(12, height * 0.016),
    color: '#8c8c8c',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: height * 0.04,
    letterSpacing: 0.3,
    paddingHorizontal: 10,
  },
  // NEW STYLES for booking summary
  bookingSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: height * 0.03,
    borderWidth: 1,
    borderColor: '#68bdee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookingSummaryTitle: {
    fontSize: Math.min(14, height * 0.018),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bookingSummaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bookingSummaryLabel: {
    fontSize: Math.min(12, height * 0.016),
    color: '#8c8c8c',
    width: 70,
    fontWeight: '500',
  },
  bookingSummaryValue: {
    fontSize: Math.min(12, height * 0.016),
    color: '#3c3c3c',
    flex: 1,
    fontWeight: '600',
  },
  bookingSummaryAddress: {
    fontSize: Math.min(12, height * 0.016),
    color: '#3c3c3c',
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  bookingSummaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  bookingSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingSummaryTotalLabel: {
    fontSize: Math.min(13, height * 0.017),
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  bookingSummaryTotalValue: {
    fontSize: Math.min(16, height * 0.02),
    color: '#68bdee',
    fontWeight: 'bold',
  },
  bookingSummaryContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookingSummaryContactText: {
    fontSize: Math.min(11, height * 0.015),
    color: '#8c8c8c',
    flex: 1,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: height * 0.03,
  },
  stepCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  stepIconContainerCompleted: {
    marginRight: 15,
  },
  stepIconContainerActive: {
    marginRight: 15,
  },
  stepIconContainerInactive: {
    marginRight: 15,
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    backgroundColor: 'transparent',
  },
  stepTextCompleted: {
    fontSize: Math.min(14, height * 0.018),
    color: '#68bdee',
    fontWeight: '600',
    flex: 1,
  },
  stepTextActive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
  },
  stepTextInactive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#b0b0b0',
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    borderWidth:1,
    borderColor: '#c3c5c5',
    padding: 18,
    width: '100%',
    marginBottom: height * 0.03,
  },
  infoTitle: {
    fontSize: Math.min(12, height * 0.016),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: Math.min(12, height * 0.016),
    color: '#5c5c5c',
    lineHeight: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
});

export default FindingProviderScreen;
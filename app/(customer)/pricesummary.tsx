import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { styles } from './styles/PriceSummaryStyles';

const PriceSummaryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper function to safely get string from params
  const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) return '';
    return Array.isArray(param) ? param[0] : param;
  };

  // Helper function to safely parse JSON from params
  const getParsedArray = (param: string | string[] | undefined): any[] => {
    const value = getStringParam(param);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  // Get service info
  const serviceId = getStringParam(params.serviceId);
  const serviceName = getStringParam(params.serviceName) || 'Quick Tow (Flatbed)';
  const servicePrice = getStringParam(params.servicePrice) || '75 BHD';
  const serviceCategory = getStringParam(params.serviceCategory) || 'Towing';

  // Check service types
  const isCarRental = serviceId === '11';
  const isFuelDelivery = serviceId === '3';
  const isSpareParts = serviceId === '12';
  const isTowing = serviceId === '1';
  const isCarWash = serviceId === '9' || serviceId === '10';

  // Get all data from previous screens
  const pickupAddress = getStringParam(params.pickupAddress);
  const pickupLat = getStringParam(params.pickupLat);
  const pickupLng = getStringParam(params.pickupLng);
  const dropoffAddress = getStringParam(params.dropoffAddress);
  const dropoffLat = getStringParam(params.dropoffLat);
  const dropoffLng = getStringParam(params.dropoffLng);

  // Waypoints data
  const waypointsParam = getStringParam(params.waypoints);
  const hasWaypoints = getStringParam(params.hasWaypoints) === 'true';

  // Additional details data
  const urgency = getStringParam(params.urgency) || 'moderate';
  const issues = getParsedArray(params.issues);
  const description = getStringParam(params.description);
  const photos = getParsedArray(params.photos);
  const hasInsurance = getStringParam(params.hasInsurance) === 'true';
  const needSpecificTruck = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications = getStringParam(params.hasModifications) === 'true';
  const needMultilingual = getStringParam(params.needMultilingual) === 'true';

  // Vehicle data from VehicleContactInfoScreen
  const vehicleType = getStringParam(params.vehicleType);
  const makeModel = getStringParam(params.makeModel);
  const year = getStringParam(params.year);
  const color = getStringParam(params.color);
  const licensePlate = getStringParam(params.licensePlate);
  const selectedVehicle = getStringParam(params.selectedVehicle);

  // Contact data from VehicleContactInfoScreen
  const fullName = getStringParam(params.fullName);
  const phoneNumber = getStringParam(params.phoneNumber);
  const email = getStringParam(params.email);
  const emergencyContact = getStringParam(params.emergencyContact);

  // Special fields from VehicleContactInfoScreen
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);

  // Location skipped flag
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

  // Schedule data - FIXED: Use scheduledAt from ScheduleServiceScreen
  const serviceTime = getStringParam(params.serviceTime) || 'right_now';
  const scheduledAt = getStringParam(params.scheduledAt);
  
  // Parse scheduledAt if it exists
  const getScheduledDate = (): string => {
    if (!scheduledAt) return '';
    try {
      const date = new Date(scheduledAt);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };
  
  const getScheduledTimeSlot = (): string => {
    if (!scheduledAt) return '';
    try {
      const date = new Date(scheduledAt);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };
  
  const scheduledDate = getScheduledDate();
  const scheduledTimeSlot = getScheduledTimeSlot();
  
  // Check if this is a scheduled booking
  const isScheduledBooking = serviceTime === 'schedule_later' && !!scheduledAt;

  const tipOptions = [
    { label: 'No Tip', value: 0 },
    { label: '5 BHD', value: 5 },
    { label: '10 BHD', value: 10 },
    { label: '15 BHD', value: 15 },
  ];
  
  useEffect(() => {
    // Parse waypoints for detailed logging
    let parsedWaypoints: any[] = [];
    if (hasWaypoints && waypointsParam) {
      try {
        parsedWaypoints = JSON.parse(waypointsParam);
      } catch (e) {
        console.error('Error parsing waypoints for log:', e);
      }
    }

    // Parse service price
    const baseServiceFee = parsePrice(servicePrice);
    const distanceFee = isCarRental ? 0 : 15;
    const platformServiceFee = 5;
    const taxRate = 0.05;
    const subtotal = baseServiceFee + distanceFee + platformServiceFee;
    const tax = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + tax + (selectedTip || 0);

    // Log ALL received data for debugging
    console.log('=====================================');
    console.log('💰 PriceSummary - RECEIVED DATA:');
    console.log('=====================================');

    // Service Info
    console.log('📦 SERVICE INFO:');
    console.log('  • serviceId:', serviceId);
    console.log('  • serviceName:', serviceName);
    console.log('  • servicePrice:', servicePrice);
    console.log('  • serviceCategory:', serviceCategory);

    // Location Data - WITH COORDINATES
    console.log('📍 LOCATION DATA:');
    console.log('  • pickupAddress:', pickupAddress);
    console.log('  • pickupLat:', pickupLat);
    console.log('  • pickupLng:', pickupLng);
    console.log('  • dropoffAddress:', dropoffAddress || '(not provided)');
    console.log('  • dropoffLat:', dropoffLat || '(not provided)');
    console.log('  • dropoffLng:', dropoffLng || '(not provided)');

    // Waypoints Data
    console.log('🛑 WAYPOINTS DATA:');
    console.log('  • hasWaypoints:', hasWaypoints);
    console.log('  • waypointsParam raw:', waypointsParam);
    console.log('  • parsed waypoints count:', parsedWaypoints.length);
    if (parsedWaypoints.length > 0) {
      parsedWaypoints.forEach((wp, index) => {
        console.log(`    Stop ${index + 1}:`);
        console.log(`      address: ${wp.address}`);
        console.log(`      lat: ${wp.lat}`);
        console.log(`      lng: ${wp.lng}`);
        console.log(`      order: ${wp.order}`);
      });
    }

    // Vehicle Data
    console.log('🚗 VEHICLE DATA:');
    console.log('  • vehicleType:', vehicleType);
    console.log('  • makeModel:', makeModel);
    console.log('  • year:', year);
    console.log('  • color:', color);
    console.log('  • licensePlate:', licensePlate);
    console.log('  • selectedVehicle:', selectedVehicle);

    // Contact Data
    console.log('👤 CONTACT DATA:');
    console.log('  • fullName:', fullName);
    console.log('  • phoneNumber:', phoneNumber);
    console.log('  • email:', email);
    console.log('  • emergencyContact:', emergencyContact);

    // Special Fields
    console.log('🔧 SPECIAL FIELDS:');
    console.log('  • hasLicenseFront:', !!licenseFront);
    console.log('  • hasLicenseBack:', !!licenseBack);
    console.log('  • fuelType:', fuelType || '(not provided)');
    console.log('  • partDescription:', partDescription ? partDescription.substring(0, 50) + '...' : '(not provided)');

    // Additional Details
    console.log('📝 ADDITIONAL DETAILS:');
    console.log('  • urgency:', urgency);
    console.log('  • issues count:', issues.length);
    console.log('  • description:', description ? description.substring(0, 50) + '...' : '(not provided)');
    console.log('  • photos count:', photos.length);
    console.log('  • hasInsurance:', hasInsurance);
    console.log('  • needSpecificTruck:', needSpecificTruck);
    console.log('  • hasModifications:', hasModifications);
    console.log('  • needMultilingual:', needMultilingual);

    // Schedule Data - UPDATED
    console.log('📅 SCHEDULE DATA:');
    console.log('  • serviceTime:', serviceTime);
    console.log('  • scheduledAt:', scheduledAt || '(not provided)');
    console.log('  • scheduledDate:', scheduledDate || '(not provided)');
    console.log('  • scheduledTimeSlot:', scheduledTimeSlot || '(not provided)');
    console.log('  • isScheduledBooking:', isScheduledBooking);

    // Service Types
    console.log('⚙️ SERVICE TYPES:');
    console.log('  • isCarRental:', isCarRental);
    console.log('  • isFuelDelivery:', isFuelDelivery);
    console.log('  • isSpareParts:', isSpareParts);
    console.log('  • isTowing:', isTowing);
    console.log('  • isCarWash:', isCarWash);
    console.log('  • locationSkipped:', locationSkipped);

    // Price Info
    console.log('💵 PRICE INFO:');
    console.log('  • baseServiceFee:', baseServiceFee);
    console.log('  • distanceFee:', distanceFee);
    console.log('  • platformServiceFee:', platformServiceFee);
    console.log('  • tax:', tax);
    console.log('  • selectedTip:', selectedTip);
    console.log('  • totalAmount:', totalAmount);

    console.log('=====================================');

  }, []);

  const handleBack = () => {
    router.back();
  };




  // API request function for scheduled bookings
  const submitScheduledBooking = async (): Promise<boolean> => {
    // Parse waypoints if they exist
    let parsedWaypoints: any[] = [];
    if (hasWaypoints && waypointsParam) {
      try {
        parsedWaypoints = JSON.parse(waypointsParam);
      } catch (e) {
        console.error('Error parsing waypoints:', e);
      }
    }

    // Generate a unique booking ID
    const newBookingId = `YHIW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare booking data matching FindingProvider format
    const bookingData = {
      bookingId: newBookingId,
      
      pickup: {
        address: pickupAddress,
        coordinates: pickupLat && pickupLng ? { 
          lat: parseFloat(pickupLat), 
          lng: parseFloat(pickupLng) 
        } : null,
      },
      
      dropoff: dropoffAddress ? {
        address: dropoffAddress,
        coordinates: dropoffLat && dropoffLng ? { 
          lat: parseFloat(dropoffLat), 
          lng: parseFloat(dropoffLng) 
        } : null,
      } : null,
      
      waypoints: hasWaypoints && parsedWaypoints.length > 0 ? parsedWaypoints : null,
      hasWaypoints: hasWaypoints,
      
      serviceId,
      serviceName,
      servicePrice: parsePrice(servicePrice),
      serviceCategory,
      isCarRental,
      isFuelDelivery,
      isSpareParts,
      
      vehicle: {
        type: vehicleType,
        makeModel,
        year,
        color,
        licensePlate,
      },
      
      customer: {
        name: fullName,
        phone: phoneNumber,
        email: email,
        emergencyContact,
      },
      
      carRental: isCarRental ? {
        licenseFront,
        licenseBack,
        hasInsurance,
      } : null,
      
      fuelDelivery: isFuelDelivery ? {
        fuelType,
      } : null,
      
      spareParts: isSpareParts ? {
        partDescription,
      } : null,
      
      additionalDetails: {
        urgency,
        issues: issues.length > 0 ? issues : null,
        description,
        photos: photos.length > 0 ? photos : null,
        needSpecificTruck,
        hasModifications,
        needMultilingual,
      },
      
      schedule: {
        type: serviceTime,
        scheduledDateTime: isScheduledBooking && scheduledAt ? {
          date: scheduledDate,
          timeSlot: scheduledTimeSlot,
          isoString: scheduledAt,
        } : null,
      },
      
      payment: {
        totalAmount: totalAmount,
        selectedTip,
        baseServiceFee: parsePrice(servicePrice),
        paymentMethod: 'cash',
      },
      
      locationSkipped,
      timestamp: new Date().toISOString(),
      platform: 'mobile',
      version: '1.1',
    };

    console.log('Submitting scheduled booking:', JSON.stringify(bookingData, null, 2));

    // Get auth token
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication token not found. Please sign in again.');
    }

    // Make real API call
    const response = await fetch('https://yhiw-backend.onrender.com/api/jobs/create-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `Server error: ${response.status}`);
    }

    if (responseData.success) {
      // Store booking ID
      await AsyncStorage.setItem('currentBookingId', responseData.bookingId);
      return true;
    } else {
      throw new Error('Failed to create booking');
    }
  };



  
  const handleContinue = async () => {
    // Validate required fields
    if (!fullName || !phoneNumber) {
      Alert.alert('Error', 'Missing contact information. Please go back and complete all required fields.');
      return;
    }

    // For RIGHT NOW service - just navigate to next page (Finding Provider)
    if (!isScheduledBooking) {
      console.log('Right now service - navigating to Finding Provider');
      
      // Pass all data to FindingProvider screen
      router.push({
        pathname: '/(customer)/FindingProvider',
        params: {
          // Location
          pickupAddress, pickupLat, pickupLng,
          dropoffAddress, dropoffLat, dropoffLng,
          // Service
          serviceId, serviceName, servicePrice, serviceCategory,
          // Vehicle
          vehicleType, makeModel, year, color, licensePlate, selectedVehicle,
          // Contact
          fullName, phoneNumber, email, emergencyContact,
          saveVehicle: getStringParam(params.saveVehicle),
          licenseFront, licenseBack,
          fuelType, partDescription,
          // Additional
          urgency,
          issues: JSON.stringify(issues),
          description,
          photos: JSON.stringify(photos),
          hasInsurance: String(hasInsurance),
          needSpecificTruck: String(needSpecificTruck),
          hasModifications: String(hasModifications),
          needMultilingual: String(needMultilingual),
          locationSkipped: String(locationSkipped),
          // Schedule
          serviceTime,
          scheduledAt,

          // Payment info
          totalAmount: totalAmount.toFixed(2),
          selectedTip: String(selectedTip),
        },
      });
      return;
    }

    // For SCHEDULED service - submit API request
    setIsSubmitting(true);
    
    try {
      const success = await submitScheduledBooking();
      
      if (success) {
        Alert.alert(
          'Booking Confirmed!',
          'Your scheduled service has been booked successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(customer)/Home');
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTip = (value: number) => {
    setSelectedTip(value);
  };

  // Parse service price from string (e.g., "75 BHD" -> 75)
  const parsePrice = (price: string): number => {
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 75;
  };

  // Calculate fees based on service type
  const baseServiceFee = parsePrice(servicePrice);
  const distanceFee = isCarRental ? 0 : 15;
  const platformServiceFee = 5;
  const taxRate = 0.05;

  const subtotal = baseServiceFee + distanceFee + platformServiceFee;
  const tax = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + tax + (selectedTip || 0);

  // Format schedule display text - UPDATED
  const getScheduleDisplay = () => {
    if (serviceTime === 'right_now') {
      return 'ASAP (15-20 min)';
    } else if (isScheduledBooking && scheduledAt) {
      try {
        const date = new Date(scheduledAt);
        return `${date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })} at ${date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`;
      } catch {
        return 'Schedule later';
      }
    } else {
      return 'Schedule later';
    }
  };

  // Get button text based on booking type
  const getButtonText = () => {
    if (isScheduledBooking) {
      return 'Confirm Booking';
    } else {
      return 'Continue to Find Provider';
    }
  };

  // Get service-specific summary details
  const getServiceSpecificSummary = () => {
    if (isCarRental && licenseFront) {
      return (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>License:</Text>
          <Text style={styles.summaryValue}>Uploaded ✓</Text>
        </View>
      );
    }
    if (isFuelDelivery && fuelType) {
      return (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fuel Type:</Text>
          <Text style={styles.summaryValue}>
            {fuelType === 'petrol' ? 'Petrol' :
              fuelType === 'diesel' ? 'Diesel' : 'Premium'}
          </Text>
        </View>
      );
    }
    if (isSpareParts && partDescription) {
      return (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Part:</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {partDescription.substring(0, 30)}...
          </Text>
        </View>
      );
    }
    return null;
  };

  // Get step number based on service
  const getStepNumber = () => {
    if (isCarRental) return 6;
    return 5;
  };

  // Get total steps
  const getTotalSteps = () => {
    return 7;
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const step = getStepNumber();
    const total = getTotalSteps();
    return `${(step / total) * 100}%`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image
            source={require('../../assets/customer/back_button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>PRICE SUMMARY</Text>
          <Text style={styles.headerSubtitle}>Step {getStepNumber()} of {getTotalSteps()}</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Image
            source={require('../../assets/customer/LanguageToggle.png')}
            style={styles.editIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: getProgressPercentage() as any }]} />
        </View>
      </View>

      {/* Scheduled Booking Banner */}
      {isScheduledBooking && (
        <View style={styles.scheduledBanner}>
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
          <Text style={styles.scheduledBannerText}>
            Scheduled for {getScheduleDisplay()}
          </Text>
        </View>
      )}

      {/* Service Banner for special services */}
      {isCarRental && (
        <View style={styles.serviceBanner}>
          <Ionicons name="car" size={20} color="#FFFFFF" />
          <Text style={styles.serviceBannerText}>
            Car Rental - License verified ✓
          </Text>
        </View>
      )}
      {isFuelDelivery && fuelType && (
        <View style={[styles.serviceBanner, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="flame" size={20} color="#FFFFFF" />
          <Text style={styles.serviceBannerText}>
            Fuel: {fuelType === 'petrol' ? 'Petrol' : fuelType === 'diesel' ? 'Diesel' : 'Premium'}
          </Text>
        </View>
      )}
      {isSpareParts && partDescription && (
        <View style={[styles.serviceBanner, { backgroundColor: '#9C27B0' }]}>
          <Ionicons name="construct" size={20} color="#FFFFFF" />
          <Text style={styles.serviceBannerText}>
            Part details provided
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>BOOKING SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{serviceName}</Text>
          </View>

          {/* Show service-specific summary */}
          {getServiceSpecificSummary()}

          {/* Show pickup only if not locationSkipped or if it's a valid address */}
          {!locationSkipped && pickupAddress && pickupAddress !== 'Location not required for this service' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup:</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {pickupAddress}
              </Text>
            </View>
          )}

          {dropoffAddress && !locationSkipped && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dropoff:</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {dropoffAddress}
              </Text>
            </View>
          )}

          {/* Show waypoints count if any */}
          {hasWaypoints && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stops:</Text>
              <Text style={styles.summaryValue}>
                {getParsedArray(params.waypoints).length} stops
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Schedule:</Text>
            <Text style={styles.summaryValue}>{getScheduleDisplay()}</Text>
          </View>

          {urgency && !isCarRental && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Urgency:</Text>
              <Text style={styles.summaryValue}>
                {urgency === 'urgent' ? 'Urgent' :
                  urgency === 'moderate' ? 'Moderate' : 'Not Urgent'}
              </Text>
            </View>
          )}

          {vehicleType && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle:</Text>
              <Text style={styles.summaryValue}>
                {makeModel || vehicleType}
              </Text>
            </View>
          )}

          {licensePlate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plate:</Text>
              <Text style={styles.summaryValue}>{licensePlate}</Text>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.cardTitle}>PRICE BREAKDOWN</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Service Fee</Text>
            <Text style={styles.priceValue}>{baseServiceFee} BHD</Text>
          </View>

          {!isCarRental && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distance Fee (~5 km)</Text>
              <Text style={styles.priceValue}>{distanceFee} BHD</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Service Fee</Text>
            <Text style={styles.priceValue}>{platformServiceFee} BHD</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (5%)</Text>
            <Text style={styles.priceValue}>{tax} BHD</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{subtotal.toFixed(2)} BHD</Text>
          </View>

          {selectedTip > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tip</Text>
              <Text style={styles.priceValue}>{selectedTip} BHD</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{totalAmount.toFixed(2)} BHD</Text>
          </View>
        </View>

        {/* Tip Section - Hide for Car Rental maybe? */}
        {!isCarRental && (
          <View style={styles.tipCard}>
            <Text style={styles.cardTitle}>ADD TIP (OPTIONAL)</Text>

            <View style={styles.tipOptionsContainer}>
              {tipOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.tipButton,
                    selectedTip === option.value && styles.tipButtonSelected,
                  ]}
                  onPress={() => handleSelectTip(option.value)}
                >
                  <Text
                    style={[
                      styles.tipButtonText,
                      selectedTip === option.value && styles.tipButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.tipNote}>
              100% of your tip goes directly to the service provider
            </Text>
          </View>
        )}

        {/* Promo Code */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>HAVE A PROMO CODE?</Text>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Enter Code</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>PAYMENT METHOD</Text>

          {/* MVP Notice */}
          <View style={styles.mvpNotice}>
            <Ionicons name="information-circle" size={20} color="#8B0000" />
            <View style={styles.mvpNoticeTextContainer}>
              <Text style={styles.mvpNoticeTitle}>
                MVP Notice - Cash Payment Only
              </Text>
              <Text style={styles.mvpNoticeText}>
                This is an MVP version. Only cash payment is available at this time.
                Online payment methods will be added in future updates.
              </Text>
            </View>
          </View>

          {/* Cash Payment Option */}
          <TouchableOpacity style={styles.paymentOption}>
            <View style={styles.paymentOptionLeft}>
              <Image
                source={require('../../assets/customer/cash.png')}
                style={styles.paymentIcon}
              />
              <View>
                <Text style={styles.paymentMethodName}>Cash</Text>
                <Text style={styles.paymentMethodDesc}>
                  Pay when service is complete
                </Text>
              </View>
            </View>
            <View style={styles.radioButton}>
              <View style={styles.radioButtonInner} />
            </View>
          </TouchableOpacity>

          {/* Disabled Payment Options */}
          <View style={styles.paymentOptionDisabled}>
            <View style={styles.paymentOptionLeft}>
              <Image
                source={require('../../assets/customer/credit.png')}
                style={[styles.paymentIcon, styles.disabledIcon]}
              />
              <View>
                <Text style={styles.paymentMethodNameDisabled}>Credit Card</Text>
                <Text style={styles.paymentMethodDescDisabled}>Coming Soon</Text>
              </View>
            </View>
            <View style={styles.radioButtonDisabled} />
          </View>

          <View style={styles.paymentOptionDisabled}>
            <View style={styles.paymentOptionLeft}>
              <Image
                source={require('../../assets/customer/yhiw.png')}
                style={[styles.paymentIcon, styles.disabledIcon]}
              />
              <View>
                <Text style={styles.paymentMethodNameDisabled}>VHIW Wallet</Text>
                <Text style={styles.paymentMethodDescDisabled}>Coming Soon</Text>
              </View>
            </View>
            <View style={styles.radioButtonDisabled} />
          </View>
        </View>

        {/* Price Guarantee */}
        <View style={styles.guaranteeBox}>
          <View style={styles.guaranteeHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#68bdee" />
            <Text style={styles.guaranteeTitle}>Price Guarantee</Text>
          </View>
          <Text style={styles.guaranteeText}>
            {isCarRental
              ? 'Final price includes all rental fees and insurance. No hidden charges.'
              : 'Final price may vary by ±10% based on actual distance and service time. You\'ll be notified of any changes before service begins and can cancel free of charge.'
            }
          </Text>
        </View>

        {/* How is the price calculated */}
        <View style={styles.calculationCard}>
          <View style={styles.calculationHeaderContainer}>
            <Text style={styles.calculationTitle}>
              HOW IS THE PRICE CALCULATED?
            </Text>
          </View>

          <View style={styles.calculationDivider} />

          {isCarRental ? (
            // Car Rental specific calculation
            <>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Base rental fee includes daily rate and insurance
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Platform fee supports app maintenance
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  All taxes are included in the final price
                </Text>
              </View>
            </>
          ) : (
            // Normal service calculation
            <>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Base fee covers the first 3km and basic service
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Distance fee: 3 BHD per additional kilometer
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Platform fee supports app maintenance
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  Urgent service adds priority to your request
                </Text>
              </View>
              <View style={styles.calculationItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.calculationText}>
                  All taxes are included in the final price
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalToPayLabel}>Total to Pay</Text>
          <Text style={styles.totalToPayAmount}>{totalAmount.toFixed(2)} BHD</Text>
        </View>

        {isSubmitting ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingButtonText}>Processing...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Text style={styles.continueButtonText}>{getButtonText()}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default PriceSummaryScreen;
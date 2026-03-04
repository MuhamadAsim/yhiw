import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const saveVehicle = getStringParam(params.saveVehicle) === 'true';

  // Special fields from VehicleContactInfoScreen
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);

  // Location skipped flag
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

  // Schedule data
  const serviceTime = getStringParam(params.serviceTime) || 'schedule_later';
  const scheduledDate = getStringParam(params.scheduledDate);
  const scheduledTimeSlot = getStringParam(params.scheduledTimeSlot);

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
    console.log('  • saveVehicle:', saveVehicle);

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

    // Schedule Data
    console.log('📅 SCHEDULE DATA:');
    console.log('  • serviceTime:', serviceTime);
    console.log('  • scheduledDate:', scheduledDate || '(not provided)');
    console.log('  • scheduledTimeSlot:', scheduledTimeSlot || '(not provided)');

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

  // Mock API request function
  const submitBooking = async (): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate for demo
        const success = Math.random() > 0.1;
        resolve(success);
      }, 1500); // Simulate network delay
    });
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!fullName || !phoneNumber) {
      Alert.alert('Error', 'Missing contact information. Please go back and complete all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare booking data for API
      const bookingData = {
        // Service info
        serviceId,
        serviceName,
        serviceCategory,
        basePrice: baseServiceFee,

        // Location data
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        waypoints: hasWaypoints ? JSON.parse(waypointsParam) : [],

        // Schedule data
        serviceTime,
        scheduledDate,
        scheduledTimeSlot,

        // Vehicle data
        vehicleType,
        makeModel,
        year,
        color,
        licensePlate,

        // Contact data
        fullName,
        phoneNumber,
        email,
        emergencyContact,

        // Special fields
        licenseFront,
        licenseBack,
        fuelType,
        partDescription,

        // Additional details
        urgency,
        issues,
        description,
        hasInsurance,
        needSpecificTruck,
        hasModifications,
        needMultilingual,

        // Payment data
        tip: selectedTip,
        totalAmount: totalAmount,

        // Metadata
        locationSkipped,
        createdAt: new Date().toISOString(),
      };

      console.log('Submitting booking:', bookingData);

      // Check if this is a scheduled booking
      const isScheduledBooking = serviceTime === 'schedule_later' && scheduledDate && scheduledTimeSlot;

      if (isScheduledBooking) {
        // For scheduled bookings, make API request and go to home
        const success = await submitBooking();

        if (success) {
          Alert.alert(
            'Booking Saved!',
            'Your service has been scheduled successfully. You will receive a confirmation shortly.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to home screen (main app)
                  router.push('/(customer)/home'); // Adjust this path based on your routing structure
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Booking Failed',
            'There was an error saving your booking. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // For immediate bookings (Right Now), proceed to Confirm Booking screen
        router.push({
          pathname: '/(customer)/ConfirmBooking',
          params: {
            // Location data
            pickupAddress,
            pickupLat,
            pickupLng,
            dropoffAddress,
            dropoffLat,
            dropoffLng,

            // Waypoints
            waypoints: waypointsParam,
            hasWaypoints: String(hasWaypoints),

            // Service data
            serviceId,
            serviceName,
            servicePrice,
            serviceCategory,

            // Additional details
            urgency,
            issues: JSON.stringify(issues),
            description,
            photos: JSON.stringify(photos),
            hasInsurance: String(hasInsurance),
            needSpecificTruck: String(needSpecificTruck),
            hasModifications: String(hasModifications),
            needMultilingual: String(needMultilingual),

            // Vehicle data
            vehicleType,
            makeModel,
            year,
            color,
            licensePlate,
            selectedVehicle,

            // Contact data
            fullName,
            phoneNumber,
            email,
            emergencyContact,
            saveVehicle: String(saveVehicle),

            // Special fields
            licenseFront,
            licenseBack,
            fuelType,
            partDescription,

            // Location skipped flag
            locationSkipped: String(locationSkipped),

            // Schedule data
            serviceTime,
            scheduledDate,
            scheduledTimeSlot,

            // Payment data
            selectedTip: String(selectedTip),
            totalAmount: String(totalAmount),
          }
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
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

  // Different fee structure for Car Rental
  const distanceFee = isCarRental ? 0 : 15; // No distance fee for car rental
  const platformServiceFee = 5;
  const taxRate = 0.05;

  const subtotal = baseServiceFee + distanceFee + platformServiceFee;
  const tax = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + tax + (selectedTip || 0);

  // Format schedule display text
  const getScheduleDisplay = () => {
    if (serviceTime === 'right_now') {
      return 'ASAP (15-20 min)';
    } else if (scheduledDate && scheduledTimeSlot) {
      try {
        const date = new Date(scheduledDate);
        return `${date.toLocaleDateString()} at ${scheduledTimeSlot}`;
      } catch {
        return `${scheduledDate} at ${scheduledTimeSlot}`;
      }
    } else {
      return 'Schedule later';
    }
  };

  // Check if this is a scheduled booking
  const isScheduledBooking = serviceTime === 'schedule_later' && scheduledDate && scheduledTimeSlot;

  // Get button text based on booking type
  const getButtonText = () => {
    if (isScheduledBooking) {
      return 'Save Booking';
    } else {
      return 'Continue to Confirm';
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
    if (isCarRental) return 6; // Location (1) → Vehicle+License (2) → Additional (3) → Schedule (4) → Price Summary (5) → Confirm (6)
    return 5; // Normal flow: Location (1) → Vehicle (2) → Additional (3) → Schedule (4) → Price Summary (5)
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backIcon: {
    width: 46,
    height: 46,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
  editIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#68bdee',
    borderRadius: 3,
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  scheduledBannerText: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#68bdee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  serviceBannerText: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
    width: 80,
  },
  summaryValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 13,
    color: '#5c5c5c',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  subtotalLabel: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  subtotalValue: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#3c3c3c',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#68bdee',
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  tipOptionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tipButtonSelected: {
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
  },
  tipButtonText: {
    fontSize: 12,
    color: '#5c5c5c',
    fontWeight: '600',
  },
  tipButtonTextSelected: {
    color: '#68bdee',
    fontWeight: 'bold',
  },
  tipNote: {
    fontSize: 10,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  promoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promoButtonText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3c3c3c',
  },
  mvpNotice: {
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  mvpNoticeTextContainer: {
    flex: 1,
  },
  mvpNoticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 6,
  },
  mvpNoticeText: {
    fontSize: 11,
    color: '#FF0000',
    lineHeight: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#68bdee',
    backgroundColor: '#e3f5ff',
    marginBottom: 12,
  },
  paymentOptionDisabled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    marginBottom: 12,
    opacity: 0.6,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  disabledIcon: {
    opacity: 0.5,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  radioButtonDisabled: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d0d0d0',
  },
  paymentMethodName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  paymentMethodDesc: {
    fontSize: 11,
    color: '#5c5c5c',
    marginTop: 2,
  },
  paymentMethodNameDisabled: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#a0a0a0',
  },
  paymentMethodDescDisabled: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 2,
  },
  guaranteeBox: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#5c5c5c',
    lineHeight: 16,
  },
  calculationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 15,
  },
  calculationHeaderContainer: {
    borderWidth: 2,
    borderColor: '#3c3c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  calculationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  calculationDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  calculationItem: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingLeft: 5,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginTop: 7,
    marginRight: 12,
  },
  calculationText: {
    fontSize: 11,
    color: '#5c5c5c',
    lineHeight: 18,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalContainer: {
    flex: 1,
  },
  totalToPayLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalToPayAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#68bdee',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingButton: {
    backgroundColor: '#b0b0b0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default PriceSummaryScreen;
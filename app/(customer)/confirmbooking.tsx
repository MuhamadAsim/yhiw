import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import {styles} from './styles/ConfirmBookingStyles';

const ConfirmBookingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

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
  const serviceName = getStringParam(params.serviceName);
  const servicePrice = getStringParam(params.servicePrice);
  const serviceCategory = getStringParam(params.serviceCategory);
  
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
  
  // Additional details data
  const urgency = getStringParam(params.urgency);
  const issues = getParsedArray(params.issues);
  const description = getStringParam(params.description);
  const photos = getParsedArray(params.photos);
  const hasInsurance = getStringParam(params.hasInsurance) === 'true';
  const needSpecificTruck = getStringParam(params.needSpecificTruck) === 'true';
  const hasModifications = getStringParam(params.hasModifications) === 'true';
  const needMultilingual = getStringParam(params.needMultilingual) === 'true';
  
  // Schedule data
  const serviceTime = getStringParam(params.serviceTime);
  const scheduledDate = getStringParam(params.scheduledDate);
  const scheduledTimeSlot = getStringParam(params.scheduledTimeSlot);
  
  // Payment data
  const selectedTip = parseFloat(getStringParam(params.selectedTip)) || 0;
  const totalAmount = parseFloat(getStringParam(params.totalAmount)) || 0;

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
  
  // NEW FIELDS from VehicleContactInfoScreen
  const licenseFront = getStringParam(params.licenseFront);
  const licenseBack = getStringParam(params.licenseBack);
  const fuelType = getStringParam(params.fuelType);
  const partDescription = getStringParam(params.partDescription);
  
  // Location skipped flag
  const locationSkipped = getStringParam(params.locationSkipped) === 'true';

 useEffect(() => {
  // Log ALL received data for debugging
  console.log('=====================================');
  console.log('✅ ConfirmBooking - RECEIVED DATA:');
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
  
  // Waypoints Data - Parse if available
  const waypointsParam = getStringParam(params.waypoints);
  const hasWaypoints = getStringParam(params.hasWaypoints) === 'true';
  
  if (hasWaypoints && waypointsParam) {
    try {
      const parsedWaypoints = JSON.parse(waypointsParam);
      console.log('🛑 WAYPOINTS DATA:');
      console.log('  • hasWaypoints:', hasWaypoints);
      console.log('  • waypoints count:', parsedWaypoints.length);
      parsedWaypoints.forEach((wp: any, index: number) => {
        console.log(`    Stop ${index + 1}:`);
        console.log(`      address: ${wp.address}`);
        console.log(`      lat: ${wp.lat}`);
        console.log(`      lng: ${wp.lng}`);
        console.log(`      order: ${wp.order}`);
      });
    } catch (e) {
      console.log('  • Error parsing waypoints:', e);
    }
  } else {
    console.log('  • hasWaypoints:', hasWaypoints);
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
  
  // Payment Data
  console.log('💰 PAYMENT DATA:');
  console.log('  • selectedTip:', selectedTip);
  console.log('  • totalAmount:', totalAmount);
  
  // Service Types
  console.log('⚙️ SERVICE TYPES:');
  console.log('  • isCarRental:', isCarRental);
  console.log('  • isFuelDelivery:', isFuelDelivery);
  console.log('  • isSpareParts:', isSpareParts);
  console.log('  • isTowing:', isTowing);
  console.log('  • isCarWash:', isCarWash);
  console.log('  • locationSkipped:', locationSkipped);
  
  console.log('=====================================');
  
}, []);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (section: string) => {
    console.log(`Edit ${section}`);
    
    // Navigate back to specific screens based on section
    switch(section) {
      case 'service':
        router.back();
        break;
      case 'location':
        if (locationSkipped) {
          Alert.alert('Location Not Required', 'This service does not require a location');
          return;
        }
        router.push({
          pathname: '/(customer)/LocationDetails',
          params: {
            ...params
          }
        });
        break;
      case 'schedule':
        router.push({
          pathname: '/(customer)/ScheduleServices',
          params: {
            ...params
          }
        });
        break;
      case 'contact':
        router.push({
          pathname: '/(customer)/VehicleContactInfo',
          params: {
            ...params
          }
        });
        break;
      case 'payment':
        router.push({
          pathname: '/(customer)/PriceSummary',
          params: {
            ...params
          }
        });
        break;
      default:
        router.back();
    }
  };

  const handleConfirmBooking = () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please agree to the Terms of Service and Privacy Policy'
      );
      return;
    }
    
    console.log('Booking confirmed');
    
    // Navigate to tracking/confirmation screen with ALL data
    router.push({
      pathname: '/(customer)/FindingProvider',
      params: {
        // Pass all data to next screen
        ...params,
        confirmed: 'true',
        confirmationTime: new Date().toISOString(),
      }
    });
  };

  const handleGoBackToEdit = () => {
    router.back();
  };

  // Format schedule display text
  const getScheduleDisplay = () => {
    if (serviceTime === 'right_now') {
      return 'Right Now (ASAP)';
    } else if (serviceTime === 'schedule_later') {
      if (scheduledDate && scheduledTimeSlot) {
        try {
          const date = new Date(scheduledDate);
          return `${date.toLocaleDateString()} at ${scheduledTimeSlot}`;
        } catch {
          return `${scheduledDate} at ${scheduledTimeSlot}`;
        }
      }
      return 'Schedule Later';
    } else {
      return 'Not specified';
    }
  };

  // Format vehicle display name
  const getVehicleDisplay = () => {
    if (makeModel) {
      return makeModel;
    } else if (vehicleType) {
      return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
    } else {
      return 'Not specified';
    }
  };

  // Get service-specific details
  const getServiceSpecificDetails = () => {
    if (isCarRental && licenseFront) {
      return (
        <View style={styles.serviceSpecificRow}>
          <Ionicons name="card-outline" size={16} color="#4CAF50" />
          <Text style={styles.serviceSpecificText}>License Verified ✓</Text>
        </View>
      );
    }
    if (isFuelDelivery && fuelType) {
      return (
        <View style={styles.serviceSpecificRow}>
          <Ionicons name="flame-outline" size={16} color="#FF9800" />
          <Text style={styles.serviceSpecificText}>
            Fuel: {fuelType === 'petrol' ? 'Petrol' : 
                  fuelType === 'diesel' ? 'Diesel' : 'Premium'}
          </Text>
        </View>
      );
    }
    if (isSpareParts && partDescription) {
      return (
        <View style={styles.serviceSpecificRow}>
          <Ionicons name="construct-outline" size={16} color="#9C27B0" />
          <Text style={styles.serviceSpecificText} numberOfLines={1}>
            Part: {partDescription.substring(0, 30)}...
          </Text>
        </View>
      );
    }
    return null;
  };

  // Parse service price for calculations
  const parsePrice = (price: string): number => {
    if (!price) return 0;
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const baseServiceFee = parsePrice(servicePrice);
  const distanceFee = isCarRental ? 0 : 20; // No distance fee for car rental
  const tax = parseFloat((baseServiceFee * 0.05).toFixed(2));
  const calculatedTotal = baseServiceFee + distanceFee + tax + selectedTip;

  // Use totalAmount from params if available, otherwise calculate
  const displayTotal = totalAmount > 0 ? totalAmount : calculatedTotal;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image 
            source={require('../../assets/customer/back_button.png')}
            style={styles.backButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>CONFIRM BOOKING</Text>
          <Text style={styles.headerSubtitle}>Step 9 of 10 - Final Review</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '90%' }]} />
        </View>
      </View>

      {/* Full width separator line */}
      <View style={styles.fullWidthSeparator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Review Header */}
        <View style={styles.reviewHeader}>
          <View style={styles.checkIconContainer}>
            <Image 
              source={require('../../assets/customer/review_booking.png')}
              style={styles.reviewIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.reviewTitle}>Review Your Booking</Text>
          <Text style={styles.reviewSubtitle}>
            Please confirm all details are correct
          </Text>
        </View>

        {/* Service Details */}
        <View style={[styles.card, styles.serviceCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Image 
                source={require('../../assets/customer/service_details_icon.png')}
                style={styles.cardHeaderIcon}
                resizeMode="contain"
              />
              <Text style={styles.cardTitle}>SERVICE DETAILS</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit('service')}
              style={styles.editButton}
            >
              <Image 
                source={require('../../assets/customer/pen.png')}
                style={styles.penIcon}
                resizeMode="contain"
              />
              <Text style={[styles.editText, styles.underlineText]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.serviceInfo}>
            <Image
              source={require('../../assets/customer/roadside_towing.png')}
              style={styles.serviceIconNoContainer}
              resizeMode="contain"
            />
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceName}>{serviceName || 'Service'}</Text>
              <View style={styles.serviceTags}>
                <Text style={styles.simpleTag}>
                  {isCarRental ? 'Rental' : 
                   isFuelDelivery ? 'Fuel Delivery' :
                   isSpareParts ? 'Spare Parts' : 
                   isCarWash ? 'Car Wash' : 'Service'}
                </Text>
                {urgency === 'urgent' && !isCarRental && (
                  <>
                    <Text style={styles.plusSign}>+</Text>
                    <Text style={styles.simpleTag}>Priority Service</Text>
                  </>
                )}
              </View>
              {getServiceSpecificDetails()}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.vehicleDetailsContainer}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{getVehicleDisplay()}</Text>
              {year && <Text style={styles.detailSubValue}>{year}</Text>}
              {color && <Text style={styles.detailSubValue}>{color}</Text>}
            </View>
            
            <View style={styles.licensePlateContainer}>
              <Text style={styles.detailLabel}>License Plate</Text>
              <Text style={styles.detailValue}>{licensePlate || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Location Details - Only show if not skipped */}
        {!locationSkipped && pickupAddress && pickupAddress !== 'Location not required for this service' && (
          <View style={[styles.card, styles.locationCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="location-outline" size={20} color="#3c3c3c" />
                <Text style={styles.cardTitle}>LOCATION DETAILS</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleEdit('location')}
                style={styles.editButton}
              >
                <Image 
                  source={require('../../assets/customer/pen.png')}
                  style={styles.penIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.editText, styles.underlineText]}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationItem}>
              <View style={styles.locationIconBlue}>
                <View style={styles.locationDot} />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationAddress}>{pickupAddress}</Text>
              </View>
            </View>

            {dropoffAddress && (
              <View style={styles.locationItem}>
                <View style={styles.locationIconOutline}>
                  <View style={styles.locationDotOutline} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Drop-off Location</Text>
                  <Text style={styles.locationAddress}>{dropoffAddress}</Text>
                </View>
              </View>
            )}

            {!isCarRental && (
              <View style={styles.distanceButtonFull}>
                <Ionicons name="navigate-outline" size={18} color="#8c8c8c" />
                <Text style={styles.distanceText}>Estimated Distance: 5.2 km</Text>
              </View>
            )}
          </View>
        )}

        {/* Location Skipped Banner - Show for Car Rental/Spare Parts */}
        {locationSkipped && (
          <View style={[styles.card, styles.locationCard]}>
            <View style={styles.locationSkippedBanner}>
              <Ionicons name="information-circle-outline" size={20} color="#68bdee" />
              <Text style={styles.locationSkippedText}>
                Location not required for this service
              </Text>
            </View>
          </View>
        )}

        {/* Schedule */}
        <View style={[styles.card, styles.scheduleCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="calendar-outline" size={20} color="#3c3c3c" />
              <Text style={styles.cardTitle}>SCHEDULE</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit('schedule')}
              style={styles.editButton}
            >
              <Image 
                source={require('../../assets/customer/pen.png')}
                style={styles.penIcon}
                resizeMode="contain"
              />
              <Text style={[styles.editText, styles.underlineText]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleIconContainer}>
              <Image 
                source={require('../../assets/customer/schedule.png')}
                style={styles.scheduleImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.scheduleTextContainer}>
              <Text style={styles.scheduleTitle} numberOfLines={1}>
                {getScheduleDisplay()}
              </Text>
              <Text style={styles.scheduleSubtitle} numberOfLines={2}>
                {serviceTime === 'right_now' && !isCarRental
                  ? 'Provider will arrive in 15-20 minutes'
                  : isCarRental && scheduledDate
                  ? 'Rental scheduled'
                  : 'You will select date and time later'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={[styles.card, styles.contactCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="person-outline" size={20} color="#3c3c3c" />
              <Text style={styles.cardTitle}>CONTACT INFORMATION</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit('contact')}
              style={styles.editButton}
            >
              <Image 
                source={require('../../assets/customer/pen.png')}
                style={styles.penIcon}
                resizeMode="contain"
              />
              <Text style={[styles.editText, styles.underlineText]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="person-outline" size={20} color="#8c8c8c" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Name</Text>
              <Text style={styles.contactValue}>{fullName || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#8c8c8c" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>{phoneNumber || 'Not provided'}</Text>
            </View>
          </View>

          {email ? (
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#8c8c8c" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{email}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Payment Summary */}
        <View style={[styles.card, styles.paymentCard, styles.paymentCardWithBlueBorder]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Image 
                source={require('../../assets/customer/dollar_icon.png')}
                style={styles.cardHeaderIcon}
                resizeMode="contain"
              />
              <Text style={styles.cardTitle}>PAYMENT SUMMARY</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit('payment')}
              style={styles.editButton}
            >
              <Image 
                source={require('../../assets/customer/pen.png')}
                style={styles.penIcon}
                resizeMode="contain"
              />
              <Text style={[styles.editText, styles.underlineText]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Service Fee</Text>
            <Text style={styles.paymentValue}>{baseServiceFee || 75} BHD</Text>
          </View>

          {!isCarRental && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Distance & Fees</Text>
              <Text style={styles.paymentValue}>{distanceFee} BHD</Text>
            </View>
          )}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tax (5%)</Text>
            <Text style={styles.paymentValue}>{tax} BHD</Text>
          </View>

          {selectedTip > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tip</Text>
              <Text style={styles.paymentValue}>{selectedTip} BHD</Text>
            </View>
          )}

          <View style={styles.bolderDivider} />

          <View style={styles.paymentRowTotal}>
            <Text style={styles.paymentLabelTotal}>Total Amount</Text>
            <Text style={styles.paymentValueTotal}>{displayTotal.toFixed(2)} BHD</Text>
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.paymentMethodLabel}>Cash on Service</Text>
          </View>
        </View>

        {/* Additional Notes */}
        <View style={[styles.card, styles.notesCard]}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="document-text-outline" size={20} color="#3c3c3c" />
            <Text style={styles.cardTitle}>ADDITIONAL NOTES</Text>
          </View>
          {description ? (
            <Text style={styles.notesText}>{description}</Text>
          ) : isSpareParts && partDescription ? (
            <Text style={styles.notesText}>{partDescription}</Text>
          ) : (
            <Text style={styles.notesPlaceholder}>No additional notes provided</Text>
          )}
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.7}
        >
          <View style={styles.checkbox}>
            {agreedToTerms && <View style={styles.checkboxDot} />}
          </View>
          <Text style={styles.checkboxText}>
            I agree to the{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>. I understand that
            {isCarRental 
              ? ' cancellation within 24 hours of scheduled time may incur a fee.'
              : ' cancellation within 2 hours of scheduled time may incur a fee.'}
          </Text>
        </TouchableOpacity>

        {/* Your Safety Matters */}
        <View style={styles.safetyNotice}>
          <View style={styles.safetyIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#68bdee" />
          </View>
          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>Your Safety Matters</Text>
            <Text style={styles.safetyText}>
              All our providers are verified, insured, and rated by users like you.
              Track your provider in real-time and contact support 24/7 if needed.
            </Text>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.cancellationCard}>
          <View style={[styles.card, styles.notesCard, { marginBottom: 0 }]}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>
                {isCarRental ? 'RENTAL CANCELLATION POLICY' : 'CANCELLATION POLICY'}
              </Text>
            </View>
          </View>
          
          <View style={styles.policyDividerFull} />
          
          {isCarRental ? (
            <>
              <View style={styles.policyItem}>
                <View style={[styles.bulletPoint, styles.blackBullet]} />
                <Text style={styles.policyText}>
                  Free cancellation up to 24 hours before scheduled time
                </Text>
              </View>
              <View style={styles.policyItem}>
                <View style={[styles.bulletPoint, styles.blackBullet]} />
                <Text style={styles.policyText}>
                  50% fee if cancelled within 24 hours
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.policyItem}>
                <View style={[styles.bulletPoint, styles.blackBullet]} />
                <Text style={styles.policyText}>
                  Free cancellation up to 2 hours before scheduled time
                </Text>
              </View>
              <View style={styles.policyItem}>
                <View style={[styles.bulletPoint, styles.blackBullet]} />
                <Text style={styles.policyText}>
                  50% fee if cancelled within 2 hours of scheduled time
                </Text>
              </View>
              <View style={styles.policyItem}>
                <View style={[styles.bulletPoint, styles.blackBullet]} />
                <Text style={styles.policyText}>
                  Full fee if provider has already arrived
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Container */}
      <View style={styles.bottomContainer}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color="#F57C00" />
          <Text style={styles.warningText}>
            Review all details before confirming
          </Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.confirmButtonText}>Confirm & Request Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backEditButton}
          onPress={handleGoBackToEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.backEditButtonText}>Go Back to Edit</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          By confirming, you agree to our terms and conditions
        </Text>
      </View>
    </View>
  );
};


export default ConfirmBookingScreen;
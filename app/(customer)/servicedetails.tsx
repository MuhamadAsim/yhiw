import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ServiceDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSaved, setIsSaved] = useState(false);

  // Get all passed parameters
  const {
    serviceId,
    serviceName,
    serviceDescription,
    servicePrice,
    serviceRating,
    serviceDistance,
    serviceTime,
    requiresDestination,
    requiresFuelType,
    requiresLicense,
    hasBooking,
    requiresTextDescription,
    comingFrom
  } = params;

  // Service icons mapping based on service ID or name
  const getServiceIcon = (id: string, name: string) => {
    const serviceIcons: { [key: string]: any } = {
      '1': require('../../assets/customer/towing.png'),
      '2': require('../../assets/customer/repair.png'),
      '3': require('../../assets/customer/fuel.png'),
      '4': require('../../assets/customer/battery.png'),
      '5': require('../../assets/customer/home/ac.png'),
      '6': require('../../assets/customer/home/tire.png'),
      '7': require('../../assets/customer/oil.png'),
      '8': require('../../assets/customer/inspection.png'),
      '9': require('../../assets/customer/home/carwash.png'),
      '10': require('../../assets/customer/home/detailing.png'),
      '11': require('../../assets/customer/home/rent.png'),
      '12': require('../../assets/customer/home/spareparts.png'),
    };
    
    // Try to get by ID first, fallback to a default icon
    return serviceIcons[serviceId as string] || require('../../assets/customer/service.png');
  };

  // Service-specific key features
  const getKeyFeatures = (id: string) => {
    const features: { [key: string]: Array<{ id: number; title: string }> } = {
      '1': [ // Towing
        { id: 1, title: 'Professional certified drivers' },
        { id: 2, title: '24/7 availability' },
        { id: 3, title: 'Modern flatbed equipment' },
        { id: 4, title: 'Insurance covered' },
        { id: 5, title: 'Real-time GPS tracking' },
        { id: 6, title: 'No hidden fees' },
      ],
      '2': [ // Roadside Assistance
        { id: 1, title: '24/7 emergency response' },
        { id: 2, title: 'Certified mechanics' },
        { id: 3, title: 'Jump start service' },
        { id: 5, title: 'Lockout assistance' },
        { id: 6, title: 'Fuel delivery' },
      ],
      '3': [ // Fuel Delivery
        { id: 1, title: 'All fuel types available' },
        { id: 2, title: '24/7 delivery' },
        { id: 3, title: 'No minimum quantity' },
        { id: 4, title: 'Emergency service' },
        { id: 6, title: 'Quick response' },
      ],
      '4': [ // Battery Replacement
        { id: 1, title: 'Quality batteries' },
        { id: 2, title: 'Free testing' },
        { id: 3, title: 'On-site replacement' },
        { id: 4, title: 'Warranty included' },
        { id: 5, title: '24/7 service' },
      ],
      '5': [ // AC Gas Refill
        { id: 1, title: 'Professional AC service' },
        { id: 2, title: 'Leak detection' },
        { id: 3, title: 'Quality refrigerants' },
        { id: 4, title: 'System diagnostics' },
        { id: 5, title: 'Performance check' },
        { id: 6, title: 'Warranty on service' },
      ],
      '6': [ // Tire Replacement
        { id: 1, title: 'All tire brands' },
        { id: 2, title: 'Professional fitting' },
        { id: 3, title: 'Wheel balancing' },
        { id: 4, title: 'Pressure check' },
        { id: 5, title: 'Valve replacement' },
      ],
      '7': [ // Oil Change
        { id: 1, title: 'Premium quality oil' },
        { id: 2, title: 'Filter replacement' },
        { id: 3, title: 'Fluid top-up' },
        { id: 4, title: 'Multi-point inspection' },
        { id: 5, title: 'Quick service' },
      ],
      '8': [ // Inspection / Repair
        { id: 1, title: 'Comprehensive inspection' },
        { id: 2, title: 'Certified mechanics' },
        { id: 3, title: 'Diagnostic report' },
        { id: 4, title: 'Transparent pricing' },
        { id: 5, title: 'Genuine parts' },
        { id: 6, title: 'Warranty on repairs' },
      ],
      '9': [ // Car Wash
        { id: 1, title: 'Eco-friendly products' },
        { id: 2, title: 'Hand wash' },
        { id: 3, title: 'Interior cleaning' },
        { id: 4, title: 'Tire shine' },
        { id: 5, title: 'Window cleaning' },
        { id: 6, title: 'Quick drying' },
      ],
      '10': [ // Car Detailing
        { id: 1, title: 'Complete interior detail' },
        { id: 2, title: 'Exterior polishing' },
        { id: 3, title: 'Paint protection' },
        { id: 4, title: 'Leather treatment' },
        { id: 5, title: 'Engine bay cleaning' },
        { id: 6, title: 'Ceramic coating option' },
      ],
      '11': [ // Car Rental
        { id: 1, title: 'Wide vehicle selection' },
        { id: 2, title: 'Flexible duration' },
        { id: 3, title: 'Insurance included' },
        { id: 4, title: 'Unlimited mileage' },
        { id: 5, title: '24/7 road assistance' },
      ],
      '12': [ // Spare Parts
        { id: 1, title: 'Genuine parts' },
        { id: 2, title: 'All makes/models' },
        { id: 3, title: 'Quick delivery' },
        { id: 4, title: 'Price match' },
        { id: 5, title: 'Warranty included' },
        { id: 6, title: 'Expert advice' },
      ],
    };
    
    return features[serviceId as string] || features['1'];
  };

  // What's included based on service
  const getWhatsIncluded = (id: string) => {
    const included: { [key: string]: string[] } = {
      '1': [ // Towing
        'Vehicle pickup from location',
        'Safe flatbed transport',
        'Delivery to destination',
        'Basic damage inspection',
      ],
      '2': [ // Roadside Assistance
        'Emergency response',
        'Jump start service',
        'Flat tire change',
        'Lockout assistance',
      ],
      '3': [ // Fuel Delivery
        'Fuel delivery to location',
        'Fuel type of your choice',
        'Emergency service',
        'Safe handling',
      ],
      '4': [ // Battery Replacement
        'Battery testing',
        'New battery installation',
        'Old battery recycling',
        'System check',
      ],
      '5': [ // AC Gas Refill
        'AC system check',
        'Leak detection',
        'Gas refill',
        'Performance test',
      ],
      '6': [ // Tire Replacement
        'Tire removal',
        'New tire installation',
        'Wheel balancing',
        'Pressure check',
      ],
      '7': [ // Oil Change
        'Oil drain',
        'New oil fill',
        'Filter replacement',
        'Fluid top-up',
      ],
      '8': [ // Inspection / Repair
        'Full vehicle inspection',
        'Diagnostic report',
        'Repair estimate',
        'Quality assurance',
      ],
      '9': [ // Car Wash
        'Exterior hand wash',
        'Interior vacuum',
        'Window cleaning',
        'Tire shine',
      ],
      '10': [ // Car Detailing
        'Deep interior cleaning',
        'Exterior polish',
        'Paint protection',
        'Final inspection',
      ],
      '11': [ // Car Rental
        'Vehicle rental',
        'Insurance coverage',
        '24/7 support',
        'Clean & sanitized',
      ],
      '12': [ // Spare Parts
        'Part identification',
        'Quality verification',
        'Secure packaging',
        'Delivery tracking',
      ],
    };
    
    return included[serviceId as string] || included['1'];
  };

  // Stats based on service
  const getStats = (id: string) => {
    const statsMap: { [key: string]: Array<{ id: number; icon: string; title: string }> } = {
      '1': [
        { id: 1, icon: 'shield-checkmark-outline', title: 'Verified' },
        { id: 2, icon: 'people-outline', title: '500+ Jobs' },
        { id: 3, icon: 'star-outline', title: 'Top Rated' },
      ],
      '2': [
        { id: 1, icon: 'shield-checkmark-outline', title: '24/7 Service' },
        { id: 2, icon: 'people-outline', title: '1000+ Rescues' },
        { id: 3, icon: 'star-outline', title: '4.9 Rating' },
      ],
      '3': [
        { id: 1, icon: 'shield-checkmark-outline', title: 'Verified' },
        { id: 2, icon: 'people-outline', title: '300+ Delivers' },
        { id: 3, icon: 'star-outline', title: '4.8 Rating' },
      ],
      '4': [
        { id: 1, icon: 'shield-checkmark-outline', title: 'Certified' },
        { id: 2, icon: 'people-outline', title: '400+ Jobs' },
        { id: 3, icon: 'star-outline', title: '4.7 Rating' },
      ],
    };
    
    return statsMap[serviceId as string] || [
      { id: 1, icon: 'shield-checkmark-outline', title: 'Verified' },
      { id: 2, icon: 'people-outline', title: '200+ Jobs' },
      { id: 3, icon: 'star-outline', title: 'Top Rated' },
    ];
  };

  // Reviews data
  const reviews = [
    {
      id: 1,
      name: 'Mohammed A.',
      rating: 5,
      time: '2 days ago',
      text: 'Quick response and professional service!',
      avatar: require('../../assets/customer/user.png'),
    },
    {
      id: 2,
      name: 'Sarah K.',
      rating: 5,
      time: '5 days ago',
      text: 'Driver was very careful with my car.',
      avatar: require('../../assets/customer/user.png'),
    },
    {
      id: 3,
      name: 'Ali H.',
      rating: 4,
      time: '1 week ago',
      text: 'Good service, arrived on time.',
      avatar: require('../../assets/customer/user.png'),
    },
  ];

  // Get service details
  const serviceIcon = getServiceIcon(serviceId as string, serviceName as string);
  const keyFeatures = getKeyFeatures(serviceId as string);
  const whatsIncluded = getWhatsIncluded(serviceId as string);
  const stats = getStats(serviceId as string);

  // Parse values
  const parsedRating = parseFloat(serviceRating as string) || 4.8;
  const parsedPrice = parseFloat(servicePrice as string) || 75;
  const displayDistance = serviceDistance || '1.5 km away';
  const displayTime = serviceTime || '15-20 min';

  const handleBack = () => {
    if (comingFrom === 'home') {
      router.push('/(customer)/Home');
    } else if (comingFrom === 'popular') {
      router.push('/(customer)/PopularServices');
    } else if (comingFrom === 'services') {
      router.push('/(customer)/Services');
    } else {
      router.back();
    }
  };

  const handleBookNow = () => {
  // Services that should skip location and go directly to vehicle contact info
  const skipLocationServiceIds = ['11']; // Car Rental only skips location
  
  const shouldSkipLocation = skipLocationServiceIds.includes(serviceId as string);
  
  // Prepare params with ALL service requirements
  const serviceParams = {
    // Pass all service data
    serviceId: serviceId as string,
    serviceName: serviceName as string,
    servicePrice: parsedPrice.toString(),
    serviceCategory: serviceName as string,
    
    // Pass service-specific requirements as booleans
    requiresDestination: serviceId === '1' ? 'true' : 'false', // Towing
    requiresFuelType: serviceId === '3' ? 'true' : 'false',    // Fuel Delivery
    requiresLicense: serviceId === '11' ? 'true' : 'false',    // Car Rental
    hasBooking: (serviceId === '9' || serviceId === '10') ? 'true' : 'false', // Car Wash/Detailing
    requiresTextDescription: serviceId === '12' ? 'true' : 'false', // Spare Parts
    
    // Flag to indicate location was skipped
    locationSkipped: shouldSkipLocation ? 'true' : 'false'
  };
  
  if (shouldSkipLocation) {
    // For Car Rental - skip location
    router.push({
      pathname: '/(customer)/VehicleContactInfo',
      params: {
        // Pass placeholder location data
        pickupAddress: 'Location not required for this service',
        pickupLat: '0',
        pickupLng: '0',
        ...serviceParams
      }
    });
  } else {
    // Normal flow - go to location details first
    router.push({
      pathname: '/(customer)/LocationDetails',
      params: serviceParams
    });
  }
};

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
          <Text style={styles.headerTitle}>Service Details</Text>
          <Text style={styles.headerSubtitle}>Review service information</Text>
        </View>
      </View>
      <View style={styles.headerSeparator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Header Card */}
        <View style={styles.serviceHeaderCard}>
          <View style={styles.serviceIconContainer}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#e3f5ff' }]}>
              <Image
                source={serviceIcon}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.serviceName}>{serviceName || 'Quick Tow (Flatbed)'}</Text>
          <View style={styles.ratingDistanceContainer}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{parsedRating}</Text>
              <Text style={styles.reviewCount}>(234)</Text>
            </View>
            <View style={styles.separator}>
              <Text style={styles.separatorText}>•</Text>
            </View>
            <View style={styles.distanceBox}>
              <Ionicons name="time-outline" size={14} color="#8c8c8c" />
              <Text style={styles.distanceText}>{displayTime}</Text>
            </View>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.startingFromText}>Starting from</Text>
            <View style={styles.priceRight}>
              <Text style={styles.headerPrice}>{parsedPrice}</Text>
              <Text style={styles.currency}>BHD</Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionSeparator} />

        {/* About This Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.aboutText}>
            {serviceDescription || 'Professional service for your vehicle.'}
          </Text>
          <Text style={styles.aboutText}>
            Our {serviceName || 'service'} provides fast, reliable assistance. We use state-of-the-art equipment to ensure your vehicle is handled with care.
          </Text>
        </View>
        <View style={styles.sectionSeparator} />

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key features</Text>
          <View style={styles.featuresGrid}>
            {keyFeatures.map((feature) => (
              <View key={feature.id} style={styles.featureItem}>
                <Image
                  source={require('../../assets/customer/tick.png')}
                  style={styles.tickIcon}
                  resizeMode="contain"
                />
                <Text style={styles.featureText}>{feature.title}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.sectionSeparator} />

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's included</Text>
          <View style={styles.includedList}>
            {whatsIncluded.map((item, index) => (
              <View key={index} style={styles.includedItem}>
                <View style={styles.circleDot}>
                  <View style={styles.filledDot} />
                </View>
                <Text style={styles.includedText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.sectionSeparator} />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={32} color="#68bdee" />
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sectionSeparator} />

        {/* Customer Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer reviews</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image
                  source={review.avatar}
                  style={styles.reviewAvatar}
                  resizeMode="cover"
                />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={12}
                        color="#FFB800"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewTime}>{review.time}</Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>

        {/* White background wrapper for pricing section */}
        <View style={styles.pricingWrapper}>
          <View style={styles.pricingInfoBox}>
            <View style={styles.pricingInfoHeader}>
              <Image
                source={require('../../assets/customer/dollar_icon.png')}
                style={styles.dollarIcon}
                resizeMode="contain"
              />
              <Text style={styles.pricingInfoTitle}>Transparent pricing</Text>
            </View>
            <Text style={styles.pricingInfoText}>
              Starting price is {parsedPrice} BHD. Final cost may vary based on distance and additional services. You'll see the exact price before confirming.
            </Text>
          </View>
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Price Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>
            {parsedPrice} BHD
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={handleBookNow}
          activeOpacity={0.8}
        >
          <Text style={styles.bookNowButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        <View style={[styles.paginationDot, styles.paginationDotActive]} />
        <View style={[styles.paginationDot, styles.paginationDotActive]} />
        <View style={[styles.paginationDot, styles.paginationDotActive]} />
        <View style={styles.paginationDot} />
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
  },
  backButtonImage: {
    width: 46,
    height: 46,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  serviceHeaderCard: {
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  serviceIconContainer: {
    marginBottom: 15,
  },
  serviceIconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  serviceIcon: {
    width: 50,
    height: 50,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingDistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  separator: {
    marginHorizontal: 8,
  },
  separatorText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  startingFromText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  headerPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8c8c8c',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '47%',
  },
  tickIcon: {
    width: 20,
    height: 20,
  },
  tickIconSmall: {
    width: 14,
    height: 14,
  },
  featureText: {
    fontSize: 12,
    color: '#3c3c3c',
    flex: 1,
  },
  includedList: {
    gap: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filledDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  includedText: {
    flex: 1,
    fontSize: 12,
    color: '#3c3c3c',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statIcon: {
    width: 32,
    height: 32,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3c3c3c',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  reviewCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTime: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  reviewText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  pricingWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  pricingInfoBox: {
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pricingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pricingInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  pricingInfoText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  dollarIcon: {
    width: 24,
    height: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  paginationDotActive: {
    backgroundColor: '#3c3c3c',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  bookNowButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  bookNowButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ServiceDetailsScreen;
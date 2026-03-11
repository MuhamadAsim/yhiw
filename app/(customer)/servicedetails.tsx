import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/ServiceDetailsStyles';

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

  // Debug function to check params on mount
useEffect(() => {
  console.log('📱 ServiceDetailsScreen mounted');
  console.log('📦 All params received:', JSON.stringify(params, null, 2));
  
  // Validate required params
  if (!serviceId) {
    console.warn('⚠️ Warning: No serviceId provided!');
  }
  if (!serviceName) {
    console.warn('⚠️ Warning: No serviceName provided!');
  }
}, []);
const handleBookNow = () => {
  try {
    console.log('📱 ===== BOOK NOW CLICKED =====');
    console.log('📦 Raw params received:', {
      serviceId,
      serviceName,
      servicePrice,
      serviceRating,
      comingFrom
    });

    // Services that should skip location
    const skipLocationServiceIds = ['11'];
    const shouldSkipLocation = skipLocationServiceIds.includes(serviceId as string);
    
    // CLEAN PARAMS - Only pass what's needed and ensure all values are strings
    const serviceParams = {
      // Essential service data - with fallbacks
      serviceId: String(serviceId || ''),
      serviceName: String(serviceName || 'Service'),
      servicePrice: String(parsedPrice || '0'),
      serviceCategory: String(serviceName || 'Service'),
      serviceDescription: String(serviceDescription || ''),
      serviceRating: String(serviceRating || '4.8'),
      serviceDistance: String(serviceDistance || '1.5 km'),
      serviceTime: String(serviceTime || '15-20 min'),
      comingFrom: String(comingFrom || 'home'),
      
      // Service-specific flags - only pass if needed
      ...(serviceId === '1' && { requiresDestination: 'true' }),
      ...(serviceId === '3' && { requiresFuelType: 'true' }),
      ...(serviceId === '11' && { requiresLicense: 'true' }),
      ...((serviceId === '9' || serviceId === '10') && { hasBooking: 'true' }),
      ...(serviceId === '12' && { requiresTextDescription: 'true' }),
    };

    // Log the cleaned params
    console.log('✅ Cleaned params:', JSON.stringify(serviceParams, null, 2));
    console.log('📍 Target screen:', shouldSkipLocation ? 'VehicleContactInfo' : 'LocationDetails');

    // Validate critical params
    if (!serviceParams.serviceId) {
      throw new Error('Service ID is missing');
    }

    // Navigate with clean params
    if (shouldSkipLocation) {
      router.push({
        pathname: '/(customer)/VehicleContactInfo',
        params: {
          pickupAddress: 'Location not required for this service',
          pickupLat: '0',
          pickupLng: '0',
          ...serviceParams
        }
      });
    } else {
      router.push({
        pathname: '/(customer)/LocationDetails',
        params: serviceParams
      });
    }
    
    console.log('✅ Navigation successful');
    console.log('===== BOOK NOW COMPLETED =====\n');
    
  } catch (error) {
    // Error boundary - properly type the error
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('❌===== NAVIGATION ERROR =====');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    } else if (typeof error === 'string') {
      errorMessage = error;
      console.error('❌ String error:', error);
    } else {
      console.error('❌ Unknown error type:', error);
    }
    
    console.log('===== ERROR END =====\n');
    
    // Show user-friendly alert with debug info
    Alert.alert(
      'Navigation Error',
      `Unable to proceed to booking.\n\nDebug Info:\n${errorMessage}\n\nPlease try again or contact support.`,
      [
        { 
          text: 'OK', 
          onPress: () => console.log('Error alert dismissed') 
        }
      ]
    );
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


export default ServiceDetailsScreen;













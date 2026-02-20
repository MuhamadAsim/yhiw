// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// const ServiceDetailsScreen = () => {
//   const router = useRouter();
//   const [isSaved, setIsSaved] = useState(false);

//   const serviceDetails = {
//     name: 'Quick Tow (Flatbed)',
//     rating: 4.8,
//     distance: '1.5 km away',
//     price: 75,
//     currency: 'BHD',
//     icon: require('../../assets/customer/service.png'),
//   };

//   const keyFeatures = [
//     { id: 1, title: 'Professional certified drivers', icon: 'checkmark-circle' },
//     { id: 2, title: '24/7 availability', icon: 'checkmark-circle' },
//     { id: 3, title: 'Modern flatbed equipment', icon: 'checkmark-circle' },
//     { id: 4, title: 'Insurance covered', icon: 'checkmark-circle' },
//     { id: 5, title: 'Real-time GPS tracking', icon: 'checkmark-circle' },
//     { id: 6, title: 'No hidden fees', icon: 'checkmark-circle' },
//   ];

//   const whatsIncluded = [
//     'Vehicle pickup from location',
//     'Safe flatbed transport',
//     'Delivery to destination',
//     'Basic damage inspection',
//   ];

//   const stats = [
//     { id: 1, icon: 'shield-checkmark-outline', title: 'Verified' },
//     { id: 2, icon: 'people-outline', title: '234+ Jobs' },
//     { id: 3, icon: 'star-outline', title: 'Top Rated' },
//   ];

//   const reviews = [
//     {
//       id: 1,
//       name: 'Mohammed A.',
//       rating: 5,
//       time: '2 days ago',
//       text: 'Quick response and professional service!',
//       avatar: require('../../assets/customer/user.png'),
//     },
//     {
//       id: 2,
//       name: 'Sarah K.',
//       rating: 5,
//       time: '5 days ago',
//       text: 'Driver was very careful with my car.',
//       avatar: require('../../assets/customer/user.png'),
//     },
//     {
//       id: 3,
//       name: 'Ali H.',
//       rating: 4,
//       time: '1 week ago',
//       text: 'Good service, arrived on time.',
//       avatar: require('../../assets/customer/user.png'),
//     },
//   ];

//   const handleBack = () => {
//     router.back();
//   };

//   const handleBookNow = () => {
//     console.log('Book now pressed');
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//           <Image
//             source={require('../../assets/customer/back_button.png')}
//             style={styles.backButtonImage}
//             resizeMode="contain"
//           />
//         </TouchableOpacity>
//         <View style={styles.headerTextContainer}>
//           <Text style={styles.headerTitle}>Service Details</Text>
//           <Text style={styles.headerSubtitle}>Review service information</Text>
//         </View>
//       </View>
//       <View style={styles.headerSeparator} />

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Service Header Card */}
//         <View style={styles.serviceHeaderCard}>
//           <View style={styles.serviceIconContainer}>
//             <View style={styles.serviceIconBox}>
//               <Image
//                 source={serviceDetails.icon}
//                 style={styles.serviceIcon}
//                 resizeMode="contain"
//               />
//             </View>
//           </View>
//           <Text style={styles.serviceName}>{serviceDetails.name}</Text>
//           <View style={styles.ratingDistanceContainer}>
//             <View style={styles.ratingBox}>
//               <Ionicons name="star" size={14} color="#FFB800" />
//               <Text style={styles.ratingText}>{serviceDetails.rating}</Text>
//               <Text style={styles.reviewCount}>(234)</Text>
//             </View>
//             <View style={styles.separator}>
//               <Text style={styles.separatorText}>•</Text>
//             </View>
//             <View style={styles.distanceBox}>
//               <Ionicons name="time-outline" size={14} color="#8c8c8c" />
//               <Text style={styles.distanceText}>15-20 min</Text>
//             </View>
//           </View>
//           <View style={styles.priceSection}>
//             <Text style={styles.startingFromText}>Starting from</Text>
//             <View style={styles.priceRight}>
//               <Text style={styles.headerPrice}>{serviceDetails.price}</Text>
//               <Text style={styles.currency}>{serviceDetails.currency}</Text>
//             </View>
//           </View>
//         </View>
//         <View style={styles.sectionSeparator} />

//         {/* About This Service */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>About this service</Text>
//           <Text style={styles.aboutText}>
//             Professional flatbed towing service for your vehicle. Our experienced drivers ensure safe transport with modern equipment.
//           </Text>
//           <Text style={styles.aboutText}>
//             Our Quick Tow service provides fast, reliable flatbed towing for sedans, compact cars, and small vehicles. We use state-of-the-art flatbed trucks to ensure your vehicle is transported safely without any wheel contact with the road.
//           </Text>
//         </View>
//         <View style={styles.sectionSeparator} />

//         {/* Key Features */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Key features</Text>
//           <View style={styles.featuresGrid}>
//             {keyFeatures.map((feature) => (
//               <View key={feature.id} style={styles.featureItem}>
//                 <Image
//                   source={require('../../assets/customer/tick.png')}
//                   style={styles.tickIcon}
//                   resizeMode="contain"
//                 />
//                 <Text style={styles.featureText}>{feature.title}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//         <View style={styles.sectionSeparator} />

//         {/* What's Included */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>What's included</Text>
//           <View style={styles.includedList}>
//             {whatsIncluded.map((item, index) => (
//               <View key={index} style={styles.includedItem}>
//                 <View style={styles.circleDot}>
//                   <View style={styles.filledDot} />
//                 </View>
//                 <Text style={styles.includedText}>{item}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//         <View style={styles.sectionSeparator} />

//         {/* Stats Cards */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Image
//               source={require('../../assets/customer/shield.png')}
//               style={styles.statIcon}
//               resizeMode="contain"
//             />
//             <Text style={styles.statTitle}>Verified</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Image
//               source={require('../../assets/customer/jobs.png')}
//               style={styles.statIcon}
//               resizeMode="contain"
//             />
//             <Text style={styles.statTitle}>234+ Jobs</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Image
//               source={require('../../assets/customer/rated.png')}
//               style={styles.statIcon}
//               resizeMode="contain"
//             />
//             <Text style={styles.statTitle}>Top Rated</Text>
//           </View>
//         </View>
//         <View style={styles.sectionSeparator} />

//         {/* Customer Reviews */}
//         <View style={styles.section}>
//           <View style={styles.reviewsHeader}>
//             <Text style={styles.sectionTitle}>Customer reviews</Text>
//             <TouchableOpacity>
//               <Text style={styles.viewAllText}>View all</Text>
//             </TouchableOpacity>
//           </View>

//           {reviews.map((review) => (
//             <View key={review.id} style={styles.reviewCard}>
//               <View style={styles.reviewHeader}>
//                 <Image
//                   source={review.avatar}
//                   style={styles.reviewAvatar}
//                   resizeMode="cover"
//                 />
//                 <View style={styles.reviewHeaderText}>
//                   <Text style={styles.reviewName}>{review.name}</Text>
//                   <View style={styles.reviewRating}>
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <Ionicons
//                         key={star}
//                         name={star <= review.rating ? 'star' : 'star-outline'}
//                         size={12}
//                         color="#FFB800"
//                       />
//                     ))}
//                   </View>
//                 </View>
//                 <Text style={styles.reviewTime}>{review.time}</Text>
//               </View>
//               <Text style={styles.reviewText}>{review.text}</Text>
//             </View>
//           ))}
//         </View>

//         {/* White background wrapper for pricing section */}
//         <View style={styles.pricingWrapper}>
//           <View style={styles.pricingInfoBox}>
//             <View style={styles.pricingInfoHeader}>
//               <Image
//                 source={require('../../assets/customer/dollar_icon.png')}
//                 style={styles.dollarIcon}
//                 resizeMode="contain"
//               />
//               <Text style={styles.pricingInfoTitle}>Transparent pricing</Text>
//             </View>
//             <Text style={styles.pricingInfoText}>
//               Starting price is 75 BHD. Final cost may vary based on distance and additional services. You'll see the exact price before confirming.
//             </Text>
//           </View>
//         </View>
        
//         <View style={{ height: 20 }} />
//       </ScrollView>

//       {/* Bottom Price Bar */}
//       <View style={styles.bottomBar}>
//         <View style={styles.priceContainer}>
//           <Text style={styles.priceLabel}>Starting from</Text>
//           <Text style={styles.price}>
//             {serviceDetails.price} {serviceDetails.currency}
//           </Text>
//         </View>
//         <TouchableOpacity
//           style={styles.bookNowButton}
//           onPress={handleBookNow}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.bookNowButtonText}>Book Now</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Pagination dots */}
//       <View style={styles.paginationContainer}>
//         <View style={[styles.paginationDot, styles.paginationDotActive]} />
//         <View style={[styles.paginationDot, styles.paginationDotActive]} />
//         <View style={[styles.paginationDot, styles.paginationDotActive]} />
//         <View style={styles.paginationDot} />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 15,
//     backgroundColor: '#FFFFFF',
//   },
//   backButton: {
//     marginRight: 15,
//   },
//   backButtonImage: {
//     width: 24,
//     height: 24,
//   },
//   headerSeparator: {
//     height: 1,
//     backgroundColor: '#e0e0e0',
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//   },
//   headerSubtitle: {
//     fontSize: 11,
//     color: '#8c8c8c',
//     marginTop: 2,
//   },
//   scrollView: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   serviceHeaderCard: {
//     backgroundColor: '#e3f5ff',
//     alignItems: 'center',
//     paddingVertical: 30,
//     paddingHorizontal: 20,
//   },
//   serviceIconContainer: {
//     marginBottom: 15,
//   },
//   serviceIconBox: {
//     width: 80,
//     height: 80,
//     borderRadius: 16,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#68bdee',
//   },
//   serviceIcon: {
//     width: 50,
//     height: 50,
//   },
//   serviceName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   ratingDistanceContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   ratingBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingText: {
//     fontSize: 13,
//     color: '#3c3c3c',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   reviewCount: {
//     fontSize: 12,
//     color: '#8c8c8c',
//     marginLeft: 4,
//   },
//   separator: {
//     marginHorizontal: 8,
//   },
//   separatorText: {
//     fontSize: 14,
//     color: '#8c8c8c',
//   },
//   distanceBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   distanceText: {
//     fontSize: 13,
//     color: '#8c8c8c',
//     marginLeft: 4,
//   },
//   priceSection: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     gap: 8,
//   },
//   startingFromText: {
//     fontSize: 11,
//     color: '#8c8c8c',
//   },
//   priceRight: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     gap: 4,
//   },
//   headerPrice: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//   },
//   currency: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#8c8c8c',
//   },
//   section: {
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   sectionSeparator: {
//     height: 1,
//     backgroundColor: '#e0e0e0',
//   },
//   sectionTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//     marginBottom: 15,
//   },
//   aboutText: {
//     fontSize: 12,
//     color: '#5c5c5c',
//     lineHeight: 20,
//     marginBottom: 12,
//   },
//   featuresGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     width: '47%',
//   },
//   tickIcon: {
//     width: 20,
//     height: 20,
//   },
//   tickIconSmall: {
//     width: 14,
//     height: 14,
//   },
//   featureText: {
//     fontSize: 12,
//     color: '#3c3c3c',
//     flex: 1,
//   },
//   includedList: {
//     gap: 12,
//   },
//   includedItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   circleDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: '#68bdee',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   filledDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#68bdee',
//   },
//   includedText: {
//     flex: 1,
//     fontSize: 12,
//     color: '#3c3c3c',
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     gap: 10,
//     backgroundColor: '#FFFFFF',
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   statIcon: {
//     width: 32,
//     height: 32,
//   },
//   statTitle: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#3c3c3c',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   reviewsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   viewAllText: {
//     fontSize: 12,
//     color: '#68bdee',
//     fontWeight: '600',
//   },
//   reviewCard: {
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   reviewAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   reviewHeaderText: {
//     flex: 1,
//   },
//   reviewName: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#3c3c3c',
//     marginBottom: 4,
//   },
//   reviewRating: {
//     flexDirection: 'row',
//     gap: 2,
//   },
//   reviewTime: {
//     fontSize: 11,
//     color: '#8c8c8c',
//   },
//   reviewText: {
//     fontSize: 12,
//     color: '#5c5c5c',
//     lineHeight: 18,
//   },
//   // New wrapper with white background
//   pricingWrapper: {
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 20,
//   },
//   pricingInfoBox: {
//     backgroundColor: '#e3f5ff',
//     marginHorizontal: 20,
//     borderRadius: 12,
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   pricingInfoHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     marginBottom: 10,
//   },
//   pricingInfoTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//   },
//   pricingInfoText: {
//     fontSize: 12,
//     color: '#5c5c5c',
//     lineHeight: 18,
//   },
//   dollarIcon: {
//     width: 24,
//     height: 24,
//   },
//   paginationContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     paddingVertical: 12,
//     backgroundColor: '#FFFFFF',
//   },
//   paginationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#e0e0e0',
//   },
//   paginationDotActive: {
//     backgroundColor: '#3c3c3c',
//   },
//   bottomBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: -2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   priceContainer: {
//     flex: 1,
//   },
//   priceLabel: {
//     fontSize: 11,
//     color: '#8c8c8c',
//     marginBottom: 2,
//   },
//   price: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//   },
//   bookNowButton: {
//     backgroundColor: '#68bdee',
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 10,
//   },
//   bookNowButtonText: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//   },
// });

// export default ServiceDetailsScreen;





































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

  // Get the passed parameters
  const {
    serviceId,
    serviceName,
    servicePrice,
    serviceRating,
    serviceDistance,
    serviceTime,
    serviceCategory,
    serviceDescription,
    comingFrom
  } = params;

  // Dynamic service details based on passed params
  const serviceDetails = {
    name: serviceName || 'Quick Tow (Flatbed)',
    rating: parseFloat(serviceRating as string) || 4.8,
    distance: serviceDistance || '1.5 km away',
    price: servicePrice ? parseFloat(servicePrice as string) : 75,
    currency: 'BHD',
    icon: require('../../assets/customer/service.png'),
    category: serviceCategory || 'Towing',
    description: serviceDescription || 'Professional flatbed towing service for your vehicle. Our experienced drivers ensure safe transport with modern equipment.',
  };

  const keyFeatures = [
    { id: 1, title: 'Professional certified drivers', icon: 'checkmark-circle' },
    { id: 2, title: '24/7 availability', icon: 'checkmark-circle' },
    { id: 3, title: 'Modern flatbed equipment', icon: 'checkmark-circle' },
    { id: 4, title: 'Insurance covered', icon: 'checkmark-circle' },
    { id: 5, title: 'Real-time GPS tracking', icon: 'checkmark-circle' },
    { id: 6, title: 'No hidden fees', icon: 'checkmark-circle' },
  ];

  const whatsIncluded = [
    'Vehicle pickup from location',
    'Safe flatbed transport',
    'Delivery to destination',
    'Basic damage inspection',
  ];

  const stats = [
    { id: 1, icon: 'shield-checkmark-outline', title: 'Verified' },
    { id: 2, icon: 'people-outline', title: '234+ Jobs' },
    { id: 3, icon: 'star-outline', title: 'Top Rated' },
  ];

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

  const handleBack = () => {
    // Navigate back to the appropriate screen
    if (comingFrom === 'home') {
      router.push('/(customer)/home');
    } else {
      router.back();
    }
  };

  const handleBookNow = () => {
    console.log('Book now pressed for service:', serviceDetails.name);
    // Navigate to booking screen with service details
    router.push({
      pathname: '/(customer)/locationdetails',
      params: {
        serviceName: serviceDetails.name,
        servicePrice: serviceDetails.price,
        serviceCategory: serviceDetails.category,
      }
    });
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
            <View style={styles.serviceIconBox}>
              <Image
                source={serviceDetails.icon}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.serviceName}>{serviceDetails.name}</Text>
          <View style={styles.ratingDistanceContainer}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{serviceDetails.rating}</Text>
              <Text style={styles.reviewCount}>(234)</Text>
            </View>
            <View style={styles.separator}>
              <Text style={styles.separatorText}>•</Text>
            </View>
            <View style={styles.distanceBox}>
              <Ionicons name="time-outline" size={14} color="#8c8c8c" />
              <Text style={styles.distanceText}>15-20 min</Text>
            </View>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.startingFromText}>Starting from</Text>
            <View style={styles.priceRight}>
              <Text style={styles.headerPrice}>{serviceDetails.price}</Text>
              <Text style={styles.currency}>{serviceDetails.currency}</Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionSeparator} />

        {/* About This Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.aboutText}>
            {serviceDetails.description}
          </Text>
          <Text style={styles.aboutText}>
            Our {serviceDetails.category} service provides fast, reliable assistance. We use state-of-the-art equipment to ensure your vehicle is handled with care.
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
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/customer/shield.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
            <Text style={styles.statTitle}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/customer/jobs.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
            <Text style={styles.statTitle}>234+ Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Image
              source={require('../../assets/customer/rated.png')}
              style={styles.statIcon}
              resizeMode="contain"
            />
            <Text style={styles.statTitle}>Top Rated</Text>
          </View>
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
              Starting price is {serviceDetails.price} BHD. Final cost may vary based on distance and additional services. You'll see the exact price before confirming.
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
            {serviceDetails.price} {serviceDetails.currency}
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
    paddingTop: 50,
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
  // New wrapper with white background
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
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import {
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// const HomeScreen = () => {
//   const router = useRouter();

//   const categories = [
//     { id: 1, name: 'Towing', icon: require('../../assets/customer/towing.png'), bgColor: '#f0f9ff' },
//     { id: 2, name: 'Roadside\nRepair', icon: require('../../assets/customer/repair.png'), bgColor: '#faf5ff' },
//     { id: 3, name: 'Fuel\nDelivery', icon: require('../../assets/customer/fuel.png'), bgColor: '#fffcf0' },
//     { id: 4, name: 'Battery\nJump', icon: require('../../assets/customer/battery.png'), bgColor: '#f0fdf4' },
//     { id: 5, name: 'Oil Change', icon: require('../../assets/customer/oil.png'), bgColor: '#fef2f2' },
//     { id: 6, name: 'Inspection', icon: require('../../assets/customer/inspection.png'), bgColor: '#eff6ff' },
//   ];

//   const popularServices = [
//     {
//       id: 1,
//       name: 'Quick Tow (Flatbed)',
//       price: '75 BHD',
//       rating: 4.8,
//       reviews: '1.5 km',
//       time: '5 min away',
//       icon: require('../../assets/customer/service.png'),
//     },
//     {
//       id: 2,
//       name: 'Roadside Towing',
//       price: '75 BHD',
//       rating: 4.8,
//       reviews: '1.5 km',
//       time: '5 min away',
//       icon: require('../../assets/customer/service.png'),
//     },
//     {
//       id: 3,
//       name: 'Emergency Service',
//       price: '75 BHD',
//       rating: 4.8,
//       reviews: '1.5 km',
//       time: '5 min away',
//       icon: require('../../assets/customer/service.png'),
//     },
//     {
//       id: 4,
//       name: 'Budget Friendly',
//       price: '75 BHD',
//       rating: 4.8,
//       reviews: '1.5 km',
//       time: '5 min away',
//       icon: require('../../assets/customer/service.png'),
//     },
//   ];

//   const handleSeeAllPress = () => {
//     router.push('/(customer)/services');
//   };

//   const handleMenuPress = () => {
//     // Handle menu press
//     console.log('Menu pressed');
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerTopRow}>
//           <View style={styles.iconBox}>
//             <Image
//               source={require('../../assets/customer/towing.png')}
//               style={styles.headerIcon}
//               resizeMode="contain"
//             />
//           </View>
//           <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
//             <Ionicons name="menu" size={24} color="#3c3c3c" />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.logoSection}>
//           <Text style={styles.logoText}>YHIW</Text>
//           <Text style={styles.tagline}>YOUR HELP IN WAY</Text>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Search Bar */}
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#8c8c8c" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="SEARCH FOR A SERVICE..."
//             placeholderTextColor="#8c8c8c"
//           />
//         </View>

//         {/* Categories Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>CATEGORIES</Text>
//           <View style={styles.categoriesGrid}>
//             {categories.map((category) => (
//               <TouchableOpacity
//                 key={category.id}
//                 style={styles.categoryCard}
//                 activeOpacity={0.7}
//               >
//                 <View style={[styles.categoryIconBox, { backgroundColor: category.bgColor }]}>
//                   <Image
//                     source={category.icon}
//                     style={styles.categoryIcon}
//                     resizeMode="contain"
//                   />
//                 </View>
//                 <Text style={styles.categoryName}>{category.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* Special Offers Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>SPECIAL OFFERS</Text>
//           <TouchableOpacity style={styles.offerCard} activeOpacity={0.8}>
//             <View style={styles.offerContent}>
//               <View style={styles.offerTextContainer}>
//                 <Text style={styles.offerTitle}>20% OFF YOUR NEXT CAR WASH</Text>
//                 <Text style={styles.offerSubtitle}>VALID UNTIL 12 DEC 2025</Text>
//               </View>
//             </View>
//           </TouchableOpacity>
//         </View>

//         {/* Popular Services Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>POPULAR SERVICES</Text>
//             <TouchableOpacity onPress={handleSeeAllPress}>
//               <Text style={styles.seeAllText}>SEE ALL</Text>
//             </TouchableOpacity>
//           </View>

//           {popularServices.map((service) => (
//             <TouchableOpacity
//               key={service.id}
//               style={styles.serviceCard}
//               activeOpacity={0.7}
//             >
//               <View style={styles.serviceIconBox}>
//                 <Image
//                   source={service.icon}
//                   style={styles.serviceIcon}
//                   resizeMode="contain"
//                 />
//               </View>
//               <View style={styles.serviceInfo}>
//                 <Text style={styles.serviceName}>{service.name}</Text>
//                 <View style={styles.serviceRating}>
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <Ionicons
//                       key={star}
//                       name={star <= Math.floor(service.rating) ? 'star' : 'star-outline'}
//                       size={12}
//                       color="#FFB800"
//                     />
//                   ))}
//                   <Text style={styles.ratingText}>{service.rating}</Text>
//                 </View>
//                 <View style={styles.serviceDetails}>
//                   <View style={styles.detailItem}>
//                     <Ionicons name="location-outline" size={12} color="#8c8c8c" />
//                     <Text style={styles.detailText}>{service.reviews}</Text>
//                   </View>
//                   <View style={styles.detailItem}>
//                     <Text style={styles.detailText}>+ </Text>
//                     <Ionicons name="time-outline" size={12} color="#8c8c8c" />
//                     <Text style={styles.detailText}>{service.time}</Text>
//                   </View>
//                 </View>
//               </View>
//               <View style={styles.servicePriceContainer}>
//                 <Text style={styles.servicePrice}>{service.price}</Text>
//                 <Text style={styles.startingRate}>STARTING RATE</Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <View style={{ height: 20 }} />
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 15,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   headerTopRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   iconBox: {
//     width: 40,
//     height: 40,
//     borderRadius: 8,
//     borderWidth: 1.5,
//     borderColor: '#e0e0e0',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerIcon: {
//     width: 24,
//     height: 24,
//   },
//   menuButton: {
//     padding: 4,
//   },
//   logoSection: {
//     justifyContent: 'center',
//   },
//   logoText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//     letterSpacing: 1,
//   },
//   tagline: {
//     fontSize: 9,
//     color: '#8c8c8c',
//     letterSpacing: 0.5,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f9fcfc',
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     marginBottom: 25,
//     borderWidth:1,
//     borderColor:'#e2dfdf',
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: '#3c3c3c',
//   },
//   section: {
//     marginBottom: 25,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//     letterSpacing: 0.5,
//     marginBottom: 15,
//   },
//   seeAllText: {
//     fontSize: 12,
//     color: '#68bdee',
//     fontWeight: '600',
//   },
//   categoriesGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   categoryCard: {
//     width: '31%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   categoryIconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   categoryIcon: {
//     width: 28,
//     height: 28,
//   },
//   categoryName: {
//     fontSize: 10,
//     color: '#3c3c3c',
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   offerCard: {
//     backgroundColor: '#68bdee',
//     borderRadius: 12,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   offerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   offerIcon: {
//     width: 50,
//     height: 50,
//     marginRight: 15,
//   },
//   offerTextContainer: {
//     flex: 1,
//   },
//   offerTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     marginBottom: 4,
//     letterSpacing: 0.5,
//   },
//   offerSubtitle: {
//     fontSize: 11,
//     color: '#FFFFFF',
//     opacity: 0.9,
//     letterSpacing: 0.3,
//   },
//   serviceCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 10,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#000000',
//   },
//   serviceIconBox: {
//     width: 50,
//     height: 50,
//     backgroundColor: '#f0fafe',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 10,
//     borderRadius:25,
//     borderWidth:1,
//     borderColor:'#a0d6eb',

//   },
//   serviceIcon: {
//     width: 28,
//     height: 28,
//   },
//   serviceInfo: {
//     flex: 1,
//   },
//   serviceName: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#3c3c3c',
//     marginBottom: 3,
//   },
//   serviceRating: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 3,
//   },
//   ratingText: {
//     fontSize: 11,
//     color: '#8c8c8c',
//     marginLeft: 4,
//   },
//   serviceDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   detailText: {
//     fontSize: 11,
//     color: '#8c8c8c',
//     marginLeft: 3,
//   },
//   servicePrice: {
//     fontSize: 13,
//     fontWeight: 'bold',
//     color: '#3c3c3c',
//   },
//   servicePriceContainer: {
//     alignItems: 'flex-end',
//   },
//   startingRate: {
//     fontSize: 8,
//     color: '#8c8c8c',
//     marginTop: 2,
//     letterSpacing: 0.3,
//   },
// });

// export default HomeScreen;











import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HomeScreen = () => {
  const router = useRouter();

  const categories = [
    { id: 1, name: 'Towing', icon: require('../../assets/customer/towing.png'), bgColor: '#f0f9ff' },
    { id: 2, name: 'Roadside\nRepair', icon: require('../../assets/customer/repair.png'), bgColor: '#faf5ff' },
    { id: 3, name: 'Fuel\nDelivery', icon: require('../../assets/customer/fuel.png'), bgColor: '#fffcf0' },
    { id: 4, name: 'Battery\nJump', icon: require('../../assets/customer/battery.png'), bgColor: '#f0fdf4' },
    { id: 5, name: 'Oil Change', icon: require('../../assets/customer/oil.png'), bgColor: '#fef2f2' },
    { id: 6, name: 'Inspection', icon: require('../../assets/customer/inspection.png'), bgColor: '#eff6ff' },
  ];

  const popularServices = [
    {
      id: 1,
      name: 'Quick Tow (Flatbed)',
      price: '75 BHD',
      rating: 4.8,
      reviews: '1.5 km',
      time: '5 min away',
      icon: require('../../assets/customer/service.png'),
      category: 'Towing',
      description: 'Professional flatbed towing service for your vehicle. Our experienced drivers ensure safe transport with modern equipment.',
    },
    {
      id: 2,
      name: 'Roadside Towing',
      price: '75 BHD',
      rating: 4.8,
      reviews: '1.5 km',
      time: '5 min away',
      icon: require('../../assets/customer/service.png'),
      category: 'Towing',
      description: 'Emergency roadside assistance and towing services available 24/7.',
    },
    {
      id: 3,
      name: 'Emergency Service',
      price: '75 BHD',
      rating: 4.8,
      reviews: '1.5 km',
      time: '5 min away',
      icon: require('../../assets/customer/service.png'),
      category: 'Roadside Repair',
      description: '24/7 emergency roadside assistance for all types of vehicles.',
    },
    {
      id: 4,
      name: 'Budget Friendly',
      price: '75 BHD',
      rating: 4.8,
      reviews: '1.5 km',
      time: '5 min away',
      icon: require('../../assets/customer/service.png'),
      category: 'Towing',
      description: 'Affordable towing service without compromising on quality and safety.',
    },
  ];

  const handleSeeAllPress = () => {
    router.push('/(customer)/services');
  };

  const handleMenuPress = () => {
    // Handle menu press
    console.log('Menu pressed');
  };

  const handleServicePress = (service: any) => {
    router.push({
      pathname: '/(customer)/servicedetails',
      params: {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceRating: service.rating,
        serviceDistance: service.reviews,
        serviceTime: service.time,
        serviceCategory: service.category,
        serviceDescription: service.description,
        comingFrom: 'home'
      }
    });
  };

  const handleCategoryPress = (category: any) => {
    router.push({
      pathname: '/(customer)/servicedetails',
      params: {
        serviceId: `cat-${category.id}`,
        serviceName: category.name.replace('\n', ' '),
        servicePrice: '75 BHD',
        serviceRating: 4.5,
        serviceDistance: '2 km',
        serviceTime: '10 min away',
        serviceCategory: category.name.replace('\n', ' '),
        serviceDescription: `Professional ${category.name.replace('\n', ' ')} services available 24/7.`,
        comingFrom: 'home'
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.iconBox}>
            <Image
              source={require('../../assets/customer/towing.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="#3c3c3c" />
          </TouchableOpacity>
        </View>
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>YHIW</Text>
          <Text style={styles.tagline}>YOUR HELP IN WAY</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8c8c8c" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH FOR A SERVICE..."
            placeholderTextColor="#8c8c8c"
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.categoryIconBox, { backgroundColor: category.bgColor }]}>
                  <Image
                    source={category.icon}
                    style={styles.categoryIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Offers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECIAL OFFERS</Text>
          <TouchableOpacity style={styles.offerCard} activeOpacity={0.8}>
            <View style={styles.offerContent}>
              <View style={styles.offerTextContainer}>
                <Text style={styles.offerTitle}>20% OFF YOUR NEXT CAR WASH</Text>
                <Text style={styles.offerSubtitle}>VALID UNTIL 12 DEC 2025</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Popular Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>POPULAR SERVICES</Text>
            <TouchableOpacity onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          {popularServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              activeOpacity={0.7}
              onPress={() => handleServicePress(service)}
            >
              <View style={styles.serviceIconBox}>
                <Image
                  source={service.icon}
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.floor(service.rating) ? 'star' : 'star-outline'}
                      size={12}
                      color="#FFB800"
                    />
                  ))}
                  <Text style={styles.ratingText}>{service.rating}</Text>
                </View>
                <View style={styles.serviceDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={12} color="#8c8c8c" />
                    <Text style={styles.detailText}>{service.reviews}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailText}>+ </Text>
                    <Ionicons name="time-outline" size={12} color="#8c8c8c" />
                    <Text style={styles.detailText}>{service.time}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.servicePriceContainer}>
                <Text style={styles.servicePrice}>{service.price}</Text>
                <Text style={styles.startingRate}>STARTING RATE</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  menuButton: {
    padding: 4,
  },
  logoSection: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    color: '#8c8c8c',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fcfc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 25,
    borderWidth:1,
    borderColor:'#e2dfdf',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
  },
  categoryName: {
    fontSize: 10,
    color: '#3c3c3c',
    textAlign: 'center',
    fontWeight: '500',
  },
  offerCard: {
    backgroundColor: '#68bdee',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  offerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  offerSubtitle: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  serviceIconBox: {
    width: 50,
    height: 50,
    backgroundColor: '#f0fafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius:25,
    borderWidth:1,
    borderColor:'#a0d6eb',

  },
  serviceIcon: {
    width: 28,
    height: 28,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 3,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 3,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  startingRate: {
    fontSize: 8,
    color: '#8c8c8c',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
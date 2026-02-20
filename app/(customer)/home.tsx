import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const HomeScreen = () => {
  const categories = [
    { id: 1, name: 'Towing', icon: '🚗' },
    { id: 2, name: 'Roadside Repair', icon: '🔧' },
    { id: 3, name: 'Fuel Delivery', icon: '⛽' },
    { id: 4, name: 'Battery Jump', icon: '🔋' },
    { id: 5, name: 'Oil Change', icon: '🛢️' },
    { id: 6, name: 'Inspection', icon: '🔍' },
  ];

  const services = [
    {
      id: 1,
      name: 'Quick Tow (Flatbed)',
      rating: 4.8,
      reviews: '1.2k',
      time: '~5 min',
      status: 'Starting rate',
      price: '75 BHD',
    },
    {
      id: 2,
      name: 'Roadside Towing',
      rating: 4.8,
      reviews: '890',
      time: '~8 min',
      status: 'Starting rate',
      price: '75 BHD',
    },
    {
      id: 3,
      name: 'Emergency Service',
      rating: 4.7,
      reviews: '1k',
      time: '~10 min',
      status: 'Starting rate',
      price: '75 BHD',
    },
    {
      id: 4,
      name: 'Budget Friendly',
      rating: 4.6,
      reviews: '2.3k',
      time: '~15 min',
      status: 'Starting rate',
      price: '75 BHD',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Feather name="truck" size={20} color="#000" />
          </View>
          <View>
            <Text style={styles.appName}>YHIW</Text>
            <Text style={styles.tagline}>Your Help is Way</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Feather name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a service..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECIAL OFFERS</Text>
          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>20% Off Your Next Car Wash</Text>
            <Text style={styles.offerSubtitle}>
              Valid until: 15 Dec 2025 • Code: WASH20
            </Text>
          </View>
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>POPULAR SERVICES</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          {services.map((service, index) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceIcon}>
                <Feather name="truck" size={24} color="#000" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceDetails}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>{'⭐'.repeat(Math.floor(service.rating))}</Text>
                    <Text style={styles.ratingNumber}>{service.rating}</Text>
                    <Text style={styles.reviewCount}>({service.reviews})</Text>
                  </View>
                  <Text style={styles.serviceTime}>• {service.time}</Text>
                </View>
                <Text style={styles.serviceStatus}>{service.status}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{service.price}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  categoryEmoji: {
    fontSize: 30,
  },
  categoryName: {
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  offerCard: {
    backgroundColor: '#1A2332',
    borderRadius: 12,
    padding: 20,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  offerSubtitle: {
    fontSize: 11,
    color: '#BBB',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    marginRight: 3,
  },
  ratingNumber: {
    fontSize: 11,
    color: '#666',
    marginRight: 3,
  },
  reviewCount: {
    fontSize: 10,
    color: '#999',
  },
  serviceTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 5,
  },
  serviceStatus: {
    fontSize: 10,
    color: '#999',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D3D3D3',
  },
  activeDot: {
    backgroundColor: '#000',
    width: 24,
  },
  bottomPadding: {
    height: 30,
  },
});

export default HomeScreen;
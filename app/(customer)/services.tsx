import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ServicesScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Services');

  const categories = ['All Services', 'Popular', 'Nearby', 'Deals'];

  const services = [
    {
      id: 1,
      name: 'Quick Tow (Flatbed)',
      description: 'Our flatbed tow truck is available and quick for safe vehicle transport.',
      rating: 4.2,
      reviews: '1.2k',
      time: '5 min',
      status: 'Starting Now',
      price: '75',
      available: true,
    },
    {
      id: 2,
      name: 'Heavy Duty Towing',
      description: 'Professional towing for heavy, bulky, and oversized vehicles.',
      rating: 4.6,
      reviews: '890',
      time: '8 min',
      status: 'Starting Now',
      price: '120',
      available: true,
    },
    {
      id: 3,
      name: 'Roadside Towing',
      description: 'Quick assistance for emergency roadside towing needs.',
      rating: 4.7,
      reviews: '1.8k',
      time: '5 min',
      status: 'Starting Now',
      price: '65',
      available: true,
    },
    {
      id: 4,
      name: 'Long Distance Towing - (Affordable)',
      description: 'Reliable towing for long-distance trips at competitive rates.',
      rating: 4.5,
      reviews: '2.1k',
      time: '15 min',
      status: 'Starting Now',
      price: '150',
      available: true,
    },
    {
      id: 5,
      name: 'Motorcycle Towing',
      description: 'Specialized service for motorcycles and bikes.',
      rating: 4.6,
      reviews: '956',
      time: '10 min',
      status: 'Starting Now',
      price: '45',
      available: true,
    },
    {
      id: 6,
      name: 'Premium Towing',
      description: 'Luxury vehicle towing with extra care and attention.',
      rating: 4.9,
      reviews: '742',
      time: '7 min',
      status: 'Starting Now',
      price: '200',
      available: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Popular Services</Text>
            <Text style={styles.headerSubtitle}>6 services available</Text>
          </View>
        </View>
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
            placeholder="Search services..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category && styles.categoryTabTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services List */}
        <View style={styles.servicesContainer}>
          {services.map((service) => (
            <TouchableOpacity key={service.id} style={styles.serviceCard}>
              {/* Service Header */}
              <View style={styles.serviceHeader}>
                <View style={styles.serviceTitleContainer}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Feather name="heart" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>

              {/* Service Details */}
              <View style={styles.serviceDetails}>
                <View style={styles.leftDetails}>
                  <View style={styles.ratingContainer}>
                    <Feather name="star" size={14} color="#FFB800" />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                    <Text style={styles.reviewCount}>({service.reviews})</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Feather name="clock" size={14} color="#666" />
                    <Text style={styles.timeText}>{service.time}</Text>
                  </View>
                </View>
              </View>

              {/* Service Footer */}
              <View style={styles.serviceFooter}>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{service.status}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>{service.price}</Text>
                  <Text style={styles.priceCurrency}>BHD</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Need Help Section */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>NEED HELP CHOOSING?</Text>
          <Text style={styles.helpDescription}>
            Not sure which service fits your needs? Contact our support team for recommendations based on your situation.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Feather name="headphones" size={18} color="#000" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
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
    marginTop: 15,
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
  categoriesContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFF',
  },
  categoryTabActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FFF',
  },
  servicesContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  serviceCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 10,
  },
  favoriteButton: {
    padding: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  priceCurrency: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  helpTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 10,
  },
  helpDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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

export default ServicesScreen;
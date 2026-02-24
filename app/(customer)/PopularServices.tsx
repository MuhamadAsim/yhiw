import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PopularServicesScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // EXACTLY THE 12 SERVICES from home page
  const services = [
    {
      id: 1,
      name: 'Towing',
      tags: ['24/7', 'FLATBED'],
      description: 'PROFESSIONAL TOWING SERVICE FOR ALL VEHICLE TYPES. FAST RESPONSE AND SAFE TRANSPORT.',
      rating: 4.9,
      reviewCount: 312,
      time: '8 min',
      price: 75,
      currency: 'BHD',
      category: 'Towing',
      distance: '2.3 km',
      popularity: 98,
    },
    {
      id: 2,
      name: 'Roadside Assistance',
      tags: ['24/7', 'EMERGENCY'],
      description: '24/7 EMERGENCY ROADSIDE ASSISTANCE INCLUDING JUMP STARTS, FLAT TIRES, AND LOCKOUT SERVICE.',
      rating: 4.8,
      reviewCount: 456,
      time: '7 min',
      price: 35,
      currency: 'BHD',
      category: 'Roadside',
      distance: '1.4 km',
      popularity: 96,
    },
    {
      id: 3,
      name: 'Fuel Delivery',
      tags: ['24/7', 'EMERGENCY'],
      description: 'EMERGENCY FUEL DELIVERY TO YOUR LOCATION. ALL FUEL TYPES AVAILABLE.',
      rating: 4.8,
      reviewCount: 189,
      time: '12 min',
      price: 15,
      currency: 'BHD',
      category: 'Fuel',
      distance: '2.1 km',
      popularity: 88,
    },
    {
      id: 4,
      name: 'Battery Replacement',
      tags: ['WARRANTY', '24/7'],
      description: 'ON-SITE BATTERY REPLACEMENT AND JUMP-START SERVICES. QUALITY BATTERIES WITH WARRANTY.',
      rating: 4.7,
      reviewCount: 156,
      time: '12 min',
      price: 65,
      currency: 'BHD',
      category: 'Battery',
      distance: '1.5 km',
      popularity: 92,
    },
    {
      id: 5,
      name: 'AC Gas Refill',
      tags: ['COOLING', 'DIAGNOSTICS'],
      description: 'PROFESSIONAL AC GAS REFILL AND DIAGNOSTICS FOR YOUR VEHICLE.',
      rating: 4.8,
      reviewCount: 134,
      time: '12 min',
      price: 40,
      currency: 'BHD',
      category: 'AC',
      distance: '2.4 km',
      popularity: 91,
    },
    {
      id: 6,
      name: 'Tire Replacement',
      tags: ['ALL TIRES', 'REPAIR'],
      description: 'QUICK TIRE REPLACEMENT AND REPAIR SERVICE. WIDE RANGE OF TIRE BRANDS AVAILABLE.',
      rating: 4.8,
      reviewCount: 189,
      time: '10 min',
      price: 45,
      currency: 'BHD',
      category: 'Tire',
      distance: '1.2 km',
      popularity: 94,
    },
    {
      id: 7,
      name: 'Oil Change',
      tags: ['PREMIUM OIL', 'FILTER'],
      description: 'QUICK OIL CHANGE SERVICE USING PREMIUM QUALITY OILS AND FILTERS.',
      rating: 4.7,
      reviewCount: 167,
      time: '20 min',
      price: 30,
      currency: 'BHD',
      category: 'Maintenance',
      distance: '1.1 km',
      popularity: 89,
    },
    {
      id: 8,
      name: 'Inspection / Repair',
      tags: ['CERTIFIED', 'DIAGNOSTICS'],
      description: 'COMPREHENSIVE VEHICLE INSPECTION AND REPAIR SERVICES BY CERTIFIED MECHANICS.',
      rating: 4.8,
      reviewCount: 203,
      time: '15 min',
      price: 25,
      currency: 'BHD',
      category: 'Inspection',
      distance: '1.8 km',
      popularity: 90,
    },
    {
      id: 9,
      name: 'Car Wash',
      tags: ['ON-LOCATION', 'ECO-FRIENDLY'],
      description: 'PROFESSIONAL CAR WASH SERVICE AT YOUR LOCATION. ECO-FRIENDLY PRODUCTS.',
      rating: 4.8,
      reviewCount: 245,
      time: '10 min',
      price: 20,
      currency: 'BHD',
      category: 'Car Wash',
      distance: '1.1 km',
      popularity: 95,
    },
    {
      id: 10,
      name: 'Car Detailing',
      tags: ['COMPLETE', 'INTERIOR/EXTERIOR'],
      description: 'COMPLETE CAR DETAILING SERVICE INCLUDING INTERIOR AND EXTERIOR.',
      rating: 4.9,
      reviewCount: 178,
      time: '15 min',
      price: 50,
      currency: 'BHD',
      category: 'Detailing',
      distance: '1.7 km',
      popularity: 93,
    },
    {
      id: 11,
      name: 'Car Rental',
      tags: ['DAILY/WEEKLY', 'INSURED'],
      description: 'FLEXIBLE CAR RENTAL SERVICES WITH COMPETITIVE RATES AND INSURANCE OPTIONS.',
      rating: 4.8,
      reviewCount: 92,
      time: '6 min',
      price: 150,
      currency: 'BHD',
      category: 'Rental',
      distance: '2.5 km',
      popularity: 86,
    },
    {
      id: 12,
      name: 'Spare Parts',
      tags: ['AUTHENTIC', 'DELIVERY'],
      description: 'GENUINE SPARE PARTS DELIVERY FOR ALL VEHICLE MAKES AND MODELS.',
      rating: 4.7,
      reviewCount: 112,
      time: '8 min',
      price: 0,
      currency: 'BHD',
      category: 'Parts',
      distance: '1.9 km',
      popularity: 87,
    },
  ];

  const handleBack = () => {
    router.push('/(customer)/Home');
  };

  const handleServicePress = (service: any) => {
    router.push({
      pathname: '/(customer)/ServiceDetails',
      params: {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: `${service.price} ${service.currency}`,
        serviceRating: service.rating,
        serviceDistance: service.distance,
        serviceTime: service.time,
        serviceCategory: service.category,
        serviceDescription: service.description,
        comingFrom: 'popular'
      }
    });
  };

  const handleContactSupport = () => {
    console.log('Contact support pressed');
  };

  // Filter and search logic
  const getFilteredServices = () => {
    let filtered = [...services];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filters
    switch (selectedFilter) {
      case 'popular':
        filtered = filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'nearest':
        filtered = filtered.sort((a, b) => {
          const distA = parseFloat(a.distance) || 999;
          const distB = parseFloat(b.distance) || 999;
          return distA - distB;
        });
        break;
      default:
        // 'all' - keep as is but sort by id
        filtered = filtered.sort((a, b) => a.id - b.id);
        break;
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();

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
          <Text style={styles.headerTitle}>POPULAR SERVICES</Text>
          <Text style={styles.headerSubtitle}>{filteredServices.length} SERVICES AVAILABLE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8c8c8c" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor="#8c8c8c"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8c8c8c" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
                All Services
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'popular' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('popular')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'popular' && styles.filterButtonTextActive]}>
                Popular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'nearest' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('nearest')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'nearest' && styles.filterButtonTextActive]}>
                Nearest
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Services List */}
        <View style={styles.servicesList}>
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceTitleContainer}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {service.tags.map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8c8c8c" />
                </View>

                <Text style={styles.serviceDescription}>{service.description}</Text>

                {/* Rating and Time - Above separator */}
                <View style={styles.serviceMetrics}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.ratingText}>
                      {service.rating} ({service.reviewCount})
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>+</Text>
                    <Ionicons name="time-outline" size={14} color="#8c8c8c" />
                    <Text style={styles.timeText}>{service.time}</Text>
                  </View>
                  <View style={styles.distanceContainer}>
                    <Ionicons name="location-outline" size={14} color="#8c8c8c" />
                    <Text style={styles.distanceText}>{service.distance}</Text>
                  </View>
                </View>

                {/* Separator Line */}
                <View style={styles.separator} />

                {/* Price Section - Below separator */}
                <View style={styles.serviceFooter}>
                  <View style={styles.priceLeftSection}>
                    <Image
                      source={require('../../assets/customer/dollar_icon.png')}
                      style={styles.dollarIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.startingFromText}>STARTING FROM</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {service.price}{' '}
                      <Text style={styles.currencyText}>{service.currency}</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No services found</Text>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>NEED HELP CHOOSING?</Text>
          <Text style={styles.helpText}>
            NOT SURE WHICH SERVICE YOU NEED? CONTACT OUR SUPPORT TEAM AND WE'LL HELP YOU FIND THE PERFECT SOLUTION FOR YOUR SITUATION.
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.supportButtonText}>CONTACT SUPPORT</Text>
          </TouchableOpacity>
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Pagination dots */}
        <View style={styles.paginationContainer}>
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
        </View>

        <View style={{ height: 30 }} />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 18,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonImage: {
    width: 46,
    height: 46,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8c8c8c',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  searchSection: {
    paddingTop: 20,
    marginBottom: 20,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
    marginHorizontal: -20, 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#68bdee',
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  servicesList: {
    marginBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitleContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#e3f5ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    color: '#68bdee',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#8c8c8c',
    lineHeight: 16,
    marginBottom: 12,
  },
  serviceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarIcon: {
    width: 16,
    height: 16,
  },
  startingFromText: {
    fontSize: 11,
    color: '#8c8c8c',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  currencyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8c8c8c',
    lineHeight: 11,
    textAlignVertical: 'top',
  },
  helpSection: {
    backgroundColor: '#f0fafe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#352f2f',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  helpText: {
    fontSize: 11,
    color: '#3c3c3c',
    lineHeight: 18,
    marginBottom: 16,
  },
  supportButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#81c2e7',
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#68bdee',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  paginationDotActive: {
    backgroundColor: '#68bdee',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
});

export default PopularServicesScreen;
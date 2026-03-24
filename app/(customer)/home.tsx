import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { styles } from './styles/HomeStyles';

// Define types for our data structures
type Service = {
  id: number;
  name: string;
  icon: any;
  bgColor: string;
  description: string;
};

type PopularService = {
  id: number;
  name: string;
  price: string;
  rating: number;
  reviews: string;
  time: string;
  icon: any;
  bgColor: string;
  category: string;
  description: string;
};

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [navigationInProgress, setNavigationInProgress] = useState<boolean>(false);
  const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';


  // Check for existing booking whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkExistingBooking();
    }, [])
  );




  // In HomeScreen.tsx - replace checkExistingBooking with this:
  const checkExistingBooking = async () => {
    if (navigationInProgress) {
      console.log('🏠 Navigation already in progress, skipping...');
      return;
    }

    try {
      setIsLoading(true);

      const currentBookingId = await AsyncStorage.getItem('currentBookingId');

      console.log('🏠 HomeScreen - Checking existing booking:', { currentBookingId });

      if (currentBookingId) {
        setNavigationInProgress(true);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsLoading(false);
          setNavigationInProgress(false);
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/jobs/${currentBookingId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            if (response.status === 404) {
              await AsyncStorage.removeItem('currentBookingId');
              setIsLoading(false);
              setNavigationInProgress(false);
              return;
            }
            throw new Error('Failed to fetch status');
          }

          const data = await response.json();
          console.log('📊 HomeScreen - Real status from backend:', data);

          // Get additional booking details from activeBookings or fetch them
          let customerName = 'Customer';
          let pickupLocation = '';
          let serviceType = '';
          let totalAmount = '0';
          let duration = '';
          let providerName = '';
          let providerId = '';
          let providerPhone = '';
          let vehicleType = '';
          let licensePlate = '';
          let vehicleModel = '';

          const activeBookingsJson = await AsyncStorage.getItem('activeBookings');
          if (activeBookingsJson) {
            try {
              const activeBookings = JSON.parse(activeBookingsJson);
              const currentBooking = activeBookings.find((b: any) => b.bookingId === currentBookingId);
              if (currentBooking) {
                customerName = currentBooking.customerName || 'Customer';
                pickupLocation = currentBooking.pickupLocation || '';
                serviceType = currentBooking.serviceType || '';
                totalAmount = currentBooking.totalAmount || '0';
                duration = currentBooking.duration || '';
                providerName = currentBooking.providerName || 'Provider';
                providerId = currentBooking.providerId || '';
                providerPhone = currentBooking.providerPhone || '';
                vehicleType = currentBooking.vehicleType || '';
                licensePlate = currentBooking.licensePlate || '';
                vehicleModel = currentBooking.vehicleModel || '';
              }
            } catch (e) {
              console.error('Error parsing activeBookings:', e);
            }
          }

          // Small delay to ensure navigation doesn't conflict with mounting
          setTimeout(async () => {
            console.log(`➡️ Navigating with bookingId: ${currentBookingId}, status: ${data.status}`);

            // ===== HANDLE ALL POSSIBLE STATUSES =====
            switch (data.status) {
              case 'searching':
                router.replace({
                  pathname: '/(customer)/FindingProvider',
                  params: { bookingId: currentBookingId }
                });
                break;

              case 'accepted':
                router.replace({
                  pathname: '/(customer)/ProviderAssigned',
                  params: {
                    bookingId: currentBookingId,
                    providerName: providerName,
                    providerId: providerId,
                    providerPhone: providerPhone
                  }
                });
                break;

              case 'in_progress':
                router.replace({
                  pathname: '/(customer)/ServiceInProgress',
                  params: {
                    bookingId: currentBookingId,
                    providerName: providerName,
                    providerId: providerId,
                    providerPhone: providerPhone,
                    serviceType: serviceType,
                    pickupLocation: pickupLocation,
                    totalAmount: totalAmount,
                    startedAt: data.startedAt
                  }
                });
                break;

              // ===== UPDATED: completed_provider - Provider marked complete, waiting for customer =====
              case 'completed_provider':
                console.log('✅ Service completed by provider - Navigating to ServiceInProgress (waiting for customer confirmation)');
                router.replace({
                  pathname: '/(customer)/ServiceInProgress',
                  params: {
                    bookingId: currentBookingId,
                    providerName: providerName,
                    providerId: providerId,
                    providerPhone: providerPhone,
                    serviceType: serviceType,
                    pickupLocation: pickupLocation,
                    totalAmount: totalAmount,
                    vehicleType: vehicleType,
                    licensePlate: licensePlate,
                    vehicleModel: vehicleModel,
                    startedAt: data.startedAt,
                    status: 'completed_provider'
                  }
                });
                break;

              // ===== UPDATED: completed - Navigate to ServiceCompleted =====
              case 'completed':
                console.log('✅ Service completed (waiting for customer confirmation) - Navigating to ServiceCompleted');
                router.replace({
                  pathname: '/(customer)/ServiceCompleted',
                  params: {
                    bookingId: currentBookingId,
                    providerName: providerName,
                    serviceType: serviceType,
                    totalAmount: totalAmount,
                    duration: duration,
                    pickupLocation: pickupLocation,
                    completedAt: data.completedAt,
                    status: 'completed'
                  }
                });
                break;

              // ===== UPDATED: completed_confirmed - Navigate to ServiceCompleted and CLEAN UP =====
              case 'completed_confirmed':
                console.log('✅ Service completed_confirmed - Navigating to ServiceCompleted and cleaning up');

                // Navigate to completion screen first
                router.replace({
                  pathname: '/(customer)/ServiceCompleted',
                  params: {
                    bookingId: currentBookingId,
                    providerName: providerName,
                    serviceType: serviceType,
                    totalAmount: totalAmount,
                    duration: duration,
                    pickupLocation: pickupLocation,
                    completedAt: data.completedAt,
                    status: 'completed_confirmed'
                  }
                });

                // Clean up storage after navigation
                setTimeout(async () => {
                  console.log('🧹 Cleaning up storage for completed_confirmed booking');
                  await AsyncStorage.removeItem('currentBookingId');
                  await AsyncStorage.removeItem('currentBookingStatus');

                  if (activeBookingsJson) {
                    try {
                      const activeBookings = JSON.parse(activeBookingsJson);
                      const updatedBookings = activeBookings.filter((b: any) => b.bookingId !== currentBookingId);
                      await AsyncStorage.setItem('activeBookings', JSON.stringify(updatedBookings));
                    } catch (e) {
                      console.error('Error updating activeBookings:', e);
                    }
                  }
                }, 1000);
                break;

              case 'cancelled':
                console.log('❌ Job was cancelled - Showing alert and cleaning up');

                await AsyncStorage.removeItem('currentBookingId');
                if (activeBookingsJson) {
                  try {
                    const activeBookings = JSON.parse(activeBookingsJson);
                    const updatedBookings = activeBookings.filter((b: any) => b.bookingId !== currentBookingId);
                    await AsyncStorage.setItem('activeBookings', JSON.stringify(updatedBookings));
                  } catch (e) {
                    console.error('Error updating activeBookings:', e);
                  }
                }

                Alert.alert(
                  'Service Cancelled',
                  data.cancelledBy === 'provider'
                    ? `The provider has cancelled this service.\n\nReason: ${data.cancellationReason || 'No reason provided'}`
                    : `This service was cancelled.\n\nReason: ${data.cancellationReason || 'No reason provided'}`,
                  [{ text: 'OK' }]
                );

                setIsLoading(false);
                setNavigationInProgress(false);
                break;

              case 'expired':
                console.log('⏰ Job expired - Cleaning up');
                await AsyncStorage.removeItem('currentBookingId');

                if (activeBookingsJson) {
                  try {
                    const activeBookings = JSON.parse(activeBookingsJson);
                    const updatedBookings = activeBookings.filter((b: any) => b.bookingId !== currentBookingId);
                    await AsyncStorage.setItem('activeBookings', JSON.stringify(updatedBookings));
                  } catch (e) {
                    console.error('Error updating activeBookings:', e);
                  }
                }

                setIsLoading(false);
                setNavigationInProgress(false);
                break;

              default:
                console.log('Unknown status:', data.status);
                setIsLoading(false);
                setNavigationInProgress(false);
            }
          }, 100);
        } catch (error) {
          console.error('Error fetching job status:', error);
          setIsLoading(false);
          setNavigationInProgress(false);
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking booking ID:', error);
      setIsLoading(false);
    }
  };

  // Also check when component mounts (initial load)
  useEffect(() => {
    checkExistingBooking();

    // Cleanup function
    return () => {
      setNavigationInProgress(false);
    };
  }, []);

  // EXACTLY 12 SERVICES as per SRS v1.1 Detailed Supplement
  const services: Service[] = [
    // Location & Vehicle-Type Based Services
    {
      id: 1,
      name: 'Towing',
      icon: require('../../assets/customer/towing.png'),
      bgColor: '#f0f9ff',
      description: 'Professional towing service'
    },
    {
      id: 2,
      name: 'Roadside Assistance',
      icon: require('../../assets/customer/repair.png'),
      bgColor: '#faf5ff',
      description: '24/7 emergency roadside assistance'
    },
    {
      id: 3,
      name: 'Fuel Delivery',
      icon: require('../../assets/customer/fuel.png'),
      bgColor: '#fffcf0',
      description: 'Fuel delivery to your location'
    },

    // Location & Vehicle-Info Based Services
    {
      id: 4,
      name: 'Battery Replacement',
      icon: require('../../assets/customer/battery.png'),
      bgColor: '#f0fdf4',
      description: 'Battery replacement service'
    },
    {
      id: 5,
      name: 'AC Gas Refill',
      icon: require('../../assets/customer/home/ac.png'),
      bgColor: '#fef2f2',
      description: 'AC gas refill for your vehicle'
    },
    {
      id: 6,
      name: 'Tire Replacement',
      icon: require('../../assets/customer/home/tire.png'),
      bgColor: '#eff6ff',
      description: 'Tire replacement and repair'
    },
    {
      id: 7,
      name: 'Oil Change',
      icon: require('../../assets/customer/oil.png'),
      bgColor: '#fef2f2',
      description: 'Oil change service'
    },
    {
      id: 8,
      name: 'Inspection / Repair',
      icon: require('../../assets/customer/inspection.png'),
      bgColor: '#faf5ff',
      description: 'Vehicle inspection and repair'
    },

    // On-Location Services with Scheduling
    {
      id: 9,
      name: 'Car Wash',
      icon: require('../../assets/customer/home/carwash.png'),
      bgColor: '#f0f9ff',
      description: 'Professional car wash'
    },
    {
      id: 10,
      name: 'Car Detailing',
      icon: require('../../assets/customer/home/detailing.png'),
      bgColor: '#fffcf0',
      description: 'Complete car detailing'
    },

    // Special Services
    {
      id: 11,
      name: 'Car Rental',
      icon: require('../../assets/customer/home/rent.png'),
      bgColor: '#f0fdf4',
      description: 'Car rental service'
    },
    {
      id: 12,
      name: 'Spare Parts',
      icon: require('../../assets/customer/home/spareparts.png'),
      bgColor: '#eff6ff',
      description: 'Spare parts request'
    },
  ];

  // Popular services from categories (using your 12 services icons)
  const popularServices: PopularService[] = [
    {
      id: 1,
      name: 'Towing',
      price: '75 BHD',
      rating: 4.9,
      reviews: '2.3 km',
      time: '8 min away',
      icon: require('../../assets/customer/towing.png'),
      bgColor: '#f0f9ff',
      category: 'Towing',
      description: '24/7 professional towing service for all vehicle types',
    },
    {
      id: 6,
      name: 'Tire Replacement',
      price: '45 BHD',
      rating: 4.8,
      reviews: '1.2 km',
      time: '10 min away',
      icon: require('../../assets/customer/home/tire.png'),
      bgColor: '#eff6ff',
      category: 'Tire Service',
      description: 'Quick tire replacement and repair service',
    },
    {
      id: 4,
      name: 'Battery Service',
      price: '65 BHD',
      rating: 4.7,
      reviews: '1.5 km',
      time: '12 min away',
      icon: require('../../assets/customer/battery.png'),
      bgColor: '#f0fdf4',
      category: 'Battery Service',
      description: 'On-site battery replacement and jump-start',
    },
    {
      id: 8,
      name: 'Vehicle Inspection',
      price: '25 BHD',
      rating: 4.8,
      reviews: '1.8 km',
      time: '15 min away',
      icon: require('../../assets/customer/inspection.png'),
      bgColor: '#faf5ff',
      category: 'Inspection',
      description: 'Comprehensive vehicle inspection services',
    },
  ];

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (text.trim().length > 0) {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(text.toLowerCase()) ||
        service.description.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredServices(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setFilteredServices([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setFilteredServices([]);
  };

  const handleServicePress = (service: Service) => {
    router.push({
      pathname: '/(customer)/ServiceDetails',
      params: {
        serviceId: service.id.toString(),
        serviceName: service.name,
        serviceDescription: service.description,
        requiresDestination: service.id === 1 ? 'true' : 'false',
        requiresFuelType: service.id === 3 ? 'true' : 'false',
        requiresLicense: service.id === 11 ? 'true' : 'false',
        hasBooking: service.id === 9 || service.id === 10 ? 'true' : 'false',
        requiresTextDescription: service.id === 12 ? 'true' : 'false',
      }
    });
    clearSearch();
  };

  const handlePopularServicePress = (service: PopularService) => {
    const mainService = services.find(s =>
      s.name.toLowerCase().includes(service.category.toLowerCase()) ||
      s.name.toLowerCase().includes(service.name.toLowerCase().split(' ')[0])
    );

    if (mainService) {
      router.push({
        pathname: '/(customer)/ServiceDetails',
        params: {
          serviceId: mainService.id.toString(),
          serviceName: service.name,
          serviceDescription: service.description,
          servicePrice: service.price,
          serviceRating: service.rating.toString(),
          serviceDistance: service.reviews,
          serviceTime: service.time,
          requiresDestination: mainService.id === 1 ? 'true' : 'false',
          requiresFuelType: mainService.id === 3 ? 'true' : 'false',
          requiresLicense: mainService.id === 11 ? 'true' : 'false',
          hasBooking: mainService.id === 9 || mainService.id === 10 ? 'true' : 'false',
          requiresTextDescription: mainService.id === 12 ? 'true' : 'false',
        }
      });
    }
  };

  const handleSeeAllPress = () => {
    router.push('/(customer)/PopularServices');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  // Show loading indicator while checking for booking
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
        <Text style={styles.loadingText}>Checking active booking...</Text>
      </View>
    );
  }

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
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#8c8c8c" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SEARCH RESULTS ({filteredServices.length})</Text>
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.clearText}>CLEAR</Text>
              </TouchableOpacity>
            </View>

            {filteredServices.length > 0 ? (
              <View style={styles.categoriesGrid}>
                {filteredServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.categoryCard}
                    activeOpacity={0.7}
                    onPress={() => handleServicePress(service)}
                  >
                    <View style={[styles.categoryIconBox, { backgroundColor: service.bgColor }]}>
                      <Image
                        source={service.icon}
                        style={styles.categoryIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.categoryName}>{service.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={40} color="#d0d0d0" />
                <Text style={styles.noResultsText}>No services found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
              </View>
            )}
          </View>
        )}

        {/* All 12 Services Section - Hide when searching */}
        {!showSearchResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CATEGORIES</Text>
            <View style={styles.categoriesGrid}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                  onPress={() => handleServicePress(service)}
                >
                  <View style={[styles.categoryIconBox, { backgroundColor: service.bgColor }]}>
                    <Image
                      source={service.icon}
                      style={styles.categoryIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.categoryName}>{service.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Special Offers Section - Hide when searching */}
        {!showSearchResults && (
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
        )}

        {/* Popular Services Section - Hide when searching */}
        {!showSearchResults && (
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
                onPress={() => handlePopularServicePress(service)}
              >
                <View style={[styles.serviceIconBox, { backgroundColor: service.bgColor }]}>
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
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
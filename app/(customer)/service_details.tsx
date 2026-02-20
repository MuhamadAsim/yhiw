import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ServiceDetailsScreen = () => {
  const [selectedTab, setSelectedTab] = useState('included');

  const included = [
    'Professional licensed technicians',
    'Vehicle pickup from location',
    'Up to 25 km distance',
    'Safe flatbed towing',
    'Basic damage inspection',
  ];

  const notIncluded = [
    '24/7 availability',
    'Weekend service',
    'Insurance coverage',
    'Express service',
    'Multiple trips',
  ];

  const reviews = [
    {
      id: 1,
      name: 'Muhammad A.',
      rating: 5,
      date: '2 days ago',
      comment: 'Great service, very professional!',
    },
    {
      id: 2,
      name: 'Fatima K.',
      rating: 4,
      date: '1 week ago',
      comment: 'Quick and very polite service.',
    },
    {
      id: 3,
      name: 'Ali R.',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Would recommend!',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="share-2" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="heart" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Icon & Title */}
        <View style={styles.serviceHeader}>
          <View style={styles.serviceLogo}>
            <Feather name="truck" size={32} color="#000" />
          </View>
          <Text style={styles.serviceTitle}>Quick Tow (Flatbed)</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.ratingText}>4.8 (1.2k)</Text>
            <Text style={styles.reviewsLink}>• 112 reviews</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT THIS SERVICE</Text>
          <Text style={styles.aboutText}>
            Our Quick Tow (Flatbed) service provides safe and reliable towing for all types of vehicles. Our experienced professionals use modern flatbed trucks for vehicles, compact cars, vans, small vehicles, and luxury cars. We ensure your vehicle is transported safely and securely. We also offer free vehicle condition check. Fast, professional, and reliable assistance for stress-free contact with our team.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="award" size={18} color="#000" />
              </View>
              <Text style={styles.featureText}>Professional licensed technicians</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="clock" size={18} color="#000" />
              </View>
              <Text style={styles.featureText}>24/7 availability</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="shield" size={18} color="#000" />
              </View>
              <Text style={styles.featureText}>Insurance covered</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="map-pin" size={18} color="#000" />
              </View>
              <Text style={styles.featureText}>Multiple trips allowed</Text>
            </View>
          </View>
        </View>

        {/* What's Included Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'included' && styles.activeTab]}
              onPress={() => setSelectedTab('included')}
            >
              <Feather 
                name="check-circle" 
                size={16} 
                color={selectedTab === 'included' ? '#000' : '#999'} 
              />
              <Text style={[styles.tabText, selectedTab === 'included' && styles.activeTabText]}>
                Included
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'not-included' && styles.activeTab]}
              onPress={() => setSelectedTab('not-included')}
            >
              <Feather 
                name="x-circle" 
                size={16} 
                color={selectedTab === 'not-included' ? '#000' : '#999'} 
              />
              <Text style={[styles.tabText, selectedTab === 'not-included' && styles.activeTabText]}>
                Not Included
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'requirements' && styles.activeTab]}
              onPress={() => setSelectedTab('requirements')}
            >
              <Feather 
                name="file-text" 
                size={16} 
                color={selectedTab === 'requirements' ? '#000' : '#999'} 
              />
              <Text style={[styles.tabText, selectedTab === 'requirements' && styles.activeTabText]}>
                Requirements
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {selectedTab === 'included' && (
              <View>
                {included.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Feather name="check" size={16} color="#4CAF50" />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 'not-included' && (
              <View>
                {notIncluded.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Feather name="x" size={16} color="#F44336" />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 'requirements' && (
              <View>
                <View style={styles.listItem}>
                  <Feather name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.listItemText}>Valid vehicle registration</Text>
                </View>
                <View style={styles.listItem}>
                  <Feather name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.listItemText}>Proof of ownership</Text>
                </View>
                <View style={styles.listItem}>
                  <Feather name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.listItemText}>Contact phone number</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Customer Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CUSTOMER REVIEWS</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Feather name="user" size={16} color="#666" />
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewRating}>
                    <Text style={styles.reviewStars}>{'⭐'.repeat(review.rating)}</Text>
                    <Text style={styles.reviewDate}>• {review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        {/* Transparent Pricing */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Feather name="dollar-sign" size={20} color="#000" />
            <Text style={styles.pricingTitle}>Transparent Pricing</Text>
          </View>
          <Text style={styles.pricingText}>
            You'll see the exact price before you confirm. No hidden fees, no surprises. Pay only what you see.
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting rate</Text>
          <Text style={styles.price}>75 BHD</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  serviceHeader: {
    alignItems: 'center',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceLogo: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 12,
    marginRight: 5,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  reviewsLink: {
    fontSize: 13,
    color: '#666',
    marginLeft: 3,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  aboutText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 10,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#333',
    flex: 1,
    lineHeight: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 4,
    marginTop: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 5,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  listItemText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStars: {
    fontSize: 10,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
    marginLeft: 5,
  },
  reviewComment: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  pricingCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#D0E8FF',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  pricingText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 30,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 15,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});

export default ServiceDetailsScreen;
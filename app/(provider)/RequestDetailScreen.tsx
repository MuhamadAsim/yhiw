import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles/RequestDetailScreenStyles';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

interface JobDetails {
  bookingId: string;
  serviceType: string;
  serviceName: string;
  urgency: string;
  price: number;
  customer: {
    name: string;
    phone: string;
    rating?: number;
  };
  vehicle: {
    type: string;
    makeModel: string;
    year: string;
    color: string;
    licensePlate: string;
  };
  pickup: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dropoff?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  distance: string;
  description?: string;
  issues?: string[];
  payment: {
    totalAmount: number;
    baseServiceFee: number;
    selectedTip: number;
  };
  estimatedArrival?: string;
}

const RequestDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchJobDetails();
    } else {
      setError('No booking ID provided');
      setIsLoading(false);
    }
  }, [bookingId]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('Authentication failed');
        return;
      }

      // Fetch job details from notification or job model
      const response = await fetch(`${API_BASE_URL}/jobs/${bookingId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      
      if (data.success) {
        setJobDetails(data.job);
      } else {
        throw new Error(data.message || 'Job not found');
      }
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      setError(error.message || 'Failed to load job details');
      
      Alert.alert(
        'Error',
        'Could not load job details. The job may have expired.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToAccept = () => {
    if (!jobDetails) return;

    // Navigate to accept/reject page with bookingId
    router.push({
      pathname: "/AcceptRejectRequestScreen",
      params: {
        bookingId: jobDetails.bookingId,
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount} BHD`;
  };

  const calculateEarnings = (totalAmount: number) => {
    // 85% of total amount goes to provider
    return (totalAmount * 0.85).toFixed(2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !jobDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Job not found'}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isUrgent = jobDetails.urgency?.toLowerCase() === 'urgent' || 
                   jobDetails.urgency?.toLowerCase() === 'emergency';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>REQUEST DETAILS</Text>
          <Text style={styles.requestId}>{jobDetails.bookingId}</Text>
        </View>
        
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceIconContainer}>
              <Image
                source={require('../../assets/provider/car.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>
                {jobDetails.serviceName?.toUpperCase() || jobDetails.serviceType?.toUpperCase()}
              </Text>
              <Text style={styles.serviceSubtitle}>
                {isUrgent ? 'ASAP' : 'SCHEDULED'}
              </Text>
            </View>
          </View>
          
          <View style={styles.earningsRow}>
            <View style={styles.earningsLeft}>
              <Feather name="dollar-sign" size={20} color="#000" />
              <Text style={styles.earningsLabel}>YOUR EARNINGS</Text>
            </View>
            <Text style={styles.earningsValue}>
              {formatCurrency(parseFloat(calculateEarnings(jobDetails.payment.totalAmount)))}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerLeft}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={24} color="#87CEFA" />
              </View>
              <View>
                <Text style={styles.customerName}>
                  {jobDetails.customer?.name?.toUpperCase() || 'CUSTOMER'}
                </Text>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color="#000" />
                  <Text style={styles.ratingText}>
                    {jobDetails.customer?.rating || '4.5'} CUSTOMER RATING
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Image
                source={require('../../assets/provider/callbutton.png')}
                style={styles.callIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <Feather name="truck" size={20} color="#9CA3AF" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleLabel}>TYPE & MODEL</Text>
                <Text style={styles.vehicleValue}>
                  {jobDetails.vehicle?.type?.toUpperCase() || 'SEDAN'} - {jobDetails.vehicle?.makeModel || 'TOYOTA CAMRY 2020'}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>LICENSE PLATE:</Text>
                <Text style={styles.detailValue}>
                  {jobDetails.vehicle?.licensePlate || 'ABC 1234'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>COLOR:</Text>
                <Text style={styles.detailValue}>
                  {jobDetails.vehicle?.color?.toUpperCase() || 'WHITE'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Details */}
        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionTitle}>LOCATION DETAILS</Text>
            <TouchableOpacity>
              <Text style={styles.navigateText}>
                <Feather name="navigation" size={12} color="#87CEFA" /> NAVIGATE
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationCard}>
            <View style={styles.locationItem}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationAddress}>
                  {jobDetails.pickup?.address?.toUpperCase() || 'MAIN STREET, MANAMA'}
                </Text>
              </View>
            </View>
            
            {jobDetails.dropoff && (
              <>
                <View style={styles.locationDivider} />
                
                <View style={styles.locationItem}>
                  <View style={[styles.locationDot, styles.locationDotOutline]} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>DROP-OFF LOCATION</Text>
                    <Text style={styles.locationAddress}>
                      {jobDetails.dropoff.address?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </>
            )}
            
            <View style={styles.distanceCard}>
              <Feather name="navigation" size={16} color="#87CEFA" />
              <Text style={styles.distanceLabel}>DISTANCE FROM YOU</Text>
              <Text style={styles.distanceValue}>{jobDetails.distance || '2.5 KM AWAY'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Notes */}
        {(jobDetails.description || (jobDetails.issues && jobDetails.issues.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOMER NOTES</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                {jobDetails.description || (jobDetails.issues?.join(', ') || 'No additional notes')}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>PAYMENT METHOD:</Text>
              <Text style={styles.paymentValue}>CASH</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>SERVICE FEE:</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(jobDetails.payment.baseServiceFee)}
              </Text>
            </View>
            {jobDetails.payment.selectedTip > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>TIP:</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(jobDetails.payment.selectedTip)}
                </Text>
              </View>
            )}
            <View style={[styles.paymentRow, styles.earningsHighlight]}>
              <Text style={styles.paymentLabelBold}>YOUR EARNINGS (85%):</Text>
              <Text style={styles.paymentValueBold}>
                {formatCurrency(parseFloat(calculateEarnings(jobDetails.payment.totalAmount)))}
              </Text>
            </View>
          </View>
        </View>

        {/* Urgent Request Alert */}
        {isUrgent && (
          <View style={styles.urgentAlert}>
            <Feather name="alert-circle" size={20} color="#EF4444" />
            <View style={styles.urgentAlertContent}>
              <Text style={styles.urgentAlertTitle}>URGENT REQUEST</Text>
              <Text style={styles.urgentAlertText}>
                THIS IS A PRIORITY REQUEST. CUSTOMER IS WAITING AND NEEDS IMMEDIATE ASSISTANCE.
              </Text>
            </View>
          </View>
        )}

        {/* Estimated Arrival */}
        <View style={styles.arrivalCard}>
          <Feather name="clock" size={20} color="#0891B2" />
          <View style={styles.arrivalInfo}>
            <Text style={styles.arrivalTitle}>ESTIMATED ARRIVAL TIME</Text>
            <Text style={styles.arrivalTime}>
              {jobDetails.estimatedArrival || '8-10 MINUTES BASED ON CURRENT TRAFFIC'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={handleProceedToAccept}
        >
          <Text style={styles.acceptButtonText}>PROCEED TO ACCEPT/REJECT</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.homeButtonText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};


export default RequestDetails;
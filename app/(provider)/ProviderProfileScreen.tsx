import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebase';

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

const ProviderProfileScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [services, setServices] = useState([
    { id: '1', name: 'Towing', enabled: true },
    { id: '2', name: 'Fuel Delivery', enabled: true },
    { id: '3', name: 'Tire Change', enabled: false },
    { id: '4', name: 'Jump Start', enabled: true },
    { id: '5', name: 'Lockout', enabled: false },
  ]);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setProviderData(userData);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const toggleService = (serviceId: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  };

  const handleRoleSwitch = async () => {
    Alert.alert(
      'Switch to Customer Mode',
      'You will be logged in as a customer. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Get current user data
              const userDataStr = await AsyncStorage.getItem('userData');
              if (!userDataStr) {
                throw new Error('No user data found');
              }

              const userData = JSON.parse(userDataStr);
              
              // Create customer user data (same user but with customer role)
              const customerUserData = {
                ...userData,
                role: 'customer',
                // Keep the same firebaseUserId, token, etc.
              };

              // Save customer data to storage
              await AsyncStorage.setItem('userData', JSON.stringify(customerUserData));
              
              // Keep the token (same token works for both roles)
              // No need to change token as it's the same user

              console.log('Switched to customer mode:', customerUserData);

              // Navigate to customer home
              router.replace('/(customer)/Home');
            } catch (error) {
              console.error('Error switching role:', error);
              Alert.alert('Error', 'Failed to switch role. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Sign out from Firebase
              await signOut(auth);
              
              // Clear AsyncStorage
              await AsyncStorage.multiRemove(['userToken', 'userData', 'rememberMe', 'savedEmail']);
              
              // Navigate to sign in
              router.replace('/signin');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#68bdee" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {providerData?.fullName || 'AHMED AL-KHALIFA'}
            </Text>
            <Text style={styles.providerId}>
              ID: {providerData?.providerId || 'PRV-001234'}
            </Text>
          </View>
        </View>

        {/* Role Switch Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="swap-horizontal" size={24} color="#68bdee" />
            <Text style={styles.cardTitle}>SWITCH ROLE</Text>
          </View>
          <Text style={styles.cardDescription}>
            Switch to customer mode to request services
          </Text>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleRoleSwitch}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                <Text style={styles.switchButtonText}>SWITCH TO CUSTOMER</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Services Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct" size={24} color="#68bdee" />
            <Text style={styles.cardTitle}>MANAGE SERVICES</Text>
          </View>
          <Text style={styles.cardDescription}>
            Toggle the services you want to offer
          </Text>

          {services.map((service) => (
            <View key={service.id} style={styles.serviceItem}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Switch
                value={service.enabled}
                onValueChange={() => toggleService(service.id)}
                trackColor={{ false: '#E0E0E0', true: '#68bdee' }}
                thumbColor={service.enabled ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ff4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ff4444" />
              <Text style={styles.logoutButtonText}>LOGOUT</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  providerId: {
    fontSize: 13,
    color: '#888888',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2c2c',
    letterSpacing: 0.8,
  },
  cardDescription: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 18,
  },
  switchButton: {
    backgroundColor: '#68bdee',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceName: {
    fontSize: 15,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#ff4444',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footer: {
    height: 20,
  },
});

export default ProviderProfileScreen;
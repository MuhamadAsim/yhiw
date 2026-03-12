// ProviderProfileScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Switch,
  Dimensions,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../constants/firebase';

const { width } = Dimensions.get('window');

// API Base URL
const API_BASE_URL = 'https://yhiw-backend.onrender.com/api';

// Service types from backend model
const SERVICE_TYPES = [
  { id: '1', name: 'Towing', icon: require('../../assets/customer/towing.png') },
  { id: '2', name: 'Roadside Assistance', icon: require('../../assets/customer/repair.png') },
  { id: '3', name: 'Fuel Delivery', icon: require('../../assets/customer/fuel.png') },
  { id: '4', name: 'Battery Replacement', icon: require('../../assets/customer/battery.png') },
  { id: '5', name: 'AC Gas Refill', icon: require('../../assets/customer/home/ac.png') },
  { id: '6', name: 'Tire Replacement', icon: require('../../assets/customer/home/tire.png') },
  { id: '7', name: 'Oil Change', icon: require('../../assets/customer/oil.png') },
  { id: '8', name: 'Inspection / Repair', icon: require('../../assets/customer/inspection.png') },
  { id: '9', name: 'Car Wash', icon: require('../../assets/customer/home/carwash.png') },
  { id: '10', name: 'Car Detailing', icon: require('../../assets/customer/home/detailing.png') },
  { id: '11', name: 'Car Rental', icon: require('../../assets/customer/home/rent.png') },
  { id: '12', name: 'Spare Parts', icon: require('../../assets/customer/home/spareparts.png') },
];

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface ProviderData {
  id: string;
  firebaseUserId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'customer' | 'provider';
  status: 'active' | 'inactive';
  profileImage?: string;
  serviceType: string[];
  description?: string;
  totalJobsCompleted: number;
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  token: string;
}

interface StatsCardProps {
  icon: keyof typeof Feather.glyphMap;
  value: number | string;
  label: string;
}

const ProviderProfileScreen = () => {
  const router = useRouter();
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  
  // Edit form states
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Load provider data on mount
  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');

      if (userDataStr && token) {
        const userData = JSON.parse(userDataStr);
        
        // Fetch latest data from backend
        const response = await fetch(`${API_BASE_URL}/users/${userData.firebaseUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProviderData({
              ...result.data,
              token: token,
            });
            setEditedName(result.data.fullName || '');
            setEditedDescription(result.data.description || '');
            setSelectedServices(result.data.serviceType || []);
          }
        } else {
          // Fallback to stored data
          setProviderData({
            ...userData,
            token: token,
          });
          setEditedName(userData.fullName || '');
          setEditedDescription(userData.description || '');
          setSelectedServices(userData.serviceType || []);
        }
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSwitch = (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowLanguageModal(false);
    // Here you would implement actual language switching logic
    Alert.alert('Language Changed', `App language switched to ${langCode === 'en' ? 'English' : 'Arabic'}`);
  };

  const handleRoleSwitch = async () => {
    Alert.alert(
      'Switch to Customer Mode',
      'You will be logged in as a customer. All provider data will be cleared from this session. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get current user email from storage
              const userDataStr = await AsyncStorage.getItem('userData');
              if (!userDataStr) {
                throw new Error('No user data found');
              }

              const userData = JSON.parse(userDataStr);
              const email = userData.email;
              
              // Sign out from Firebase
              await signOut(auth);
              
              // Clear provider-specific storage but keep email for sign in
              await AsyncStorage.multiRemove([
                'userToken',
                'userData',
                'providerOnlineStatus',
                'currentBookingId',
                'activeBookings',
                'seenJobs',
              ]);
              
              // Store email for auto-fill on sign in
              if (email) {
                await AsyncStorage.setItem('savedEmail', email);
              }
              
              // Navigate to customer sign in
              router.replace('/(customer)/SignIn');
              
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

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!providerData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${providerData.firebaseUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editedName.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProviderData(prev => prev ? { ...prev, fullName: editedName.trim() } : null);
          
          // Update stored user data
          const userDataStr = await AsyncStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userData.fullName = editedName.trim();
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
          }
          
          setShowEditNameModal(false);
          Alert.alert('Success', 'Name updated successfully');
        }
      } else {
        throw new Error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!providerData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${providerData.firebaseUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editedDescription.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProviderData(prev => prev ? { ...prev, description: editedDescription.trim() } : null);
          setShowEditDescriptionModal(false);
          Alert.alert('Success', 'Description updated successfully');
        }
      } else {
        throw new Error('Failed to update description');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert('Error', 'Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateServices = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }

    if (!providerData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${providerData.firebaseUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${providerData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: selectedServices,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProviderData(prev => prev ? { ...prev, serviceType: selectedServices } : null);
          setShowServicesModal(false);
          Alert.alert('Success', 'Services updated successfully');
        }
      } else {
        throw new Error('Failed to update services');
      }
    } catch (error) {
      console.error('Error updating services:', error);
      Alert.alert('Error', 'Failed to update services');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      // Here you would upload the image to your backend
      Alert.alert('Success', 'Profile image updated');
      setShowImageOptions(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Here you would call API to remove image
            setShowImageOptions(false);
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.multiRemove([
                'userToken',
                'userData',
                'providerOnlineStatus',
                'currentBookingId',
                'activeBookings',
                'seenJobs',
                'rememberMe',
                'savedEmail',
              ]);
              router.replace('/(provider)/ProviderSignIn');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const StatsCard = ({ icon, value, label }: StatsCardProps) => (
    <View style={profileStyles.statCard}>
      <Feather name={icon} size={24} color="#68bdee" />
      <Text style={profileStyles.statValue}>{value}</Text>
      <Text style={profileStyles.statLabel}>{label}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={profileStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#68bdee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={profileStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={profileStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profileStyles.backButton}>
          <Image
            source={require('../../assets/customer/back_button.png')}
            style={profileStyles.backButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={profileStyles.headerTextContainer}>
          <Text style={profileStyles.headerTitle}>Provider Profile</Text>
          <Text style={profileStyles.headerSubtitle}>MANAGE YOUR ACCOUNT</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={profileStyles.signOutButton}>
          <Feather name="log-out" size={22} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <View style={profileStyles.headerSeparator} />

      <ScrollView
        style={profileStyles.scrollView}
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Image Section */}
        <View style={profileStyles.profileImageSection}>
          <TouchableOpacity onPress={() => setShowImageOptions(true)} style={profileStyles.avatarContainer}>
            {providerData?.profileImage ? (
              <Image
                source={{ uri: providerData.profileImage }}
                style={profileStyles.avatarImage}
              />
            ) : (
              <View style={profileStyles.avatarPlaceholder}>
                <Text style={profileStyles.avatarInitials}>
                  {providerData?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                </Text>
              </View>
            )}
            <View style={profileStyles.editBadge}>
              <Feather name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={profileStyles.profileName}>{providerData?.fullName}</Text>
          <Text style={profileStyles.profileEmail}>{providerData?.email}</Text>
          <Text style={profileStyles.profilePhone}>{providerData?.phoneNumber}</Text>
        </View>

        {/* Stats Cards */}
        <View style={profileStyles.statsContainer}>
          <StatsCard icon="star" value={providerData?.rating?.toFixed(1) || '0'} label="Rating" />
          <StatsCard icon="briefcase" value={providerData?.totalJobsCompleted || 0} label="Jobs" />
          <StatsCard icon="dollar-sign" value={providerData?.totalEarnings || 0} label="Earnings" />
        </View>

        {/* Language & Role Section */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>PREFERENCES</Text>
          
          {/* Language Switch */}
          <TouchableOpacity
            style={profileStyles.menuItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="globe" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Language</Text>
            </View>
            <View style={profileStyles.menuItemRight}>
              <Text style={profileStyles.menuItemValue}>
                {selectedLanguage === 'en' ? 'English' : 'العربية'}
              </Text>
              <Feather name="chevron-right" size={20} color="#8c8c8c" />
            </View>
          </TouchableOpacity>

          {/* Role Switch */}
          <TouchableOpacity
            style={[profileStyles.menuItem, profileStyles.menuItemNoBorder]}
            onPress={handleRoleSwitch}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="refresh-cw" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Switch to Customer</Text>
            </View>
            <View style={profileStyles.menuItemRight}>
              <Text style={[profileStyles.menuItemValue, { color: '#68bdee' }]}>Tap to switch</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>PERSONAL INFORMATION</Text>
          
          {/* Name */}
          <TouchableOpacity
            style={profileStyles.menuItem}
            onPress={() => {
              setEditedName(providerData?.fullName || '');
              setShowEditNameModal(true);
            }}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="user" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Full Name</Text>
            </View>
            <View style={profileStyles.menuItemRight}>
              <Text style={profileStyles.menuItemValue} numberOfLines={1}>
                {providerData?.fullName}
              </Text>
              <Feather name="chevron-right" size={20} color="#8c8c8c" />
            </View>
          </TouchableOpacity>

          {/* Description */}
          <TouchableOpacity
            style={profileStyles.menuItem}
            onPress={() => {
              setEditedDescription(providerData?.description || '');
              setShowEditDescriptionModal(true);
            }}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="file-text" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Description</Text>
            </View>
            <View style={profileStyles.menuItemRight}>
              <Text style={profileStyles.menuItemValue} numberOfLines={1}>
                {providerData?.description || 'Add description'}
              </Text>
              <Feather name="chevron-right" size={20} color="#8c8c8c" />
            </View>
          </TouchableOpacity>

          {/* Services */}
          <TouchableOpacity
            style={[profileStyles.menuItem, profileStyles.menuItemNoBorder]}
            onPress={() => {
              setSelectedServices(providerData?.serviceType || []);
              setShowServicesModal(true);
            }}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="tool" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Services</Text>
            </View>
            <View style={profileStyles.menuItemRight}>
              <Text style={profileStyles.menuItemValue}>
                {providerData?.serviceType?.length || 0} selected
              </Text>
              <Feather name="chevron-right" size={20} color="#8c8c8c" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionLabel}>ACCOUNT</Text>
          
          <TouchableOpacity style={profileStyles.menuItem}>
            <View style={profileStyles.menuItemLeft}>
              <Feather name="shield" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Privacy Policy</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#8c8c8c" />
          </TouchableOpacity>

          <TouchableOpacity style={profileStyles.menuItem}>
            <View style={profileStyles.menuItemLeft}>
              <Feather name="help-circle" size={20} color="#68bdee" />
              <Text style={profileStyles.menuItemText}>Help & Support</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#8c8c8c" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[profileStyles.menuItem, profileStyles.menuItemNoBorder]}
            onPress={handleSignOut}
          >
            <View style={profileStyles.menuItemLeft}>
              <Feather name="log-out" size={20} color="#ff4444" />
              <Text style={[profileStyles.menuItemText, { color: '#ff4444' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={profileStyles.modalContent}>
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Feather name="x" size={24} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  profileStyles.languageOption,
                  selectedLanguage === lang.code && profileStyles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSwitch(lang.code)}
              >
                <Text style={profileStyles.languageFlag}>{lang.flag}</Text>
                <Text style={profileStyles.languageName}>{lang.name}</Text>
                {selectedLanguage === lang.code && (
                  <Feather name="check" size={20} color="#68bdee" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={profileStyles.modalContent}>
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Edit Full Name</Text>
              <TouchableOpacity onPress={() => setShowEditNameModal(false)}>
                <Feather name="x" size={24} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={profileStyles.modalInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your full name"
              placeholderTextColor="#8c8c8c"
              autoFocus
            />

            <TouchableOpacity
              style={[profileStyles.modalButton, isSaving && profileStyles.modalButtonDisabled]}
              onPress={handleUpdateName}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={profileStyles.modalButtonText}>Update Name</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Description Modal */}
      <Modal
        visible={showEditDescriptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditDescriptionModal(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={profileStyles.modalContent}>
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Edit Description</Text>
              <TouchableOpacity onPress={() => setShowEditDescriptionModal(false)}>
                <Feather name="x" size={24} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[profileStyles.modalInput, profileStyles.textArea]}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Tell customers about yourself and your services..."
              placeholderTextColor="#8c8c8c"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={profileStyles.characterCount}>
              {editedDescription.length}/500
            </Text>

            <TouchableOpacity
              style={[profileStyles.modalButton, isSaving && profileStyles.modalButtonDisabled]}
              onPress={handleUpdateDescription}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={profileStyles.modalButtonText}>Update Description</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Services Modal */}
      <Modal
        visible={showServicesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServicesModal(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={[profileStyles.modalContent, profileStyles.servicesModalContent]}>
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Select Your Services</Text>
              <TouchableOpacity onPress={() => setShowServicesModal(false)}>
                <Feather name="x" size={24} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            <ScrollView style={profileStyles.servicesList}>
              {SERVICE_TYPES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={profileStyles.serviceItem}
                  onPress={() => toggleService(service.name)}
                >
                  <View style={profileStyles.serviceItemLeft}>
                    <Image source={service.icon} style={profileStyles.serviceIcon} />
                    <Text style={profileStyles.serviceName}>{service.name}</Text>
                  </View>
                  <View style={[
                    profileStyles.checkbox,
                    selectedServices.includes(service.name) && profileStyles.checkboxChecked
                  ]}>
                    {selectedServices.includes(service.name) && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[profileStyles.modalButton, isSaving && profileStyles.modalButtonDisabled]}
              onPress={handleUpdateServices}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={profileStyles.modalButtonText}>Update Services</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={profileStyles.modalContent}>
            <View style={profileStyles.modalHeader}>
              <Text style={profileStyles.modalTitle}>Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                <Feather name="x" size={24} color="#3c3c3c" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={profileStyles.imageOption} onPress={handlePickImage}>
              <Feather name="image" size={20} color="#68bdee" />
              <Text style={profileStyles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={profileStyles.imageOption} onPress={() => {
              setShowImageOptions(false);
              // Handle take photo
            }}>
              <Feather name="camera" size={20} color="#68bdee" />
              <Text style={profileStyles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>

            {providerData?.profileImage && (
              <TouchableOpacity
                style={[profileStyles.imageOption, profileStyles.imageOptionRemove]}
                onPress={handleRemoveImage}
              >
                <Feather name="trash-2" size={20} color="#ff4444" />
                <Text style={[profileStyles.imageOptionText, { color: '#ff4444' }]}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signOutButton: {
    padding: 8,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileImageSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#68bdee',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#68bdee',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#68bdee',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#68bdee',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: '#8c8c8c',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8c8c8c',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemNoBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    color: '#3c3c3c',
    marginLeft: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  menuItemValue: {
    fontSize: 13,
    color: '#8c8c8c',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  servicesModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionSelected: {
    backgroundColor: '#f8f8f8',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#3c3c3c',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#3c3c3c',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#8c8c8c',
    textAlign: 'right',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#a0d4f5',
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  servicesList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#3c3c3c',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#68bdee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#68bdee',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageOptionRemove: {
    borderBottomWidth: 0,
  },
  imageOptionText: {
    fontSize: 14,
    color: '#3c3c3c',
    marginLeft: 12,
  },
});

export default ProviderProfileScreen;
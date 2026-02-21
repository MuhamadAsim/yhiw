
// app/(customer)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

type Language = 'en' | 'ar';
type UserRole = 'customer' | 'provider';

const ProfileScreen = () => {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [notifications, setNotifications] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Mock user data - replace with actual user data from your auth system
  const [userData, setUserData] = useState({
    name: 'Ahmed Mohammed',
    email: 'ahmed.mohammed@email.com',
    phone: '+973 1234 5678',
    memberSince: 'January 2024',
    avatar: require('../../assets/customer/towing.png'),
    completedServices: 24,
    rating: 4.8,
  });

  const handleBackPress = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      language === 'ar' ? 'تسجيل الخروج' : 'Logout',
      language === 'ar' ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 'Are you sure you want to logout?',
      [
        {
          text: language === 'ar' ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
          onPress: () => {
            // Handle logout logic here
            router.replace('/(auth)/customer_signin');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    Alert.alert(
      language === 'ar' ? 'تغيير الدور' : 'Switch Role',
      language === 'ar' 
        ? `هل تريد التبديل إلى وضع ${newRole === 'provider' ? 'مزود الخدمة' : 'العميل'}؟` 
        : `Do you want to switch to ${newRole === 'provider' ? 'Provider' : 'Customer'} mode?`,
      [
        {
          text: language === 'ar' ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ar' ? 'تأكيد' : 'Confirm',
          onPress: () => {
            setUserRole(newRole);
            // Navigate to the appropriate dashboard based on role
            if (newRole === 'provider') {
              router.push('/(provider)/home');
            } else {
              router.push('/(customer)/home');
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    // Here you would implement actual language switching logic
    // This might involve updating the app's language context/storage
    Alert.alert(
      'Language Changed',
      `App language has been changed to ${newLanguage === 'ar' ? 'Arabic' : 'English'}`,
    );
  };

  const handleEditProfile = () => {
    setEditedName(userData.name);
    setEditModalVisible(true);
  };

  const handleChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUserData({
        ...userData,
        avatar: { uri: result.assets[0].uri } as any,
      });
    }
  };

  const handleSaveChanges = () => {
    if (editedName.trim()) {
      setUserData({
        ...userData,
        name: editedName.trim(),
      });
    }
    setEditModalVisible(false);
  };

  const translations = {
    en: {
      profile: 'Profile',
      editProfile: 'Edit Profile',
      memberSince: 'Member since',
      completedServices: 'Completed Services',
      rating: 'Rating',
      settings: 'Settings',
      language: 'Language',
      arabic: 'Arabic',
      english: 'English',
      role: 'Account Type',
      customer: 'Customer',
      provider: 'Provider',
      notifications: 'Push Notifications',
      logout: 'Logout',
      version: 'Version 1.0.0',
      personalInfo: 'Personal Information',
      accountSettings: 'Account Settings',
      changePhoto: 'Change Photo',
      cancel: 'Cancel',
      save: 'Save',
      editName: 'Edit Name',
      enterName: 'Enter your name',
    },
    ar: {
      profile: 'الملف الشخصي',
      editProfile: 'تعديل الملف',
      memberSince: 'عضو منذ',
      completedServices: 'الخدمات المنجزة',
      rating: 'التقييم',
      settings: 'الإعدادات',
      language: 'اللغة',
      arabic: 'العربية',
      english: 'الإنجليزية',
      role: 'نوع الحساب',
      customer: 'عميل',
      provider: 'مزود خدمة',
      notifications: 'الإشعارات',
      logout: 'تسجيل الخروج',
      version: 'الإصدار 1.0.0',
      personalInfo: 'المعلومات الشخصية',
      accountSettings: 'إعدادات الحساب',
      changePhoto: 'تغيير الصورة',
      cancel: 'إلغاء',
      save: 'حفظ',
      editName: 'تعديل الاسم',
      enterName: 'أدخل اسمك',
    },
  };

  const t = translations[language];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#68bdee', '#5aafe6']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.profile}</Text>
          <View style={styles.placeholderIcon} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              <Image source={userData.avatar} style={styles.avatar} />
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <Text style={styles.userPhone}>{userData.phone}</Text>
          
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color="#68bdee" />
            <Text style={styles.editProfileButtonText}>{t.editProfile}</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{userData.completedServices}</Text>
              <Text style={styles.statLabel}>{t.completedServices}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={24} color="#FFB800" />
              </View>
              <Text style={styles.statValue}>{userData.rating}</Text>
              <Text style={styles.statLabel}>{t.rating}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#68bdee" />
              </View>
              <Text style={styles.statValue}>{userData.memberSince.split(' ')[1]}</Text>
              <Text style={styles.statLabel}>{t.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>{t.accountSettings}</Text>

          {/* Language Selection Card */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconWrapper}>
                <LinearGradient
                  colors={['#e3f5ff', '#f0f9ff']}
                  style={styles.iconBox}
                >
                  <Ionicons name="language-outline" size={22} color="#68bdee" />
                </LinearGradient>
              </View>
              <Text style={styles.settingTitle}>{t.language}</Text>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  language === 'en' && styles.langButtonActive,
                ]}
                onPress={() => handleLanguageChange('en')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    language === 'en' && styles.langButtonTextActive,
                  ]}
                >
                  {t.english}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  language === 'ar' && styles.langButtonActive,
                ]}
                onPress={() => handleLanguageChange('ar')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    language === 'ar' && styles.langButtonTextActive,
                  ]}
                >
                  {t.arabic}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selection Card */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconWrapper}>
                <LinearGradient
                  colors={['#e3f5ff', '#f0f9ff']}
                  style={styles.iconBox}
                >
                  <Ionicons 
                    name={userRole === 'provider' ? 'construct-outline' : 'person-outline'} 
                    size={22} 
                    color="#68bdee" 
                  />
                </LinearGradient>
              </View>
              <Text style={styles.settingTitle}>{t.role}</Text>
            </View>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  userRole === 'customer' && styles.roleButtonActive,
                ]}
                onPress={() => handleRoleSwitch('customer')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="person-outline" 
                  size={16} 
                  color={userRole === 'customer' ? '#FFFFFF' : '#8c8c8c'} 
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    userRole === 'customer' && styles.roleButtonTextActive,
                  ]}
                >
                  {t.customer}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  userRole === 'provider' && styles.roleButtonActive,
                ]}
                onPress={() => handleRoleSwitch('provider')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="construct-outline" 
                  size={16} 
                  color={userRole === 'provider' ? '#FFFFFF' : '#8c8c8c'} 
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    userRole === 'provider' && styles.roleButtonTextActive,
                  ]}
                >
                  {t.provider}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Card */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingHeader}>
                <View style={styles.settingIconWrapper}>
                  <LinearGradient
                    colors={['#e3f5ff', '#f0f9ff']}
                    style={styles.iconBox}
                  >
                    <Ionicons name="notifications-outline" size={22} color="#68bdee" />
                  </LinearGradient>
                </View>
                <Text style={styles.settingTitle}>{t.notifications}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#e0e0e0', true: '#68bdee' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#e0e0e0"
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#ffebee', '#ffcdd2']}
              style={styles.logoutGradient}
            >
              <Ionicons name="log-out-outline" size={22} color="#ff4444" />
              <Text style={styles.logoutText}>{t.logout}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>{t.version}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.editProfile}</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={28} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
            <View style={styles.modalAvatarSection}>
              <View style={styles.modalAvatarWrapper}>
                <Image source={userData.avatar} style={styles.modalAvatar} />
                <View style={styles.modalCameraIconOverlay}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={20} color="#68bdee" />
                <Text style={styles.changePhotoText}>{t.changePhoto}</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t.editName}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#8c8c8c" />
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder={t.enterName}
                  placeholderTextColor="#b0b0b0"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveChanges}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#68bdee', '#5aafe6']}
                  style={styles.modalSaveGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.modalSaveText}>{t.save}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerGradient: {
    paddingTop: 45,
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  placeholderIcon: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#68bdee',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 15,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e3f5ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 25,
  },
  editProfileButtonText: {
    fontSize: 13,
    color: '#68bdee',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#8c8c8c',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8c8c8c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingIconWrapper: {
    marginRight: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 15,
    color: '#3c3c3c',
    fontWeight: '600',
    flex: 1,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  langButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  langButtonActive: {
    backgroundColor: '#68bdee',
    borderColor: '#68bdee',
  },
  langButtonText: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '600',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  roleButtonActive: {
    backgroundColor: '#68bdee',
    borderColor: '#68bdee',
  },
  roleButtonText: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    color: '#ff4444',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#b0b0b0',
    marginTop: 25,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalAvatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  modalAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#e3f5ff',
  },
  modalCameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#68bdee',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#e3f5ff',
    borderWidth: 1,
    borderColor: '#68bdee',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    fontSize: 15,
    color: '#3c3c3c',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#8c8c8c',
    fontWeight: '700',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  modalSaveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ProfileScreen;
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../constants/firebase';

// Define TypeScript interfaces
interface UserData {
  firebaseUserId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

const SignUpScreen = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('signup');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  
  // Store the generated OTP for verification
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  const handleSignInNavigation = () => {
    router.push('/provider_signin');
  };

  // Function to save user type to local storage
  const saveUserTypeToStorage = async (email: string): Promise<void> => {
    try {
      const storageKey = `userType_${email.toLowerCase().trim()}`;
      await AsyncStorage.setItem(storageKey, 'provider');
      console.log('User type saved as provider for:', email);
    } catch (error) {
      console.error('Error saving user type:', error);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    let formatted = phone.trim();
    formatted = formatted.replace(/[^\d+]/g, '');

    if (!formatted.startsWith('+')) {
      formatted = formatted.replace(/^0+/, '');

      if (formatted.startsWith('3') && formatted.length <= 8) {
        formatted = '+973' + formatted;
      } else {
        formatted = '+92' + formatted;
      }
    }

    return formatted;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const pakistaniRegex = /^\+92[3-9]\d{9}$/;
    const bahrainRegex = /^\+973[3-9]\d{7}$/;
    return pakistaniRegex.test(cleaned) || bahrainRegex.test(cleaned);
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const sendUserDataToBackend = async (firebaseUserId: string): Promise<void> => {
    try {
      const userData: UserData = {
        firebaseUserId,
        fullName,
        email,
        phoneNumber: formatPhoneNumber(phoneNumber),
      };

      const backendUrl = 'https://yhiw-backend.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.warn('Backend save failed, but continuing...');
      } else {
        console.log('User data saved to backend successfully');
      }
    } catch (error: any) {
      console.warn('Backend error (non-critical):', error.message);
    }
  };

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return false;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your phone number');
      return false;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Required Field', 'Please enter a password');
      return false;
    }

    if (!validatePassword(password)) {
      Alert.alert('Password Requirement', 'Password must be at least 6 characters long');
      return false;
    }

    if (!agreeToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  // Generate a random 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSendingOtp(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Generate OTP
      const otp = generateOTP();
      setGeneratedOtp(otp);
      
      // TODO: Send OTP to backend to send SMS
      // For now, just show it in console and alert (for testing)
      console.log('Generated OTP:', otp);
      console.log('Phone number:', formattedPhone);

      setOtpSent(true);

      // Start cooldown timer
      setOtpCooldown(60);
      const interval = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Show OTP in alert (FOR TESTING ONLY - remove in production)
      Alert.alert(
        'OTP Sent', 
        `Your verification code is: ${otp}\n\nSent to: ${formattedPhone}\n\n(This is for testing. In production, you'll receive it via SMS)`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('OTP error:', error);
      Alert.alert('Error', 'Unable to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (): Promise<void> => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit code');
      return;
    }

    // Verify OTP matches
    if (verificationCode !== generatedOtp) {
      Alert.alert('Invalid Code', 'The verification code is incorrect. Please try again.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // Create email/password account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      const user = userCredential.user;

      console.log('Firebase user created:', user.uid);

      // Save user type to AsyncStorage
      await saveUserTypeToStorage(email);

      // Try to save to backend (non-critical)
      await sendUserDataToBackend(user.uid);

      Alert.alert(
        'Success', 
        'Your account has been created successfully!',
        [{ 
          text: 'Continue', 
          onPress: () => router.replace('/(provider)/Home' as any) 
        }]
      );
    } catch (error: any) {
      console.error('Account creation error:', error);
      
      let message = 'Unable to create account. Please try again.';
      let showSignInOption = false;
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
        showSignInOption = true;
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }

      if (showSignInOption) {
        Alert.alert(
          'Account Exists', 
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => router.push('/provider_signin')
            }
          ]
        );
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    if (otpCooldown > 0) {
      Alert.alert('Wait', `Please wait ${otpCooldown} seconds before resending.`);
      return;
    }
    await handleSendOTP();
  };

  const resetForm = (): void => {
    setOtpSent(false);
    setVerificationCode('');
    setGeneratedOtp('');
    setOtpCooldown(0);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/auth/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>YHIW</Text>
          <Text style={styles.tagline}>YOUR HELP IN WAY</Text>
        </View>

        {/* Sign In / Sign Up Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
            onPress={handleSignInNavigation}
            disabled={isLoading || isSendingOtp || isVerifyingOtp}
          >
            <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
            onPress={() => setActiveTab('signup')}
            disabled={isLoading || isSendingOtp || isVerifyingOtp}
          >
            <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FULL NAME *</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ENTER YOUR FULL NAME"
              placeholderTextColor="#ccc"
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading && !isSendingOtp && !isVerifyingOtp && !otpSent}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="YOUR.EMAIL@EXAMPLE.COM"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading && !isSendingOtp && !isVerifyingOtp && !otpSent}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHONE NUMBER *</Text>
          <View style={styles.inputContainer}>
            <Feather name="phone" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+973 3X XX XXXX or +923XXXXXXXXX"
              placeholderTextColor="#ccc"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!isLoading && !isSendingOtp && !isVerifyingOtp && !otpSent}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD *</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="CREATE A PASSWORD"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading && !isSendingOtp && !isVerifyingOtp && !otpSent}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading || isSendingOtp || isVerifyingOtp || otpSent}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color="#999"
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Input (Only shown after OTP is sent) */}
        {otpSent && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>VERIFICATION CODE *</Text>
            <View style={styles.inputContainer}>
              <Feather name="shield" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="ENTER 6-DIGIT OTP"
                placeholderTextColor="#ccc"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isVerifyingOtp}
                autoFocus={true}
              />
            </View>
            <View style={styles.resendContainer}>
              <Text style={styles.resendHint}>
                {otpCooldown > 0 
                  ? `Resend in ${otpCooldown}s` 
                  : 'Enter the code sent to your phone'}
              </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={isSendingOtp || otpCooldown > 0}
              >
                <Text style={[
                  styles.resendText,
                  (isSendingOtp || otpCooldown > 0) && styles.disabledResendText
                ]}>
                  {isSendingOtp ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Terms and Conditions */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          disabled={isLoading || isSendingOtp || isVerifyingOtp || otpSent}
        >
          <View style={styles.checkbox}>
            {agreeToTerms && <View style={styles.dot} />}
          </View>
          <Text style={styles.termsText}>
            I AGREE TO THE{' '}
            <Text style={styles.termsLink}>TERMS OF SERVICE</Text>
            {' '}AND{' '}
            <Text style={styles.termsLink}>PRIVACY POLICY</Text>
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        {!otpSent ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isSendingOtp || isLoading) && styles.disabledButton
            ]}
            onPress={handleSendOTP}
            disabled={isSendingOtp || isLoading}
          >
            {isSendingOtp ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  SEND VERIFICATION CODE
                </Text>
                <Feather name="arrow-right" size={18} color="#FFF" style={styles.arrowIcon} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isVerifyingOtp && styles.disabledButton
            ]}
            onPress={handleVerifyOTP}
            disabled={isVerifyingOtp}
          >
            {isVerifyingOtp ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  CREATE ACCOUNT
                </Text>
                <Feather name="check" size={18} color="#FFF" style={styles.arrowIcon} />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Button */}
        {otpSent && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetForm}
            disabled={isVerifyingOtp}
          >
            <Text style={styles.secondaryButtonText}>CANCEL</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>G</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={require('../../assets/auth/apple.png')}
              style={styles.socialIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>f</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>ALREADY HAVE AN ACCOUNT? </Text>
          <TouchableOpacity
            onPress={handleSignInNavigation}
            disabled={isLoading || isSendingOtp || isVerifyingOtp}
          >
            <Text style={styles.signInLink}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#68bdee',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: '#2c2c2c',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#2c2c2c',
  },
  eyeIcon: {
    padding: 5,
  },
  otpInput: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resendHint: {
    fontSize: 10,
    color: '#666',
  },
  resendText: {
    fontSize: 11,
    color: '#68bdee',
    fontWeight: '500',
  },
  disabledResendText: {
    color: '#999',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  termsText: {
    fontSize: 9,
    color: '#2c2c2c',
    fontWeight: '500',
    flex: 1,
  },
  termsLink: {
    color: '#68bdee',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 10,
    color: '#999',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  signInText: {
    fontSize: 11,
    color: '#666',
  },
  signInLink: {
    fontSize: 11,
    color: '#68bdee',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
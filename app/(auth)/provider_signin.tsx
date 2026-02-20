
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import {  signInWithEmailAndPassword as firebaseSignIn } from 'firebase/auth';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';

// @ts-ignore - Your JS file doesn't have TypeScript types
import { auth } from '../../constants/firebase';

interface UserData {
  firebaseUserId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface FirebaseAuthError {
  code: string;
  message: string;
  name?: string;
}

const SignInScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Get auth lazily (Expo-safe)

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const rememberMeValue = await AsyncStorage.getItem('rememberMe');
        const emailValue = await AsyncStorage.getItem('savedEmail');

        if (rememberMeValue === 'true' && emailValue) {
          setEmail(emailValue);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Check if email belongs to a provider
  const checkIfprovider = async (userEmail: string): Promise<boolean> => {
    try {
      const storageKey = `userType_${userEmail.toLowerCase().trim()}`;
      const userType = await AsyncStorage.getItem(storageKey);

      console.log(`Checking user type for ${userEmail}:`, userType);

      return userType === 'provider';
    } catch (error) {
      console.error('Error checking provider status:', error);
      return false;
    }
  };

  const fetchUserDataFromBackend = async (firebaseUserId: string): Promise<UserData | null> => {
    try {
      const backendUrl = "https://render-baceknd.com";
      if (!backendUrl) {
        console.warn('Backend URL is not defined');
        return null;
      }

      const response = await fetch(`${backendUrl}/api/users/${firebaseUserId}`);

      if (!response.ok) {
        console.warn('Failed to fetch user data from backend');
        return null;
      }

      const userData: UserData = await response.json();
      console.log('User data fetched from backend:', userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user data from backend:', error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter a password');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use Firebase auth directly (no wrapper needed)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      ); const user = userCredential.user;

      console.log('Firebase user signed in successfully:', user.uid);

      // Check if this email belongs to a provider
      const isprovider = await checkIfprovider(email);

      if (!isprovider) {
        // Sign out the user if they're not a provider

        Alert.alert(
          'Access Denied',
          'This account is registered as a customer, not a provider. Please use the provider app to sign in.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Fetch additional user data from backend
      let userData: UserData | null = null;
      try {
        userData = await fetchUserDataFromBackend(user.uid);

        if (userData) {
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          console.log('Full user data:', userData);
        }
      } catch (backendError) {
        console.log('Backend fetch failed, continuing with Firebase auth');
      }

      // Store remember me preference
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('savedEmail');
      }

      // Navigate directly without alert (cleaner UX)
      router.replace('/(provider)/home');

    } catch (error: unknown) {
      console.error('Firebase signin error:', error);

      let errorMessage = 'Failed to sign in. Please check your credentials and try again.';

      const isFirebaseError = (err: unknown): err is FirebaseAuthError => {
        return (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          typeof (err as FirebaseAuthError).code === 'string' &&
          'message' in err &&
          typeof (err as FirebaseAuthError).message === 'string'
        );
      };

      if (isFirebaseError(error)) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please sign up first.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid credentials. Please check your email and password.';
            break;
          default:
            errorMessage = error.message || 'An unexpected error occurred';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Sign In Failed', errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpNavigation = () => {
    router.push('/(auth)/provider_signup' as any);
  };

  const handleContinueAsGuest = () => {
    router.push('/(provider)/home');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset feature coming soon!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.contentContainer}>
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
            onPress={() => setActiveTab('signin')}
            disabled={isLoading}
          >
            <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
            onPress={handleSignUpNavigation}
            disabled={isLoading}
          >
            <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="YOUR.EMAIL@EXAMPLE.COM"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ENTER YOUR PASSWORD"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#999"
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          >
            <View style={styles.checkbox}>
              {rememberMe && <View style={styles.dot} />}
            </View>
            <Text style={styles.rememberMeText}>REMEMBER ME</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
            <Text style={styles.forgotPassword}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.disabledButton]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.signInButtonText}>SIGN IN</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={styles.arrowIcon} />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>G</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Image
              source={require('../../assets/auth/apple.png')}
              style={styles.socialIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>f</Text>
          </TouchableOpacity>
        </View>

        {/* Guest Button */}
        <TouchableOpacity
          style={[styles.guestButton, isLoading && styles.disabledButton]}
          onPress={handleContinueAsGuest}
          disabled={isLoading}
        >
          <Text style={styles.guestButtonText}>CONTINUE AS A GUEST</Text>
        </TouchableOpacity>

        {/* Sign Up Link with Underline */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>DON'T HAVE AN ACCOUNT? </Text>
          <TouchableOpacity onPress={handleSignUpNavigation} disabled={isLoading}>
            <Text style={styles.signUpLink}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Keep your styles the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#68bdee',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#68bdee',
  },
  rememberMeText: {
    fontSize: 11,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 11,
    color: '#68bdee',
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#68bdee',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#a0d4f5',
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
  guestButton: {
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFF',
  },
  guestButtonText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpText: {
    fontSize: 11,
    color: '#666',
  },
  signUpLink: {
    fontSize: 11,
    color: '#68bdee',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
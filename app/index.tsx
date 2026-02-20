import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset animation to start
    loadingAnimation.setValue(0);

    // Animate the loading bar once for 2 seconds
    Animated.timing(loadingAnimation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Navigate to role selection after 2 seconds
    navigationTimeoutRef.current = setTimeout(() => {
      // Use replace to remove splash screen from navigation history
      router.replace('/(auth)/role_selection' as any);  // Type assertion to bypass
    }, 2000);

    // Cleanup function
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual navigation if user somehow stays on this screen
  const handleManualProceed = () => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    router.replace('/(auth)/role_selection' as any);  // Type assertion to bypass
  };

  const loadingWidth = loadingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Main Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo and Title */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/splash/splash_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>YHIW</Text>
        </View>

        {/* Subtitle with decorative lines */}
        <View style={styles.subtitleContainer}>
          {/* Left decorative line */}
          <View style={styles.lineContainer}>
            <View style={[styles.lineSegment, styles.lineSegment7]} />
            <View style={[styles.lineSegment, styles.lineSegment6]} />
            <View style={[styles.lineSegment, styles.lineSegment5]} />
            <View style={[styles.lineSegment, styles.lineSegment4]} />
            <View style={[styles.lineSegment, styles.lineSegment3]} />
            <View style={[styles.lineSegment, styles.lineSegment2]} />
            <View style={[styles.lineSegment, styles.lineSegment1]} />
          </View>

          <Text style={styles.subtitle}>YOUR HELP IN WAY</Text>

          {/* Right decorative line */}
          <View style={styles.lineContainer}>
            <View style={[styles.lineSegment, styles.lineSegment1]} />
            <View style={[styles.lineSegment, styles.lineSegment2]} />
            <View style={[styles.lineSegment, styles.lineSegment3]} />
            <View style={[styles.lineSegment, styles.lineSegment4]} />
            <View style={[styles.lineSegment, styles.lineSegment5]} />
            <View style={[styles.lineSegment, styles.lineSegment6]} />
            <View style={[styles.lineSegment, styles.lineSegment7]} />
          </View>
        </View>

        {/* Loading Bar */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBarBackground}>
            <Animated.View
              style={[
                styles.loadingBarFill,
                { width: loadingWidth },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </View>

      {/* Version Number */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 0,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#87cefa',
    letterSpacing: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 14,
    color: '#2C3E50',
    letterSpacing: 3,
    fontWeight: '600',
    marginHorizontal: 5,
  },
  lineContainer: {
    flexDirection: 'row',
    height: 1.5,
    alignItems: 'center',
  },
  lineSegment: {
    height: 1.5,
    backgroundColor: '#87cefa',
    marginRight: -1,
  },
  lineSegment1: {
    width: 6,
    opacity: 0.9,
  },
  lineSegment2: {
    width: 7,
    opacity: 0.85,
  },
  lineSegment3: {
    width: 8,
    opacity: 0.8,
  },
  lineSegment4: {
    width: 8,
    opacity: 0.7,
  },
  lineSegment5: {
    width: 7,
    opacity: 0.6,
  },
  lineSegment6: {
    width: 6,
    opacity: 0.5,
  },
  lineSegment7: {
    width: 5,
    opacity: 0.4,
    marginRight: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    width: width * 0.6,
    marginBottom: 20,
  },
  loadingBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#87cefa',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#7A7A7A',
    letterSpacing: 2,
    fontWeight: '500',
  },
  manualProceedContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  manualProceedText: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 18,
  },
  manualProceedLink: {
    color: '#87cefa',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 50,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#7A7A7A',
    letterSpacing: 1,
  },
});

export default SplashScreen;
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const RoleSelectionScreen = () => {
  const router = useRouter();

  const handleCustomerSelect = () => {
    router.push('/(auth)/customer_signin' as any);
  };

  const handleProviderSelect = () => {
    router.push('/(auth)/provider_signin' as any);
  };

  const handleSignIn = () => {
    router.push('/(auth)/customer_signin' as any);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/role_selection/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Welcome Header */}
      <Text style={styles.welcomeTitle}>WELCOME TO YHIW</Text>
      <Text style={styles.subtitle}>HOW CAN WE HELP YOU ?</Text>

      {/* Request a Service Section */}
      <TouchableOpacity
        style={styles.mainCard}
        onPress={handleCustomerSelect}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderWithBg}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Image
                source={require('../../assets/role_selection/customer.png')}
                style={styles.cardIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Request a Service</Text>
              <Text style={styles.cardSubtitle}>Book roadside assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#68bdee" />
          </View>
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureLabel}>I Need a Service:</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Book towing and roadside services</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Track service provider in real-time</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Save favorite providers</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Get instant help 24/7</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Become a Service Provider Section */}
      <TouchableOpacity
        style={styles.mainCard}
        onPress={handleProviderSelect}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderWithBg}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Image
                source={require('../../assets/role_selection/provider.png')}
                style={styles.cardIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Become a Service Provider</Text>
              <Text style={styles.cardSubtitle}>Earn by helping others</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#68bdee" />
          </View>
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureLabel}>I Want to Provide Service:</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Accept service requests on your schedule</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Set your own service area</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Track your earnings in real-time</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#68bdee" />
            <Text style={styles.featureText}>Build your reputation with ratings</Text>
          </View>
        </View>

        {/* Stats Section with image icons */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Image
                source={require('../../assets/role_selection/dollar.png')}
                style={styles.statIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statValue}>500+</Text>
            <Text style={styles.statLabel}>BHD/day avg</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Image
                source={require('../../assets/role_selection/star.png')}
                style={styles.statIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Avg rating</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Image
                source={require('../../assets/role_selection/clock.png')}
                style={styles.statIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.statValue}>Flexible</Text>
            <Text style={styles.statLabel}>Schedule</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Important Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteTitle}>Important Note</Text>
        <Text style={styles.noteText}>
          You can switch between customer and provider modes anytime in your account
          settings. Provider applications require verification (1-2 business days).
        </Text>
      </View>

      {/* Sign In Link */}
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleSignIn}>
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#68bdee', // Changed to #68bdee
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3c3c3c',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: 30,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeaderWithBg: {
    backgroundColor: '#f0fafe',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#68bdee', // Changed to #68bdee
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconImage: {
    width: 35,
    height: 35,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  featureLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#3c3c3c',
    marginLeft: 10,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconImage: {
    width: 24,
    height: 24,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    textTransform: 'uppercase',
  },
  noteContainer: {
    backgroundColor: '#f0fafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#68bdee', // Changed to #68bdee
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 13,
    color: '#3c3c3c',
    lineHeight: 20,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signInText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  signInLink: {
    fontSize: 14,
    color: '#68bdee',
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;


























































































import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: Math.min(160, height * 0.2),
    height: Math.min(160, height * 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.03,
    backgroundColor: 'transparent',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Math.min(24, height * 0.032),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: height * 0.015,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Math.min(14, height * 0.018),
    color: '#68bdee',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: height * 0.02,
    letterSpacing: 0.3,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
    marginBottom: height * 0.03,
  },
  stepCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  stepIconContainerCompleted: {
    marginRight: 15,
  },
  stepIconContainerActive: {
    marginRight: 15,
  },
  stepIconContainerInactive: {
    marginRight: 15,
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    backgroundColor: 'transparent',
  },
  completedCircle: {
    borderColor: '#68bdee',
    backgroundColor: '#68bdee',
  },
  inactiveCircle: {
    borderColor: '#ff4444',
    backgroundColor: 'transparent',
  },
  stepTextCompleted: {
    fontSize: Math.min(14, height * 0.018),
    color: '#68bdee',
    fontWeight: '600',
    flex: 1,
  },
  stepTextActive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#3c3c3c',
    fontWeight: 'bold',
    flex: 1,
  },
  stepTextInactive: {
    fontSize: Math.min(14, height * 0.018),
    color: '#b0b0b0',
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#e3f5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3c5c5',
    padding: 18,
    width: '100%',
    marginBottom: height * 0.03,
  },
  infoTitle: {
    fontSize: Math.min(12, height * 0.016),
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: Math.min(12, height * 0.016),
    color: '#5c5c5c',
    lineHeight: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  dotCompleted: {
    backgroundColor: '#4CAF50',
  },
  dotError: {
    backgroundColor: '#ff4444',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
  errorText: {
    color: '#ff4444',
    fontSize: Math.min(12, height * 0.016),
    marginTop: 15,
    textAlign: 'center',
  },
});

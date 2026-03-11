import {StyleSheet} from 'react-native';


export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 38,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.77,
    borderBottomColor: '#dddfe5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  requestId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: '#ffe2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 29757000,
  },
  urgentText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    letterSpacing: 0,
  },

  // Loading and Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Service Card
  serviceCard: {
    backgroundColor: '#e2f5ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIcon: {
    width: 32,
    height: 32,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },

  // Section
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.77,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  // Customer Card
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  callButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    width: 48,
    height: 48,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Location
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigateText: {
    fontSize: 12,
    color: '#87CEFA',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#60A5FA',
    marginTop: 4,
    marginRight: 12,
  },
  locationDotOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 20,
  },
  locationDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 8,
  },
  distanceCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  distanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0891B2',
  },

  // Notes Card
  notesCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Payment Card
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  earningsHighlight: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  paymentLabelBold: {
    fontSize: 13,
    color: '#000',
    fontWeight: '700',
  },
  paymentValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // Urgent Alert
  urgentAlert: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  urgentAlertContent: {
    flex: 1,
    marginLeft: 12,
  },
  urgentAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  urgentAlertText: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 18,
  },

  // Arrival Card
  arrivalCard: {
    backgroundColor: '#CFFAFE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  arrivalInfo: {
    marginLeft: 12,
    flex: 1,
  },
  arrivalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  arrivalTime: {
    fontSize: 12,
    color: '#0891B2',
    fontWeight: '500',
  },

  // Buttons
  acceptButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
});
import { StyleSheet } from 'react-native';



export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  headerSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
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
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  serviceHeaderCard: {
    backgroundColor: '#e3f5ff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  serviceIconContainer: {
    marginBottom: 15,
  },
  serviceIconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#68bdee',
  },
  serviceIcon: {
    width: 50,
    height: 50,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingDistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#3c3c3c',
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  separator: {
    marginHorizontal: 8,
  },
  separatorText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  startingFromText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  headerPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8c8c8c',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '47%',
  },
  tickIcon: {
    width: 20,
    height: 20,
  },
  tickIconSmall: {
    width: 14,
    height: 14,
  },
  featureText: {
    fontSize: 12,
    color: '#3c3c3c',
    flex: 1,
  },
  includedList: {
    gap: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#68bdee',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filledDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#68bdee',
  },
  includedText: {
    flex: 1,
    fontSize: 12,
    color: '#3c3c3c',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statIcon: {
    width: 32,
    height: 32,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3c3c3c',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  reviewCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTime: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  reviewText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  pricingWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  pricingInfoBox: {
    backgroundColor: '#e3f5ff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pricingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pricingInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  pricingInfoText: {
    fontSize: 12,
    color: '#5c5c5c',
    lineHeight: 18,
  },
  dollarIcon: {
    width: 24,
    height: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  paginationDotActive: {
    backgroundColor: '#3c3c3c',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  bookNowButton: {
    backgroundColor: '#68bdee',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  bookNowButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
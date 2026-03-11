import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  menuButton: {
    padding: 4,
  },
  logoSection: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    color: '#8c8c8c',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fcfc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2dfdf',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
    paddingRight: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3c3c3c',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  seeAllText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  clearText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  // No Results Styles
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  // Categories/All Services Grid Styles - Using categoryCard styling
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
  },
  categoryName: {
    fontSize: 10,
    color: '#3c3c3c',
    textAlign: 'center',
    fontWeight: '500',
  },
  offerCard: {
    backgroundColor: '#68bdee',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  offerSubtitle: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  // Popular Services Card Styles - Using serviceCard styling
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  serviceIconBox: {
    width: 50,
    height: 50,
    backgroundColor: '#f0fafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#a0d6eb',
  },
  serviceIcon: {
    width: 28,
    height: 28,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c3c3c',
    marginBottom: 3,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 11,
    color: '#8c8c8c',
    marginLeft: 3,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  startingRate: {
    fontSize: 8,
    color: '#8c8c8c',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

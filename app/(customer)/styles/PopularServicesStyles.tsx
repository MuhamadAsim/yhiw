import { StyleSheet } from 'react-native';




export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 18,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
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
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8c8c8c',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  searchSection: {
    paddingTop: 20,
    marginBottom: 20,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
    marginHorizontal: -20, 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3c3c3c',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#68bdee',
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#68bdee',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  servicesList: {
    marginBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitleContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c3c3c',
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#e3f5ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    color: '#68bdee',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#8c8c8c',
    lineHeight: 16,
    marginBottom: 12,
  },
  serviceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#3c3c3c',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarIcon: {
    width: 16,
    height: 16,
  },
  startingFromText: {
    fontSize: 11,
    color: '#8c8c8c',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c3c3c',
  },
  currencyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8c8c8c',
    lineHeight: 11,
    textAlignVertical: 'top',
  },
  helpSection: {
    backgroundColor: '#f0fafe',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#352f2f',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  helpText: {
    fontSize: 11,
    color: '#3c3c3c',
    lineHeight: 18,
    marginBottom: 16,
  },
  supportButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#81c2e7',
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#68bdee',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  paginationDotActive: {
    backgroundColor: '#68bdee',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#8c8c8c',
  },
});

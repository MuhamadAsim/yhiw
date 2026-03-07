import {StyleSheet} from 'react-native';


// ─── Styles ──────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  successCircle: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },

  // ── Detail Rows ──
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  detailValueBold: {
    fontWeight: '900',
  },

  // ── Earnings Row ──
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
  },

  // ── Checkbox Row ──
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EBF5FD',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  confirmInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EBF5FD',
    borderRadius: 10,
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
  },
  checkboxTextBlock: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  checkboxSub: {
    fontSize: 12,
    color: '#5B9BD5',
    fontWeight: '500',
    lineHeight: 17,
  },

  // ── Photos ──
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  photosCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B9BD5',
    letterSpacing: 0.3,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    borderWidth: 1,
    borderColor: '#BDE0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Notes ──
  notesInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1A1A2E',
    minHeight: 90,
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
    marginBottom: 8,
  },
  notesHint: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Rating ──
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingStar: {
    fontSize: 20,
    color: '#F5B800',
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  ratingSubText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 12,
  },
  ratingCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  squareCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCheckboxChecked: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
  },
  ratingCheckLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },

  // ── Today's Earnings Card ──
  earningsCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 16,
  },
  earningsCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  earningsCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  earningsCardValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  earningsCardRight: {
    alignItems: 'flex-end',
  },
  earningsCardJobs: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'right',
  },
  earningsCardMotivation: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Confirm Button ──
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#1b93d1',
    shadowColor: '#1b93d1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: '#888888',
  },

  // ── Payment Warning ──
  paymentWarning: {
    textAlign: 'center',
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: -4,
  },

  // ── Back to Home ──
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backHomeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 0.5,
  },
});


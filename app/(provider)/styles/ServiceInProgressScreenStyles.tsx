import {StyleSheet} from 'react-native';



// ─── Styles ──────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 29,
    borderBottomWidth: 1.77,
    borderBottomColor: '#d1d5dc',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2939',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    width: 40, // Same width as backBtn was to maintain balance
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  headerRight: {
    width: 38,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  // ── Active Badge ──
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00C853',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C853',
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Timer Card ──
  timerCard: {
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a7282',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: '#87cefa',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerSavingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  timerSavingText: {
    fontSize: 11,
    color: '#87cefa',
    fontWeight: '600',
  },
  timerStarted: {
    fontSize: 12,
    color: '#6a7282',
    marginTop: 6,
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#f0b100',
    backgroundColor: '#eff6ff',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0b100',
    letterSpacing: 0.5,
  },
  addTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    backgroundColor: '#eff6ff',
  },
  addTimeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f0f10',
    letterSpacing: 0.5,
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // ── Service Details ──
  detailsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#555f6f',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: 0.2,
  },

  // ── Customer Contact ──
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BDE0F5',
  },
  customerText: { flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  customerPhone: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
    fontWeight: '600',
  },
  contactBtnRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 7,
  },
  contactBtnSep: {
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9dd7fb',
    letterSpacing: 0.3,
  },

  // ── Photo Documentation ──
  photoAddBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    gap: 4,
  },
  photoAddText: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Checklist ──
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkIconWrap: {},
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
    flex: 1,
  },

  // ── Earnings Card ──
  earningsCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
  earningsStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'right',
  },
  inProgressBadge: {
    backgroundColor: '#00C853',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Report Issue ──
  reportCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d08700',
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.3,
  },
  reportSubText: {
    fontSize: 12,
    color: '#d08700',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  reportBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d08700',
    backgroundColor: 'transparent',
  },
  reportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d08700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Complete Button ──
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 17,
    backgroundColor: '#2e9dd9',
    shadowColor: '#2e9dd9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  completeHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#737a8a',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // ── Cancel Link ──
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
  // Add these to your styles object
messageIconContainer: {
  position: 'relative',
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 4,
},
messageDot: {
  position: 'absolute',
  top: -3,
  right: -3,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#FF4444',
  borderWidth: 1,
  borderColor: '#FFFFFF',
},
});
import {StyleSheet} from 'react-native';


// ─── Styles (keep exactly as provided) ─────────────────────────────────────
export const styles = StyleSheet.create({
  // ── Safe Area ──
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 3,
    letterSpacing: 0.2,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1.2,
    marginBottom: 14,
    textTransform: 'uppercase',
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F0F0F0',
  },
  iconWrap: {
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  summarySubLabel: {
    fontSize: 11,
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // ── Card Shared ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardDividergreen: {
    height: 2,
    backgroundColor: '#00C853',
    width: '100%',
  },
  cardDividerred: {
    height: 1.77,
    backgroundColor: '#fc454d',
    width: '100%',
  },

  // ── Accept Card ──
  acceptCard: {
    backgroundColor: '#F0FBF0',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00C853',
    overflow: 'hidden',
  },
  acceptSection: {
    padding: 18,
  },
  acceptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  acceptCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#87CEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#87CEFA',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  acceptBtn: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Decline Card ──
  declineCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F44336',
    overflow: 'hidden',
  },
  declineTop: {
    backgroundColor: '#FFF5F5',
    padding: 14,
  },
  declineBottom: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  declineIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  declineCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
    letterSpacing: 0.2,
  },

  // ── Reason Selection ──
  reasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F44336',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    letterSpacing: 0.2,
  },
  radioLabelSelected: {
    color: '#F44336',
    fontWeight: '700',
  },

  // ── Confirm Decline Button ──
  confirmDeclineBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: '#4eafe4',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDeclineBtnDisabled: {
    backgroundColor: '#A8C8E8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmDeclineBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Cancel Button ──
  cancelBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Warning Card ──
  warningCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFC107',
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57F17',
    letterSpacing: 0.3,
  },
  warningText: {
    fontSize: 13,
    color: '#F57F17',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  warningBold: {
    fontWeight: '800',
    fontStyle: 'normal',
  },

  // ── Impact Card ──
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 18,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactCol: {
    flex: 1,
  },
  impactColHead: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  impactStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  impactIconGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CAF50',
  },
  impactStatGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },
  impactIconRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F44336',
  },
  impactStatRed: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
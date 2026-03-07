import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // ── Body ──
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
  },

  // Warning icon
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  // Title
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 1.2,
    marginBottom: 24,
  },

  // Info card
  infoCard: {
    width: '100%',
    backgroundColor: '#EBF5FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  infoCardDivider: {
    height: 1,
    backgroundColor: '#C9E3F5',
    marginBottom: 14,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1,
  },
  feeValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E53935',
    letterSpacing: 0.5,
  },

  // Subtitle
  subtitle: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 12,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  keepBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#5B9BD5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  keepBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
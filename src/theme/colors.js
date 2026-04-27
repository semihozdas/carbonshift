// CarbonShift design system — dark navy + neon green (adapted from Carbora)
export const colors = {
  // Backgrounds
  background: '#060B14',
  backgroundCard: '#0F1623',
  backgroundElevated: '#161E2E',
  backgroundModal: 'rgba(6,11,20,0.97)',
  backgroundOverlay: 'rgba(6,11,20,0.88)',

  // Neon primary (CarbonShift green)
  primary: '#00FF87',
  primaryDark: '#00CC6A',
  primaryLight: '#4DFFAA',
  primaryGlow: 'rgba(0,255,135,0.4)',
  primaryGlowSoft: 'rgba(0,255,135,0.15)',
  primaryGlowStrong: 'rgba(0,255,135,0.55)',
  primaryBorder: 'rgba(0,255,135,0.2)',
  primaryBorderStrong: 'rgba(0,255,135,0.38)',

  // Glass
  bgGlass: 'rgba(255,255,255,0.05)',
  bgGlassStrong: 'rgba(255,255,255,0.08)',

  // Accents
  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',
  accentOrange: '#F59E0B',
  accentPink: '#EC4899',
  accentCyan: '#06B6D4',
  gold: '#F59E0B',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderMedium: 'rgba(255,255,255,0.10)',
  borderLight: 'rgba(255,255,255,0.04)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  textDisabled: 'rgba(255,255,255,0.2)',
  textInverse: '#000000',

  // Status
  success: '#22C55E',
  successGlow: 'rgba(34,197,94,0.2)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245,158,11,0.2)',
  error: '#EF4444',
  errorGlow: 'rgba(239,68,68,0.2)',
  info: '#3B82F6',
  infoGlow: 'rgba(59,130,246,0.2)',

  // Rarity
  rarityCommon: '#64748B',
  rarityRare: '#3B82F6',
  rarityEpic: '#8B5CF6',
  rarityLegendary: '#F59E0B',

  // Tab bar
  tabBackground: '#08101C',
  tabActive: '#00FF87',
  tabInactive: 'rgba(255,255,255,0.3)',

  // Transport mode
  modeWalk: '#00FF87',
  modeBus: '#3B82F6',
  modeBike: '#F59E0B',
  modeCar: '#EF4444',
};

export const shadows = {
  neonGreen: {
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  neonGreenSoft: {
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const glass = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardStrong: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

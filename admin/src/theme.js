export const t = {
  bg: '#060B14',
  bgCard: '#0F1623',
  bgElevated: '#161E2E',
  bgSidebar: '#07101E',
  bgHover: 'rgba(255,255,255,0.04)',
  bgGlass: 'rgba(255,255,255,0.03)',

  primary: '#00FF87',
  primaryDark: '#00CC6A',
  primaryLight: '#4DFFAA',
  primaryGlow: 'rgba(0,255,135,0.35)',
  primaryGlowSoft: 'rgba(0,255,135,0.08)',
  primaryBorder: 'rgba(0,255,135,0.2)',
  primaryBorderStrong: 'rgba(0,255,135,0.38)',

  gold: '#F59E0B',
  goldGlow: 'rgba(245,158,11,0.2)',
  blue: '#3B82F6',
  blueGlow: 'rgba(59,130,246,0.2)',
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139,92,246,0.2)',
  cyan: '#06B6D4',
  error: '#EF4444',
  errorGlow: 'rgba(239,68,68,0.15)',
  success: '#22C55E',
  warning: '#F59E0B',

  text: '#FFFFFF',
  textSec: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  textDisabled: 'rgba(255,255,255,0.22)',

  border: 'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.10)',

  r: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 },
};

export const card = {
  background: '#0F1623',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 20,
};

export const neonCard = {
  ...card,
  border: '1px solid rgba(0,255,135,0.18)',
  boxShadow: '0 0 30px rgba(0,255,135,0.04)',
};

export const inputBase = {
  background: '#161E2E',
  border: '1.5px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  color: '#fff',
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
  fontFamily: 'inherit',
};

export const btnPrimary = {
  background: 'linear-gradient(135deg, #4DFFAA, #00FF87)',
  border: 'none',
  borderRadius: 10,
  color: '#000',
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.2s, transform 0.1s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export const btnGhost = {
  background: 'rgba(0,255,135,0.08)',
  border: '1.5px solid rgba(0,255,135,0.25)',
  borderRadius: 10,
  color: '#00FF87',
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export const btnDanger = {
  background: 'rgba(239,68,68,0.1)',
  border: '1.5px solid rgba(239,68,68,0.3)',
  borderRadius: 8,
  color: '#EF4444',
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

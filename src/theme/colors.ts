import { Platform } from 'react-native';

// Modern dark palette — deep night-blue ground with violet/gold accents.
// Designed for glass-card UI: backgrounds are dark enough that translucent
// overlays read as frosted glass, not muddy gray.
export const colors = {
  // Base
  bg: '#07060b',
  bgGradientA: '#120b1f',
  bgGradientB: '#060510',
  bgGlass: 'rgba(255,255,255,0.04)',
  bgGlassStrong: 'rgba(255,255,255,0.08)',
  bgGlassSoft: 'rgba(255,255,255,0.02)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Text
  text: '#f4f3f8',
  textMuted: 'rgba(244,243,248,0.62)',
  textDim: 'rgba(244,243,248,0.38)',

  // Accents
  accent: '#e4bf5a',         // warm gold
  accentBright: '#ffd879',
  accentSoft: 'rgba(228,191,90,0.16)',
  primary: '#a78bfa',        // lavender — interactive
  primaryBright: '#c4b4ff',
  primarySoft: 'rgba(167,139,250,0.18)',

  // States
  hp: '#ef4444',
  ep: '#38bdf8',
  xp: '#e4bf5a',

  // Semantics
  success: '#22c55e',
  successSoft: 'rgba(34,197,94,0.18)',
  warn: '#f59e0b',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.18)',

  // Schools
  earth: '#84cc16',
  water: '#38bdf8',
  fire: '#fb923c',
  air: '#e5e7eb',
  light: '#fde68a',
  dark: '#a78bfa',
  blood: '#f43f5e',

  // Side
  hero: '#e4bf5a',
  ally: '#4ade80',
  enemy: '#fb7185',

  // Back-compat aliases used by older screens — eventually inline these away.
  bgElevated: 'rgba(255,255,255,0.06)',
  bgCard: 'rgba(255,255,255,0.04)',
  bgDeep: 'rgba(0,0,0,0.28)',
  borderLight: 'rgba(255,255,255,0.12)',
  borderGold: 'rgba(228,191,90,0.4)',
  accentDark: 'rgba(228,191,90,0.25)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const layout = {
  maxContentWidth: 520,
  minTouchTarget: 44,
} as const;

// System serif fallback for numerals / headers.
const display = Platform.select({
  web: '"Cinzel", "Trajan Pro", "Playfair Display", Georgia, serif',
  default: 'serif',
});

const sans = Platform.select({
  web: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'System',
});

export const fonts = { display, sans };

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, fontFamily: display, letterSpacing: 0.3 },
  h1: { fontSize: 24, fontWeight: '700' as const, fontFamily: display, letterSpacing: 0.2 },
  h2: { fontSize: 20, fontWeight: '700' as const, fontFamily: display, letterSpacing: 0.2 },
  h3: { fontSize: 16, fontWeight: '700' as const, fontFamily: sans, letterSpacing: 0.2 },
  body: { fontSize: 14, fontWeight: '500' as const, fontFamily: sans },
  caption: { fontSize: 12, fontWeight: '500' as const, fontFamily: sans, letterSpacing: 0.1 },
  label: { fontSize: 11, fontWeight: '600' as const, fontFamily: sans, letterSpacing: 1.4, textTransform: 'uppercase' as const },
  button: { fontSize: 15, fontWeight: '600' as const, fontFamily: sans, letterSpacing: 0.3 },
} as const;

// Web-only glass helper — applies backdrop blur on web, degrades gracefully
// on native (to a solid translucent fill).
export const glass = {
  card: Platform.select({
    web: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(14px) saturate(140%)',
      WebkitBackdropFilter: 'blur(14px) saturate(140%)' as any,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.09)',
    },
    default: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
  }) as any,
  strong: Platform.select({
    web: {
      backgroundColor: 'rgba(255,255,255,0.09)',
      backdropFilter: 'blur(18px) saturate(160%)',
      WebkitBackdropFilter: 'blur(18px) saturate(160%)' as any,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    default: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
  }) as any,
  soft: Platform.select({
    web: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)' as any,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    default: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
  }) as any,
};

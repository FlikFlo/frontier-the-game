import { Platform } from 'react-native';

// Medieval/Disciples-2-inspired palette: aged parchment on deep earth,
// with warm gold accents and muted blood/mana. Everything stays dark enough
// to not glare on mobile at night.
export const colors = {
  bg: '#15100a',         // deep stained wood
  bgElevated: '#211a11', // one step up
  bgCard: '#2a2114',     // card surface — tooled leather
  bgDeep: '#0c0906',     // sunken panels
  border: '#5a4323',     // aged bronze / carved oak
  borderLight: '#7b5a32',
  borderGold: '#9a7638',
  text: '#e8dfc5',       // cream parchment
  textMuted: '#a69477',
  textDim: '#6b5c44',
  accent: '#c69a42',     // state gold
  accentBright: '#e8bf5e',
  accentDark: '#6f4f1f',
  hp: '#a5342a',         // blood red
  ep: '#3d6fa0',         // mana blue
  hero: '#c69a42',
  ally: '#6b9a5b',
  enemy: '#8f3026',
  earth: '#6a8a3a',
  water: '#3a6b9f',
  fire: '#b8532a',
  air: '#b5b7b0',
  light: '#dec77e',
  dark: '#533373',
  blood: '#7a2a3a',
  warn: '#cf8e3e',
  danger: '#a5342a',
  success: '#6b9a5b',
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
  sm: 4,
  md: 8,
  lg: 12,
} as const;

// Layout constants — cap content width on wide screens so the mobile-first
// layout doesn't smear across a desktop browser.
export const layout = {
  maxContentWidth: 560,
} as const;

// Fonts — serif for headers to evoke the carved runes / hand-inked labels
// of D2. Body stays in the system sans for readability on small screens.
const serif = Platform.select({
  web: 'Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif',
  default: 'serif',
});

export const fonts = {
  serif,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 0.2 },
  h3: { fontSize: 17, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 15, fontWeight: '700' as const, fontFamily: serif, letterSpacing: 0.5 },
} as const;

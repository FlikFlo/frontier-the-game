export const colors = {
  bg: '#0f0e13',
  bgElevated: '#1a1823',
  bgCard: '#232030',
  border: '#3a3548',
  text: '#e8e4d9',
  textMuted: '#8b8599',
  textDim: '#5e596e',
  accent: '#d4a14a', // amber/gold — fortress walls
  accentDark: '#8a6a30',
  hp: '#c0463e',
  ep: '#4a8dd4',
  hero: '#d4a14a',
  ally: '#6fb06f',
  enemy: '#c0463e',
  earth: '#5c8a3a',
  water: '#3a6b9f',
  fire: '#c5572a',
  air: '#bcbec6',
  light: '#e0d78a',
  dark: '#5e3a7a',
  blood: '#8a2a3a',
  warn: '#e0a64a',
  danger: '#c0463e',
  success: '#6fb06f',
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
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

// Lefrig Design System — Tokens compartidos
// Inspiración: desierto saharaui, amanecer, dignidad, comunidad

export const colors = {
  // Base desierto
  sand: {
    50: '#FDF8F3',
    100: '#FAF0E4',
    200: '#F2E0C8',
    300: '#E8CFA8',
    400: '#D4B483',
    500: '#C4A574',
    600: '#A68B5B',
    700: '#8B7349',
    800: '#6B5838',
    900: '#4A3D27',
  },
  // Blanco cálido
  warmWhite: '#FFFBF7',
  // Negro suave
  softBlack: '#1A1A1A',
  charcoal: '#2D2D2D',
  // Verde profundo (confianza, crecimiento)
  deepGreen: {
    50: '#E8F5EF',
    100: '#C5E6D5',
    200: '#9DD4B8',
    300: '#6BBF98',
    400: '#3DA876',
    500: '#1B5E4B',
    600: '#164D3E',
    700: '#123D32',
    800: '#0E2E26',
    900: '#0A1F1A',
  },
  // Rojo acento (urgencia, acción)
  accentRed: {
    50: '#FEF2F0',
    100: '#FCDDD8',
    200: '#F9BBB0',
    300: '#F08A78',
    400: '#E05A42',
    500: '#C45C26',
    600: '#A34A1F',
    700: '#823918',
    800: '#612811',
    900: '#40170A',
  },
  // Dorado/ámbar (highlights, premium)
  amber: {
    50: '#FFF8E7',
    100: '#FFEFC4',
    200: '#FFE099',
    300: '#FFD066',
    400: '#E8B84A',
    500: '#D4A017',
    600: '#B8860B',
    700: '#946B09',
    800: '#705007',
    900: '#4C3605',
  },
  // Estados
  success: '#2D6A4F',
  warning: '#E9C46A',
  error: '#C45C26',
  info: '#457B9D',
  // Neutros
  gray: {
    50: '#F9F7F5',
    100: '#F0EDE8',
    200: '#E0DBD3',
    300: '#C8C0B4',
    400: '#A89E90',
    500: '#8A8074',
    600: '#6B6358',
    700: '#4D4740',
    800: '#33302B',
    900: '#1F1D1A',
  },
} as const;

export const gradients = {
  dawn: 'linear-gradient(135deg, #FDF8F3 0%, #FFE099 50%, #1B5E4B 100%)',
  desert: 'linear-gradient(180deg, #FAF0E4 0%, #F2E0C8 100%)',
  hero: 'linear-gradient(135deg, #1B5E4B 0%, #164D3E 40%, #B8860B 100%)',
  card: 'linear-gradient(145deg, #FFFBF7 0%, #FAF0E4 100%)',
  action: 'linear-gradient(135deg, #1B5E4B 0%, #2D6A4F 100%)',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', 'Noto Sans Arabic', system-ui, sans-serif",
    arabic: "'Noto Sans Arabic', 'Inter', system-ui, sans-serif",
    display: "'Inter', 'Noto Sans Arabic', system-ui, sans-serif",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(26, 26, 26, 0.05)',
  md: '0 4px 12px rgba(26, 26, 26, 0.08)',
  lg: '0 8px 24px rgba(26, 26, 26, 0.12)',
  xl: '0 16px 48px rgba(26, 26, 26, 0.16)',
  glow: '0 0 24px rgba(27, 94, 75, 0.2)',
} as const;

export const touchTarget = {
  min: '48px',
  comfortable: '56px',
  large: '64px',
} as const;

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  radii,
  shadows,
  touchTarget,
} as const;

export type Theme = typeof theme;

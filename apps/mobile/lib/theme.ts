import type { FeatherIconName } from '@/components/AppIcon';

/** Perla Sahara — alineado con sovereign.css / home web */
export const theme = {
  canvas: '#faf8f4',
  canvasSoft: '#f3efe8',
  surface: '#ffffff',
  ink: '#1a1612',
  inkMuted: 'rgba(26,22,18,0.62)',
  inkSoft: 'rgba(26,22,18,0.42)',
  dune: '#a8842d',
  duneBright: '#c9a84c',
  oasis: '#2d8a62',
  oasisDeep: '#1f6b4a',
  pearl: '#faf8f4',
  flare: '#c45c3a',
  horizon: '#d4a04a',
  border: 'rgba(26,22,18,0.08)',
  borderStrong: 'rgba(26,22,18,0.14)',
  shadow: 'rgba(26,22,18,0.12)',
  scrim: 'rgba(10,8,6,0.55)',
  scrimDeep: 'rgba(8,6,4,0.72)',

  // Mirage legacy (pantallas secundarias)
  void: '#070b10',
  obsidian: '#0f1419',
  slate: '#161d27',
  slateLight: '#1e2836',
  cream: '#faf8f4',
  sand: '#f0e4d4',
  sandMuted: '#b8a690',
  gold: '#a8842d',
  goldBright: '#c9a84c',
  emerald: '#2d8a62',
  emeraldDeep: '#1f6b4a',
  terracotta: '#c45c3a',
  coral: '#e07a5f',
  text: '#1a1612',
  textMuted: 'rgba(26,22,18,0.62)',
  textDark: '#1a1612',
  textDarkMuted: 'rgba(26,22,18,0.52)',
  textOnDark: '#faf8f4',
  textOnDarkMuted: 'rgba(250,248,244,0.72)',
  glass: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(26,22,18,0.08)',

  warmWhite: '#faf8f4',
  softBlack: '#1a1612',
  sand100: '#f3efe8',
  sand200: '#e8dcc8',
  deepGreen: '#1f6b4a',
  deepGreenLight: '#2d8a62',
  amber: '#a8842d',
  accent: '#c45c3a',
  gray400: 'rgba(26,22,18,0.38)',
  gray500: '#8a8074',
  gray600: 'rgba(26,22,18,0.52)',

  // Tokens semánticos (hub / garage / badges)
  line: 'rgba(26,22,18,0.08)',
  stone: 'rgba(26,22,18,0.42)',
  success: '#2d8a62',
  successSoft: 'rgba(45,138,98,0.12)',
  warning: '#a8842d',
  warningSoft: 'rgba(168,132,45,0.14)',
  danger: '#c45c3a',
  dangerSoft: 'rgba(196,92,58,0.12)',
  info: '#0c4a6e',
  infoSoft: 'rgba(12,74,110,0.1)',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const gradients = {
  hero: ['#faf8f4', '#f3efe8'] as const,
  heroDark: ['#070b10', '#0f1419', '#161d27'] as const,
  gold: ['#7a5c1a', '#a8842d', '#c9a84c'] as const,
  oasis: ['#1f6b4a', '#2d8a62'] as const,
  buy: ['#1f6b4a', '#2d8a62'] as const,
  sell: ['#9a3412', '#c45c3a'] as const,
  transport: ['#0c4a6e', '#38bdf8'] as const,
  services: ['#134e4a', '#2dd4bf'] as const,
  jobs: ['#365314', '#84cc16'] as const,
};

export const actionStyles: Record<string, { gradient: readonly [string, string]; icon: FeatherIconName }> = {
  buy: { gradient: gradients.buy, icon: 'shopping-bag' },
  sell: { gradient: gradients.sell, icon: 'tag' },
  services: { gradient: gradients.services, icon: 'zap' },
  transport: { gradient: gradients.transport, icon: 'truck' },
  jobs: { gradient: gradients.jobs, icon: 'briefcase' },
};

export const CURATED_ITEMS = [
  { slug: 'mobiles', labelKey: 'curated.mobiles' },
  { slug: 'cars', labelKey: 'curated.cars' },
  { slug: 'cosmetics', labelKey: 'curated.cosmetics' },
  { slug: 'henna', labelKey: 'curated.henna' },
  { slug: 'agua-potable', labelKey: 'curated.aguaPotable' },
  { slug: 'solar', labelKey: 'curated.solar' },
  { slug: 'food', labelKey: 'curated.food' },
] as const;

export const TRUST_PILLS: { labelKey: string }[] = [
  { labelKey: 'trust.cash' },
  { labelKey: 'trust.community' },
];

export const QUICK_LINKS: { icon: FeatherIconName; labelKey: string; href: string }[] = [
  { icon: 'package', labelKey: 'nav.orders', href: '/orders' },
  { icon: 'tag', labelKey: 'me.modules.sales', href: '/marketplace/mine' },
  { icon: 'heart', labelKey: 'nav.favorites', href: '/favorites' },
  { icon: 'users', labelKey: 'nav.community', href: '/community' },
  { icon: 'message-circle', labelKey: 'nav.messages', href: '/messages' },
  { icon: 'bell', labelKey: 'nav.notifications', href: '/notifications' },
  { icon: 'dollar-sign', labelKey: 'profile.links.cashPin', href: '/cash' },
];

import { StyleSheet, TextStyle } from 'react-native';
import { theme, radii } from './theme';

/** Tipografía Perla Sahara — Fraunces display + DM Sans body (cargadas en _layout). */
export const fonts = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
};

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const type = StyleSheet.create({
  display: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -0.6,
    color: theme.ink,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.ink,
  },
  subtitle: {
    fontFamily: fonts.bodyMed,
    fontSize: 15,
    lineHeight: 22,
    color: theme.inkMuted,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.ink,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    color: theme.inkSoft,
  },
  caption: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: theme.inkMuted,
  },
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  pad: {
    paddingHorizontal: space.lg,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.surface,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
  },
  chipOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: theme.inkMuted,
  },
  chipTextOn: {
    color: theme.dune,
  },
});

export function fontOrSystem(name: string): TextStyle['fontFamily'] {
  return name;
}

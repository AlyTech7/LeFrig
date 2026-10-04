import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { WithSpringConfig } from 'react-native-reanimated';

/** Springs iOS-first: respuesta rápida, asentamiento suave. */
export const springs = {
  snappy: { damping: 18, stiffness: 420, mass: 0.7 } satisfies WithSpringConfig,
  soft: { damping: 20, stiffness: 180, mass: 0.85 } satisfies WithSpringConfig,
  settle: { damping: 22, stiffness: 260, mass: 0.8 } satisfies WithSpringConfig,
};

export const pressScale = {
  default: 0.97,
  chip: 0.96,
  fab: 0.94,
  card: 0.985,
} as const;

export type HapticKind = 'light' | 'medium' | 'selection' | 'none';

export async function haptic(kind: HapticKind = 'light') {
  if (kind === 'none' || Platform.OS === 'web') return;
  try {
    if (kind === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    await Haptics.impactAsync(
      kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // Expo Go / simulador sin hápticos
  }
}

/** Elevación suave tipo iOS (sombra real en iOS, elevation en Android). */
export const elevation = {
  bar: Platform.select({
    ios: {
      shadowColor: 'rgba(26,22,18,0.18)',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 1,
      shadowRadius: 18,
    },
    default: { elevation: 14 },
  }),
  card: Platform.select({
    ios: {
      shadowColor: 'rgba(26,22,18,0.14)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    default: { elevation: 4 },
  }),
  fab: Platform.select({
    ios: {
      shadowColor: 'rgba(168,132,45,0.45)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 14,
    },
    default: { elevation: 10 },
  }),
} as const;

import { Alert, Platform } from 'react-native';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export type BiometricKind = 'face-recognition' | 'fingerprint' | null | undefined;

export function biometricMethodLabel(kind: BiometricKind, t: Translate): string {
  if (kind === 'fingerprint') return t('auth.biometricsFingerprint');
  return t('auth.biometricsFace');
}

export function canUseDeviceBiometrics(kind: BiometricKind): boolean {
  return Platform.OS !== 'web' && Boolean(kind);
}

/** Pregunta si guardar Face ID / huella. Nunca guarda sin consentimiento. */
export function offerBiometricEnrollment(
  t: Translate,
  method: string,
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  return new Promise((resolve) => {
    Alert.alert(
      t('auth.biometricsOfferTitle', { method }),
      t('auth.biometricsOfferBody', { method }),
      [
        {
          text: t('auth.biometricsOfferNo'),
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: t('auth.biometricsOfferYes'),
          onPress: () => resolve(true),
        },
      ],
    );
  });
}

export async function enrollLocalBiometrics(options: {
  t: Translate;
  biometricType: BiometricKind;
  identifier: string;
  password: string;
  setCredentials: (params: { identifier: string; password: string }) => Promise<void>;
}): Promise<void> {
  const { t, biometricType, identifier, password, setCredentials } = options;
  if (!canUseDeviceBiometrics(biometricType) || password.length < 8) return;
  const method = biometricMethodLabel(biometricType, t);
  const accepted = await offerBiometricEnrollment(t, method);
  if (!accepted) return;
  try {
    await setCredentials({ identifier: identifier.trim().toLowerCase(), password });
  } catch {
    Alert.alert(t('common.error'), t('auth.errors.biometricsEnrollFailed'));
  }
}

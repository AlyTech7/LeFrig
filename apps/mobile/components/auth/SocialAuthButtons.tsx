import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  SOCIAL_PROVIDERS,
  defaultAuthProviders,
  useSocialAuth,
  type SocialProviderId,
} from '@/lib/social-auth';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Variant = 'hero' | 'perla';

type Props = {
  variant?: Variant;
  disabled?: boolean;
  /** Defaults: Apple+Google on iOS, Google elsewhere (App Store 4.8). */
  providers?: SocialProviderId[];
  onError?: (message: string) => void;
};

function ProviderGlyph({ id }: { id: SocialProviderId }) {
  if (id === 'google') {
    return (
      <View style={styles.googleMark}>
        <GoogleLogo size={20} />
      </View>
    );
  }
  if (id === 'facebook') {
    return (
      <View style={styles.facebookMark}>
        <Text style={styles.facebookF}>f</Text>
      </View>
    );
  }
  return (
    <View style={styles.appleMark}>
      <FontAwesome name="apple" size={20} color="#fff" />
    </View>
  );
}

export function SocialAuthButtons({
  variant = 'perla',
  disabled = false,
  providers,
  onError,
}: Props) {
  const { signInWith, loadingProvider, isExpoGoClient } = useSocialAuth();
  const t = useT();
  const [localError, setLocalError] = useState('');

  const isHero = variant === 'hero';
  const busy = disabled || loadingProvider !== null;
  const selected = providers?.length ? providers : defaultAuthProviders();
  const visibleProviders = SOCIAL_PROVIDERS.filter((p) => selected.includes(p.id));

  const handlePress = async (provider: (typeof SOCIAL_PROVIDERS)[number]) => {
    setLocalError('');
    const result = await signInWith(provider);
    if (!result.ok) {
      // Evitar duplicar el mismo mensaje (padre + local)
      if (onError) onError(result.error);
      else setLocalError(result.error);
    }
  };

  return (
    <View style={styles.wrap}>
      {visibleProviders.map((provider) => {
        const loading = loadingProvider === provider.id;
        return (
          <Pressable
            key={provider.id}
            style={[
              styles.btn,
              isHero ? styles.btnHero : styles.btnPerla,
              provider.id === 'google' && styles.btnGoogle,
              provider.id === 'facebook' && styles.btnFacebook,
              provider.id === 'apple' && styles.btnApple,
              busy && !loading && styles.btnDisabled,
            ]}
            onPress={() => handlePress(provider)}
            disabled={busy}
          >
            {loading ? (
              <ActivityIndicator color={provider.id === 'apple' || provider.id === 'facebook' ? theme.pearl : theme.ink} />
            ) : (
              <>
                <ProviderGlyph id={provider.id} />
                <Text
                  style={[
                    styles.btnText,
                    isHero ? styles.btnTextHero : styles.btnTextPerla,
                    provider.id === 'google' && styles.btnTextGoogle,
                    provider.id === 'facebook' && styles.btnTextLight,
                    provider.id === 'apple' && styles.btnTextLight,
                  ]}
                >
                  {t('auth.continueWith', { provider: provider.label })}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
      {isExpoGoClient ? (
        <Text style={styles.hint}>
          En Expo Go usa email. Google/Apple requieren un build instalable (EAS).
        </Text>
      ) : null}
      {localError ? <Text style={styles.error}>{localError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  btnHero: {
    backgroundColor: theme.glass,
    borderColor: theme.glassBorder,
  },
  btnPerla: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  btnGoogle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
  },
  btnFacebook: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  btnApple: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { fontSize: 16, fontWeight: '700' },
  btnTextHero: { color: theme.text },
  btnTextPerla: { color: theme.ink },
  btnTextGoogle: { color: '#1F1F1F' },
  btnTextLight: { color: theme.pearl },
  googleMark: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookF: { fontSize: 16, fontWeight: '800', color: '#1877F2', marginTop: -1 },
  appleMark: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: theme.flare,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
  },
  hint: {
    color: theme.inkMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});

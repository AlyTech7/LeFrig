import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { API_URL } from '@/lib/api';

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSendCode = async () => {
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    if (!isLoaded || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    const emailAddress = email.trim().toLowerCase();

    try {
      await signUp.create({ emailAddress });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setEmail(emailAddress);
      setPendingVerification(true);
    } catch {
      setError(t('auth.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (code.trim().length < 6) {
      setError(t('auth.errors.wrongCode'));
      return;
    }
    if (!isLoaded || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId! });
        const token = await getToken();
        if (token) {
          try {
            await fetch(`${API_URL}/auth/sync`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch {
            /* offline */
          }
        }
        router.replace('/');
      }
    } catch {
      setError(t('auth.errors.wrongCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoMark}>
            <Text style={styles.brandGlyph}>ⵣ</Text>
          </View>
          <Text style={styles.brand}>LEFRIG</Text>
          <Text style={styles.title}>{t('auth.signUpTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.signUpSubtitle')}</Text>

          {!pendingVerification ? (
            <>
              <View style={styles.inputWrap}>
                <AppIcon name="mail" size={18} color={theme.dune} />
                <TextInput
                  style={styles.inputInner}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={theme.inkSoft}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </View>
              <Pressable style={styles.btnPrimary} onPress={onSendCode} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={theme.pearl} />
                ) : (
                  <Text style={styles.btnPrimaryText}>{t('auth.sendEmailCode')}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.codeHint}>{t('auth.codeSent', { email })}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder={t('auth.codePlaceholder')}
                placeholderTextColor={theme.inkSoft}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Pressable style={styles.btnPrimary} onPress={onVerify} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={theme.pearl} />
                ) : (
                  <Text style={styles.btnPrimaryText}>{t('auth.verify')}</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setPendingVerification(false)}>
                <Text style={styles.switchLink}>{t('auth.changeEmail')}</Text>
              </Pressable>
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <SocialAuthButtons variant="perla" providers={['google']} disabled={loading} onError={setError} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => router.replace('/sign-in')}>
            <Text style={styles.switchLink}>{t('auth.hasAccount')}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/legal/index' as never)}>
            <Text style={styles.footer}>{t('auth.termsPrivacy')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.canvas },
  scroll: { flexGrow: 1, padding: 28, justifyContent: 'center', minHeight: '100%' },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(168,132,45,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  brandGlyph: { fontSize: 32, color: theme.dune },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.dune,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 32, fontWeight: '800', color: theme.ink, letterSpacing: -1, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.inkMuted, marginTop: 8, marginBottom: 32, textAlign: 'center' },
  codeHint: { color: theme.inkMuted, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputInner: { flex: 1, paddingVertical: 18, fontSize: 17, color: theme.ink },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    padding: 18,
    fontSize: 17,
    color: theme.ink,
    marginBottom: 16,
  },
  codeInput: { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: '700' },
  btnPrimary: {
    backgroundColor: theme.oasisDeep,
    borderRadius: radii.md,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnPrimaryText: { fontSize: 17, fontWeight: '800', color: theme.pearl },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { color: theme.inkMuted, fontSize: 13 },
  error: { color: theme.flare, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  switchLink: { color: theme.dune, textAlign: 'center', marginTop: 20, fontWeight: '700' },
  footer: { textAlign: 'center', color: theme.inkMuted, marginTop: 32, fontSize: 13 },
});

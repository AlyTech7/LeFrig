import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
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
import { theme, gradients } from '@/lib/theme';
import { API_URL } from '@/lib/api';

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncToApi = async (token: string) => {
    try {
      await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* offline */
    }
  };

  const onSendCode = async () => {
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    if (!isLoaded || !signIn) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    const identifier = email.trim().toLowerCase();

    try {
      await signIn.create({ identifier });
      const emailFactor = signIn.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (emailFactor && 'emailAddressId' in emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        setEmail(identifier);
        setPendingVerification(true);
      } else {
        setError(t('auth.errors.clerkEmail'));
      }
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
    if (!isLoaded || !signIn) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        const token = await getToken();
        if (token) await syncToApi(token);
        router.replace('/');
      }
    } catch {
      setError(t('auth.errors.wrongCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoMark}>
              <Text style={styles.brandGlyph}>ⵣ</Text>
            </View>
            <Text style={styles.brand}>LEFRIG</Text>
            <Text style={styles.title}>{t('auth.welcome')}</Text>
            <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

            {!pendingVerification ? (
              <>
                <View style={styles.inputWrap}>
                  <AppIcon name="mail" size={18} color={theme.gold} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={theme.textMuted}
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
                    <ActivityIndicator color={theme.obsidian} />
                  ) : (
                    <>
                      <AppIcon name="mail" size={18} color={theme.obsidian} />
                      <Text style={styles.btnPrimaryText}>{t('auth.sendEmailCode')}</Text>
                    </>
                  )}
                </Pressable>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('common.or')}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialAuthButtons variant="hero" providers={['google']} disabled={loading} onError={setError} />
              </>
            ) : (
              <>
                <View style={styles.codeHeader}>
                  <AppIcon name="lock" size={20} color={theme.gold} />
                  <Text style={styles.codeHint}>{t('auth.codeSent', { email })}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder={t('auth.codePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Pressable style={styles.btnPrimary} onPress={onVerify} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.obsidian} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t('auth.verify')}</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setPendingVerification(false)}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </>
            )}

            {error ? (
              <View style={styles.errorWrap}>
                <AppIcon name="alert-circle" size={16} color={theme.terracotta} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.footer}>{t('auth.footerTagline')}</Text>
            <Pressable onPress={() => router.replace('/sign-up')}>
              <Text style={styles.switchLink}>{t('auth.noAccount')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/legal/index' as never)}>
              <Text style={styles.legalLink}>{t('auth.legalLink')}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 28, justifyContent: 'center', minHeight: '100%' },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(232,184,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  brandGlyph: { fontSize: 32, color: theme.gold },
  brand: { fontSize: 14, fontWeight: '800', color: theme.gold, letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: theme.text, letterSpacing: -1, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.textMuted, marginTop: 8, marginBottom: 32, textAlign: 'center' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputInner: { flex: 1, paddingVertical: 18, fontSize: 17, color: theme.text },
  input: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    color: theme.text,
    marginBottom: 16,
  },
  codeInput: { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: '700' },
  codeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  codeHint: { color: theme.textMuted, fontSize: 14 },
  btnPrimary: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.gold,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnPrimaryText: { fontSize: 17, fontWeight: '800', color: theme.obsidian },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.glassBorder },
  dividerText: { color: theme.textMuted, fontSize: 13 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  error: { color: theme.terracotta, fontWeight: '600' },
  backLink: { color: theme.gold, textAlign: 'center', marginTop: 20, fontWeight: '600' },
  footer: { textAlign: 'center', color: theme.textMuted, marginTop: 48, fontSize: 13 },
  switchLink: { color: theme.gold, textAlign: 'center', marginTop: 16, fontWeight: '700', fontSize: 15 },
  legalLink: { color: theme.textMuted, textAlign: 'center', marginTop: 12, fontSize: 13, textDecorationLine: 'underline' },
});

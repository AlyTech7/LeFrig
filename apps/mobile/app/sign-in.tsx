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
import { formatPhone } from '@/lib/formatPhone';
import { setLegacySession } from '@/lib/legacySession';

const DEV_OTP = __DEV__;

function phoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

function isValidPhone(input: string): boolean {
  const digits = phoneDigits(input);
  return digits.length >= 8 && digits.length <= 15;
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useT();
  const [phone, setPhone] = useState('');
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
    if (!isValidPhone(phone)) {
      setError(t('auth.errors.phoneRequired'));
      return;
    }
    setLoading(true);
    setError('');
    const formatted = formatPhone(phone);

    try {
      if (DEV_OTP) {
        const res = await fetch(`${API_URL}/auth/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formatted }),
        });
        if (!res.ok) throw new Error('otp request failed');
        setPhone(formatted);
        setPendingVerification(true);
        return;
      }

      if (!isLoaded || !signIn) {
        setError(t('auth.errors.authLoading'));
        return;
      }
      await signIn.create({ identifier: formatted });
      const phoneFactor = signIn.supportedFirstFactors?.find((f) => f.strategy === 'phone_code');
      if (phoneFactor && 'phoneNumberId' in phoneFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneFactor.phoneNumberId,
        });
        setPhone(formatted);
        setPendingVerification(true);
      } else {
        setError(t('auth.errors.clerkPhone'));
      }
    } catch {
      setError(t('auth.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (code.trim().length < 6) {
      setError('Introduce el código de 6 dígitos.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (DEV_OTP) {
        const res = await fetch(`${API_URL}/auth/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: code.trim() }),
        });
        if (!res.ok) throw new Error('invalid code');
        const data = (await res.json()) as {
          accessToken: string;
          user: { id: string; phone: string | null; roles: string[]; campId?: string | null };
        };
        await setLegacySession(data.accessToken, data.user);
        router.replace('/');
        return;
      }

      if (!isLoaded || !signIn) {
        setError(t('auth.errors.authLoading'));
        return;
      }
      const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
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
                  <AppIcon name="phone" size={18} color={theme.gold} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor={theme.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
                {DEV_OTP ? (
                  <Text style={styles.devHint}>{t('auth.devHint')}</Text>
                ) : null}
                <Pressable style={styles.btnPrimary} onPress={onSendCode} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.obsidian} />
                  ) : (
                    <>
                      <AppIcon name="message-circle" size={18} color={theme.obsidian} />
                      <Text style={styles.btnPrimaryText}>{t('auth.sendSms')}</Text>
                    </>
                  )}
                </Pressable>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('common.or')}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialAuthButtons variant="hero" disabled={loading} onError={setError} />
              </>
            ) : (
              <>
                <View style={styles.codeHeader}>
                  <AppIcon name="lock" size={20} color={theme.gold} />
                  <Text style={styles.codeHint}>{t('auth.codeSent', { phone })}</Text>
                </View>
                {DEV_OTP ? <Text style={styles.devHint}>Usa 123456 en desarrollo</Text> : null}
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
                  <Text style={styles.backLink}>{t('auth.changeNumber')}</Text>
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
  devHint: {
    fontSize: 13,
    color: theme.gold,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
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

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

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useT();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      if (!isLoaded || !signUp) {
        setError(t('auth.errors.authLoading'));
        return;
      }
      await signUp.create({ phoneNumber: formatted });
      await signUp.preparePhoneNumberVerification();
      setPhone(formatted);
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

      if (!isLoaded || !signUp) {
        setError(t('auth.errors.authLoading'));
        return;
      }
      const result = await signUp.attemptPhoneNumberVerification({ code: code.trim() });
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
                <AppIcon name="phone" size={18} color={theme.dune} />
                <TextInput
                  style={styles.inputInner}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor={theme.inkSoft}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Pressable style={styles.btnPrimary} onPress={onSendCode} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={theme.pearl} />
                ) : (
                  <Text style={styles.btnPrimaryText}>{t('auth.sendSms')}</Text>
                )}
              </Pressable>
              {DEV_OTP ? (
                <Text style={styles.devHint}>{t('auth.devHint')}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.codeHint}>{t('auth.codeSent', { phone })}</Text>
              {DEV_OTP ? <Text style={styles.devHint}>{t('auth.devCode')}</Text> : null}
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
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <SocialAuthButtons variant="perla" disabled={loading} onError={setError} />

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
  devHint: {
    fontSize: 13,
    color: theme.dune,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
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

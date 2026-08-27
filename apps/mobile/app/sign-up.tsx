import { useSignIn, useSignUp, useAuth, useClerk } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { ClerkCaptcha } from '@/components/auth/ClerkCaptcha';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { defaultAuthProviders } from '@/lib/social-auth';
import { LefrigMark } from '@/components/LefrigMark';
import { finalizeSignUpAfterEmail, splitDisplayName } from '@/lib/auth-complete';
import { getClerkErrorMessage, isIdentifierExists, isIdentifierNotFound } from '@/lib/clerk-errors';
import { useT } from '@/lib/locale';
import { theme, gradients, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { API_URL } from '@/lib/api';

const RESEND_SECONDS = 30;

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

function digitsOnly(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

type Step = 'email' | 'details' | 'code' | 'password';

export default function SignUpScreen() {
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useT();
  const isLoaded = signUpLoaded && signInLoaded;

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const syncToApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* offline */
    }
  };

  const finishSession = async (sessionId: string) => {
    await setActive({ session: sessionId });
    await syncToApi();
    router.replace('/');
  };

  const resetToEmail = () => {
    setStep('email');
    setCode('');
    setFullName('');
    setPassword('');
    setPassword2('');
    setShowPassword(false);
    setError('');
    setResendIn(0);
  };

  const goSignIn = (emailAddress: string) => {
    setError(t('auth.errors.alreadyRegistered'));
    router.replace({ pathname: '/sign-in', params: { email: emailAddress } });
  };

  const startCodeCooldown = () => setResendIn(RESEND_SECONDS);

  const onContinue = async () => {
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
    setEmail(emailAddress);

    try {
      if (signIn) {
        try {
          await signIn.create({ identifier: emailAddress });
          goSignIn(emailAddress);
          return;
        } catch (probeErr) {
          if (isIdentifierExists(probeErr)) {
            goSignIn(emailAddress);
            return;
          }
          if (!isIdentifierNotFound(probeErr)) {
            // Probe falló por otra razón: intentamos registro
          }
        }
      }

      // Cuenta nueva: primero nombre + contraseña (Play / UX clara), luego código.
      setStep('details');
    } catch (err) {
      if (isIdentifierExists(err)) {
        goSignIn(emailAddress);
      } else {
        setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const onCreateWithPassword = async () => {
    if (fullName.trim().length < 2) {
      setError(t('auth.errors.nameRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }
    if (password !== password2) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    if (!isLoaded || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { firstName, lastName } = splitDisplayName(fullName);
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: firstName || undefined,
        lastName,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      startCodeCooldown();
      setStep('code');
    } catch (err) {
      if (isIdentifierExists(err)) {
        goSignIn(email.trim().toLowerCase());
      } else {
        setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendIn > 0 || !signUp || loading) return;
    setLoading(true);
    setError('');
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      startCodeCooldown();
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
    } finally {
      setLoading(false);
    }
  };

  const completeWithOptionalPassword = async (
    pwd?: string,
    resource?: NonNullable<typeof signUp>,
    name?: string,
  ) => {
    const target = resource ?? signUp;
    if (!target) return;
    const { firstName, lastName } = splitDisplayName(name ?? fullName);
    const finalized = await finalizeSignUpAfterEmail(target, {
      password: pwd,
      firstName: firstName || undefined,
      lastName,
    });
    if (finalized.ok) {
      await finishSession(finalized.sessionId);
      return;
    }
    if ('needPassword' in finalized && finalized.needPassword) {
      setStep('password');
      setError('');
      return;
    }
    setError('error' in finalized ? finalized.error : t('auth.errors.wrongCode'));
  };

  const onVerify = async (rawCode?: string) => {
    const digits = digitsOnly(rawCode ?? code);
    if (digits.length < 6) {
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
      const attempt = await signUp.attemptEmailAddressVerification({ code: digits });
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await finishSession(attempt.createdSessionId);
        return;
      }
      await completeWithOptionalPassword(password || undefined, attempt, fullName);
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.wrongCode')));
    } finally {
      setLoading(false);
    }
  };

  const onSetPassword = async () => {
    if (fullName.trim().length < 2) {
      setError(t('auth.errors.nameRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }
    if (password !== password2) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    if (!isLoaded || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeWithOptionalPassword(password, undefined, fullName);
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.passwordSaveFailed')));
    } finally {
      setLoading(false);
    }
  };

  const onChangeCode = (value: string) => {
    const next = digitsOnly(value);
    setCode(next);
    if (next.length === 6 && !loading) {
      void onVerify(next);
    }
  };

  const title =
    step === 'password' || step === 'details'
      ? t('auth.signUpTitle')
      : step === 'code'
        ? t('auth.verify')
        : t('auth.signUpTitle');

  const subtitle =
    step === 'details'
      ? t('auth.signupFormSubtitle')
      : step === 'password'
        ? t('auth.passwordStepSubtitle')
        : step === 'code'
          ? t('auth.codeStepSubtitle')
          : t('auth.signUpSubtitle');

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoMark}>
              <LefrigMark size={64} />
            </View>
            <Text style={styles.brand}>LEFRIG</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {step === 'email' ? (
              <>
                <View style={styles.inputWrap}>
                  <AppIcon name="mail" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!loading}
                    onSubmitEditing={() => void onContinue()}
                  />
                </View>
                <ClerkCaptcha />
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onContinue()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <>
                      <AppIcon name="arrow-right" size={18} color={theme.pearl} />
                      <Text style={styles.btnPrimaryText}>{t('common.continue')}</Text>
                    </>
                  )}
                </Pressable>
                <Text style={styles.helper}>{t('auth.emailHelper')}</Text>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('common.or')}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialAuthButtons
                  variant="hero"
                  providers={defaultAuthProviders()}
                  disabled={loading}
                  onError={setError}
                />
              </>
            ) : null}

            {step === 'details' ? (
              <>
                <Text style={styles.passwordEmail}>{email}</Text>
                <View style={styles.inputWrap}>
                  <AppIcon name="user" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <AppIcon name="lock" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!loading}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    hitSlop={10}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.inkMuted} />
                  </Pressable>
                </View>
                <View style={styles.inputWrap}>
                  <AppIcon name="lock" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={password2}
                    onChangeText={setPassword2}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!loading}
                    onSubmitEditing={() => void onCreateWithPassword()}
                  />
                </View>
                <Text style={styles.helper}>{t('auth.passwordRules')}</Text>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onCreateWithPassword()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t('auth.createAccount')}</Text>
                  )}
                </Pressable>
                <Pressable onPress={resetToEmail} disabled={loading}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </>
            ) : null}

            {step === 'code' ? (
              <>
                <View style={styles.codeHeader}>
                  <AppIcon name="lock" size={20} color={theme.dune} />
                  <Text style={styles.codeHint}>{t('auth.codeSent', { email })}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={theme.inkMuted}
                  value={code}
                  onChangeText={onChangeCode}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={6}
                  editable={!loading}
                  onSubmitEditing={() => void onVerify()}
                />
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onVerify()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t('auth.verify')}</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => void onResend()} disabled={loading || resendIn > 0}>
                  <Text style={[styles.backLink, resendIn > 0 && styles.backLinkMuted]}>
                    {resendIn > 0 ? t('auth.resendIn', { s: resendIn }) : t('auth.resendCode')}
                  </Text>
                </Pressable>
                <Pressable onPress={resetToEmail} disabled={loading}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </>
            ) : null}

            {step === 'password' ? (
              <>
                <Text style={styles.passwordEmail}>{email}</Text>
                <Text style={styles.passwordHint}>{t('auth.passwordVerifiedHint')}</Text>
                <View style={styles.inputWrap}>
                  <AppIcon name="user" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <AppIcon name="lock" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!loading}
                  />
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.inkMuted} />
                  </Pressable>
                </View>
                <View style={styles.inputWrap}>
                  <AppIcon name="lock" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.inkMuted}
                    value={password2}
                    onChangeText={setPassword2}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!loading}
                    onSubmitEditing={() => void onSetPassword()}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onSetPassword()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t('auth.createAccount')}</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {error ? (
              <View style={styles.errorWrap}>
                <AppIcon name="alert-circle" size={16} color={theme.terracotta} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.footer}>{t('auth.footerTagline')}</Text>
            <Pressable onPress={() => router.replace('/sign-in')}>
              <Text style={styles.switchLink}>{t('auth.hasAccount')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/legal' as never)}>
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
  scroll: { flexGrow: 1, padding: space.xl, justifyContent: 'center', minHeight: '100%' },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#08090c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
    shadowColor: '#08090c',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  brand: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.dune,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: theme.ink,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.inkMuted,
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    borderRadius: radii.md,
    padding: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
    marginBottom: 16,
  },
  codeInput: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    letterSpacing: 8,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  codeHint: { fontFamily: fonts.body, color: theme.inkMuted, fontSize: 14, flexShrink: 1 },
  passwordEmail: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  btnPrimary: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.dune,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.pearl,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.borderStrong },
  dividerText: { fontFamily: fonts.body, color: theme.inkMuted, fontSize: 13 },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  error: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    color: theme.terracotta,
    textAlign: 'center',
  },
  backLink: {
    fontFamily: fonts.bodySemi,
    color: theme.dune,
    textAlign: 'center',
    marginTop: 12,
  },
  backLinkMuted: { color: theme.inkMuted },
  footer: {
    fontFamily: fonts.body,
    textAlign: 'center',
    color: theme.inkMuted,
    marginTop: 40,
    fontSize: 13,
  },
  switchLink: {
    fontFamily: fonts.bodyBold,
    color: theme.dune,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
  },
  legalLink: {
    fontFamily: fonts.body,
    color: theme.inkMuted,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

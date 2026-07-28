import { useSignIn, useSignUp, useAuth, useClerk } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { finalizeSignUpAfterEmail, splitDisplayName } from '@/lib/auth-complete';
import {
  getClerkErrorMessage,
  isIdentifierNotFound,
} from '@/lib/clerk-errors';
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

type Step = 'email' | 'code' | 'password';
type AuthMode = 'signin' | 'signup';

export default function SignInScreen() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { setActive } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const t = useT();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<Step>('email');
  const [hasEmailCode, setHasEmailCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isLoaded = signInLoaded && signUpLoaded;

  useEffect(() => {
    const prefill = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
    if (prefill && isValidEmail(prefill)) {
      setEmail(prefill);
    }
  }, [params.email]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const startCodeCooldown = () => setResendIn(RESEND_SECONDS);
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
    setError('');
    setHasEmailCode(false);
    setMode('signin');
    setResendIn(0);
  };

  /** Intenta login; si el email no existe, inicia registro por código. */
  const onContinue = async () => {
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    if (!isLoaded || !signIn || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    const identifier = email.trim().toLowerCase();
    setEmail(identifier);

    try {
      const attempt = await signIn.create({ identifier });
      const factors = attempt.supportedFirstFactors ?? [];
      const emailFactor = factors.find((f) => f.strategy === 'email_code');
      const passwordFactor = factors.find((f) => f.strategy === 'password');
      const oauthGoogle = factors.some((f) => f.strategy === 'oauth_google');

      setMode('signin');
      setHasEmailCode(Boolean(emailFactor && 'emailAddressId' in emailFactor));

      // Preferir código solo si Clerk puede prepararlo; si falla (p. ej. cuenta Google),
      // caemos a contraseña u OAuth.
      if (emailFactor && 'emailAddressId' in emailFactor) {
        try {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          startCodeCooldown();
          setStep('code');
          return;
        } catch {
          setHasEmailCode(false);
        }
      }

      if (passwordFactor) {
        setStep('password');
        setError(t('auth.errors.usePassword'));
        return;
      }

      if (oauthGoogle) {
        setError(t('auth.errors.useGoogle'));
        return;
      }

      setError(t('auth.errors.clerkEmail'));
    } catch (err) {
      if (isIdentifierNotFound(err)) {
        try {
          await signUp.create({ emailAddress: identifier });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setMode('signup');
          setHasEmailCode(true);
          startCodeCooldown();
          setStep('code');
        } catch (signUpErr) {
          setError(getClerkErrorMessage(signUpErr, t('auth.errors.sendFailed')));
        }
      } else {
        setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async (rawCode?: string) => {
    const digits = digitsOnly(rawCode ?? code);
    if (digits.length < 6) {
      setError(t('auth.errors.wrongCode'));
      return;
    }
    if (!isLoaded || !signIn || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const attempt = await signUp.attemptEmailAddressVerification({ code: digits });
        if (attempt.status === 'complete' && attempt.createdSessionId) {
          await finishSession(attempt.createdSessionId);
          return;
        }
        const finalized = await finalizeSignUpAfterEmail(attempt);
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
        return;
      }

      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: digits });
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId);
        return;
      }

      const firstPassword = result.supportedFirstFactors?.some((f) => f.strategy === 'password');
      if (result.status === 'needs_first_factor' && firstPassword) {
        setStep('password');
        setError(t('auth.errors.usePassword'));
        return;
      }

      if (result.status === 'needs_second_factor') {
        setError(t('auth.errors.useGoogle'));
        return;
      }

      setError(t('auth.errors.incomplete'));
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.wrongCode')));
    } finally {
      setLoading(false);
    }
  };

  const onPassword = async () => {
    if (mode === 'signup') {
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
    } else if (!password) {
      setError(t('auth.errors.usePassword'));
      return;
    }
    if (!isLoaded || !signIn || !signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const { firstName, lastName } = splitDisplayName(fullName);
        const finalized = await finalizeSignUpAfterEmail(signUp, {
          password,
          firstName,
          lastName,
        });
        if (finalized.ok) {
          await finishSession(finalized.sessionId);
          return;
        }
        setError('error' in finalized ? finalized.error : t('auth.errors.incomplete'));
        return;
      }

      const result = await signIn.attemptFirstFactor({ strategy: 'password', password });
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId);
        return;
      }

      setError(t('auth.errors.incomplete'));
    } catch (err) {
      setError(
        getClerkErrorMessage(
          err,
          mode === 'signup' ? t('auth.errors.passwordSaveFailed') : t('auth.errors.wrongPassword'),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendIn > 0 || loading || !isLoaded) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        if (!signUp) return;
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else {
        if (!signIn) return;
        const attempt = await signIn.create({ identifier: email });
        const emailFactor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
        if (!emailFactor || !('emailAddressId' in emailFactor)) {
          setError(t('auth.errors.clerkEmail'));
          return;
        }
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
      }
      startCodeCooldown();
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
    } finally {
      setLoading(false);
    }
  };

  const onChangeCode = (value: string) => {
    const next = digitsOnly(value);
    setCode(next);
    if (next.length === 6 && !loading) {
      void onVerifyCode(next);
    }
  };

  const title =
    step === 'password'
      ? mode === 'signup'
        ? t('auth.signUpTitle')
        : t('auth.welcomeBack')
      : step === 'code'
        ? t('auth.verify')
        : mode === 'signup'
          ? t('auth.signUpTitle')
          : t('auth.welcomeBack');

  const subtitle =
    step === 'password'
      ? mode === 'signup'
        ? t('auth.passwordStepSubtitle')
        : t('auth.errors.usePassword')
      : step === 'code'
        ? t('auth.codeStepSubtitle')
        : mode === 'signup'
          ? t('auth.signUpSubtitle')
          : t('auth.subtitle');

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoMark}>
              <Text style={styles.brandGlyph}>ⵣ</Text>
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
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('common.or')}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialAuthButtons variant="hero" providers={['google']} disabled={loading} onError={setError} />
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
                  onSubmitEditing={() => void onVerifyCode()}
                />
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onVerifyCode()}
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
                {mode === 'signup' ? (
                  <Text style={styles.passwordHint}>{t('auth.passwordVerifiedHint')}</Text>
                ) : null}
                {mode === 'signup' ? (
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
                ) : null}
                <View style={styles.inputWrap}>
                  <AppIcon name="lock" size={18} color={theme.dune} />
                  <TextInput
                    style={styles.inputInner}
                    placeholder={
                      mode === 'signup' ? t('auth.newPasswordPlaceholder') : t('auth.passwordPlaceholder')
                    }
                    placeholderTextColor={theme.inkMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                    editable={!loading}
                    onSubmitEditing={() => {
                      if (mode !== 'signup') void onPassword();
                    }}
                  />
                </View>
                {mode === 'signup' ? (
                  <View style={styles.inputWrap}>
                    <AppIcon name="lock" size={18} color={theme.dune} />
                    <TextInput
                      style={styles.inputInner}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      placeholderTextColor={theme.inkMuted}
                      value={password2}
                      onChangeText={setPassword2}
                      secureTextEntry
                      autoComplete="new-password"
                      editable={!loading}
                      onSubmitEditing={() => void onPassword()}
                    />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onPassword()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {mode === 'signup' ? t('auth.createAccount') : t('auth.continueWithPassword')}
                    </Text>
                  )}
                </Pressable>
                {hasEmailCode && mode === 'signin' ? (
                  <Pressable
                    onPress={() => {
                      setPassword('');
                      setError('');
                      void (async () => {
                        setLoading(true);
                        try {
                          if (!signIn) return;
                          const attempt = await signIn.create({ identifier: email });
                          const emailFactor = attempt.supportedFirstFactors?.find(
                            (f) => f.strategy === 'email_code',
                          );
                          if (emailFactor && 'emailAddressId' in emailFactor) {
                            await signIn.prepareFirstFactor({
                              strategy: 'email_code',
                              emailAddressId: emailFactor.emailAddressId,
                            });
                            startCodeCooldown();
                            setStep('code');
                          }
                        } catch (err) {
                          setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
                        } finally {
                          setLoading(false);
                        }
                      })();
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.backLink}>{t('auth.enterWithCode')}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={resetToEmail} disabled={loading}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
                {mode === 'signin' ? (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>{t('common.or')}</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <SocialAuthButtons variant="hero" providers={['google']} disabled={loading} onError={setError} />
                  </>
                ) : null}
              </>
            ) : null}

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
    marginBottom: 14,
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

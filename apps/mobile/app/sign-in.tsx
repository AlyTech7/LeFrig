import { useSignIn, useSignUp, useAuth, useClerk } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { BiometricSignInButton } from '@/components/auth/BiometricSignInButton';
import { ClerkCaptcha } from '@/components/auth/ClerkCaptcha';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { defaultAuthProviders } from '@/lib/social-auth';
import { LefrigMark } from '@/components/LefrigMark';
import { finalizeSignUpAfterEmail, splitDisplayName } from '@/lib/auth-complete';
import { enrollLocalBiometrics } from '@/lib/biometrics';
import {
  getClerkErrorMessage,
  isIdentifierNotFound,
} from '@/lib/clerk-errors';
import { useLefrigLocalCredentials } from '@/lib/useLefrigLocalCredentials';
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

type Step = 'email' | 'method' | 'code' | 'password' | 'signup';
type AuthMode = 'signin' | 'signup';

export default function SignInScreen() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { setActive } = useClerk();
  const { getToken } = useAuth();
  const {
    hasCredentials,
    setCredentials,
    authenticate,
    biometricType,
  } = useLefrigLocalCredentials();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const t = useT();
  const biometricAutoTried = useRef(false);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<Step>('email');
  const [hasEmailCode, setHasEmailCode] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isLoaded = signInLoaded && signUpLoaded;

  useEffect(() => {
    const prefill = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
    if (prefill && isValidEmail(prefill)) setEmail(prefill);
  }, [params.email]);

  useEffect(() => {
    if (isLoaded) {
      setError((prev) => (prev === t('auth.errors.authLoading') ? '' : prev));
    }
  }, [isLoaded, t]);

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

  const finishSession = async (
    sessionId: string,
    enroll?: { identifier: string; password: string },
  ) => {
    if (enroll) {
      await enrollLocalBiometrics({
        t,
        biometricType,
        identifier: enroll.identifier,
        password: enroll.password,
        setCredentials,
      });
    }
    await setActive({ session: sessionId });
    await syncToApi();
    router.replace('/');
  };

  const onBiometricSignIn = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await authenticate();
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId);
        return;
      }
      setError(t('auth.errors.incomplete'));
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.biometricsFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !hasCredentials || !biometricType || biometricAutoTried.current) return;
    if (step !== 'email') return;
    biometricAutoTried.current = true;
    const id = setTimeout(() => {
      void onBiometricSignIn();
    }, 500);
    return () => clearTimeout(id);
  }, [isLoaded, hasCredentials, biometricType, step]);

  const resetToEmail = () => {
    setStep('email');
    setCode('');
    setFullName('');
    setPassword('');
    setPassword2('');
    setShowPassword(false);
    setError('');
    setHasEmailCode(false);
    setHasPassword(false);
    setEmailAddressId(null);
    setMode('signin');
    setResendIn(0);
  };

  const sendEmailCode = async () => {
    if (!signIn) throw new Error('signIn missing');
    let id = emailAddressId;
    if (!id) {
      const attempt = await signIn.create({ identifier: email.trim().toLowerCase() });
      const emailFactor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (!emailFactor || !('emailAddressId' in emailFactor)) {
        throw new Error(t('auth.errors.clerkEmail'));
      }
      id = emailFactor.emailAddressId;
      setEmailAddressId(id);
    }
    await signIn.prepareFirstFactor({
      strategy: 'email_code',
      emailAddressId: id,
    });
    startCodeCooldown();
    setStep('code');
  };

  /** Tras el email: elige método (contraseña preferida) o registro. */
  const onContinue = async () => {
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    if (!isLoaded || !signIn || !signUp) {
      setError(
        Platform.OS === 'web'
          ? 'Clerk aún no está listo. En el navegador usa https://www.lefrig.com/sign-in.'
          : t('auth.errors.authLoading'),
      );
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

      const canCode = Boolean(emailFactor && 'emailAddressId' in emailFactor);
      const canPass = Boolean(passwordFactor);
      setMode('signin');
      setHasEmailCode(canCode);
      setHasPassword(canPass);
      if (canCode && emailFactor && 'emailAddressId' in emailFactor) {
        setEmailAddressId(emailFactor.emailAddressId);
      }

      // Contraseña disponible → preferirla (Play review + UX clara)
      if (canPass && canCode) {
        setStep('method');
        return;
      }
      if (canPass) {
        setStep('password');
        return;
      }
      if (canCode && emailFactor && 'emailAddressId' in emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        startCodeCooldown();
        setStep('code');
        return;
      }
      if (oauthGoogle) {
        setError(t('auth.errors.useGoogle'));
        return;
      }
      setError(t('auth.errors.clerkEmail'));
    } catch (err) {
      if (isIdentifierNotFound(err)) {
        setMode('signup');
        setHasEmailCode(true);
        setHasPassword(true);
        setStep('signup');
        setError('');
      } else {
        setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const onChoosePassword = () => {
    setError('');
    setPassword('');
    setStep('password');
  };

  const onChooseCode = async () => {
    setLoading(true);
    setError('');
    try {
      await sendEmailCode();
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
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
          await finishSession(
            attempt.createdSessionId,
            password.length >= 8 ? { identifier: email, password } : undefined,
          );
          return;
        }
        const finalized = await finalizeSignUpAfterEmail(attempt, {
          password: password || undefined,
          ...splitDisplayName(fullName),
        });
        if (finalized.ok) {
          await finishSession(
            finalized.sessionId,
            password.length >= 8 ? { identifier: email, password } : undefined,
          );
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
        setHasPassword(true);
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

  const onPasswordSignIn = async () => {
    if (!password) {
      setError(t('auth.errors.usePassword'));
      return;
    }
    if (!isLoaded || !signIn) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Asegura intento fresco con factor password
      await signIn.create({ identifier: email.trim().toLowerCase() });
      const result = await signIn.attemptFirstFactor({ strategy: 'password', password });
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId, {
          identifier: email.trim().toLowerCase(),
          password,
        });
        return;
      }
      setError(t('auth.errors.incomplete'));
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.wrongPassword')));
    } finally {
      setLoading(false);
    }
  };

  /** Registro nuevo: nombre + contraseña → código email. */
  const onSignupSubmit = async () => {
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
      setMode('signup');
      setHasEmailCode(true);
      startCodeCooldown();
      setStep('code');
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
    } finally {
      setLoading(false);
    }
  };

  /** Completa password si Clerk lo pide tras verificar email. */
  const onPasswordAfterSignup = async () => {
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
    if (!signUp) {
      setError(t('auth.errors.authLoading'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { firstName, lastName } = splitDisplayName(fullName);
      const finalized = await finalizeSignUpAfterEmail(signUp, {
        password,
        firstName,
        lastName,
      });
      if (finalized.ok) {
        await finishSession(finalized.sessionId, {
          identifier: email.trim().toLowerCase(),
          password,
        });
        return;
      }
      setError('error' in finalized ? finalized.error : t('auth.errors.incomplete'));
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.passwordSaveFailed')));
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
        await sendEmailCode();
        return;
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
    if (next.length === 6 && !loading) void onVerifyCode(next);
  };

  const title =
    step === 'method'
      ? t('auth.methodTitle')
      : step === 'signup'
        ? t('auth.signUpTitle')
        : step === 'password'
          ? mode === 'signup'
            ? t('auth.signUpTitle')
            : t('auth.welcomeBack')
          : step === 'code'
            ? t('auth.verify')
            : t('auth.welcomeBack');

  const subtitle =
    step === 'method'
      ? t('auth.methodSubtitle')
      : step === 'signup'
        ? t('auth.signupFormSubtitle')
        : step === 'password'
          ? mode === 'signup'
            ? t('auth.passwordStepSubtitle')
            : t('auth.passwordSignInSubtitle')
          : step === 'code'
            ? t('auth.codeStepSubtitle')
            : t('auth.subtitle');

  const PasswordToggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
      hitSlop={10}
      onPress={() => setShowPassword((v) => !v)}
      style={styles.eyeBtn}
    >
      <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.inkMuted} />
    </Pressable>
  );

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
                {hasCredentials && biometricType ? (
                  <BiometricSignInButton
                    biometricType={biometricType}
                    loading={loading}
                    onPress={() => void onBiometricSignIn()}
                  />
                ) : null}
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

            {step === 'method' ? (
              <>
                <Text style={styles.passwordEmail}>{email}</Text>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.methodCard, styles.methodCardPrimary, loading && styles.btnDisabled]}
                  onPress={onChoosePassword}
                  disabled={loading}
                >
                  <View style={styles.methodIcon}>
                    <AppIcon name="lock" size={22} color={theme.pearl} />
                  </View>
                  <View style={styles.methodCopy}>
                    <Text style={styles.methodTitle}>{t('auth.methodPasswordTitle')}</Text>
                    <Text style={styles.methodHint}>{t('auth.methodPasswordHint')}</Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color={theme.pearl} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.methodCard, loading && styles.btnDisabled]}
                  onPress={() => void onChooseCode()}
                  disabled={loading}
                >
                  <View style={[styles.methodIcon, styles.methodIconGhost]}>
                    <AppIcon name="mail" size={22} color={theme.dune} />
                  </View>
                  <View style={styles.methodCopy}>
                    <Text style={[styles.methodTitle, styles.methodTitleDark]}>
                      {t('auth.methodCodeTitle')}
                    </Text>
                    <Text style={[styles.methodHint, styles.methodHintDark]}>
                      {t('auth.methodCodeHint')}
                    </Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator color={theme.dune} />
                  ) : (
                    <AppIcon name="chevron-right" size={18} color={theme.inkMuted} />
                  )}
                </Pressable>
                <Pressable onPress={resetToEmail} disabled={loading}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </>
            ) : null}

            {step === 'signup' ? (
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
                    autoComplete="new-password"
                    editable={!loading}
                  />
                  {PasswordToggle}
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
                    autoComplete="new-password"
                    editable={!loading}
                    onSubmitEditing={() => void onSignupSubmit()}
                  />
                </View>
                <Text style={styles.helper}>{t('auth.passwordRules')}</Text>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void onSignupSubmit()}
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
                {mode === 'signin' && hasPassword ? (
                  <Pressable
                    onPress={() => {
                      setCode('');
                      setError('');
                      setStep('password');
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.backLink}>{t('auth.enterWithPasswordInstead')}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={resetToEmail} disabled={loading}>
                  <Text style={styles.backLink}>{t('auth.changeEmail')}</Text>
                </Pressable>
              </>
            ) : null}

            {step === 'password' ? (
              <>
                <Text style={styles.passwordEmail}>{email}</Text>
                {mode === 'signup' ? (
                  <>
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
                  </>
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
                    secureTextEntry={!showPassword}
                    autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                    editable={!loading}
                    onSubmitEditing={() => {
                      if (mode !== 'signup') void onPasswordSignIn();
                    }}
                  />
                  {PasswordToggle}
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
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      editable={!loading}
                      onSubmitEditing={() => void onPasswordAfterSignup()}
                    />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() =>
                    void (mode === 'signup' ? onPasswordAfterSignup() : onPasswordSignIn())
                  }
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
                  <Pressable onPress={() => void onChooseCode()} disabled={loading}>
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
                    <SocialAuthButtons
                      variant="hero"
                      providers={defaultAuthProviders()}
                      disabled={loading}
                      onError={setError}
                    />
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
    fontSize: 28,
    color: theme.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.inkMuted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 54,
  },
  inputInner: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 4 },
  input: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
    marginBottom: 12,
  },
  codeInput: {
    letterSpacing: 10,
    fontSize: 24,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
    marginTop: 4,
  },
  btnPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
  btnDisabled: { opacity: 0.55 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.glassBorder },
  dividerText: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  codeHint: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 20 },
  passwordEmail: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.dune,
    textAlign: 'center',
    marginBottom: 12,
  },
  passwordHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.inkMuted,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 12,
  },
  methodCardPrimary: {
    backgroundColor: theme.ink,
    borderColor: theme.ink,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconGhost: {
    backgroundColor: 'rgba(180, 137, 49, 0.12)',
  },
  methodCopy: { flex: 1 },
  methodTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.pearl,
    marginBottom: 2,
  },
  methodTitleDark: { color: theme.ink },
  methodHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  methodHintDark: { color: theme.inkMuted },
  backLink: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: theme.dune,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  backLinkMuted: { opacity: 0.5 },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(196, 92, 62, 0.12)',
    borderRadius: radii.sm,
  },
  error: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: theme.terracotta, lineHeight: 20 },
  footer: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkMuted,
    textAlign: 'center',
    marginTop: 28,
  },
  switchLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.dune,
    textAlign: 'center',
    marginTop: 12,
  },
  legalLink: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});

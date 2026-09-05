'use client';

import { useAuth, useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LefrigMark } from '@/components/LefrigMark';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { finalizeSignUpAfterEmail, splitDisplayName } from '@/lib/auth-complete';
import {
  getClerkErrorMessage,
  isIdentifierExists,
  isIdentifierNotFound,
} from '@/lib/clerk-errors';
import { useLocale, useT } from '@/lib/locale';
import { safeInternalPath } from '@/lib/safe-redirect';

const RESEND_SECONDS = 30;

type Step = 'email' | 'method' | 'code' | 'password' | 'signup';
type AuthMode = 'signin' | 'signup';

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

function digitsOnly(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

type Props = {
  /** Página de entrada: login o registro. */
  intent?: 'signin' | 'signup';
};

export function EliteAuthForm({ intent = 'signin' }: Props) {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { setActive } = useClerk();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const t = useT();
  const { dir } = useLocale();
  const isRtl = dir === 'rtl';

  const redirectAfter = safeInternalPath(
    searchParams.get('redirect_url') ?? searchParams.get('redirect'),
    '/me',
  );

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(intent);
  const [step, setStep] = useState<Step>('email');
  const [hasEmailCode, setHasEmailCode] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isLoaded = signInLoaded && signUpLoaded;

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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/sync`, {
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
    const dest =
      redirectAfter.startsWith('/sign-in') || redirectAfter.startsWith('/sign-up')
        ? '/me'
        : redirectAfter;
    window.location.replace(dest);
  };

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
    setMode(intent);
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
      if (intent === 'signup') {
        setMode('signup');
        setHasEmailCode(true);
        setHasPassword(true);
        setStep('signup');
        return;
      }

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
          await finishSession(attempt.createdSessionId);
          return;
        }
        const finalized = await finalizeSignUpAfterEmail(attempt, {
          password: password || undefined,
          ...splitDisplayName(fullName),
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
      await signIn.create({ identifier: email.trim().toLowerCase() });
      const result = await signIn.attemptFirstFactor({ strategy: 'password', password });
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId);
        return;
      }
      setError(t('auth.errors.incomplete'));
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.wrongPassword')));
    } finally {
      setLoading(false);
    }
  };

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
      if (isIdentifierExists(err)) {
        setError(t('auth.errors.alreadyRegistered'));
        setMode('signin');
        setStep('email');
        return;
      }
      setError(getClerkErrorMessage(err, t('auth.errors.sendFailed')));
    } finally {
      setLoading(false);
    }
  };

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
        await finishSession(finalized.sessionId);
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

  const onGoogle = async () => {
    if (!isLoaded || !signIn || oauthLoading) return;
    setOauthLoading(true);
    setError('');
    try {
      const dest =
        redirectAfter.startsWith('/sign-in') || redirectAfter.startsWith('/sign-up')
          ? '/me'
          : redirectAfter;
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: dest,
      });
    } catch (err) {
      setError(getClerkErrorMessage(err, t('auth.errors.incomplete')));
      setOauthLoading(false);
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
            : intent === 'signup'
              ? t('auth.signUpTitle')
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
            : intent === 'signup'
              ? t('auth.signUpSubtitle')
              : t('auth.subtitle');

  const busy = loading || oauthLoading;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 'email') void onContinue();
    else if (step === 'password' && mode === 'signin') void onPasswordSignIn();
    else if (step === 'password' && mode === 'signup') void onPasswordAfterSignup();
    else if (step === 'signup') void onSignupSubmit();
    else if (step === 'code') void onVerifyCode();
  };

  return (
    <section
      className={`lf-auth ${isRtl ? 'lf-auth--rtl' : ''}`}
      style={
        {
          '--lf-auth-stage': `url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=85&fm=webp")`,
        } as CSSProperties
      }
    >
      <aside className="lf-auth__stage" aria-hidden={false}>
        <div className="lf-auth__stage-media" />
        <div className="lf-auth__stage-veil" />
        <div className="lf-auth__stage-grain" />
        <div className="lf-auth__stage-mark">
          <LefrigMark size={34} showOrbit={false} />
        </div>
        <div className="lf-auth__stage-content">
          <p className="lf-auth__stage-kicker">{t('auth.stageKicker')}</p>
          <p className="lf-auth__stage-brand">LEFRIG</p>
          <p className="lf-auth__stage-line">{t('auth.stageLine')}</p>
        </div>
      </aside>

      <div className="lf-auth__rail" dir={dir}>
        <div className="lf-auth__rail-top">
          <Link href="/" className="lf-auth__home">
            <AppIcon name={isRtl ? 'arrow-right' : 'arrow-left'} size={14} />
            <span>{t('auth.railHome')}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className="lf-auth__rail-body">
          <header className="lf-auth__head">
            <h1 className="lf-auth__title">{title}</h1>
            <p className="lf-auth__subtitle">{subtitle}</p>
            {step === 'code' && email ? (
              <p className="lf-auth__hint">{t('auth.codeSent', { email })}</p>
            ) : null}
          </header>

          <form className="lf-auth__form" onSubmit={onSubmit} noValidate>
            {step !== 'email' ? (
              <button type="button" className="lf-auth__back" onClick={resetToEmail} disabled={busy}>
                <AppIcon name={isRtl ? 'arrow-right' : 'arrow-left'} size={16} />
                <span>{t('auth.changeEmail')}</span>
              </button>
            ) : null}

            {step === 'email' ? (
              <>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.emailPlaceholder')}</span>
                  <span className="lf-auth__input-wrap">
                    <AppIcon name="mail" size={18} color="var(--lf-auth-dune)" />
                    <input
                      className="lf-auth__input"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={busy}
                      required
                    />
                  </span>
                </label>
                <div id="clerk-captcha" />
                <button type="submit" className="lf-auth__btn lf-auth__btn--primary" disabled={busy}>
                  {loading ? (
                    <span className="lf-auth__spinner" aria-hidden />
                  ) : (
                    <>
                      <span>{t('common.continue')}</span>
                      <AppIcon name={isRtl ? 'arrow-left' : 'arrow-right'} size={18} />
                    </>
                  )}
                </button>
                <p className="lf-auth__helper">{t('auth.emailHelper')}</p>

                <div className="lf-auth__divider">
                  <span>{t('common.or')}</span>
                </div>

                <button
                  type="button"
                  className="lf-auth__btn lf-auth__btn--google"
                  onClick={() => void onGoogle()}
                  disabled={busy}
                >
                  {oauthLoading ? (
                    <span className="lf-auth__spinner lf-auth__spinner--dark" aria-hidden />
                  ) : (
                    <>
                      <GoogleLogo size={20} />
                      <span>{t('auth.continueWith', { provider: 'Google' })}</span>
                    </>
                  )}
                </button>
              </>
            ) : null}

            {step === 'method' ? (
              <div className="lf-auth__methods">
                {hasPassword ? (
                  <button
                    type="button"
                    className="lf-auth__method"
                    onClick={onChoosePassword}
                    disabled={busy}
                  >
                    <span className="lf-auth__method-ico" aria-hidden>
                      <AppIcon name="lock" size={20} color="var(--lf-auth-ink)" />
                    </span>
                    <span className="lf-auth__method-copy">
                      <strong>{t('auth.methodPasswordTitle')}</strong>
                      <small>{t('auth.methodPasswordHint')}</small>
                    </span>
                    <AppIcon name={isRtl ? 'arrow-left' : 'arrow-right'} size={16} />
                  </button>
                ) : null}
                {hasEmailCode ? (
                  <button
                    type="button"
                    className="lf-auth__method"
                    onClick={() => void onChooseCode()}
                    disabled={busy}
                  >
                    <span className="lf-auth__method-ico" aria-hidden>
                      <AppIcon name="mail" size={20} color="var(--lf-auth-ink)" />
                    </span>
                    <span className="lf-auth__method-copy">
                      <strong>{t('auth.methodCodeTitle')}</strong>
                      <small>{t('auth.methodCodeHint')}</small>
                    </span>
                    {loading ? (
                      <span className="lf-auth__spinner lf-auth__spinner--dark" aria-hidden />
                    ) : (
                      <AppIcon name={isRtl ? 'arrow-left' : 'arrow-right'} size={16} />
                    )}
                  </button>
                ) : null}
              </div>
            ) : null}

            {step === 'password' && mode === 'signin' ? (
              <>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.passwordLabel')}</span>
                  <span className="lf-auth__input-wrap">
                    <AppIcon name="lock" size={18} color="var(--lf-auth-dune)" />
                    <input
                      className="lf-auth__input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy}
                      required
                    />
                    <button
                      type="button"
                      className="lf-auth__eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </span>
                </label>
                <button type="submit" className="lf-auth__btn lf-auth__btn--primary" disabled={busy}>
                  {loading ? (
                    <span className="lf-auth__spinner" aria-hidden />
                  ) : (
                    <span>{t('auth.continueWithPassword')}</span>
                  )}
                </button>
                {hasEmailCode ? (
                  <button
                    type="button"
                    className="lf-auth__link-btn"
                    onClick={() => void onChooseCode()}
                    disabled={busy}
                  >
                    {t('auth.enterWithCode')}
                  </button>
                ) : null}
              </>
            ) : null}

            {step === 'signup' || (step === 'password' && mode === 'signup') ? (
              <>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.namePlaceholder')}</span>
                  <span className="lf-auth__input-wrap">
                    <input
                      className="lf-auth__input"
                      type="text"
                      autoComplete="name"
                      placeholder={t('auth.namePlaceholder')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={busy}
                      required
                    />
                  </span>
                </label>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.newPasswordPlaceholder')}</span>
                  <span className="lf-auth__input-wrap">
                    <AppIcon name="lock" size={18} color="var(--lf-auth-dune)" />
                    <input
                      className="lf-auth__input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('auth.newPasswordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="lf-auth__eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </span>
                </label>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.confirmPasswordPlaceholder')}</span>
                  <span className="lf-auth__input-wrap">
                    <input
                      className="lf-auth__input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      disabled={busy}
                      required
                      minLength={8}
                    />
                  </span>
                </label>
                <p className="lf-auth__helper">{t('auth.passwordRules')}</p>
                <button type="submit" className="lf-auth__btn lf-auth__btn--primary" disabled={busy}>
                  {loading ? (
                    <span className="lf-auth__spinner" aria-hidden />
                  ) : (
                    <span>
                      {step === 'password' ? t('common.continue') : t('auth.createAccount')}
                    </span>
                  )}
                </button>
              </>
            ) : null}

            {step === 'code' ? (
              <>
                <label className="lf-auth__field">
                  <span className="lf-auth__label">{t('auth.codePlaceholder')}</span>
                  <input
                    className="lf-auth__input lf-auth__input--code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => onChangeCode(e.target.value)}
                    disabled={busy}
                    maxLength={6}
                    required
                  />
                </label>
                <button type="submit" className="lf-auth__btn lf-auth__btn--primary" disabled={busy}>
                  {loading ? (
                    <span className="lf-auth__spinner" aria-hidden />
                  ) : (
                    <span>{t('auth.verify')}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="lf-auth__link-btn"
                  onClick={() => void onResend()}
                  disabled={busy || resendIn > 0}
                >
                  {resendIn > 0 ? t('auth.resendIn', { s: resendIn }) : t('auth.resendCode')}
                </button>
                {mode === 'signin' && hasPassword ? (
                  <button
                    type="button"
                    className="lf-auth__link-btn"
                    onClick={onChoosePassword}
                    disabled={busy}
                  >
                    {t('auth.enterWithPasswordInstead')}
                  </button>
                ) : null}
              </>
            ) : null}

            {error ? (
              <p className="lf-auth__error" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <footer className="lf-auth__footer">
            {intent === 'signin' ? (
              <p>
                <Link href={`/sign-up?redirect_url=${encodeURIComponent(redirectAfter)}`}>
                  {t('auth.noAccount')}
                </Link>
              </p>
            ) : (
              <p>
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectAfter)}`}>
                  {t('auth.hasAccount')}
                </Link>
              </p>
            )}
            <Link href="/legal" className="lf-auth__legal">
              {t('auth.legalLink')}
            </Link>
            <p className="lf-auth__tagline">{t('auth.footerTagline')}</p>
          </footer>
        </div>
      </div>
    </section>
  );
}

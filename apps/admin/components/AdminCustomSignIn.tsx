'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Step = 'credentials' | 'verify';

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#1f2937',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: 32,
  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: '#111827',
  color: '#f8faf9',
  fontSize: 15,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: 'rgba(248,250,249,0.75)',
  fontSize: 14,
  fontWeight: 600,
};

export function AdminCustomSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [clerkSlow, setClerkSlow] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setClerkSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setClerkSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  const finishSignIn = async (sessionId: string | null) => {
    if (!sessionId) {
      setError('No se pudo crear la sesión.');
      return;
    }
    if (!setActive) {
      setError('Auth no disponible.');
      return;
    }
    await setActive({ session: sessionId });
    router.push('/');
  };

  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');
    setInfo('');

    try {
      await signIn.create({ identifier: email, password });

      if (signIn.status === 'complete') {
        await finishSignIn(signIn.createdSessionId);
        return;
      }

      const status = signIn.status as string;
      if (status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
        const emailFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');

        if (emailFactor && 'emailAddressId' in emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          setStep('verify');
          setInfo('Te enviamos un código a tu email. Introdúcelo abajo.');
          return;
        }

        const phoneFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'phone_code');
        if (phoneFactor && 'phoneNumberId' in phoneFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
          setStep('verify');
          setInfo('Te enviamos un código por SMS.');
          return;
        }
      }

      setError(`Estado de login no soportado: ${signIn.status}`);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');

    try {
      const factor = signIn.supportedSecondFactors?.[0];
      const strategy = factor?.strategy === 'phone_code' ? 'phone_code' : 'email_code';

      const result = await signIn.attemptSecondFactor({ strategy, code });

      if (result.status === 'complete') {
        await finishSignIn(result.createdSessionId);
        return;
      }

      setError('Código incorrecto o expirado.');
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Error de verificación'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h1 style={{ margin: '0 0 8px', color: '#f8faf9', fontSize: '1.5rem', fontWeight: 800 }}>
        Lefrig Admin
      </h1>
      <p style={{ margin: '0 0 24px', color: 'rgba(248,250,249,0.6)', fontSize: 14 }}>
        {step === 'credentials' ? 'Inicia sesión con tu cuenta admin' : 'Verifica tu identidad'}
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      {info ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(13,148,136,0.15)',
            color: '#6ee7b7',
            fontSize: 14,
          }}
        >
          {info}
        </div>
      ) : null}

      {!isLoaded && !clerkSlow ? (
        <p style={{ margin: '0 0 16px', color: 'rgba(248,250,249,0.55)', fontSize: 14 }}>
          Cargando autenticación…
        </p>
      ) : null}

      {clerkSlow && !isLoaded ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(245,158,11,0.12)',
            color: '#fcd34d',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Clerk no responde. Prueba sin VPN, desactiva bloqueadores de anuncios y recarga. Si persiste,
          abre{' '}
          <a href="https://clerk.lefrig.com" style={{ color: '#fde68a' }}>
            clerk.lefrig.com
          </a>{' '}
          en otra pestaña.
        </div>
      ) : null}

      {step === 'credentials' ? (
        <form onSubmit={onSubmitCredentials}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="tu@email.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle} htmlFor="admin-password">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !isLoaded}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando…' : !isLoaded ? 'Esperando Clerk…' : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitCode}>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle} htmlFor="admin-code">
              Código de verificación
            </label>
            <input
              id="admin-code"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={inputStyle}
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !isLoaded}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verificando…' : 'Verificar y entrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setCode('');
              setError('');
              setInfo('');
            }}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '10px',
              border: 'none',
              background: 'transparent',
              color: 'rgba(248,250,249,0.6)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ← Volver
          </button>
        </form>
      )}
    </div>
  );
}

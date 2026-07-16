import { isClerkConfigured } from '@/lib/clerk-config';
import { adminRedirectUrl } from '@/lib/site-url';

export default function AdminSignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string; error?: string };
}) {
  if (!isClerkConfigured()) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#111827',
          color: '#f8faf9',
          padding: 24,
        }}
      >
        <p>
          Configura Clerk en Vercel: <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> y{' '}
          <code>CLERK_SECRET_KEY</code>
        </p>
      </div>
    );
  }

  const action = `${adminRedirectUrl('/api/auth/sign-in')}${
    searchParams.redirect_url
      ? `?redirect_url=${encodeURIComponent(searchParams.redirect_url)}`
      : ''
  }`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111827',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#1f2937',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', color: '#f8faf9', fontSize: '1.5rem', fontWeight: 800 }}>
          Lefrig Admin
        </h1>
        <p style={{ margin: '0 0 24px', color: 'rgba(248,250,249,0.6)', fontSize: 14 }}>
          Inicia sesión con tu cuenta admin (sin depender de Clerk en el navegador)
        </p>

        {searchParams.error ? (
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
            {searchParams.error}
          </div>
        ) : null}

        <form method="POST" action={action}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="admin-email"
              style={{
                display: 'block',
                marginBottom: 6,
                color: 'rgba(248,250,249,0.75)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#111827',
                color: '#f8faf9',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                marginBottom: 6,
                color: 'rgba(248,250,249,0.75)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Contraseña
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#111827',
                color: '#f8faf9',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

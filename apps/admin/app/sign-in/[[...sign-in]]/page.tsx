import { isClerkConfigured } from '@/lib/clerk-config';
import { adminRedirectUrl } from '@/lib/site-url';

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (!isClerkConfigured()) {
    return (
      <div className="adm-auth">
        <div className="adm-auth__card">
          <h1 className="adm-auth__title">Clerk no configurado</h1>
          <p className="adm-auth__sub">
            Configura en Vercel: <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> y{' '}
            <code>CLERK_SECRET_KEY</code>
          </p>
        </div>
      </div>
    );
  }

  const action = `${adminRedirectUrl('/api/auth/sign-in')}${
    params.redirect_url ? `?redirect_url=${encodeURIComponent(params.redirect_url)}` : ''
  }`;

  return (
    <div className="adm-auth">
      <div className="adm-auth__card">
        <div className="adm-brand" style={{ marginBottom: 20 }}>
          <div className="adm-brand__mark">L</div>
          <div>
            <div className="adm-brand__name">Lefrig</div>
            <div className="adm-brand__meta">Atlas Control</div>
          </div>
        </div>

        <h1 className="adm-auth__title">Entrar al panel</h1>
        <p className="adm-auth__sub">Acceso seguro para operaciones Lefrig.</p>

        {params.error ? <div className="adm-auth__error">{params.error}</div> : null}

        <form method="POST" action={action}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            className="adm-input"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hola@lefrig.com"
          />

          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            className="adm-input"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />

          <button type="submit" className="adm-btn adm-btn--primary">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

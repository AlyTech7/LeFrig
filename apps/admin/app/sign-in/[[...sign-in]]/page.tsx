import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { adminRedirectUrl, getHostedClerkSignInUrl } from '@/lib/site-url';

export default function AdminSignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
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

  const returnTo = searchParams.redirect_url ?? adminRedirectUrl('/');
  redirect(getHostedClerkSignInUrl(returnTo));
}

import { AdminCustomSignIn } from '@/components/AdminCustomSignIn';

export default function AdminSignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#111827', color: '#f8faf9', padding: 24 }}>
        <p>Configura Clerk en <code>apps/admin/.env.local</code></p>
      </div>
    );
  }

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
      <AdminCustomSignIn />
    </div>
  );
}

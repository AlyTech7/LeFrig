import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Acceso denegado</h1>
      <p style={{ color: '#6b7280', marginTop: 12 }}>
        Necesitas rol admin o moderador en Clerk (publicMetadata.roles).
      </p>
      <Link href="/sign-in" style={{ color: '#0d9488', fontWeight: 600, marginTop: 24, display: 'inline-block' }}>
        Volver a entrar
      </Link>
    </div>
  );
}

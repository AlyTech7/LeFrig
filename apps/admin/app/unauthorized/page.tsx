import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="adm-auth">
      <div className="adm-auth__card" style={{ textAlign: 'center' }}>
        <h1 className="adm-auth__title">Acceso denegado</h1>
        <p className="adm-auth__sub">
          Necesitas rol admin o moderador en Clerk (<code>publicMetadata.roles</code>).
        </p>
        <Link href="/sign-in" className="adm-btn adm-btn--primary">
          Volver a entrar
        </Link>
      </div>
    </div>
  );
}

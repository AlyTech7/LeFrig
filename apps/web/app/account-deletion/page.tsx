import type { Metadata } from 'next';
import Link from 'next/link';
import './account-deletion.css';

export const metadata: Metadata = {
  title: 'Eliminar cuenta — Lefrig',
  description:
    'Cómo solicitar la eliminación de tu cuenta Lefrig (requisito Google Play / App Store).',
  robots: { index: true, follow: true },
};

export default function AccountDeletionPage() {
  return (
    <main className="ad-page">
      <div className="ad-card">
        <p className="ad-kicker">Cuenta · Privacidad</p>
        <h1>Eliminar tu cuenta Lefrig</h1>
        <p className="ad-lead">
          Puedes borrar tu cuenta desde la app o solicitarlo por email. Cumplimos los requisitos de
          Google Play y App Store sobre eliminación de cuentas.
        </p>

        <section>
          <h2>1. Desde la app (recomendado)</h2>
          <ol>
            <li>Abre Lefrig e inicia sesión.</li>
            <li>
              Ve a <strong>Perfil → Seguridad → Eliminar cuenta</strong>.
            </li>
            <li>Confirma escribiendo la palabra indicada (y tu contraseña si aplica).</li>
          </ol>
          <p>
            La eliminación es inmediata en Clerk. Datos asociados en Lefrig se borran o anonimizan
            según la{' '}
            <Link href="/legal#privacidad">política de privacidad</Link>.
          </p>
        </section>

        <section>
          <h2>2. Por email</h2>
          <p>
            Escribe a{' '}
            <a href="mailto:hola@lefrig.com?subject=Eliminar%20cuenta%20Lefrig">hola@lefrig.com</a>{' '}
            con el asunto <strong>«Eliminar cuenta Lefrig»</strong> e indica el email o teléfono de
            la cuenta. Responderemos en un plazo razonable (como máximo 30 días).
          </p>
        </section>

        <section>
          <h2>Qué se elimina</h2>
          <ul>
            <li>Perfil, sesión y acceso a la app.</li>
            <li>Anuncios, mensajes y datos de actividad asociados a tu usuario.</li>
            <li>
              Algunos registros pueden conservarse temporalmente por obligación legal, fraude o
              disputas (ver privacidad).
            </li>
          </ul>
        </section>

        <p className="ad-foot">
          <Link href="/legal#privacidad">Privacidad</Link>
          {' · '}
          <Link href="/legal">Centro legal</Link>
          {' · '}
          <a href="mailto:hola@lefrig.com">hola@lefrig.com</a>
        </p>
      </div>
    </main>
  );
}

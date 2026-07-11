import type { Metadata } from 'next';
import '@lefrig/ui/styles.css';
import './globals.css';
import './sovereign.css';
import './footer.css';
import './pages.css';
import './lefrig-mark.css';
import { ClientShell } from '@/components/ClientShell';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: {
    default: 'Lefrig — Superapp saharaui',
    template: '%s | Lefrig',
  },
  description:
    'Lefrig conecta los campamentos, Tindouf y la diáspora. Mercado, servicios, transporte, tiendas y comunidad con pagos en efectivo.',
  keywords: ['saharaui', 'Tindouf', 'mercado', 'transporte', 'diáspora', 'Lefrig'],
  openGraph: {
    title: 'Lefrig — Superapp saharaui',
    description: 'Mercado, transporte, tiendas y diáspora unidos en una sola plataforma.',
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" dir="ltr">
      <body>
        <AppProviders>
          <ClientShell>{children}</ClientShell>
        </AppProviders>
      </body>
    </html>
  );
}

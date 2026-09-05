import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { getDirection, LOCALE_STORAGE_KEY, resolveLocale } from '@lefrig/shared';
import '@lefrig/ui/styles.css';
import './globals.css';
import './sovereign.css';
import './footer.css';
import './pages.css';
import './auth-elite.css';
import './lefrig-mark.css';
import { ClientShell } from '@/components/ClientShell';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: {
    default: 'Lefrig — Superapp saharaui',
    template: '%s | Lefrig',
  },
  description:
    'Lefrig conecta los campamentos y Tindouf. Mercado, servicios, transporte, tiendas y comunidad con pagos en efectivo.',
  keywords: ['saharaui', 'Tindouf', 'mercado', 'transporte', 'efectivo', 'Lefrig'],
  openGraph: {
    title: 'Lefrig — Superapp saharaui',
    description: 'Mercado, transporte y tiendas en los campamentos — efectivo con confianza.',
    locale: 'es_ES',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_STORAGE_KEY)?.value, 'ar');
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir}>
      <body>
        <AppProviders>
          <ClientShell>{children}</ClientShell>
        </AppProviders>
      </body>
    </html>
  );
}

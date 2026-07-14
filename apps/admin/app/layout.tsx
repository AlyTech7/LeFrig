import type { Metadata } from 'next';
import '@lefrig/ui/styles.css';
import './globals.css';
import { AdminShell } from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'Lefrig Admin — Command Center',
  description: 'Panel de administración Lefrig',
};

/** Panel autenticado — no pre-render estático en build */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

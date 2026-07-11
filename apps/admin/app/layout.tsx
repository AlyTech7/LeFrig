import type { Metadata } from 'next';
import '@lefrig/ui/styles.css';
import './globals.css';
import { AdminClerkProvider } from '@/components/AdminClerkProvider';
import { AdminShell } from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'Lefrig Admin — Command Center',
  description: 'Panel de administración Lefrig',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AdminClerkProvider>
          <AdminShell>{children}</AdminShell>
        </AdminClerkProvider>
      </body>
    </html>
  );
}

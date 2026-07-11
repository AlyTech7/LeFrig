'use client';

import { usePathname } from 'next/navigation';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { CommandPaletteProvider } from './pro/CommandPalette';

const AUTH_PATHS = ['/sign-in', '/unauthorized'];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <CommandPaletteProvider>
      <div className="adm-shell">
        <AdminSidebar />
        <div className="adm-main">
          <AdminHeader />
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}

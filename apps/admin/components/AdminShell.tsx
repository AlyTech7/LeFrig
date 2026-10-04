'use client';

import { usePathname } from 'next/navigation';
import { AdminTopNav } from './AdminTopNav';
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
        <div className="adm-main">
          <AdminTopNav />
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SovereignBackdrop, SovereignHeader, WebDock } from '@/components/SovereignChrome';
import { SovereignFooter } from '@/components/SovereignFooter';

function isAuthPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/sso-callback')
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authRoute = isAuthPath(pathname);

  useEffect(() => {
    document.body.classList.toggle('lf-auth-route', authRoute);
    return () => {
      document.body.classList.remove('lf-auth-route');
    };
  }, [authRoute]);

  return (
    <>
      <SovereignBackdrop />
      <SovereignHeader />
      <main className="sv-main">{children}</main>
      {authRoute ? null : <SovereignFooter />}
      {authRoute ? null : <WebDock />}
    </>
  );
}

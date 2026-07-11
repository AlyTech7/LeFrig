'use client';

import { SovereignBackdrop, SovereignHeader, WebDock } from '@/components/SovereignChrome';
import { SovereignFooter } from '@/components/SovereignFooter';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SovereignBackdrop />
      <SovereignHeader />
      <main className="sv-main">{children}</main>
      <SovereignFooter />
      <WebDock />
    </>
  );
}

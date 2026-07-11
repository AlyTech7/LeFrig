import React from 'react';
import { colors } from '../tokens';

export interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  dir?: 'ltr' | 'rtl';
}

export function AppShell({ children, header, footer, dir = 'ltr' }: AppShellProps) {
  return (
    <div dir={dir} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.warmWhite }}>
      {header && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: colors.warmWhite,
            borderBottom: `1px solid ${colors.sand[200]}`,
            padding: '12px 20px',
          }}
        >
          {header}
        </header>
      )}
      <main style={{ flex: 1, padding: '0 0 80px' }}>{children}</main>
      {footer && (
        <footer
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: colors.warmWhite,
            borderTop: `1px solid ${colors.sand[200]}`,
            padding: '8px 16px',
            zIndex: 100,
          }}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

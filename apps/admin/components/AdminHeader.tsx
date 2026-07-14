'use client';

import { usePathname } from 'next/navigation';
import { useCommandPalette } from './pro/CommandPalette';
import { LiveClock } from './pro/LiveClock';

const titles: Record<string, string> = {
  '/': 'Centro de mando',
  '/users': 'Usuarios',
  '/listings': 'Anuncios',
  '/shops': 'Tiendas',
  '/orders': 'Pedidos',
  '/transport': 'Transporte',
  '/moderation': 'Moderación',
  '/disputes': 'Disputas',
  '/analytics': 'Analytics',
};

export function AdminHeader() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const title = Object.entries(titles).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path),
  )?.[1] ?? 'Admin';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '16px 32px',
        borderBottom: '1px solid var(--adm-border)',
        background: 'rgba(10, 15, 20, 0.75)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--adm-muted)', letterSpacing: '0.06em' }}>
          LEFRIG ADMIN / <LiveClock options={{ hour: '2-digit', minute: '2-digit' }} />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 2, letterSpacing: '-0.02em' }}>{title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" className="adm-btn adm-btn--ghost" style={{ fontSize: '0.8rem' }} onClick={open}>
          ⌘K
        </button>

        <button
          type="button"
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid var(--adm-border)',
            background: 'var(--adm-surface-2)',
            color: 'var(--adm-text)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
          aria-label="Notificaciones"
        >
          🔔
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--adm-coral)',
              border: '2px solid var(--adm-surface-2)',
            }}
          />
        </button>

        <a
          href="/api/sign-out"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid var(--adm-border)',
            background: 'var(--adm-surface-2)',
            color: 'var(--adm-muted)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
          title="Cerrar sesión"
        >
          ⎋
        </a>
      </div>
    </header>
  );
}

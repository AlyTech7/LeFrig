'use client';

import { usePathname } from 'next/navigation';
import { useCommandPalette } from './pro/CommandPalette';
import { LiveClock } from './pro/LiveClock';

const titles: Record<string, string> = {
  '/': 'Centro de mando',
  '/users': 'Usuarios',
  '/listings': 'Anuncios',
  '/shops': 'Tiendas',
  '/services': 'Servicios',
  '/orders': 'Pedidos',
  '/transport': 'Transporte',
  '/moderation': 'Moderación',
  '/disputes': 'Disputas',
  '/analytics': 'Analytics',
  '/camps': 'Campamentos',
  '/audit': 'Auditoría',
  '/cash': 'Efectivo PIN',
  '/jobs': 'Empleo',
  '/needs': 'Necesidades',
  '/community': 'Comunidad',
  '/drivers': 'Conductores',
  '/settings': 'Configuración',
};

export function AdminHeader() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const title =
    Object.entries(titles).find(([path]) =>
      path === '/' ? pathname === '/' : pathname.startsWith(path),
    )?.[1] ?? 'Admin';

  return (
    <header className="adm-header">
      <div>
        <div className="adm-header__eyebrow">
          Lefrig Admin · <LiveClock options={{ hour: '2-digit', minute: '2-digit' }} />
        </div>
        <div className="adm-header__title">{title}</div>
      </div>

      <div className="adm-header__actions">
        <button type="button" className="adm-btn adm-btn--ghost" onClick={open}>
          Buscar
          <kbd
            style={{
              marginLeft: 4,
              padding: '2px 6px',
              borderRadius: 6,
              border: '1px solid var(--adm-border)',
              background: 'var(--adm-surface-2)',
              fontSize: '0.72rem',
              fontFamily: 'var(--adm-mono)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        <button type="button" className="adm-icon-btn" aria-label="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
            <path d="M6 17h12l-1.2-2.2A6 6 0 0 1 16 10V9a4 4 0 0 0-8 0v1a6 6 0 0 1-.8 4.8z" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
          <span className="adm-icon-btn__dot" />
        </button>

        <a href="/api/sign-out" className="adm-icon-btn" title="Cerrar sesión" aria-label="Cerrar sesión">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
            <path d="M10 7V5a1 1 0 0 1 1-1h8v16h-8a1 1 0 0 1-1-1v-2" />
            <path d="M13 12H4m0 0 3-3M4 12l3 3" />
          </svg>
        </a>
      </div>
    </header>
  );
}

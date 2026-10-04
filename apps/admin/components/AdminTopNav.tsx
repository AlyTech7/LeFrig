'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminApi } from '@/lib/useAdminApi';
import type { DashboardMetrics } from '@/lib/types';
import { useCommandPalette } from './pro/CommandPalette';
import { LiveClock } from './pro/LiveClock';

const links: {
  href: string;
  label: string;
  badgeKey: keyof DashboardMetrics | null;
}[] = [
  { href: '/', label: 'Mando', badgeKey: null },
  { href: '/analytics', label: 'Analytics', badgeKey: null },
  { href: '/camps', label: 'Campamentos', badgeKey: null },
  { href: '/users', label: 'Usuarios', badgeKey: null },
  { href: '/listings', label: 'Anuncios', badgeKey: 'pendingListings' },
  { href: '/orders', label: 'Pedidos', badgeKey: 'ordersCount' },
  { href: '/shops', label: 'Tiendas', badgeKey: null },
  { href: '/transport', label: 'Transporte', badgeKey: 'transportCount' },
  { href: '/cash', label: 'Efectivo', badgeKey: null },
  { href: '/jobs', label: 'Empleo', badgeKey: null },
  { href: '/needs', label: 'Necesidades', badgeKey: null },
  { href: '/community', label: 'Comunidad', badgeKey: null },
  { href: '/drivers', label: 'Conductores', badgeKey: null },
  { href: '/moderation', label: 'Moderación', badgeKey: 'pendingReports' },
  { href: '/disputes', label: 'Disputas', badgeKey: 'openDisputes' },
  { href: '/audit', label: 'Auditoría', badgeKey: null },
  { href: '/settings', label: 'Ajustes', badgeKey: null },
];

export function AdminTopNav() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const { request } = useAdminApi();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    request<DashboardMetrics>('/admin/dashboard').then(setMetrics).catch(() => {});
  }, [request]);

  const badge = (key: keyof DashboardMetrics | null) => {
    if (!key || !metrics) return null;
    const v = metrics[key];
    if (typeof v !== 'number' || v <= 0) return null;
    if (key === 'ordersCount' || key === 'transportCount') return v > 99 ? '99+' : String(v);
    return String(v);
  };

  return (
    <>
      <header className="adm-topbar">
        <div className="adm-topbar__row">
          <Link href="/" className="adm-brand">
            <div className="adm-brand__mark">L</div>
            <div>
              <div className="adm-brand__name">Lefrig</div>
              <div className="adm-brand__meta">Atlas Control</div>
            </div>
          </Link>

          <div className="adm-topbar__center">
            <button type="button" className="adm-search-chip" onClick={open}>
              <span>Buscar en el atlas…</span>
              <kbd>⌘K</kbd>
            </button>
          </div>

          <div className="adm-topbar__actions">
            <div className="adm-live-pill">
              <span className="adm-live-dot" />
              <LiveClock options={{ hour: '2-digit', minute: '2-digit' }} />
            </div>
            <a href="/api/sign-out" className="adm-icon-btn" title="Cerrar sesión" aria-label="Cerrar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M10 7V5a1 1 0 0 1 1-1h8v16h-8a1 1 0 0 1-1-1v-2" />
                <path d="M13 12H4m0 0 3-3M4 12l3 3" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <nav className="adm-atlas-nav" aria-label="Navegación principal">
        <div className="adm-atlas-nav__inner">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const b = badge(link.badgeKey);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`adm-atlas-link${active ? ' adm-atlas-link--active' : ''}`}
              >
                {link.label}
                {b ? <span className="adm-atlas-link__badge">{b}</span> : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

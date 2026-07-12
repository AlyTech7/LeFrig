'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminApi } from '@/lib/useAdminApi';
import type { DashboardMetrics } from '@/lib/types';

const navGroups = [
  {
    label: 'Comando',
    links: [
      { href: '/', label: 'Centro de mando', icon: '◈', badgeKey: null },
      { href: '/analytics', label: 'Analytics', icon: '◎', badgeKey: null },
      { href: '/camps', label: 'Campamentos', icon: '⬡', badgeKey: null },
      { href: '/audit', label: 'Auditoría', icon: '◷', badgeKey: null },
    ],
  },
  {
    label: 'Plataforma',
    links: [
      { href: '/users', label: 'Usuarios', icon: '◉', badgeKey: null },
      { href: '/listings', label: 'Anuncios', icon: '▣', badgeKey: 'pendingListings' as const },
      { href: '/shops', label: 'Tiendas', icon: '◫', badgeKey: null },
      { href: '/orders', label: 'Pedidos', icon: '◧', badgeKey: 'ordersCount' as const },
      { href: '/cash', label: 'Efectivo PIN', icon: '◈', badgeKey: null },
      { href: '/transport', label: 'Transporte', icon: '⬢', badgeKey: 'transportCount' as const },
      { href: '/jobs', label: 'Empleo', icon: '◈', badgeKey: null },
      { href: '/needs', label: 'Necesidades', icon: '◇', badgeKey: null },
      { href: '/community', label: 'Comunidad', icon: '◉', badgeKey: null },
      { href: '/drivers', label: 'Conductores', icon: '⬡', badgeKey: null },
    ],
  },
  {
    label: 'Seguridad',
    links: [
      { href: '/moderation', label: 'Moderación', icon: '⬡', badgeKey: 'pendingReports' as const },
      { href: '/disputes', label: 'Disputas', icon: '⚖', badgeKey: 'openDisputes' as const },
    ],
  },
  {
    label: 'Sistema',
    links: [{ href: '/settings', label: 'Configuración', icon: '⚙', badgeKey: null }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
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
    <aside
      style={{
        width: 272,
        minHeight: '100vh',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--adm-border)',
        background: 'linear-gradient(180deg, var(--adm-surface) 0%, var(--adm-void) 100%)',
        padding: '24px 14px',
      }}
    >
      <div style={{ padding: '0 10px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--adm-gold), var(--adm-emerald-deep))',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: '1.1rem',
              color: '#05080c',
              boxShadow: 'var(--adm-glow-gold)',
            }}
          >
            L
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Lefrig</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--adm-gold)', textTransform: 'uppercase' }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto' }}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div style={{ padding: '0 10px 8px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--adm-muted)' }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.links.map((link) => {
                const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const b = badge(link.badgeKey);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: active ? 'var(--adm-text)' : 'var(--adm-muted)',
                      background: active ? 'linear-gradient(90deg, rgba(13,148,136,0.25), rgba(13,148,136,0.05))' : 'transparent',
                      border: active ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ width: 28, textAlign: 'center', fontSize: '0.9rem', color: active ? 'var(--adm-emerald)' : 'inherit' }}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {b ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: active ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)', color: active ? 'var(--adm-emerald)' : 'var(--adm-gold)' }}>
                        {b}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="adm-glass" style={{ margin: '0 6px', padding: '14px 16px', fontSize: '0.78rem', color: 'var(--adm-muted)', lineHeight: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="adm-live-dot" />
          <strong style={{ color: 'var(--adm-emerald)', fontWeight: 700 }}>Operativo</strong>
        </div>
        {metrics ? `${metrics.usersCount.toLocaleString()} usuarios · ${metrics.listingsCount} anuncios` : 'Cargando métricas…'}
      </div>
    </aside>
  );
}

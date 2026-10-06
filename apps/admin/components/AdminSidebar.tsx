'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminApi } from '@/lib/useAdminApi';
import type { DashboardMetrics } from '@/lib/types';

type NavIcon =
  | 'home'
  | 'chart'
  | 'camp'
  | 'audit'
  | 'users'
  | 'ads'
  | 'shop'
  | 'orders'
  | 'cash'
  | 'truck'
  | 'jobs'
  | 'needs'
  | 'community'
  | 'drivers'
  | 'shield'
  | 'scale'
  | 'settings';

const navGroups: {
  label: string;
  links: { href: string; label: string; icon: NavIcon; badgeKey: keyof DashboardMetrics | null }[];
}[] = [
  {
    label: 'Comando',
    links: [
      { href: '/', label: 'Centro de mando', icon: 'home', badgeKey: null },
      { href: '/analytics', label: 'Analytics', icon: 'chart', badgeKey: null },
      { href: '/camps', label: 'Campamentos', icon: 'camp', badgeKey: null },
      { href: '/audit', label: 'Auditoría', icon: 'audit', badgeKey: null },
    ],
  },
  {
    label: 'Plataforma',
    links: [
      { href: '/users', label: 'Usuarios', icon: 'users', badgeKey: null },
      { href: '/listings', label: 'Anuncios', icon: 'ads', badgeKey: 'pendingListings' },
      { href: '/shops', label: 'Tiendas', icon: 'shop', badgeKey: null },
      { href: '/services', label: 'Servicios', icon: 'jobs', badgeKey: null },
      { href: '/orders', label: 'Pedidos', icon: 'orders', badgeKey: 'ordersCount' },
      { href: '/cash', label: 'Efectivo PIN', icon: 'cash', badgeKey: null },
      { href: '/transport', label: 'Transporte', icon: 'truck', badgeKey: 'transportCount' },
      { href: '/jobs', label: 'Empleo', icon: 'jobs', badgeKey: null },
      { href: '/needs', label: 'Necesidades', icon: 'needs', badgeKey: null },
      { href: '/community', label: 'Comunidad', icon: 'community', badgeKey: null },
      { href: '/drivers', label: 'Conductores', icon: 'drivers', badgeKey: null },
    ],
  },
  {
    label: 'Seguridad',
    links: [
      { href: '/moderation', label: 'Moderación', icon: 'shield', badgeKey: 'pendingReports' },
      { href: '/disputes', label: 'Disputas', icon: 'scale', badgeKey: 'openDisputes' },
    ],
  },
  {
    label: 'Sistema',
    links: [{ href: '/settings', label: 'Configuración', icon: 'settings', badgeKey: null }],
  },
];

function NavGlyph({ name }: { name: NavIcon }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 15v-4M12 15V8M16 15v-6" />
        </svg>
      );
    case 'camp':
      return (
        <svg {...common}>
          <path d="M4 19h16M6 19 12 6l6 13" />
          <path d="M9.5 19 12 13l2.5 6" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 3.5 3.5" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M15.5 19a4 4 0 0 1 5-3.7" />
        </svg>
      );
    case 'ads':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...common}>
          <path d="M4 9h16l-1.2 10H5.2z" />
          <path d="M8 9V7a4 4 0 0 1 8 0v2" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <path d="M7 7h13l-1.5 9H8.2L6 4H3" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      );
    case 'cash':
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.4" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
          <circle cx="7.5" cy="18.5" r="1.5" />
          <circle cx="17.5" cy="18.5" r="1.5" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        </svg>
      );
    case 'needs':
      return (
        <svg {...common}>
          <path d="M12 20s7-4.5 7-10a4 4 0 0 0-7-2.5A4 4 0 0 0 5 10c0 5.5 7 10 7 10z" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3.5 18a4.5 4.5 0 0 1 9 0M11.5 18a4.5 4.5 0 0 1 9 0" />
        </svg>
      );
    case 'drivers':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...common}>
          <path d="M12 3v18M5 8h14M7 8 5 14h4zm10 0-2 6h4z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
        </svg>
      );
    default:
      return null;
  }
}

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
    <aside className="adm-sidebar">
      <div className="adm-sidebar__brand">
        <div className="adm-sidebar__mark">L</div>
        <div>
          <div className="adm-sidebar__name">Lefrig</div>
          <div className="adm-sidebar__tag">Sovereign Ops</div>
        </div>
      </div>

      <nav className="adm-sidebar__nav">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="adm-sidebar__group-label">{group.label}</div>
            <div className="adm-sidebar__links">
              {group.links.map((link) => {
                const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const b = badge(link.badgeKey);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`adm-nav-link${active ? ' adm-nav-link--active' : ''}`}
                  >
                    <span className="adm-nav-link__icon">
                      <NavGlyph name={link.icon} />
                    </span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {b ? <span className="adm-nav-link__badge">{b}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="adm-sidebar__status">
        <div className="adm-sidebar__status-row">
          <span className="adm-live-dot" />
          <strong>Operativo</strong>
        </div>
        {metrics
          ? `${metrics.usersCount.toLocaleString('es-ES')} usuarios · ${metrics.listingsCount} anuncios`
          : 'Cargando métricas…'}
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import type { AdminOverview } from '@/lib/types';
import { BarChart, DonutChart, Sparkline } from './pro/Charts';
import { LiveClock, RelativeTime } from './pro/LiveClock';
import { StatusBadge } from './AdminUI';

const statusColors: Record<string, string> = {
  active: 'var(--adm-emerald)',
  draft: 'var(--adm-gold)',
  pending_review: 'var(--adm-sky)',
  rejected: 'var(--adm-coral)',
  pending: 'var(--adm-gold)',
};

function KpiPro({
  label,
  value,
  sub,
  icon,
  accent,
  spark,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  accent: string;
  spark?: number[];
}) {
  return (
    <div className="adm-card adm-kpi-pro adm-card--interactive" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="adm-kpi-pro__icon">{icon}</span>
      <p className="adm-kpi__label">{label}</p>
      <p className="adm-kpi__value">{typeof value === 'number' ? value.toLocaleString('es-ES') : value}</p>
      {sub ? <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{sub}</p> : null}
      {spark ? (
        <div style={{ marginTop: 12 }}>
          <Sparkline points={spark} color={accent} />
        </div>
      ) : null}
    </div>
  );
}

function timeAgo(iso: string) {
  return <RelativeTime iso={iso} />;
}

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const { metrics, campActivity, listingsByStatus, weeklyTrend, recentActivity, recentUsers } = overview;
  const maxCamp = Math.max(...campActivity.map((c) => c.users), 1);

  const donutSegments = listingsByStatus.map((l) => ({
    label: l.status.replace(/_/g, ' '),
    value: l.count,
    color: statusColors[l.status] ?? 'var(--adm-violet)',
  }));

  const sparkFromTrend = weeklyTrend.map((d) => d.count);
  const hasAlerts = metrics.pendingReports > 0 || metrics.openDisputes > 0;

  return (
    <div style={{ animation: 'adm-rise 0.45s ease-out' }}>
      {hasAlerts ? (
        <div className="adm-alert-banner">
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>Cola de atención prioritaria</strong>
            <span style={{ color: 'var(--adm-muted)', fontSize: '0.875rem' }}>
              {metrics.pendingReports} reportes · {metrics.openDisputes} disputas ·{' '}
              {metrics.pendingListings ?? 0} anuncios por revisar
            </span>
          </div>
          <Link href="/moderation" className="adm-btn adm-btn--primary">
            Gestionar →
          </Link>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="adm-page-title">Centro de mando</h1>
          <p className="adm-page-sub">
            Operaciones Lefrig · {metrics.ordersLast7Days ?? 0} pedidos esta semana · datos en vivo
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/analytics" className="adm-btn adm-btn--ghost">Analytics</Link>
          <Link href="/audit" className="adm-btn adm-btn--ghost">Auditoría</Link>
          <Link href="/camps" className="adm-btn adm-btn--primary">Campamentos</Link>
        </div>
      </div>

      <div className="adm-stat-grid" style={{ marginBottom: 24 }}>
        <KpiPro label="Usuarios" value={metrics.usersCount} icon="◉" accent="var(--adm-emerald)" spark={sparkFromTrend} sub="Registrados en plataforma" />
        <KpiPro label="Anuncios activos" value={metrics.listingsCount} icon="▣" accent="var(--adm-gold)" sub={`${metrics.pendingListings ?? 0} pendientes revisión`} />
        <KpiPro label="Pedidos totales" value={metrics.ordersCount} icon="◧" accent="var(--adm-sky)" spark={sparkFromTrend} />
        <KpiPro label="Tiendas" value={metrics.shopsCount} icon="◫" accent="var(--adm-violet)" />
        <KpiPro label="Transporte" value={metrics.transportCount} icon="⬢" accent="var(--adm-emerald-deep)" sub="Viajes activos" />
        <KpiPro label="Reportes" value={metrics.pendingReports} icon="⬡" accent="var(--adm-coral)" sub="Pendientes" />
        <KpiPro label="Disputas" value={metrics.openDisputes} icon="⚖" accent="var(--adm-coral)" />
        <KpiPro
          label="Efectivo PIN"
          value={metrics.pendingCashAgreements ?? 0}
          icon="◈"
          accent="var(--adm-gold)"
          sub="Acuerdos pendientes"
        />
      </div>

      <div className="adm-grid-2" style={{ marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h2 className="adm-section-title"><span className="adm-live-dot" /> Pedidos — últimos 7 días</h2>
          <BarChart
            data={weeklyTrend.map((d) => ({ label: d.label, value: d.count }))}
            color="var(--adm-emerald)"
            height={160}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--adm-border)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Semana</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>{metrics.ordersLast7Days ?? 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Volumen est.</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: 'var(--adm-gold)' }}>— duros</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conversión</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: 'var(--adm-emerald)' }}>—</div>
            </div>
          </div>
        </div>

        <div className="adm-card" style={{ padding: 24 }}>
          <h2 className="adm-section-title">Estado de anuncios</h2>
          {donutSegments.length > 0 ? (
            <DonutChart segments={donutSegments} />
          ) : (
            <p style={{ color: 'var(--adm-muted)' }}>Sin datos de anuncios</p>
          )}
        </div>
      </div>

      <div className="adm-grid-2" style={{ marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h2 className="adm-section-title">◈ Densidad por campamento</h2>
          {campActivity.map((c) => (
            <div key={c.campId} className="adm-camp-row">
              <span style={{ width: 80, fontSize: '0.82rem', fontWeight: 600 }}>{c.campName}</span>
              <div className="adm-camp-bar-bg">
                <div className="adm-camp-bar-fill" style={{ width: `${(c.users / maxCamp) * 100}%` }} />
              </div>
              <span style={{ fontFamily: 'var(--adm-mono)', fontSize: '0.78rem', color: 'var(--adm-muted)', width: 40, textAlign: 'right' }}>
                {c.users}
              </span>
            </div>
          ))}
        </div>

        <div className="adm-card" style={{ padding: 24 }}>
          <h2 className="adm-section-title">◷ Actividad reciente</h2>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--adm-muted)' }}>Sin actividad reciente</p>
          ) : (
            recentActivity.map((a) => (
              <div key={`${a.type}-${a.id}`} className="adm-feed-item">
                <div className="adm-feed-icon">{a.type === 'report' ? '🛡️' : '📦'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{a.subtitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={a.status} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', marginTop: 6 }}>{timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="adm-grid-3">
        <div className="adm-card" style={{ padding: 24 }}>
          <h2 className="adm-section-title">▸ Acciones rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: '/moderation', icon: '🛡️', label: 'Cola de moderación' },
              { href: '/disputes', icon: '⚖️', label: 'Resolver disputas' },
              { href: '/listings', icon: '📋', label: 'Revisar anuncios' },
              { href: '/users', icon: '👥', label: 'Verificar usuarios' },
              { href: '/transport', icon: '🚐', label: 'Monitor transporte' },
              { href: '/cash', icon: '💵', label: 'Efectivo PIN pendiente' },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="adm-quick-action">
                <span>{a.icon}</span> {a.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="adm-card" style={{ padding: 24, gridColumn: 'span 2' }}>
          <h2 className="adm-section-title">Nuevos usuarios</h2>
          <div className="adm-table-wrap" style={{ border: 'none' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Verificación</th>
                  <th>Registro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.displayName}</td>
                    <td><StatusBadge status={u.verificationLevel} /></td>
                    <td style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{timeAgo(u.createdAt)}</td>
                    <td>
                      <Link href="/users" className="adm-btn adm-btn--ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="adm-card adm-glass" style={{ marginTop: 24, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Salud del ecosistema Lefrig</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginTop: 4 }}>
            Monitoreo de servicios críticos · última sync <LiveClock />
          </div>
        </div>
        {['API', 'PostgreSQL', 'Redis', 'Clerk', 'Meilisearch'].map((s) => (
          <div key={s} style={{ textAlign: 'center', minWidth: 64 }}>
            <span className="adm-live-dot" style={{ display: 'block', margin: '0 auto 6px' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--adm-muted)', fontWeight: 700 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

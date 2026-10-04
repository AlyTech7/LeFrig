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

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const { metrics, campActivity, listingsByStatus, weeklyTrend, recentActivity, recentUsers } = overview;
  const maxCamp = Math.max(...campActivity.map((c) => c.users), 1);
  const spark = weeklyTrend.map((d) => d.count);
  const hasAlerts = metrics.pendingReports > 0 || metrics.openDisputes > 0;

  const donutSegments = listingsByStatus.map((l) => ({
    label: l.status.replace(/_/g, ' '),
    value: l.count,
    color: statusColors[l.status] ?? 'var(--adm-violet)',
  }));

  return (
    <div className="adm-stage">
      <section className="adm-masthead">
        <article className="adm-masthead__story">
          <div>
            <div className="adm-masthead__kicker">Atlas Control · en vivo</div>
            <h1 className="adm-masthead__title">El pulso del Sáhara</h1>
            <p className="adm-masthead__lede">
              Una lectura clara de pedidos, confianza y densidad en campamentos — sin ruido, con mando.
            </p>
          </div>
          <div className="adm-masthead__foot">
            <Link href="/analytics" className="adm-btn">
              Ver analytics
            </Link>
            <Link href="/camps" className="adm-btn adm-btn--primary">
              Abrir campamentos
            </Link>
          </div>
        </article>

        <div className="adm-masthead__stack">
          <div className="adm-stat-tile">
            <div className="adm-stat-tile__label">Pedidos / 7 días</div>
            <div className="adm-stat-tile__value">{(metrics.ordersLast7Days ?? 0).toLocaleString('es-ES')}</div>
            <div className="adm-stat-tile__sub">Ritmo semanal de la plaza</div>
            <div style={{ marginTop: 12 }}>
              <Sparkline points={spark} color="var(--adm-forest)" />
            </div>
          </div>
          <div className="adm-stat-tile">
            <div className="adm-stat-tile__label">Usuarios</div>
            <div className="adm-stat-tile__value">{metrics.usersCount.toLocaleString('es-ES')}</div>
            <div className="adm-stat-tile__sub">{metrics.listingsCount} anuncios activos</div>
          </div>
          <div className="adm-stat-tile">
            <div className="adm-stat-tile__label">Atención</div>
            <div className="adm-stat-tile__value" style={{ color: 'var(--adm-signal)' }}>
              {metrics.pendingReports + metrics.openDisputes}
            </div>
            <div className="adm-stat-tile__sub">
              {metrics.pendingReports} reportes · {metrics.openDisputes} disputas
            </div>
          </div>
        </div>
      </section>

      {hasAlerts ? (
        <div className="adm-dock" role="status">
          <div>
            <strong>Cola prioritaria</strong>
            <p>
              {metrics.pendingReports} reportes · {metrics.openDisputes} disputas · {metrics.pendingListings ?? 0}{' '}
              anuncios
            </p>
          </div>
          <Link href="/moderation" className="adm-btn adm-btn--primary">
            Gestionar
          </Link>
        </div>
      ) : null}

      <div className="adm-horizon">
        <div className="adm-card adm-panel adm-horizon__4">
          <div className="adm-stat-tile__label">Tiendas</div>
          <div className="adm-stat-tile__value" style={{ fontSize: '2.2rem', marginTop: 10 }}>
            {metrics.shopsCount}
          </div>
        </div>
        <div className="adm-card adm-panel adm-horizon__4">
          <div className="adm-stat-tile__label">Transporte</div>
          <div className="adm-stat-tile__value" style={{ fontSize: '2.2rem', marginTop: 10 }}>
            {metrics.transportCount}
          </div>
        </div>
        <div className="adm-card adm-panel adm-horizon__4">
          <div className="adm-stat-tile__label">Efectivo PIN</div>
          <div className="adm-stat-tile__value" style={{ fontSize: '2.2rem', marginTop: 10 }}>
            {metrics.pendingCashAgreements ?? 0}
          </div>
        </div>

        <div className="adm-card adm-panel adm-horizon__7">
          <h2 className="adm-section-title" style={{ marginBottom: 18 }}>
            Pedidos · últimos 7 días
          </h2>
          <BarChart
            data={weeklyTrend.map((d) => ({ label: d.label, value: d.count }))}
            color="var(--adm-forest)"
            height={170}
          />
        </div>

        <div className="adm-card adm-panel adm-horizon__5">
          <h2 className="adm-section-title" style={{ marginBottom: 18 }}>
            Estado de anuncios
          </h2>
          {donutSegments.length > 0 ? (
            <DonutChart segments={donutSegments} />
          ) : (
            <p style={{ color: 'var(--adm-muted)' }}>Sin datos</p>
          )}
        </div>

        <div className="adm-card adm-panel adm-horizon__6">
          <h2 className="adm-section-title" style={{ marginBottom: 18 }}>
            Densidad por campamento
          </h2>
          {campActivity.map((c) => (
            <div key={c.campId} className="adm-camp-row">
              <span style={{ width: 88, fontWeight: 700, fontSize: '0.86rem' }}>{c.campName}</span>
              <div className="adm-camp-bar-bg">
                <div className="adm-camp-bar-fill" style={{ width: `${(c.users / maxCamp) * 100}%` }} />
              </div>
              <span style={{ fontFamily: 'var(--adm-mono)', fontSize: '0.78rem', color: 'var(--adm-muted)', width: 36, textAlign: 'right' }}>
                {c.users}
              </span>
            </div>
          ))}
        </div>

        <div className="adm-card adm-panel adm-horizon__6">
          <h2 className="adm-section-title" style={{ marginBottom: 10 }}>
            Acciones rápidas
          </h2>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {[
              { href: '/moderation', label: 'Cola de moderación' },
              { href: '/disputes', label: 'Resolver disputas' },
              { href: '/listings', label: 'Revisar anuncios' },
              { href: '/users', label: 'Verificar usuarios' },
              { href: '/transport', label: 'Monitor transporte' },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="adm-quick-action">
                <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--adm-copper)' }} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="adm-card adm-panel adm-horizon__5">
          <h2 className="adm-section-title" style={{ marginBottom: 10 }}>
            Actividad reciente
          </h2>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--adm-muted)', marginTop: 12 }}>Sin actividad reciente</p>
          ) : (
            recentActivity.map((a) => (
              <div key={`${a.type}-${a.id}`} className="adm-feed-item">
                <div className="adm-feed-icon">{a.type === 'report' ? 'R' : 'P'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', marginTop: 3 }}>{a.subtitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={a.status} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', marginTop: 6 }}>
                    <RelativeTime iso={a.createdAt} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="adm-card adm-panel adm-horizon__7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="adm-section-title">Nuevos usuarios</h2>
            <Link href="/users" className="adm-btn adm-btn--ghost" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
              Ver todos
            </Link>
          </div>
          <div className="adm-table-wrap" style={{ border: 'none' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Verificación</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.displayName}</td>
                    <td>
                      <StatusBadge status={u.verificationLevel} />
                    </td>
                    <td style={{ color: 'var(--adm-muted)' }}>
                      <RelativeTime iso={u.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adm-card adm-panel adm-horizon__12" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: 'var(--adm-display)', fontSize: '1.3rem', fontWeight: 600 }}>Salud del ecosistema</div>
            <div style={{ color: 'var(--adm-muted)', marginTop: 4, fontSize: '0.9rem' }}>
              Sync · <LiveClock />
            </div>
          </div>
          {['API', 'PostgreSQL', 'Redis', 'Clerk', 'Meilisearch'].map((s) => (
            <div key={s} style={{ textAlign: 'center', minWidth: 70 }}>
              <span className="adm-live-dot" style={{ display: 'block', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--adm-muted)' }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

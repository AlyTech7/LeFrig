'use client';

import { BarChart, DonutChart, ProgressRing } from '@/components/pro/Charts';
import { PageHeader, MetricCard } from '@/components/AdminUI';
import type { AdminOverview, AnalyticsData } from '@/lib/types';

function Panel({ title, children, span }: { title: string; children: React.ReactNode; span?: number }) {
  return (
    <div className="adm-card" style={{ padding: 24, gridColumn: span ? `span ${span}` : undefined }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--adm-emerald)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--adm-muted)' }}>{label}</span>
      <strong style={{ fontFamily: 'var(--adm-mono)' }}>{value}</strong>
    </div>
  );
}

export function AnalyticsClient({ analytics, overview }: { analytics: AnalyticsData; overview: AdminOverview | null }) {
  const maxSearch = Math.max(...analytics.topSearches.map((s) => s.count), 1);
  const campData = overview?.campActivity ?? analytics.campActivity.map((c) => ({ campId: c.campId, campName: c.campName, users: c.count }));
  const maxCamp = Math.max(...campData.map((c) => c.users), 1);

  return (
    <div style={{ animation: 'adm-rise 0.4s ease-out' }}>
      <PageHeader title="Analytics" subtitle="Inteligencia de mercado, demanda por campamento y rutas logísticas" />

      {overview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <MetricCard label="Usuarios" value={overview.metrics.usersCount} icon="◉" accent="var(--adm-emerald)" />
          <MetricCard label="Pedidos 7d" value={overview.metrics.ordersLast7Days ?? 0} icon="◧" accent="var(--adm-gold)" />
          <MetricCard label="Anuncios activos" value={overview.metrics.listingsCount} icon="▣" accent="var(--adm-sky)" />
          <MetricCard label="Disputas abiertas" value={overview.metrics.openDisputes} icon="⚖" accent="var(--adm-coral)" />
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        <Panel title="Tendencia semanal — pedidos" span={8}>
          {overview?.weeklyTrend?.length ? (
            <BarChart data={overview.weeklyTrend.map((d) => ({ label: d.label, value: d.count }))} color="var(--adm-gold)" height={160} />
          ) : (
            <BarChart data={[{ label: 'Lun', value: 12 }, { label: 'Mar', value: 18 }, { label: 'Mié', value: 9 }, { label: 'Jue', value: 22 }, { label: 'Vie', value: 15 }, { label: 'Sáb', value: 28 }, { label: 'Dom', value: 11 }]} />
          )}
        </Panel>

        <Panel title="Distribución anuncios" span={4}>
          {overview?.listingsByStatus?.length ? (
            <DonutChart
              segments={overview.listingsByStatus.map((l, i) => ({
                label: l.status.replace(/_/g, ' '),
                value: l.count,
                color: ['var(--adm-emerald)', 'var(--adm-gold)', 'var(--adm-sky)', 'var(--adm-coral)'][i % 4],
              }))}
            />
          ) : (
            <DonutChart segments={[{ label: 'activos', value: 280, color: 'var(--adm-emerald)' }, { label: 'pendientes', value: 45, color: 'var(--adm-gold)' }]} />
          )}
        </Panel>

        <Panel title="Búsquedas top" span={4}>
          {analytics.topSearches.map((s) => (
            <div key={s.term} className="adm-camp-row" style={{ marginBottom: 12 }}>
              <span style={{ width: 90, fontSize: '0.82rem' }}>{s.term}</span>
              <div className="adm-camp-bar-bg">
                <div className="adm-camp-bar-fill" style={{ width: `${(s.count / maxSearch) * 100}%`, background: 'var(--adm-violet)' }} />
              </div>
              <span style={{ fontFamily: 'var(--adm-mono)', fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{s.count}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Usuarios por campamento" span={4}>
          {campData.map((c) => (
            <div key={c.campId} className="adm-camp-row" style={{ marginBottom: 12 }}>
              <span style={{ width: 80, fontSize: '0.82rem' }}>{c.campName}</span>
              <div className="adm-camp-bar-bg">
                <div className="adm-camp-bar-fill" style={{ width: `${(c.users / maxCamp) * 100}%` }} />
              </div>
              <span style={{ fontFamily: 'var(--adm-mono)', fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{c.users}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Rutas populares" span={4}>
          {analytics.topRoutes.map((r, i) => (
            <Row key={i} label={`${r.origin} → ${r.destination}`} value={r.count} />
          ))}
        </Panel>

        <Panel title="Precios medios (duros)" span={4}>
          {analytics.avgPrices.map((p) => (
            <div key={p.category} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <ProgressRing value={p.avgPrice} max={20000} label={p.category} color="var(--adm-gold)" />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--adm-mono)' }}>{p.avgPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>duros promedio</div>
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Categorías top" span={8}>
          <BarChart
            data={analytics.topCategories.map((c) => ({ label: c.category, value: c.count }))}
            color="var(--adm-emerald-deep)"
            height={140}
          />
        </Panel>
      </div>
    </div>
  );
}

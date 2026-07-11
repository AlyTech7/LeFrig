'use client';

import { BarChart } from '@/components/pro/Charts';
import { PageHeader, StatusBadge } from '@/components/AdminUI';
import type { AdminCampRow } from '@/lib/types';

export function CampsClient({ initial }: { initial: AdminCampRow[] }) {
  const totalUsers = initial.reduce((a, c) => a + c.users, 0);
  const maxUsers = Math.max(...initial.map((c) => c.users), 1);

  return (
    <div style={{ animation: 'adm-rise 0.4s ease-out' }}>
      <PageHeader
        title="Campamentos"
        subtitle="Red territorial saharaui — usuarios, comercio y actividad por campamento"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="adm-badge adm-badge--info">{initial.length} campamentos</span>
            <span className="adm-badge adm-badge--success">{totalUsers.toLocaleString()} usuarios</span>
          </div>
        }
      />

      <div className="adm-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--adm-gold)' }}>
          Distribución de usuarios
        </h3>
        <BarChart data={initial.map((c) => ({ label: c.nameEs.slice(0, 6), value: c.users }))} color="var(--adm-emerald)" height={120} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {initial.map((camp) => (
          <div key={camp.id} className="adm-card adm-card--interactive" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{camp.nameEs}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--adm-muted)', direction: 'rtl' }}>{camp.nameAr}</p>
              </div>
              {camp.isTindouf ? <StatusBadge status="trusted" /> : <StatusBadge status="active" />}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="adm-camp-bar-bg" style={{ height: 8 }}>
                <div className="adm-camp-bar-fill" style={{ width: `${(camp.users / maxUsers) * 100}%` }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--adm-mono)', color: 'var(--adm-emerald)' }}>{camp.users}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usuarios</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--adm-mono)', color: 'var(--adm-gold)' }}>{camp.listings}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anuncios</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--adm-mono)', color: 'var(--adm-sky)' }}>{camp.shops}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tiendas</div>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--adm-border)', fontSize: '0.75rem', color: 'var(--adm-muted)', fontFamily: 'var(--adm-mono)' }}>
              /{camp.slug}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { PageHeader, StatusBadge } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';

const sections = [
  {
    id: 'general',
    title: 'General',
    icon: '◈',
    fields: [
      { key: 'platformName', label: 'Nombre de plataforma', value: 'Lefrig', type: 'text' },
      { key: 'defaultCurrency', label: 'Moneda por defecto', value: 'MRU', type: 'text' },
      { key: 'maintenanceMode', label: 'Modo mantenimiento', value: false, type: 'toggle' },
    ],
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: '⬡',
    fields: [
      { key: 'requireKyc', label: 'KYC obligatorio para vender', value: true, type: 'toggle' },
      { key: 'autoModerate', label: 'Moderación automática de anuncios', value: false, type: 'toggle' },
      { key: 'sessionTimeout', label: 'Timeout sesión admin (min)', value: '60', type: 'text' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    icon: '◎',
    fields: [
      { key: 'emailAlerts', label: 'Alertas por email', value: true, type: 'toggle' },
      { key: 'disputeAlerts', label: 'Notificar nuevas disputas', value: true, type: 'toggle' },
      { key: 'reportDigest', label: 'Resumen diario de reportes', value: false, type: 'toggle' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    icon: '⚙',
    readOnly: true,
    fields: [
      { key: 'clerk', label: 'Clerk Auth', value: 'Conectado', type: 'status' },
      { key: 'meilisearch', label: 'Meilisearch', value: 'Configurado', type: 'status' },
      { key: 'postgres', label: 'PostgreSQL', value: 'Activo', type: 'status' },
      { key: 'redis', label: 'Redis', value: 'Caché + rate limit', type: 'status' },
    ],
  },
] as const;

export function SettingsClient() {
  const { request } = useAdminApi();
  const [active, setActive] = useState('general');
  const [saved, setSaved] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    maintenanceMode: false,
    requireKyc: true,
    autoModerate: false,
    emailAlerts: true,
    disputeAlerts: true,
    reportDigest: false,
  });

  const section = sections.find((s) => s.id === active)!;

  const save = async () => {
    try {
      await request('/admin/actions/log', { method: 'POST', body: JSON.stringify({ action: 'update_settings', resource: active }) });
    } catch {
      /* demo */
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reindexSearch = async () => {
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await request<{ indexed: number }>('/admin/search/reindex', { method: 'POST' });
      setReindexResult(`${res.indexed} anuncios indexados en Meilisearch`);
    } catch {
      setReindexResult('Error al reindexar. Verifica que la API y Meilisearch estén activos.');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div style={{ animation: 'adm-rise 0.4s ease-out' }}>
      <PageHeader
        title="Configuración"
        subtitle="Parámetros del command center, seguridad e integraciones"
        action={
          <button type="button" className="adm-btn adm-btn--primary" onClick={save}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        <nav className="adm-card" style={{ padding: 8 }}>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 14px',
                border: 'none',
                borderRadius: 10,
                background: active === s.id ? 'rgba(13,148,136,0.2)' : 'transparent',
                color: active === s.id ? 'var(--adm-text)' : 'var(--adm-muted)',
                fontWeight: active === s.id ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <span>{s.icon}</span>
              {s.title}
            </button>
          ))}
        </nav>

        <div className="adm-card" style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '1.15rem', fontWeight: 800 }}>{section.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {section.fields.map((field) => (
              <div
                key={field.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid var(--adm-border)',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{field.label}</div>
                  {'readOnly' in section && section.readOnly ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)' }}>Solo lectura — gestionado por infraestructura</div>
                  ) : null}
                </div>
                {field.type === 'toggle' ? (
                  <button
                    type="button"
                    className={`adm-toggle ${toggles[field.key as keyof typeof toggles] ? 'adm-toggle--on' : ''}`}
                    onClick={() => setToggles((t) => ({ ...t, [field.key]: !t[field.key as keyof typeof toggles] }))}
                    aria-pressed={toggles[field.key as keyof typeof toggles]}
                  />
                ) : field.type === 'status' ? (
                  <StatusBadge status="active" />
                ) : (
                  <input className="adm-input" defaultValue={String(field.value)} style={{ width: 200, textAlign: 'right' }} readOnly={'readOnly' in section && section.readOnly} />
                )}
              </div>
            ))}
          </div>

          {active === 'integrations' && (
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--adm-border)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Búsqueda Meilisearch</h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--adm-muted)' }}>
                Reindexa todos los anuncios activos del marketplace.
              </p>
              <button
                type="button"
                className="adm-btn adm-btn--primary"
                onClick={reindexSearch}
                disabled={reindexing}
              >
                {reindexing ? 'Indexando...' : 'Reindexar anuncios'}
              </button>
              {reindexResult && (
                <p style={{ margin: '12px 0 0', fontSize: '0.875rem', color: 'var(--adm-emerald)' }}>{reindexResult}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

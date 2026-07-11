'use client';

export function AdminApiBanner({ usingDemo }: { usingDemo: boolean }) {
  if (!usingDemo) return null;

  return (
    <div
      className="adm-alert-banner"
      style={{ marginBottom: 24, background: 'rgba(232,184,109,0.12)', borderColor: 'rgba(232,184,109,0.35)' }}
    >
      <span style={{ fontSize: '1.25rem' }}>⚠</span>
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>Datos demo — API no disponible</strong>
        <span style={{ color: 'var(--adm-muted)', fontSize: '0.875rem' }}>
          Inicia la API en :3001 y asegúrate de tener rol admin en Clerk para ver datos reales.
        </span>
      </div>
    </div>
  );
}

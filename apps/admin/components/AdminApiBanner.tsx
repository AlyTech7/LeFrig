'use client';

export function AdminApiBanner({ usingDemo, errorHint }: { usingDemo: boolean; errorHint?: string }) {
  if (!usingDemo) return null;

  return (
    <div
      className="adm-alert-banner"
      style={{
        marginBottom: 24,
        background: 'rgba(184, 137, 45, 0.1)',
        borderColor: 'rgba(184, 137, 45, 0.28)',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(184, 137, 45, 0.16)',
          color: 'var(--adm-gold-dim)',
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        !
      </span>
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>Datos demo — API no disponible</strong>
        <span style={{ color: 'var(--adm-muted)', fontSize: '0.875rem' }}>
          No se pudo conectar con la API de producción. Comprueba tu sesión admin o vuelve a iniciar sesión.
        </span>
        {errorHint ? (
          <code
            style={{
              display: 'block',
              marginTop: 8,
              fontSize: '0.75rem',
              color: 'var(--adm-muted)',
              wordBreak: 'break-all',
            }}
          >
            {errorHint}
          </code>
        ) : null}
      </div>
    </div>
  );
}

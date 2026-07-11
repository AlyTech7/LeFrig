const variantMap: Record<string, string> = {
  active: 'success',
  verified: 'success',
  trusted: 'success',
  delivered: 'success',
  completed: 'success',
  pending: 'warning',
  pending_review: 'warning',
  in_transit: 'info',
  requested: 'info',
  accepted: 'info',
  reported: 'error',
  open: 'error',
  rejected: 'error',
  mediation: 'gold',
  redeemed: 'default',
};

export function StatusBadge({ status }: { status: string }) {
  const variant = variantMap[status] ?? 'default';
  return <span className={`adm-badge adm-badge--${variant}`}>{status.replace(/_/g, ' ')}</span>;
}

export function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="adm-card adm-kpi adm-card--interactive" style={{ borderTop: `3px solid ${accent ?? 'var(--adm-emerald-deep)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="adm-kpi__label">{label}</p>
          <p className="adm-kpi__value">{value}</p>
        </div>
        <span style={{ fontSize: '1.75rem', opacity: 0.9 }}>{icon}</span>
      </div>
    </div>
  );
}

export function AdminTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampFilter() {
  return (
    <select className="adm-select" defaultValue="">
      <option value="">Todos los campamentos</option>
      <option value="rabouni">Rabouni</option>
      <option value="smara">Smara</option>
      <option value="tindouf">Tindouf</option>
      <option value="dakhla">Dakhla</option>
      <option value="aaiun">Aaiún</option>
    </select>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 className="adm-page-title">{title}</h1>
        {subtitle ? <p className="adm-page-sub">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

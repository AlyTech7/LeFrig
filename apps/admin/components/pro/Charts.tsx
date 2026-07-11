'use client';

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = 'var(--adm-emerald)', height = 140 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            title={`${d.value}`}
            style={{
              width: '100%',
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              borderRadius: '8px 8px 2px 2px',
              background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 60%, black))`,
              transition: 'transform 0.2s',
            }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--adm-muted)', fontWeight: 600 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 160 }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 40;
  const c = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--adm-surface-3)" strokeWidth="12" />
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dash = pct * c;
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="50" y="48" textAnchor="middle" fill="var(--adm-text)" fontSize="14" fontWeight="800">
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="var(--adm-muted)" fontSize="6">
          total
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 140 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.82rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--adm-muted)' }}>{s.label}</span>
            <strong style={{ fontFamily: 'var(--adm-mono)' }}>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ points, color = '#34d399' }: { points: number[]; color?: string }) {
  const max = Math.max(...points, 1);
  const w = 140;
  const h = 40;
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`).join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#spark-fill)" points={`0,${h} ${coords} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={coords} />
    </svg>
  );
}

export function ProgressRing({ value, max, label, color = 'var(--adm-emerald)' }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? value / max : 0;
  const r = 36;
  const c = 2 * Math.PI * r;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--adm-surface-3)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${pct * c} ${c}`}
          transform="rotate(-90 44 44)"
          strokeLinecap="round"
        />
        <text x="44" y="48" textAnchor="middle" fill="var(--adm-text)" fontSize="16" fontWeight="800">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

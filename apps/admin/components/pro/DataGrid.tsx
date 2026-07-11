'use client';

import { useMemo, useState } from 'react';
import { StatusBadge } from '../AdminUI';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataGridProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = 'Buscar…',
  onRowClick,
  actions,
  emptyMessage = 'Sin resultados',
}: DataGridProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let rows = data;
    if (search.trim() && searchKeys.length) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="adm-card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--adm-border)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--adm-muted)' }}>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--adm-text)',
              fontSize: '0.875rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontFamily: 'var(--adm-mono)' }}>
          {filtered.length} registros
        </span>
        {actions}
      </div>

      <div className="adm-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table className="adm-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  {col.header}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--adm-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid var(--adm-border)',
          }}
        >
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StatusCell({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: 'var(--adm-mono)', fontSize: '0.82rem', ...style }}>{children}</span>;
}

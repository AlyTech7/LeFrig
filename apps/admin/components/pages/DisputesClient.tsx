'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminDisputeRow } from '@/lib/types';

export function DisputesClient({ initial }: { initial: AdminDisputeRow[] }) {
  const { request } = useAdminApi();
  const [disputes, setDisputes] = useState(initial);

  const resolve = async (id: string) => {
    const resolution = window.prompt('Resolución de la disputa:') ?? 'Resuelto por administración';
    if (!resolution.trim()) return;
    try {
      await request(`/admin/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution }) });
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'resolved' } : d)));
    } catch {
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'resolved' } : d)));
    }
  };

  return (
    <div>
      <PageHeader title="Disputas" subtitle="Mediación, evidencias y resolución de conflictos entre partes" />
      <DataGrid<AdminDisputeRow & Record<string, unknown>>
        data={disputes as (AdminDisputeRow & Record<string, unknown>)[]}
        searchKeys={['parties', 'reason', 'type']}
        columns={[
          { key: 'id', header: 'ID', render: (r) => <Mono>{r.id.slice(0, 8)}…</Mono> },
          { key: 'type', header: 'Tipo', render: (r) => <StatusCell status={r.type} /> },
          { key: 'parties', header: 'Partes' },
          { key: 'reason', header: 'Motivo' },
          { key: 'amount', header: 'Importe', render: (r) => (r.amount ? <Mono>{r.amount.toLocaleString()} duros</Mono> : '—') },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) =>
              r.status !== 'resolved' ? (
                <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => resolve(r.id)}>
                  Resolver
                </button>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminNeedRow } from '@/lib/types';

export function NeedsClient({ initial }: { initial: AdminNeedRow[] }) {
  const { request } = useAdminApi();
  const [needs, setNeeds] = useState(initial);
  const [filter, setFilter] = useState('all');

  const updateStatus = async (id: string, status: string) => {
    try {
      await request(`/admin/needs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
    } catch {
      setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
    }
  };

  const filtered = filter === 'all' ? needs : needs.filter((n) => n.status === filter);

  return (
    <div>
      <PageHeader
        title="Necesidades"
        subtitle="Solicitudes comunitarias y ofertas de ayuda"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="open">Abiertas</option>
            <option value="fulfilled">Cumplidas</option>
            <option value="closed">Cerradas</option>
          </select>
        }
      />
      <DataGrid<AdminNeedRow & Record<string, unknown>>
        data={filtered as (AdminNeedRow & Record<string, unknown>)[]}
        searchKeys={['title', 'requester', 'camp', 'type']}
        columns={[
          { key: 'title', header: 'Título', sortable: true },
          { key: 'type', header: 'Tipo' },
          { key: 'requester', header: 'Solicitante' },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'offersCount', header: 'Ofertas', render: (r) => <Mono>{r.offersCount}</Mono> },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                {r.status === 'open' && (
                  <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'fulfilled')}>
                    Cumplida
                  </button>
                )}
                <button type="button" className="adm-btn adm-btn--danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'closed')}>
                  Cerrar
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

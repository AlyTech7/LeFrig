'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminDiasporaRow } from '@/lib/types';

export function DiasporaClient({ initial }: { initial: AdminDiasporaRow[] }) {
  const { request } = useAdminApi();
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState('all');

  const updateStatus = async (id: string, status: string) => {
    try {
      await request(`/admin/diaspora/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader
        title="Diáspora"
        subtitle="Pedidos de ayuda desde la diáspora hacia campamentos"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="processing">En proceso</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        }
      />
      <DataGrid<AdminDiasporaRow & Record<string, unknown>>
        data={filtered as (AdminDiasporaRow & Record<string, unknown>)[]}
        searchKeys={['beneficiary', 'diasporaUser', 'orderType', 'camp']}
        columns={[
          { key: 'id', header: 'ID', render: (r) => <Mono>{r.id.slice(0, 8)}…</Mono> },
          { key: 'beneficiary', header: 'Beneficiario', sortable: true },
          { key: 'diasporaUser', header: 'Remitente' },
          { key: 'orderType', header: 'Tipo' },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'budget', header: 'Presupuesto', render: (r) => (r.budget != null ? <Mono>{r.budget.toLocaleString()} MRU</Mono> : '—') },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.status === 'pending' && (
                  <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'processing')}>
                    Procesar
                  </button>
                )}
                {r.status === 'processing' && (
                  <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'delivered')}>
                    Entregado
                  </button>
                )}
                {r.status !== 'cancelled' && r.status !== 'delivered' && (
                  <button type="button" className="adm-btn adm-btn--danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'cancelled')}>
                    Cancelar
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

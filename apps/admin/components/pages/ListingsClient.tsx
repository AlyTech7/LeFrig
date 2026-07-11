'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminListingRow } from '@/lib/types';

export function ListingsClient({ initial }: { initial: AdminListingRow[] }) {
  const { request } = useAdminApi();
  const [listings, setListings] = useState(initial);
  const [filter, setFilter] = useState('all');

  const moderate = async (id: string, status: string) => {
    try {
      await request(`/admin/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const filtered = filter === 'all' ? listings : listings.filter((l) => l.status === filter);

  return (
    <div>
      <PageHeader
        title="Anuncios"
        subtitle="Moderación, aprobación y control del marketplace saharaui"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending_review">Pendientes</option>
            <option value="draft">Borrador</option>
            <option value="rejected">Rechazados</option>
          </select>
        }
      />
      <DataGrid<AdminListingRow & Record<string, unknown>>
        data={filtered as (AdminListingRow & Record<string, unknown>)[]}
        searchKeys={['title', 'seller', 'camp', 'category']}
        columns={[
          { key: 'title', header: 'Título', sortable: true },
          { key: 'seller', header: 'Vendedor' },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'category', header: 'Categoría' },
          { key: 'price', header: 'Precio', sortable: true, render: (r) => <Mono>{r.price.toLocaleString()} MRU</Mono> },
          { key: 'viewCount', header: 'Views', render: (r) => <Mono>{r.viewCount}</Mono> },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => moderate(r.id, 'active')}>
                  Aprobar
                </button>
                <button type="button" className="adm-btn adm-btn--danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => moderate(r.id, 'rejected')}>
                  Rechazar
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminServiceRow } from '@/lib/types';

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Madrid',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPrice(row: AdminServiceRow) {
  if (row.priceFrom == null && row.priceTo == null) return 'A convenir';
  if (row.priceFrom != null && row.priceTo != null && row.priceFrom !== row.priceTo) {
    return `${row.priceFrom.toLocaleString()}–${row.priceTo.toLocaleString()} ${row.currency}`;
  }
  const v = row.priceFrom ?? row.priceTo;
  return `${Number(v).toLocaleString()} ${row.currency}`;
}

export function ServicesClient({ initial }: { initial: AdminServiceRow[] }) {
  const { request } = useAdminApi();
  const [services, setServices] = useState(initial);
  const [filter, setFilter] = useState('all');

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await request(`/admin/services/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
    } catch {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return services;
    if (filter === 'active') return services.filter((s) => s.isActive);
    if (filter === 'inactive') return services.filter((s) => !s.isActive);
    return services.filter((s) => s.categorySlug.includes(filter));
  }, [services, filter]);

  return (
    <div>
      <PageHeader
        title="Servicios"
        subtitle="Oficios publicados (electricistas, mecánicos, etc.) con fecha exacta de alta"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos ({services.length})</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="electrician">Electricistas</option>
            <option value="mechanic">Mecánicos</option>
          </select>
        }
      />
      <DataGrid<AdminServiceRow & Record<string, unknown>>
        data={filtered as (AdminServiceRow & Record<string, unknown>)[]}
        searchKeys={['title', 'provider', 'category', 'camps', 'providerPhone']}
        columns={[
          { key: 'title', header: 'Servicio', sortable: true },
          { key: 'category', header: 'Oficio', sortable: true },
          { key: 'provider', header: 'Proveedor', sortable: true },
          {
            key: 'providerPhone',
            header: 'Teléfono',
            render: (r) => <Mono>{r.providerPhone || '—'}</Mono>,
          },
          { key: 'camps', header: 'Campamentos' },
          {
            key: 'priceFrom',
            header: 'Precio',
            render: (r) => <Mono>{formatPrice(r)}</Mono>,
          },
          {
            key: 'createdAt',
            header: 'Alta',
            sortable: true,
            render: (r) => <Mono>{formatWhen(r.createdAt)}</Mono>,
          },
          {
            key: 'isActive',
            header: 'Estado',
            render: (r) => <StatusCell status={r.isActive ? 'active' : 'inactive'} />,
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <button
                type="button"
                className={`adm-btn ${r.isActive ? 'adm-btn--danger' : 'adm-btn--primary'}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                onClick={() => toggle(r.id, !r.isActive)}
              >
                {r.isActive ? 'Desactivar' : 'Activar'}
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}

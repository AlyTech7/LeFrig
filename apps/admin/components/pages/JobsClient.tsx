'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminJobRow } from '@/lib/types';

const JOB_TYPE_LABELS: Record<string, string> = {
  offer: 'Oferta',
  seeking: 'Busca empleo',
};

export function JobsClient({ initial }: { initial: AdminJobRow[] }) {
  const { request } = useAdminApi();
  const [jobs, setJobs] = useState(initial);
  const [filter, setFilter] = useState('all');

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await request(`/admin/jobs/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, isActive } : j)));
    } catch {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, isActive } : j)));
    }
  };

  const filtered =
    filter === 'all' ? jobs : filter === 'active' ? jobs.filter((j) => j.isActive) : jobs.filter((j) => !j.isActive);

  return (
    <div>
      <PageHeader
        title="Empleo"
        subtitle="Ofertas y búsquedas de trabajo en campamentos"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        }
      />
      <DataGrid<AdminJobRow & Record<string, unknown>>
        data={filtered as (AdminJobRow & Record<string, unknown>)[]}
        searchKeys={['title', 'poster', 'camp', 'category']}
        columns={[
          { key: 'title', header: 'Título', sortable: true },
          { key: 'jobType', header: 'Tipo', render: (r) => JOB_TYPE_LABELS[r.jobType] ?? r.jobType },
          { key: 'poster', header: 'Publicado por' },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'category', header: 'Categoría' },
          {
            key: 'salary',
            header: 'Salario',
            render: (r) => (
              <Mono>{r.salary != null ? `${r.salary.toLocaleString()} ${r.currency}` : 'A convenir'}</Mono>
            ),
          },
          { key: 'isActive', header: 'Estado', render: (r) => <StatusCell status={r.isActive ? 'active' : 'inactive'} /> },
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

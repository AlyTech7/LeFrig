'use client';

import { useCallback, useState } from 'react';
import { DataGrid, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminReportRow } from '@/lib/types';

export function ModerationClient({ initial }: { initial: AdminReportRow[] }) {
  const { request } = useAdminApi();
  const [reports, setReports] = useState(initial);

  const review = useCallback(
    async (id: string, action: string) => {
      try {
        await request(`/moderation/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
      } catch {
        /* demo */
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
    },
    [request],
  );

  return (
    <div>
      <PageHeader
        title="Moderación"
        subtitle="Cola de reportes comunitarios, revisión y acciones de seguridad"
        action={<span className="adm-badge adm-badge--warning">{reports.length} pendientes</span>}
      />
      <DataGrid<AdminReportRow & Record<string, unknown>>
        data={reports as (AdminReportRow & Record<string, unknown>)[]}
        searchKeys={['targetType', 'reason', 'reporter']}
        emptyMessage="No hay reportes pendientes — la comunidad está tranquila"
        columns={[
          { key: 'targetType', header: 'Tipo', render: (r) => <StatusCell status={r.targetType} /> },
          { key: 'reason', header: 'Motivo', sortable: true },
          { key: 'reporter', header: 'Reportado por' },
          { key: 'createdAt', header: 'Fecha', render: (r) => new Date(r.createdAt).toLocaleDateString('es-ES') },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => review(r.id, 'dismiss')}>
                  Descartar
                </button>
                <button type="button" className="adm-btn adm-btn--danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => review(r.id, 'ban')}>
                  Sancionar
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

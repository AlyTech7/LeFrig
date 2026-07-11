'use client';

import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import type { AccessLogRow } from '@/lib/types';

function formatAction(action: string) {
  return action.replace(/_/g, ' ');
}

export function AuditClient({ initial }: { initial: AccessLogRow[] }) {
  return (
    <div>
      <PageHeader
        title="Auditoría"
        subtitle="Registro de acciones administrativas, accesos y trazabilidad de operaciones"
        action={<span className="adm-badge adm-badge--default">{initial.length} eventos</span>}
      />
      <DataGrid<AccessLogRow & Record<string, unknown>>
        data={initial as (AccessLogRow & Record<string, unknown>)[]}
        searchKeys={['action', 'resource']}
        searchPlaceholder="Buscar acción, recurso, admin…"
        columns={[
          {
            key: 'createdAt',
            header: 'Fecha',
            sortable: true,
            render: (r) => (
              <Mono style={{ fontSize: '0.78rem' }}>
                {new Date(r.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
              </Mono>
            ),
          },
          { key: 'admin', header: 'Administrador', render: (r) => r.admin.displayName },
          { key: 'action', header: 'Acción', render: (r) => <StatusCell status={formatAction(r.action)} /> },
          { key: 'resource', header: 'Recurso', render: (r) => r.resource ?? '—' },
          { key: 'ipAddress', header: 'IP', render: (r) => <Mono>{r.ipAddress ?? '—'}</Mono> },
        ]}
      />
    </div>
  );
}

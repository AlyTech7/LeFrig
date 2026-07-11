'use client';

import { useEffect, useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminTransportRow } from '@/lib/types';
import type { AdminDriverRow } from '@/components/pages/DriversClient';
import type { Paginated } from '@/lib/types';

export function TransportClient({ initial }: { initial: (AdminTransportRow & { createdAt?: string })[] }) {
  const { request } = useAdminApi();
  const [rows, setRows] = useState(initial);
  const [drivers, setDrivers] = useState<AdminDriverRow[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request<Paginated<AdminDriverRow>>('/admin/drivers?verified=true&limit=50')
      .then((res) => setDrivers(res.data))
      .catch(() => {});
  }, [request]);

  const assign = async (transportId: string) => {
    if (!selectedDriver) return;
    setBusy(true);
    try {
      await request(`/admin/transport/${transportId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId: selectedDriver }),
      });
      const driverName = drivers.find((d) => d.userId === selectedDriver)?.displayName ?? '—';
      setRows((prev) =>
        prev.map((t) => (t.id === transportId ? { ...t, status: 'accepted', driver: driverName } : t)),
      );
      setAssigningId(null);
      setSelectedDriver('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transporte"
        subtitle="Rutas inter-campamentos, importaciones Tindouf y viajes compartidos"
        action={
          <span className="adm-badge adm-badge--info">
            {rows.filter((t) => t.status === 'requested' || t.status === 'accepted').length} activos
          </span>
        }
      />
      <DataGrid<AdminTransportRow & Record<string, unknown>>
        data={rows as (AdminTransportRow & Record<string, unknown>)[]}
        searchKeys={['originCamp', 'destinationCamp', 'requester', 'type']}
        columns={[
          { key: 'type', header: 'Tipo', render: (r) => <StatusCell status={r.type} /> },
          { key: 'originCamp', header: 'Origen', sortable: true },
          { key: 'destinationCamp', header: 'Destino', sortable: true },
          { key: 'requester', header: 'Solicitante' },
          { key: 'driver', header: 'Conductor', render: (r) => r.driver ?? '—' },
          {
            key: 'priceEstimate',
            header: 'Estimado',
            render: (r) => (r.priceEstimate ? <Mono>{r.priceEstimate.toLocaleString()} MRU</Mono> : '—'),
          },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          {
            key: 'actions',
            header: '',
            render: (r) =>
              r.status === 'requested' && !r.driver ? (
                assigningId === r.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="adm-select"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      style={{ minWidth: 140 }}
                    >
                      <option value="">Conductor…</option>
                      {drivers.map((d) => (
                        <option key={d.userId} value={d.userId}>
                          {d.displayName}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="adm-btn adm-btn--primary" disabled={busy || !selectedDriver} onClick={() => assign(r.id)}>
                      {busy ? '…' : 'Asignar'}
                    </button>
                    <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setAssigningId(null)}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setAssigningId(r.id)}>
                    Asignar
                  </button>
                )
              ) : null,
          },
        ]}
      />
    </div>
  );
}

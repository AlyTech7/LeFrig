'use client';

import { useState } from 'react';
import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';

export type AdminDriverRow = {
  id: string;
  userId: string;
  displayName: string;
  phone: string | null;
  camp: string | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  seatsCapacity: number;
  isVerified: boolean;
  rating: number;
  totalTrips: number;
  routes: string[];
  createdAt: string;
};

export function DriversClient({ initial }: { initial: AdminDriverRow[] }) {
  const { request } = useAdminApi();
  const [drivers, setDrivers] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

  const verify = async (userId: string, verified: boolean) => {
    try {
      await request(`/admin/drivers/${userId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verified }),
      });
      setDrivers((prev) => prev.map((d) => (d.userId === userId ? { ...d, isVerified: verified } : d)));
    } catch {
      setDrivers((prev) => prev.map((d) => (d.userId === userId ? { ...d, isVerified: verified } : d)));
    }
  };

  const filtered =
    filter === 'pending'
      ? drivers.filter((d) => !d.isVerified)
      : filter === 'verified'
        ? drivers.filter((d) => d.isVerified)
        : drivers;

  return (
    <div>
      <PageHeader
        title="Conductores"
        subtitle="Registro, verificación y rutas frecuentes"
        action={
          <select className="adm-select" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="verified">Verificados</option>
          </select>
        }
      />
      <DataGrid<AdminDriverRow & Record<string, unknown>>
        data={filtered as (AdminDriverRow & Record<string, unknown>)[]}
        searchKeys={['displayName', 'phone', 'camp', 'vehiclePlate']}
        columns={[
          { key: 'displayName', header: 'Conductor', sortable: true },
          { key: 'camp', header: 'Campamento', render: (r) => r.camp ?? '—' },
          { key: 'vehicleType', header: 'Vehículo', render: (r) => r.vehicleType ?? '—' },
          { key: 'vehiclePlate', header: 'Matrícula', render: (r) => (r.vehiclePlate ? <Mono>{r.vehiclePlate}</Mono> : '—') },
          { key: 'seatsCapacity', header: 'Plazas' },
          {
            key: 'routes',
            header: 'Rutas',
            render: (r) => (r.routes.length ? r.routes.join(', ') : '—'),
          },
          {
            key: 'isVerified',
            header: 'Estado',
            render: (r) => <StatusCell status={r.isVerified ? 'verified' : 'pending_review'} />,
          },
          {
            key: 'actions',
            header: '',
            render: (r) =>
              r.isVerified ? (
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => verify(r.userId, false)}>
                  Revocar
                </button>
              ) : (
                <button type="button" className="adm-btn adm-btn--primary" onClick={() => verify(r.userId, true)}>
                  Verificar
                </button>
              ),
          },
        ]}
      />
    </div>
  );
}

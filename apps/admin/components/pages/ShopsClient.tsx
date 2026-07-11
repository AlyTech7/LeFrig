'use client';

import { DataGrid, Mono } from '@/components/pro/DataGrid';
import { PageHeader, StatusBadge } from '@/components/AdminUI';
import type { AdminShopRow } from '@/lib/types';

export function ShopsClient({ initial }: { initial: AdminShopRow[] }) {
  return (
    <div>
      <PageHeader
        title="Tiendas"
        subtitle="Comercios verificados, métodos de pago cash-first y catálogo por campamento"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="adm-badge adm-badge--success">{initial.filter((s) => s.verified).length} verificadas</span>
            <span className="adm-badge adm-badge--info">{initial.reduce((a, s) => a + s.productsCount, 0)} productos</span>
          </div>
        }
      />
      <DataGrid<AdminShopRow & Record<string, unknown>>
        data={initial as (AdminShopRow & Record<string, unknown>)[]}
        searchKeys={['name', 'camp', 'owner']}
        searchPlaceholder="Buscar tienda, campamento, propietario…"
        columns={[
          { key: 'name', header: 'Tienda', sortable: true },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'owner', header: 'Propietario' },
          { key: 'productsCount', header: 'Productos', sortable: true, render: (r) => <Mono>{r.productsCount}</Mono> },
          {
            key: 'payments',
            header: 'Pagos',
            render: (r) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.acceptsCash ? <StatusBadge status="cash" /> : null}
                {r.acceptsFiado ? <span className="adm-badge adm-badge--gold">fiado</span> : null}
                {r.acceptsVouchers ? <span className="adm-badge adm-badge--info">voucher</span> : null}
              </div>
            ),
          },
          { key: 'verified', header: 'Estado', render: (r) => (r.verified ? <StatusBadge status="verified" /> : <StatusBadge status="pending" />) },
          { key: 'isActive', header: 'Activa', render: (r) => (r.isActive ? <StatusBadge status="active" /> : <StatusBadge status="rejected" />) },
        ]}
      />
    </div>
  );
}

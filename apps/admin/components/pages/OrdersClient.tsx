'use client';



import { useState } from 'react';

import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';

import { PageHeader } from '@/components/AdminUI';

import { useAdminApi } from '@/lib/useAdminApi';

import type { AdminOrderRow } from '@/lib/types';



export function OrdersClient({ initial }: { initial: AdminOrderRow[] }) {

  const { request } = useAdminApi();

  const [orders, setOrders] = useState(initial);



  const updateStatus = async (id: string, status: string) => {

    try {

      await request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    } catch {

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    }

  };



  return (

    <div>

      <PageHeader title="Pedidos" subtitle="Pipeline de órdenes, pagos cash-first y fulfillment en tiendas" />

      <DataGrid<AdminOrderRow & Record<string, unknown>>

        data={orders as (AdminOrderRow & Record<string, unknown>)[]}

        searchKeys={['shop', 'buyer', 'camp', 'id']}

        columns={[

          { key: 'id', header: 'ID', render: (r) => <Mono>{r.id.slice(0, 8)}…</Mono> },

          { key: 'shop', header: 'Tienda', sortable: true },

          { key: 'buyer', header: 'Comprador' },

          { key: 'camp', header: 'Campamento', sortable: true },

          { key: 'total', header: 'Total', sortable: true, render: (r) => <Mono>{r.total.toLocaleString()} duros</Mono> },

          { key: 'paymentMethod', header: 'Pago', render: (r) => <StatusCell status={r.paymentMethod} /> },

          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },

          {

            key: 'actions',

            header: 'Acciones',

            render: (r) => (

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>

                {r.status === 'pending' && (

                  <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => updateStatus(r.id, 'confirmed')}>

                    Confirmar

                  </button>

                )}

                {r.status === 'confirmed' && (

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


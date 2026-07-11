'use client';

import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import type { AdminCashRow } from '@/lib/types';

export function CashClient({ initial }: { initial: AdminCashRow[] }) {
  const total = initial.reduce((s, a) => s + a.amount, 0);

  return (
    <div>
      <PageHeader
        title="Efectivo (PIN)"
        subtitle="Acuerdos cash-first con confirmación bilateral"
        action={<span className="adm-badge adm-badge--gold">{total.toLocaleString()} MRU en operaciones</span>}
      />
      <DataGrid<AdminCashRow & Record<string, unknown>>
        data={initial as (AdminCashRow & Record<string, unknown>)[]}
        searchKeys={['operationCode', 'buyer', 'seller', 'listing']}
        columns={[
          { key: 'operationCode', header: 'Código', render: (r) => <Mono>{r.operationCode}</Mono> },
          { key: 'listing', header: 'Anuncio', sortable: true },
          { key: 'buyer', header: 'Comprador' },
          { key: 'seller', header: 'Vendedor' },
          { key: 'amount', header: 'Importe', sortable: true, render: (r) => <Mono>{r.amount.toLocaleString()} MRU</Mono> },
          { key: 'confirmations', header: 'PINs', render: (r) => <Mono>{r.confirmations}/2</Mono> },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
        ]}
      />
    </div>
  );
}

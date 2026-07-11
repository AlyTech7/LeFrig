'use client';

import { DataGrid, Mono, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';

interface VoucherRow {
  id: string;
  code: string;
  balance: number;
  status: string;
  program: string;
  expiresAt: string;
}

export function VouchersClient({ initial }: { initial: VoucherRow[] }) {
  const totalBalance = initial.reduce((a, v) => a + v.balance, 0);

  return (
    <div>
      <PageHeader
        title="Vouchers"
        subtitle="Programas humanitarios, saldo diáspora y canje en tiendas verificadas"
        action={<span className="adm-badge adm-badge--gold">{totalBalance.toLocaleString()} MRU en circulación</span>}
      />
      <DataGrid<VoucherRow & Record<string, unknown>>
        data={initial as (VoucherRow & Record<string, unknown>)[]}
        searchKeys={['code', 'program', 'status']}
        columns={[
          { key: 'code', header: 'Código', render: (r) => <Mono>{r.code}</Mono> },
          { key: 'program', header: 'Programa', sortable: true },
          { key: 'balance', header: 'Saldo', sortable: true, render: (r) => <Mono>{r.balance.toLocaleString()} MRU</Mono> },
          { key: 'status', header: 'Estado', render: (r) => <StatusCell status={r.status} /> },
          { key: 'expiresAt', header: 'Expira', render: (r) => new Date(r.expiresAt).toLocaleDateString('es-ES') },
        ]}
      />
    </div>
  );
}

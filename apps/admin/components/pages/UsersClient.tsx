'use client';

import { useCallback, useState } from 'react';
import { DataGrid, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminUserRow } from '@/lib/types';

export function UsersClient({ initial }: { initial: AdminUserRow[] }) {
  const { request } = useAdminApi();
  const [users, setUsers] = useState(initial);

  const verify = useCallback(
    async (id: string, level: string) => {
      try {
        await request(`/admin/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ level }) });
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verificationLevel: level } : u)));
      } catch {
        window.alert('No se pudo actualizar la verificación del usuario.');
      }
    },
    [request],
  );

  const setBan = useCallback(
    async (user: AdminUserRow, banned: boolean) => {
      let reason: string | undefined;
      if (banned) {
        const input = window.prompt(`Motivo del baneo de "${user.displayName}":`, 'Incumplimiento de normas');
        if (input === null) return;
        reason = input.trim() || undefined;
        if (!window.confirm(`¿Banear permanentemente a ${user.displayName}? No podrá usar la app.`)) return;
      }
      try {
        const updated = await request<{ bannedAt: string | null; banReason: string | null; isActive: boolean }>(
          `/admin/users/${user.id}/ban`,
          { method: 'PATCH', body: JSON.stringify({ banned, reason }) },
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, bannedAt: updated.bannedAt, banReason: updated.banReason, isActive: updated.isActive, suspendedUntil: null }
              : u,
          ),
        );
      } catch {
        window.alert('No se pudo actualizar el estado del usuario.');
      }
    },
    [request],
  );

  const suspend = useCallback(
    async (user: AdminUserRow, days: number) => {
      const reason = window.prompt(`Motivo de la suspensión de "${user.displayName}" (${days} días):`, 'Aviso por conducta');
      if (reason === null) return;
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      try {
        const updated = await request<{ suspendedUntil: string | null; banReason: string | null }>(
          `/admin/users/${user.id}/ban`,
          { method: 'PATCH', body: JSON.stringify({ banned: false, reason: reason.trim() || undefined, suspendedUntil: until }) },
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, suspendedUntil: updated.suspendedUntil, banReason: updated.banReason, bannedAt: null }
              : u,
          ),
        );
      } catch {
        window.alert('No se pudo suspender al usuario.');
      }
    },
    [request],
  );

  const banState = (u: AdminUserRow): { label: string; color: string } => {
    if (u.bannedAt) return { label: 'Baneado', color: '#ef4444' };
    if (u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) {
      return { label: `Suspendido hasta ${new Date(u.suspendedUntil).toLocaleDateString('es-ES')}`, color: '#f59e0b' };
    }
    return { label: 'Activo', color: '#34d399' };
  };

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Identidades, verificación KYC, reputación, roles y sanciones" />
      <DataGrid<AdminUserRow & Record<string, unknown>>
        data={users as (AdminUserRow & Record<string, unknown>)[]}
        searchKeys={['displayName', 'email', 'phone', 'camp']}
        searchPlaceholder="Buscar por nombre, email, teléfono…"
        columns={[
          { key: 'displayName', header: 'Nombre', sortable: true },
          { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
          { key: 'phone', header: 'Teléfono', render: (r) => r.phone ?? '—' },
          { key: 'camp', header: 'Campamento', sortable: true, render: (r) => r.camp ?? '—' },
          { key: 'verificationLevel', header: 'Verificación', render: (r) => <StatusCell status={r.verificationLevel} /> },
          { key: 'reputationScore', header: 'Reputación', render: (r) => `⭐ ${r.reputationScore}` },
          {
            key: 'banState',
            header: 'Estado',
            render: (r) => {
              const s = banState(r);
              return (
                <span style={{ color: s.color, fontWeight: 700, fontSize: '0.78rem' }} title={r.banReason ?? undefined}>
                  {s.label}
                </span>
              );
            },
          },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => {
              const isBanned = !!r.bannedAt;
              const isSuspended = !isBanned && !!r.suspendedUntil && new Date(r.suspendedUntil) > new Date();
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" className="adm-btn adm-btn--ghost" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => verify(r.id, 'verified')}>
                    Verificar
                  </button>
                  {isBanned || isSuspended ? (
                    <button
                      type="button"
                      className="adm-btn adm-btn--ghost"
                      style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#34d399' }}
                      onClick={() => setBan(r, false)}
                    >
                      Reactivar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#f59e0b' }}
                        onClick={() => suspend(r, 7)}
                      >
                        Suspender 7d
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#ef4444' }}
                        onClick={() => setBan(r, true)}
                      >
                        Banear
                      </button>
                    </>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}

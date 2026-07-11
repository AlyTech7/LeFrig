'use client';

import { useState } from 'react';
import { DataGrid, StatusCell } from '@/components/pro/DataGrid';
import { PageHeader } from '@/components/AdminUI';
import { useAdminApi } from '@/lib/useAdminApi';
import type { AdminCommunityRow } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  announcement: 'Anuncio',
  news: 'Noticia',
  question: 'Pregunta',
  general: 'General',
};

export function CommunityClient({ initial }: { initial: AdminCommunityRow[] }) {
  const { request } = useAdminApi();
  const [posts, setPosts] = useState(initial);

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      await request(`/admin/community/${id}/pin`, { method: 'PATCH', body: JSON.stringify({ isPinned }) });
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isPinned } : p)));
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isPinned } : p)));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await request(`/admin/community/${id}/delete`, { method: 'POST' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div>
      <PageHeader title="Comunidad" subtitle="Publicaciones y anuncios del campamento" />
      <DataGrid<AdminCommunityRow & Record<string, unknown>>
        data={posts as (AdminCommunityRow & Record<string, unknown>)[]}
        searchKeys={['title', 'author', 'camp', 'postType']}
        columns={[
          { key: 'title', header: 'Título', sortable: true },
          { key: 'postType', header: 'Tipo', render: (r) => TYPE_LABELS[r.postType] ?? r.postType },
          { key: 'author', header: 'Autor' },
          { key: 'camp', header: 'Campamento', sortable: true },
          { key: 'isPinned', header: 'Fijado', render: (r) => <StatusCell status={r.isPinned ? 'active' : 'inactive'} /> },
          {
            key: 'actions',
            header: 'Acciones',
            render: (r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="adm-btn adm-btn--primary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => togglePin(r.id, !r.isPinned)}>
                  {r.isPinned ? 'Desfijar' : 'Fijar'}
                </button>
                <button type="button" className="adm-btn adm-btn--danger" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => remove(r.id)}>
                  Eliminar
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, colors } from '@lefrig/ui/client';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { localizedCampFromSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ReportButton } from '@/components/ReportButton';
import { demoCamps, fetchWithMeta, unwrapPaginated } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

type CommunityPost = {
  id: string;
  title: string;
  content: string;
  postType: string;
  createdAt: string;
  author?: { displayName: string; avatarUrl?: string | null };
  camp?: { nameEs: string; nameAr?: string; slug: string };
};

const POST_TYPES = ['announcement', 'news', 'question', 'general'] as const;

const DATE_LOCALE = { es: 'es-ES', ar: 'ar-MA', en: 'en-GB', fr: 'fr-FR' } as const;

export default function CommunityPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCamp, setFilterCamp] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    campId: '',
    postType: 'general',
  });

  const postTypeLabel = (type: string) => {
    const key = `community.postTypes.${type}` as 'community.postTypes.general';
    const label = t(key);
    return label === key ? type : label;
  };

  const loadPosts = async (campId?: string) => {
    const params = new URLSearchParams({ limit: '30' });
    if (campId) params.set('campId', campId);
    const res = await fetchWithMeta<PaginatedResponse<CommunityPost>>(
      `/community/posts?${params}`,
      { data: [], meta: { total: 0, page: 1, limit: 30, totalPages: 0 } },
    );
    setPosts(unwrapPaginated(res.data));
  };

  useEffect(() => {
    Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', demoCamps),
      fetchWithMeta<PaginatedResponse<CommunityPost>>('/community/posts?limit=30', {
        data: [],
        meta: { total: 0, page: 1, limit: 30, totalPages: 0 },
      }),
    ]).then(([campsRes, postsRes]) => {
      setCamps(campsRes.data.length ? campsRes.data : demoCamps);
      setForm((f) => ({ ...f, campId: f.campId || campsRes.data[0]?.id || '' }));
      setPosts(unwrapPaginated(postsRes.data));
      setLoading(false);
    });
  }, []);

  const onFilterCamp = (campId: string) => {
    setFilterCamp(campId);
    setLoading(true);
    loadPosts(campId || undefined)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  const publishPost = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!form.title.trim() || !form.content.trim() || !form.campId) return;
    setSubmitting(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          campId: form.campId,
          postType: form.postType,
        }),
      });
      setShowForm(false);
      setForm((f) => ({ ...f, title: '', content: '' }));
      await loadPosts(filterCamp || undefined);
    } catch {
      alert(t('community.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="lf-page-hero">
        <div className="lf-page-hero-inner">
          <div className="lf-hero-badge" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="megaphone" size={16} color="var(--lf-gold)" />
            {t('community.title')}
          </div>
          <h1 className="lf-page-title">{t('community.voice')}</h1>
          <p className="lf-page-sub">{t('community.subtitle')}</p>
        </div>
      </section>

      <div className="lf-page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {t('community.camp')}
              <select
                value={filterCamp}
                onChange={(e) => onFilterCamp(e.target.value)}
                style={{ display: 'block', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', minWidth: 180 }}
              >
                <option value="">{t('common.all')}</option>
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
                ))}
              </select>
            </label>
          </div>
          <Button onClick={() => (isSignedIn ? setShowForm(true) : router.push('/sign-in'))}>
            {t('community.publish')}
          </Button>
        </div>

        {showForm && (
          <Card padding="lg" style={{ marginBottom: 32 }}>
            <h2 style={{ marginTop: 0 }}>{t('community.newPost')}</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <Input label={t('community.titleLabel')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <label>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('community.contentLabel')}</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('community.typeLabel')}</span>
                <select
                  value={form.postType}
                  onChange={(e) => setForm({ ...form, postType: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
                >
                  {POST_TYPES.map((type) => (
                    <option key={type} value={type}>{postTypeLabel(type)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('community.camp')}</span>
                <select
                  value={form.campId}
                  onChange={(e) => setForm({ ...form, campId: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `2px solid ${colors.sand[300]}` }}
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>{localizedCampFromSummary(c, locale)}</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button onClick={publishPost} disabled={submitting}>
                  {submitting ? t('community.publishing') : t('community.publish')}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <p style={{ color: colors.gray[500] }}>{t('community.loading')}</p>
        ) : posts.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: colors.gray[600] }}>{t('community.empty')}</p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {posts.map((post) => (
              <Card key={post.id} padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: colors.deepGreen[500], textTransform: 'uppercase' }}>
                      {postTypeLabel(post.postType)}
                      {post.camp ? ` · ${localizedCampFromSummary(post.camp, locale)}` : ''}
                    </p>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>{post.title}</h3>
                    <p style={{ margin: '0 0 12px', color: colors.gray[600], lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: colors.gray[500] }}>
                      {post.author?.displayName ?? t('community.authorFallback')} ·{' '}
                      {new Date(post.createdAt).toLocaleDateString(DATE_LOCALE[locale], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <ReportButton targetType="community_post" targetId={post.id} compact />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

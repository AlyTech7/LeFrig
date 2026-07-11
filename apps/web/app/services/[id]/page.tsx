'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { demoServices, fetchWithFallback, mapApiService } from '@/lib/api';
import { ReviewsSection } from '@/components/ReviewsSection';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import '../services.css';
import '../../marketplace/create/publish.css';

type ServiceDetail = {
  id: string;
  title: string;
  description?: string;
  priceFrom?: number | string;
  priceTo?: number | string;
  images?: string[];
  category?: { nameEs?: string; nameAr?: string; icon?: string };
  provider?: { id: string; displayName: string; phone?: string; reputationScore?: number };
  camps?: { camp: { nameEs: string; nameAr?: string } }[];
};

export default function ServiceDetailPage() {
  const t = useT();
  const { locale } = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const id = params.id;
  const fallback = demoServices.find((s) => s.id === id) ?? demoServices[0]!;

  const [service, setService] = useState<ServiceDetail>({
    id: fallback.id,
    title: fallback.title,
    description: fallback.description ?? t('services.studio.defaultDesc'),
    priceFrom: fallback.priceFrom,
    category: { nameEs: fallback.categoryName, nameAr: fallback.nameAr, icon: fallback.icon },
    provider: { id: 'demo', displayName: t('services.studio.professional'), reputationScore: fallback.rating },
    camps: [{ camp: { nameEs: fallback.campName } }],
  });
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    fetchWithFallback<ServiceDetail>(`/services/${id}`, service).then((data) => {
      setService(data);
      setLoading(false);
    });
  }, [id]);

  const mapped = mapApiService(service as unknown as Record<string, unknown>);
  const camps =
    service.camps
      ?.map((c) => (locale === 'ar' && c.camp.nameAr ? c.camp.nameAr : c.camp.nameEs))
      .join(', ') ?? mapped.campName;
  const cover = service.images?.[0] ?? mapped.imageUrl;

  const categoryName =
    locale === 'ar' && service.category?.nameAr
      ? service.category.nameAr
      : service.category?.nameEs ?? t('services.title');

  const contactProvider = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!service.provider?.id) return;
    setContacting(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: service.provider.id,
          content: t('services.studio.chatTemplate', { title: service.title }),
          refId: service.id,
          type: 'service',
        }),
      });
      router.push('/messages');
    } catch {
      alert(t('services.studio.chatError'));
    } finally {
      setContacting(false);
    }
  };

  const priceLabel =
    service.priceFrom != null
      ? service.priceTo != null
        ? t('services.studio.priceRange', {
            from: Number(service.priceFrom).toLocaleString(),
            to: Number(service.priceTo).toLocaleString(),
          })
        : t('services.studio.priceFromTo', { from: Number(service.priceFrom).toLocaleString() })
      : t('services.studio.priceNegotiable');

  if (loading) {
    return (
      <div className="svc-page">
        <div className="svc" style={{ paddingTop: '2rem' }}>
          <div className="svc-skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="svc-page">
      <div className="svc">
        <header className="svc-hero">
          <Link href="/services" className="pub-back" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <AppIcon name="arrow-left" size={16} color="var(--svc-gold)" />
            {t('services.studio.detailBack')}
          </Link>
          <div className="svc-detail__head">
            <div className="svc-detail__media">
              {cover ? <img src={cover} alt="" /> : <span>{service.category?.icon ?? '🔧'}</span>}
            </div>
            <div>
              <p className="svc-kicker">
                <span className="svc-kicker__dot" aria-hidden />
                {categoryName}
              </p>
              <h1 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--sv-display)', fontSize: 'clamp(1.4rem, 4vw, 1.85rem)' }}>
                {service.title}
              </h1>
              <p className="svc-lead" style={{ margin: 0 }}>
                📍 {camps}
              </p>
              <p className="svc-detail__price">{priceLabel}</p>
            </div>
          </div>
        </header>

        <div className="svc-detail__layout">
          <section className="pub-panel" style={{ marginBottom: 0 }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>{t('services.studio.about')}</h2>
            <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--svc-ink-muted)', fontSize: '0.92rem' }}>
              {service.description ?? t('jobs.noDescription')}
            </p>
          </section>

          {service.provider && (
            <aside className="pub-aside" style={{ position: 'static' }}>
              <div className="pub-tip">
                <span className="pub-tip__label">{t('services.studio.professional')}</span>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 700, color: 'var(--svc-ink)' }}>
                  {service.provider.displayName}
                </p>
                {service.provider.reputationScore != null && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem' }}>
                    ⭐ {t('services.studio.reputation')} {Number(service.provider.reputationScore).toFixed(1)}
                  </p>
                )}
                {service.provider.phone && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--svc-ink-muted)' }}>
                    {service.provider.phone}
                  </p>
                )}
              </div>
              <button type="button" className="pub-btn pub-btn--gold" onClick={contactProvider} disabled={contacting}>
                {contacting ? t('services.studio.openingChat') : t('services.contactProfessional')}
                <AppIcon name="message-circle" size={18} color="#1a1612" />
              </button>
            </aside>
          )}
        </div>

        {service.provider?.id && service.id && (
          <div style={{ marginTop: '1.5rem' }}>
            <ReviewsSection targetType="service" targetId={service.id} title={t('services.studio.reviewsTitle')} />
          </div>
        )}
      </div>
    </div>
  );
}

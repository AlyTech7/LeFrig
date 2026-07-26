'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, CashPaymentBadge, colors } from '@lefrig/ui/client';
import type { ListingSummary } from '@lefrig/shared';
import { formatAttributeDetails, localizedCampFromSummary } from '@lefrig/shared';
import { PageBody, PageHero } from '@/components/PageHero';
import { ListingGallery } from '@/components/marketplace/ListingGallery';
import { ReportButton } from '@/components/ReportButton';
import { ReviewsSection } from '@/components/ReviewsSection';
import { SellerTrustBadge } from '@/components/SellerTrustBadge';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { fetchApi, mapApiListing } from '@/lib/api';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const t = useT();
  const { locale } = useLocale();
  const id = params.id;

  const [listing, setListing] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [creatingCash, setCreatingCash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setListing(null);
    fetchApi<Record<string, unknown>>(`/listings/${id}`)
      .then((data) => {
        if (!cancelled) {
          setListing(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setListing(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHero icon="tag" title={t('common.loading')} subtitle="" maxWidth={900} />
        <PageBody maxWidth={900}>
          <p style={{ color: colors.gray[500] }}>{t('common.loading')}</p>
        </PageBody>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <PageHero icon="tag" title={t('common.error')} subtitle="" maxWidth={900} />
        <PageBody maxWidth={900}>
          <Link href="/marketplace" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: 16 }}>
            ← {t('marketplace.backToMarket')}
          </Link>
          <p style={{ color: colors.gray[700] }}>{t('errors.notFoundBody')}</p>
        </PageBody>
      </>
    );
  }

  const summary: ListingSummary =
    'sellerName' in listing && typeof listing.sellerName === 'string'
      ? (listing as unknown as ListingSummary)
      : mapApiListing(listing);

  const description = String(listing.description ?? t('marketplace.noDescription'));
  const seller = listing.seller as { id?: string; displayName?: string; reputationScore?: number } | undefined;
  const camp = listing.camp as { nameEs?: string; nameAr?: string; slug?: string } | undefined;
  const category = listing.category as { nameEs?: string; nameAr?: string; icon?: string; slug?: string } | undefined;
  const images = listing.images as string[] | undefined;
  const attributes = listing.attributes as Record<string, unknown> | undefined;
  const categorySlug = category?.slug ?? summary.category;
  const attributeRows = formatAttributeDetails(categorySlug, attributes);
  const campName = camp ? localizedCampFromSummary(camp, locale) : t('publish.campFallback');
  const categoryName = category
    ? locale === 'ar' && category.nameAr
      ? category.nameAr
      : category.nameEs ?? summary.category
    : summary.category;

  const toggleFavorite = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      const res = await authFetch<{ favorited: boolean }>(`/listings/${id}/favorite`, { method: 'POST' });
      setFavorited(res.favorited);
    } catch {
      /* ignore */
    }
  };

  const createCashDeal = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!seller?.id) return;
    setCreatingCash(true);
    try {
      const agreement = await authFetch<{
        operationCode: string;
        id: string;
        amount: number | string;
        currency?: string;
        status: string;
        method: string;
        createdAt: string;
        role?: 'buyer';
        listing?: { title: string };
      }>('/cash/agreements', {
        method: 'POST',
        body: JSON.stringify({
          listingId: id,
          sellerId: seller.id,
          amount: summary.price,
          method: 'cash',
        }),
      });
      const { setPendingCashAgreement } = await import('@/lib/cash-pending');
      setPendingCashAgreement({
        id: agreement.id,
        operationCode: agreement.operationCode,
        amount: agreement.amount,
        currency: agreement.currency,
        status: agreement.status,
        method: agreement.method,
        createdAt: agreement.createdAt,
        listingTitle: agreement.listing?.title ?? summary.title,
        role: 'buyer',
      });
      router.push('/cash');
    } catch {
      alert(t('marketplaceExtra.agreementError'));
    } finally {
      setCreatingCash(false);
    }
  };

  const contactSeller = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!seller?.id) return;
    setContacting(true);
    try {
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: seller.id,
          content: t('marketplaceExtra.chatTemplate', { title: summary.title }),
          refId: id,
          type: 'listing',
        }),
      });
      router.push('/messages');
    } catch {
      alert(t('marketplaceExtra.chatError'));
    } finally {
      setContacting(false);
    }
  };

  return (
    <>
      <PageHero icon="tag" title={summary.title} subtitle={`${campName} · ${categoryName}`} maxWidth={900} />
      <PageBody maxWidth={900}>
      <Link href="/marketplace" style={{ color: 'var(--lf-gold)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: 16 }}>
        ← {t('marketplace.backToMarket')}
      </Link>
      <div style={{ display: 'grid', gap: 32, marginTop: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <ListingGallery
          images={images}
          fallbackIcon={category?.icon ?? '📦'}
          height={320}
        />

        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Badge variant="info">{campName}</Badge>
            <Badge variant="default">{categoryName}</Badge>
            <CashPaymentBadge method="cash" locale={locale} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px', color: colors.softBlack }}>
            {summary.title}
          </h1>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: colors.deepGreen[600], margin: '0 0 24px' }}>
            {summary.price.toLocaleString()} {summary.currency}
          </p>
          {attributeRows.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {attributeRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: colors.sand[100],
                    border: `1px solid ${colors.sand[300]}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.75rem', color: colors.gray[500] }}>
                    {locale === 'ar' ? row.labelAr : row.label}
                  </p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: colors.softBlack }}>{row.value}</p>
                </div>
              ))}
            </div>
          )}
          <p style={{ lineHeight: 1.7, color: colors.gray[700], marginBottom: 24 }}>{description}</p>

          <Card padding="md" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{seller?.displayName ?? summary.sellerName}</p>
                {seller?.id && seller.id !== 'demo' ? (
                  <SellerTrustBadge userId={seller.id} compact />
                ) : (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: colors.gray[500] }}>
                    {t('marketplaceExtra.reputationLabel')} {seller?.reputationScore ?? 4.5} ★
                  </p>
                )}
              </div>
              {seller?.id && seller.id !== 'demo' ? (
                <ReportButton targetType="user" targetId={seller.id} targetUserId={seller.id} label={t('marketplace.reportSeller')} compact />
              ) : null}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button size="lg" onClick={createCashDeal} disabled={creatingCash}>
              {creatingCash ? t('marketplaceExtra.creatingAgreement') : t('marketplace.agreeCash')}
            </Button>
            <Button size="lg" variant="secondary" onClick={contactSeller} disabled={contacting}>
              {contacting ? t('services.studio.openingChat') : t('marketplace.contactSeller')}
            </Button>
            <Button size="lg" variant="outline" onClick={toggleFavorite}>
              {favorited ? t('marketplace.removeFavorite') : t('marketplace.addFavorite')}
            </Button>
          </div>

          <div style={{ marginTop: 16 }}>
            <ReportButton targetType="listing" targetId={id} targetUserId={seller?.id !== 'demo' ? seller?.id : undefined} label={t('marketplace.reportListing')} />
          </div>
        </div>
      </div>

      {seller?.id && <ReviewsSection targetType="user" targetId={seller.id} title={t('marketplace.sellerReputation')} />}
      </PageBody>
    </>
  );
}

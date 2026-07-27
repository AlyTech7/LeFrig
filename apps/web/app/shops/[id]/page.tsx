'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { demoShops, fetchWithFallback, mapApiShop } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import '../shops.css';
import '../../marketplace/create/publish.css';

type Product = { id: string; name: string; price: number | string; description?: string };
type ShopDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  verified?: boolean;
  acceptsCash?: boolean;
  acceptsFiado?: boolean;
  acceptsVouchers?: boolean;
  phone?: string;
  shopType?: string;
  camp?: { nameEs: string; nameAr?: string };
  owner?: { id: string; displayName: string; reputationScore?: number };
  products?: Product[];
};

const SHOP_TYPE_KEYS: Record<
  string,
  | 'shops.typeIndividual'
  | 'shops.typeRestaurant'
  | 'shops.typeCooperative'
  | 'shops.typeAssociation'
  | 'shops.typeWorkshop'
> = {
  individual: 'shops.typeIndividual',
  restaurant: 'shops.typeRestaurant',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
};

export default function ShopDetailPage() {
  const t = useT();
  const { locale } = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch, isSignedIn } = useAuthFetch();
  const id = params.id;
  const fallbackShop = demoShops.find((s) => s.id === id) ?? demoShops[0]!;

  const [shop, setShop] = useState<ShopDetail>({
    id: fallbackShop.id,
    name: fallbackShop.name,
    slug: fallbackShop.slug,
    description: fallbackShop.description ?? t('shops.detail.defaultDesc'),
    imageUrl: fallbackShop.imageUrl,
    verified: fallbackShop.verified,
    acceptsCash: fallbackShop.acceptsCash,
    acceptsFiado: fallbackShop.acceptsFiado,
    acceptsVouchers: fallbackShop.acceptsVouchers,
    shopType: fallbackShop.shopType,
    camp: { nameEs: fallbackShop.campName ?? t('shops.campFallback') },
    owner: { id: 'demo', displayName: t('shops.detail.owner'), reputationScore: 4.5 },
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const shopTypeLabel = (type?: string) => t(SHOP_TYPE_KEYS[type ?? 'individual'] ?? 'shops.typeIndividual');

  useEffect(() => {
    fetchWithFallback<ShopDetail>(`/shops/${id}`, shop).then((data) => {
      setShop(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!isSignedIn) return;
    authFetch<{ id: string }[]>('/shops/mine')
      .then((mine) => setIsOwner(mine.some((s) => s.id === id)))
      .catch(() => setIsOwner(false));
  }, [authFetch, isSignedIn, id]);

  const contactOwner = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!shop.owner?.id) return;
    setContacting(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: shop.owner.id,
          content: t('shops.detail.chatTemplate', { name: shop.name }),
          refId: shop.id,
          type: 'shop',
        }),
      });
      router.push('/messages');
    } catch {
      alert(t('shops.detail.chatError'));
    } finally {
      setContacting(false);
    }
  };

  const placeOrder = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    const products = shop.products ?? [];
    if (products.length === 0) {
      alert(t('shops.detail.noProductsOrder'));
      return;
    }
    setOrdering(true);
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shopId: shop.id,
          items: products.slice(0, 5).map((p) => ({
            productId: p.id,
            quantity: 1,
          })),
          paymentMethod: 'cash',
          notes: 'Pedido desde web Lefrig',
        }),
      });
      router.push('/messages');
    } catch {
      alert(t('shops.detail.orderError'));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="shp-page">
        <div className="shp" style={{ paddingTop: '2rem' }}>
          <div className="shp-skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }

  const mapped = mapApiShop(shop as unknown as Record<string, unknown>);
  const campName =
    locale === 'ar' && shop.camp?.nameAr
      ? shop.camp.nameAr
      : shop.camp?.nameEs ?? mapped.campName;

  return (
    <div className="shp-page">
      <div className="shp">
        <header className="shp-hero">
          <Link href="/shops" className="pub-back" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <AppIcon name="arrow-left" size={16} color="var(--shp-gold)" />
            {t('shops.detail.back')}
          </Link>
          <div className="shp-detail__head">
            <div className="shp-detail__media">
              {shop.imageUrl ? <img src={shop.imageUrl} alt="" /> : <span>🏪</span>}
            </div>
            <div>
              <p className="shp-kicker">
                <span className="shp-kicker__dot" aria-hidden />
                {shopTypeLabel(shop.shopType)}
                {shop.verified ? t('shops.detail.verifiedSuffix') : ''}
              </p>
              <h1 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--sv-display)', fontSize: 'clamp(1.4rem, 4vw, 1.85rem)' }}>
                {shop.name}
              </h1>
              <p className="shp-lead" style={{ margin: '0 0 0.65rem' }}>
                📍 {campName}
              </p>
              <div className="shp-card__tags">
                {shop.acceptsCash !== false && <span className="shp-tag shp-tag--cash">{t('shops.tagCash')}</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="shp-detail__layout">
          <section className="pub-panel" style={{ marginBottom: 0 }}>
            {shop.description && (
              <>
                <h2 style={{ margin: '0 0 0.65rem', fontSize: '1.05rem' }}>{t('shops.detail.about')}</h2>
                <p style={{ margin: '0 0 1.25rem', lineHeight: 1.65, color: 'var(--shp-ink-muted)', fontSize: '0.92rem' }}>
                  {shop.description}
                </p>
              </>
            )}
            <h2 style={{ margin: '0 0 0.65rem', fontSize: '1.05rem' }}>{t('shops.detail.products')}</h2>
            {(shop.products ?? []).length === 0 ? (
              <p style={{ margin: 0, color: 'var(--shp-ink-muted)', fontSize: '0.88rem' }}>
                {t('shops.detail.noProductsHint')}
              </p>
            ) : (
              <div className="shp-products">
                {shop.products!.map((p) => (
                  <article key={p.id} className="shp-product">
                    <div>
                      <strong>{p.name}</strong>
                      {p.description && <p>{p.description}</p>}
                    </div>
                    <span className="shp-product__price">
                      {Number(p.price).toLocaleString()} {t('common.currency')}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="pub-aside" style={{ position: 'static' }}>
            {shop.owner && (
              <div className="pub-tip">
                <span className="pub-tip__label">{t('shops.detail.owner')}</span>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 700, color: 'var(--shp-ink)' }}>
                  {shop.owner.displayName}
                </p>
                {shop.owner.reputationScore != null && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem' }}>
                    ⭐ {Number(shop.owner.reputationScore).toFixed(1)}
                  </p>
                )}
                {shop.phone && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--shp-ink-muted)' }}>
                    {shop.phone}
                  </p>
                )}
              </div>
            )}
            <button type="button" className="pub-btn pub-btn--gold" onClick={placeOrder} disabled={ordering}>
              {ordering ? t('shops.detail.processing') : t('shops.detail.orderCash')}
            </button>
            <button type="button" className="pub-btn pub-btn--ghost" onClick={contactOwner} disabled={contacting}>
              {contacting ? t('shops.detail.openingChat') : t('shops.contactShop')}
            </button>
            {isOwner && (
              <Link href={`/shops/${id}/manage`} className="pub-btn pub-btn--ghost" style={{ textAlign: 'center', textDecoration: 'none' }}>
                {t('shops.detail.manageProducts')}
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

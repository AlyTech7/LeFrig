'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { CampSummary } from '@lefrig/shared';
import { DEFAULT_CURRENCY, DEFAULT_PHONE_COUNTRY, localizedCampFromSummary } from '@lefrig/shared';
import { PhoneField } from '@lefrig/ui/client';
import { AppIcon } from '@/components/AppIcon';
import { ImageUploader, type PhotoItem } from '@/components/marketplace/ImageUploader';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';

type Product = {
  id: string;
  name: string;
  price: number | string;
  stock?: number;
  description?: string;
  imageUrl?: string;
  currency?: string;
};

type ShopInfo = {
  id: string;
  name: string;
  description?: string | null;
  shopType: string;
  phone: string;
  whatsapp?: string | null;
  campId: string;
  imageUrl?: string | null;
  acceptsCash: boolean;
  isActive: boolean;
  camp?: { id?: string; slug?: string; nameEs?: string; nameAr?: string };
};

type Tab = 'profile' | 'products';

const SHOP_TYPES = ['individual', 'restaurant', 'cooperative', 'association', 'workshop', 'pharmacy'] as const;

const TYPE_KEYS: Record<string, string> = {
  individual: 'shops.typeIndividual',
  restaurant: 'shops.typeRestaurant',
  cooperative: 'shops.typeCooperative',
  association: 'shops.typeAssociation',
  workshop: 'shops.typeWorkshop',
  pharmacy: 'shops.typePharmacy',
};

export function ShopManageStudio() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const shopId = params.id;
  const { authFetch, isSignedIn, isLoaded, getToken, syncUser } = useAuthFetch();
  const t = useT();
  const { locale } = useLocale();

  const [tab, setTab] = useState<Tab>('products');
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [profile, setProfile] = useState<{
    name: string;
    description: string;
    shopType: string;
    campId: string;
    phone: string;
    whatsapp: string;
    acceptsCash: boolean;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    shopType: 'individual',
    campId: '',
    phone: DEFAULT_PHONE_COUNTRY.dial,
    whatsapp: '',
    acceptsCash: true,
    isActive: true,
  });
  const [coverPhotos, setCoverPhotos] = useState<PhotoItem[]>([]);

  const [form, setForm] = useState({ name: '', price: '', stock: '0', description: '' });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '0', description: '' });
  const [editPhotos, setEditPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadProducts = useCallback(
    () => authFetch<Product[]>(`/shops/${shopId}/products`).then(setProducts),
    [authFetch, shopId],
  );

  const hydrateShop = useCallback((data: ShopInfo) => {
    setShop(data);
    setProfile({
      name: data.name,
      description: data.description ?? '',
      shopType: data.shopType || 'individual',
      campId: data.campId,
      phone: data.phone || DEFAULT_PHONE_COUNTRY.dial,
      whatsapp: data.whatsapp ?? '',
      acceptsCash: data.acceptsCash !== false,
      isActive: data.isActive !== false,
    });
    if (data.imageUrl) {
      setCoverPhotos([
        {
          id: 'cover',
          preview: data.imageUrl,
          url: data.imageUrl,
          uploading: false,
          processing: false,
          progress: 100,
          name: 'cover',
        },
      ]);
    } else {
      setCoverPhotos([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/shops/${shopId}/manage`);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setForbidden(false);

    (async () => {
      try {
        await authFetch('/auth/sync', { method: 'POST' });
        const [mine, campsRes] = await Promise.all([
          authFetch<ShopInfo[]>('/shops/mine'),
          fetchWithMeta<CampSummary[]>('/camps', demoCamps),
        ]);
        if (cancelled) return;
        const owned = (Array.isArray(mine) ? mine : []).find((s) => s.id === shopId);
        if (!owned) {
          setForbidden(true);
          setError(t('shops.manage.noPermission'));
          setLoading(false);
          return;
        }
        setCamps(campsRes.data.length ? campsRes.data : demoCamps);
        hydrateShop(owned);
        await loadProducts();
      } catch {
        if (!cancelled) {
          setForbidden(true);
          setError(t('shops.manage.noPermission'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authFetch, hydrateShop, isLoaded, isSignedIn, loadProducts, router, shopId, t]);

  const imageUrls = photos.filter((p) => p.url).map((p) => p.url!);
  const coverUrl = coverPhotos.find((p) => p.url)?.url ?? coverPhotos[0]?.url;
  const hasUploading = photos.some((p) => p.uploading || p.processing);
  const hasUploadErrors = photos.some((p) => p.error);
  const coverUploading = coverPhotos.some((p) => p.uploading || p.processing);

  const stats = useMemo(() => {
    const total = products.length;
    const units = products.reduce((s, p) => s + (p.stock ?? 0), 0);
    return { total, units };
  }, [products]);

  const canAdd =
    form.name.trim().length >= 2 &&
    Number(form.price) > 0 &&
    !hasUploading &&
    !hasUploadErrors;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const resetForm = () => {
    setForm({ name: '', price: '', stock: '0', description: '' });
    setPhotos((prev) => {
      prev.forEach((p) => {
        if (p.preview.startsWith('blob:')) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
  };

  const saveProfile = async () => {
    if (profile.name.trim().length < 2 || !profile.campId || !profile.phone) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await authFetch<ShopInfo>(`/shops/${shopId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: profile.name.trim(),
          description: profile.description.trim() || null,
          shopType: profile.shopType,
          campId: profile.campId,
          phone: profile.phone,
          whatsapp: profile.whatsapp.trim() || null,
          acceptsCash: profile.acceptsCash,
          isActive: profile.isActive,
          imageUrl: coverUrl || null,
        }),
      });
      hydrateShop(updated);
      flash(t('shops.manage.profileSaved'));
    } catch {
      setError(t('shops.manage.profileError'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async () => {
    setSubmitting(true);
    setError('');
    try {
      const updated = await authFetch<ShopInfo>(`/shops/${shopId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !profile.isActive }),
      });
      hydrateShop(updated);
      flash(t('shops.manage.profileSaved'));
    } catch {
      setError(t('shops.manage.profileError'));
    } finally {
      setSubmitting(false);
    }
  };

  const addProduct = async () => {
    if (!canAdd) return;
    setSubmitting(true);
    setError('');
    try {
      await authFetch(`/shops/${shopId}/products`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: Number(form.price),
          currency: DEFAULT_CURRENCY,
          stock: Number(form.stock) || 0,
          imageUrl: imageUrls[0],
        }),
      });
      await loadProducts();
      resetForm();
      flash(t('shops.manage.added'));
    } catch {
      setError(t('shops.manage.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock ?? 0),
      description: p.description ?? '',
    });
    setEditPhotos(
      p.imageUrl
        ? [
            {
              id: `edit-${p.id}`,
              preview: p.imageUrl,
              url: p.imageUrl,
              uploading: false,
              processing: false,
              progress: 100,
              name: p.name,
            },
          ]
        : [],
    );
  };

  const saveEdit = async (productId: string) => {
    setSubmitting(true);
    setError('');
    try {
      const editImage = editPhotos.find((p) => p.url)?.url;
      await authFetch(`/shops/${shopId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          price: Number(editForm.price),
          currency: DEFAULT_CURRENCY,
          stock: Number(editForm.stock) || 0,
          description: editForm.description.trim() || undefined,
          ...(editImage ? { imageUrl: editImage } : {}),
        }),
      });
      await loadProducts();
      setEditingId(null);
      setEditPhotos([]);
      flash(t('shops.manage.saved'));
    } catch {
      setError(t('shops.manage.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeProduct = async (productId: string) => {
    if (!confirm(t('shops.manage.confirmRemove'))) return;
    setError('');
    try {
      await authFetch(`/shops/${shopId}/products/${productId}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      if (editingId === productId) setEditingId(null);
      flash(t('shops.manage.removed'));
    } catch {
      setError(t('shops.manage.removeError'));
    }
  };

  if (forbidden) {
    return (
      <div className="shp-manage">
        <header className="shp-manage__hero">
          <Link href="/shops/mine" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--shp-gold)" />
            {t('shops.manage.back')}
          </Link>
          <p className="pub-error" style={{ marginTop: '1.5rem' }}>
            {error || t('shops.manage.noPermission')}
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="shp-manage">
      <header className="shp-manage__hero">
        <div className="shp-manage__hero-top">
          <Link href="/shops/mine" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--shp-gold)" />
            {t('shops.manage.back')}
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href={`/shops/${shopId}`} className="pub-btn pub-btn--ghost">
              {t('shops.manage.backPublic')}
            </Link>
            <span className="pub-badge">{t('shops.manage.badge')}</span>
          </div>
        </div>

        <div className="shp-manage__hero-shop">
          <div className="shp-manage__hero-avatar">
            {shop?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.imageUrl} alt="" />
            ) : (
              <span aria-hidden>🏪</span>
            )}
          </div>
          <div>
            <p className="pub-hero__ar" style={{ margin: 0 }}>
              {t('shops.manage.title')}
            </p>
            <h1 style={{ margin: '0.15rem 0' }}>{shop?.name ?? t('shops.manage.catalogDefault')}</h1>
            <p className="shp-lead" style={{ margin: 0 }}>
              {shop?.camp
                ? localizedCampFromSummary(
                    {
                      slug: shop.camp.slug ?? '',
                      nameEs: shop.camp.nameEs ?? '',
                      nameAr: shop.camp.nameAr ?? '',
                    },
                    locale,
                  )
                : null}
              {shop ? (
                <>
                  {' · '}
                  <span className={shop.isActive ? '' : 'shp-mine__status--off'}>
                    {shop.isActive ? t('shops.manage.activeBadge') : t('shops.manage.pausedBadge')}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="shp-manage__stats">
          <div className="shp-manage__stat">
            <span className="shp-manage__stat-n">{stats.total}</span>
            <span className="shp-manage__stat-l">{t('shops.manage.products')}</span>
          </div>
          <div className="shp-manage__stat">
            <span className="shp-manage__stat-n">{stats.units}</span>
            <span className="shp-manage__stat-l">{t('shops.manage.unitsStock')}</span>
          </div>
        </div>
      </header>

      <div className="shp-manage__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'profile'}
          className={tab === 'profile' ? 'shp-manage__tab shp-manage__tab--on' : 'shp-manage__tab'}
          onClick={() => setTab('profile')}
        >
          {t('shops.manage.tabProfile')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'products'}
          className={tab === 'products' ? 'shp-manage__tab shp-manage__tab--on' : 'shp-manage__tab'}
          onClick={() => setTab('products')}
        >
          {t('shops.manage.tabProducts')}
        </button>
      </div>

      {toast && (
        <p className="shp-manage__toast" role="status">
          {toast}
        </p>
      )}
      {error && <p className="pub-error">{error}</p>}

      {tab === 'profile' ? (
        <section className="pub-panel shp-manage__profile">
          <h2>{t('shops.manage.tabProfile')}</h2>
          <p className="pub-hint">{t('shops.studio.shopHint')}</p>

          <ImageUploader
            photos={coverPhotos}
            onChange={setCoverPhotos}
            getToken={getToken}
            isSignedIn={!!isSignedIn}
            onSignInRequired={() => router.push('/sign-in')}
            onBeforeUpload={async () => {
              await syncUser();
            }}
          />

          <label className="pub-field">
            <span>{t('shops.studio.nameLabel')}</span>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              maxLength={100}
            />
          </label>

          <label className="pub-field">
            <span>{t('shops.register.description')}</span>
            <textarea
              rows={4}
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              maxLength={1000}
            />
          </label>

          <label className="pub-field">
            <span>{t('shops.studio.reviewType')}</span>
            <select
              value={profile.shopType}
              onChange={(e) => setProfile({ ...profile, shopType: e.target.value })}
            >
              {SHOP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(TYPE_KEYS[type])}
                </option>
              ))}
            </select>
          </label>

          <label className="pub-field">
            <span>{t('shops.register.camp')}</span>
            <select
              value={profile.campId}
              onChange={(e) => setProfile({ ...profile, campId: e.target.value })}
            >
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {localizedCampFromSummary(c, locale)}
                </option>
              ))}
            </select>
          </label>

          <PhoneField
            value={profile.phone}
            onChange={(v) => setProfile({ ...profile, phone: v })}
            locale={locale as 'es' | 'en' | 'fr' | 'ar'}
            label={t('shops.studio.phone')}
            required
          />

          <PhoneField
            value={profile.whatsapp || DEFAULT_PHONE_COUNTRY.dial}
            onChange={(v) => setProfile({ ...profile, whatsapp: v })}
            locale={locale as 'es' | 'en' | 'fr' | 'ar'}
            label={t('shops.studio.whatsappOptional')}
          />

          <label className="pub-check" style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', margin: '0.75rem 0' }}>
            <input
              type="checkbox"
              checked={profile.acceptsCash}
              onChange={(e) => setProfile({ ...profile, acceptsCash: e.target.checked })}
            />
            <span>{t('shops.acceptsCash')}</span>
          </label>

          <button
            type="button"
            className="pub-btn pub-btn--gold"
            onClick={() => void saveProfile()}
            disabled={submitting || loading || coverUploading || profile.name.trim().length < 2}
          >
            {submitting ? t('shops.manage.saving') : t('shops.manage.saveProfile')}
          </button>

          <div className="shp-manage__pause-box">
            <p>{t('shops.manage.pauseHint')}</p>
            <button
              type="button"
              className="pub-btn pub-btn--ghost"
              onClick={() => void toggleActive()}
              disabled={submitting || loading}
            >
              {profile.isActive ? t('shops.manage.pauseShop') : t('shops.manage.resumeShop')}
            </button>
          </div>
        </section>
      ) : (
        <div className="shp-manage__layout">
          <aside className="pub-panel shp-manage__form-panel">
            <h2>{t('shops.manage.addProduct')}</h2>
            <p className="pub-hint">{t('shops.manage.addHint')}</p>

            <ImageUploader
              photos={photos}
              onChange={setPhotos}
              getToken={getToken}
              isSignedIn={!!isSignedIn}
              onSignInRequired={() => router.push('/sign-in')}
              onBeforeUpload={async () => {
                await syncUser();
              }}
            />

            <label className="pub-field">
              <span>{t('shops.productName')}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('shops.manage.namePlaceholder')}
                maxLength={120}
              />
            </label>
            <div className="shp-manage__row">
              <label className="pub-field">
                <span>{t('shops.price')}</span>
                <div className="pub-price-row">
                  <input
                    type="number"
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="500"
                  />
                  <span className="pub-currency">{t('shops.manage.currency')}</span>
                </div>
              </label>
              <label className="pub-field">
                <span>{t('shops.stock')}</span>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </label>
            </div>
            <label className="pub-field">
              <span>
                {t('shops.register.description')} ({t('common.optional')})
              </span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('shops.manage.descPlaceholder')}
                maxLength={500}
              />
            </label>

            <button
              type="button"
              className="pub-btn pub-btn--gold"
              onClick={() => void addProduct()}
              disabled={submitting || !canAdd}
            >
              {submitting ? t('shops.manage.saving') : t('shops.manage.addToCatalog')}
              <AppIcon name="arrow-up-right" size={18} color="#1a1612" />
            </button>
          </aside>

          <section className="pub-panel shp-manage__list-panel">
            <div className="shp-manage__list-head">
              <h2>{t('shops.manage.yourCatalog')}</h2>
              <span className="shp-manage__count">{t('shops.manage.items', { count: products.length })}</span>
            </div>

            {loading ? (
              <div className="shp-manage__skeletons">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="shp-skeleton" style={{ height: 72 }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="shp-manage__empty">
                <span className="shp-manage__empty-icon" aria-hidden>
                  📦
                </span>
                <h3>{t('shops.manage.emptyTitle')}</h3>
                <p>{t('shops.manage.emptyHint')}</p>
              </div>
            ) : (
              <ul className="shp-manage__list">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className={`shp-manage__item ${editingId === p.id ? 'shp-manage__item--edit' : ''}`}
                  >
                    {editingId === p.id ? (
                      <div className="shp-manage__edit">
                        <ImageUploader
                          photos={editPhotos}
                          onChange={setEditPhotos}
                          getToken={getToken}
                          isSignedIn={!!isSignedIn}
                          onSignInRequired={() => router.push('/sign-in')}
                          onBeforeUpload={async () => {
                            await syncUser();
                          }}
                        />
                        <label className="pub-field">
                          <span>{t('shops.productName')}</span>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </label>
                        <div className="shp-manage__row">
                          <label className="pub-field">
                            <span>{t('shops.price')}</span>
                            <div className="pub-price-row">
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                              />
                              <span className="pub-currency">{t('shops.manage.currency')}</span>
                            </div>
                          </label>
                          <label className="pub-field">
                            <span>{t('shops.stock')}</span>
                            <input
                              type="number"
                              min={0}
                              value={editForm.stock}
                              onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                            />
                          </label>
                        </div>
                        <label className="pub-field">
                          <span>{t('shops.register.description')}</span>
                          <textarea
                            rows={2}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </label>
                        <div className="shp-manage__item-actions">
                          <button
                            type="button"
                            className="pub-btn pub-btn--gold"
                            onClick={() => void saveEdit(p.id)}
                            disabled={submitting}
                          >
                            {t('common.save')}
                          </button>
                          <button
                            type="button"
                            className="pub-btn pub-btn--ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditPhotos([]);
                            }}
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="shp-manage__item-media">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className="shp-manage__item-body">
                          <strong>{p.name}</strong>
                          {p.description && <p>{p.description}</p>}
                          <div className="shp-manage__item-meta">
                            <span className="shp-product__price">
                              {Number(p.price).toLocaleString('es-ES')} {t('shops.manage.currency')}
                            </span>
                            <span>{t('shops.manage.stockLabel', { count: p.stock ?? 0 })}</span>
                          </div>
                        </div>
                        <div className="shp-manage__item-btns">
                          <button
                            type="button"
                            className="shp-manage__icon-btn"
                            onClick={() => startEdit(p)}
                            title={t('shops.manage.edit')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="shp-manage__icon-btn shp-manage__icon-btn--danger"
                            onClick={() => void removeProduct(p.id)}
                            title={t('shops.manage.remove')}
                          >
                            ×
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

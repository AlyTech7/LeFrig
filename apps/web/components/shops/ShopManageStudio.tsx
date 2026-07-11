'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/AppIcon';
import { ImageUploader, type PhotoItem } from '@/components/marketplace/ImageUploader';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useT } from '@/lib/locale';

type Product = {
  id: string;
  name: string;
  price: number | string;
  stock?: number;
  description?: string;
  imageUrl?: string;
};

type ShopInfo = { id: string; name: string; camp?: { nameEs: string } };

export function ShopManageStudio() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const shopId = params.id;
  const { authFetch, isSignedIn, getToken, syncUser } = useAuthFetch();
  const t = useT();

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', stock: '0', description: '' });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '0', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadProducts = useCallback(
    () => authFetch<Product[]>(`/shops/${shopId}/products`).then(setProducts),
    [authFetch, shopId],
  );

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    authFetch('/auth/sync', { method: 'POST' })
      .then(() =>
        Promise.all([
          authFetch<ShopInfo>(`/shops/${shopId}`),
          loadProducts(),
        ]),
      )
      .then(([shopData]) => setShop(shopData))
      .catch(() => setError(t('shops.manage.noPermission')))
      .finally(() => setLoading(false));
  }, [authFetch, isSignedIn, loadProducts, router, shopId]);

  const imageUrls = photos.filter((p) => p.url).map((p) => p.url!);
  const hasUploading = photos.some((p) => p.uploading || p.processing);
  const hasUploadErrors = photos.some((p) => p.error);

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
  };

  const saveEdit = async (productId: string) => {
    setSubmitting(true);
    setError('');
    try {
      await authFetch(`/shops/${shopId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          price: Number(editForm.price),
          stock: Number(editForm.stock) || 0,
          description: editForm.description.trim() || undefined,
        }),
      });
      await loadProducts();
      setEditingId(null);
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

  return (
    <div className="shp-manage">
      <header className="shp-manage__hero">
        <div className="shp-manage__hero-top">
          <Link href={`/shops/${shopId}`} className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--shp-gold)" />
            {t('shops.manage.back')}
          </Link>
          <span className="pub-badge">{t('shops.manage.badge')}</span>
        </div>
        <p className="pub-hero__ar">{t('shops.manage.title')}</p>
        <h1>{t('shops.manage.title')}</h1>
        <p className="shp-lead">
          {shop ? (
            <>
              {t('shops.manage.catalogOf')} <strong>{shop.name}</strong>
              {shop.camp?.nameEs ? ` · ${shop.camp.nameEs}` : ''}
            </>
          ) : (
            t('shops.manage.catalogDefault')
          )}
        </p>
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

      {toast && (
        <p className="shp-manage__toast" role="status">
          {toast}
        </p>
      )}
      {error && <p className="pub-error">{error}</p>}

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
                <span className="pub-currency">MRU</span>
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
            <span>{t('shops.register.description')} ({t('common.optional')})</span>
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
            onClick={addProduct}
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
                <li key={p.id} className={`shp-manage__item ${editingId === p.id ? 'shp-manage__item--edit' : ''}`}>
                  {editingId === p.id ? (
                    <div className="shp-manage__edit">
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
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
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
                        <button type="button" className="pub-btn pub-btn--gold" onClick={() => saveEdit(p.id)} disabled={submitting}>
                          {t('common.save')}
                        </button>
                        <button type="button" className="pub-btn pub-btn--ghost" onClick={() => setEditingId(null)}>
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="shp-manage__item-media">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      <div className="shp-manage__item-body">
                        <strong>{p.name}</strong>
                        {p.description && <p>{p.description}</p>}
                        <div className="shp-manage__item-meta">
                          <span className="shp-product__price">{Number(p.price).toLocaleString('es-ES')} MRU</span>
                          <span>{t('shops.manage.stockLabel', { count: p.stock ?? 0 })}</span>
                        </div>
                      </div>
                      <div className="shp-manage__item-btns">
                        <button type="button" className="shp-manage__icon-btn" onClick={() => startEdit(p)} title={t('shops.manage.edit')}>
                          ✎
                        </button>
                        <button type="button" className="shp-manage__icon-btn shp-manage__icon-btn--danger" onClick={() => removeProduct(p.id)} title={t('shops.manage.remove')}>
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
    </div>
  );
}

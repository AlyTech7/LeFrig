'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MARKETPLACE_DEPARTMENTS,
  marketplaceListingItems,
  categoryHasStructuredAttributes,
  getDescriptionMinLength,
  areRequiredAttributesFilled,
  formatAttributeDetails,
  suggestListingTitle,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from '@lefrig/shared';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { CountryFlag } from '@/components/CountryFlag';
import { ImageUploader, type PhotoItem } from '@/components/marketplace/ImageUploader';
import { ListingAttributeFields } from '@/components/marketplace/ListingAttributeFields';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary, pickLocalized } from '@lefrig/shared';
import { CurrencySelect } from '@lefrig/ui/client';

type Step = 1 | 2 | 3 | 4;
type PayMethod = 'cash' | 'cash_on_delivery';
type Condition = 'new' | 'like_new' | 'used' | 'for_parts';

const STEPS: { n: Step; labelKey: string }[] = [
  { n: 1, labelKey: 'publish.stepCategory' },
  { n: 2, labelKey: 'publish.stepDetails' },
  { n: 3, labelKey: 'publish.stepPrice' },
  { n: 4, labelKey: 'publish.stepReview' },
];

const CONDITIONS: { id: Condition; labelKey: string }[] = [
  { id: 'new', labelKey: 'conditions.new' },
  { id: 'like_new', labelKey: 'conditions.likeNew' },
  { id: 'used', labelKey: 'conditions.used' },
  { id: 'for_parts', labelKey: 'conditions.forParts' },
];

const PAYMENTS: { id: PayMethod; labelKey: string; descKey: string }[] = [
  { id: 'cash', labelKey: 'common.cash', descKey: 'publish.paymentCashDesc' },
  { id: 'cash_on_delivery', labelKey: 'payment.cashOnDelivery', descKey: 'publish.paymentCodDesc' },
];

const TIP_KEYS: Record<Step, string> = {
  1: 'publish.tipCategory',
  2: 'publish.tipDetailsLong',
  3: 'publish.tipPrice',
  4: 'publish.tipReview',
};

function campCountry(slug: string) {
  return slug === 'tindouf' ? 'DZ' : 'EH';
}

export function PublishListingStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, getToken, syncUser } = useAuthFetch();

  const [step, setStep] = useState<Step>(1);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);

  const [category, setCategory] = useState('mobiles');
  const [campId, setCampId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Condition>('used');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [negotiable, setNegotiable] = useState(true);
  const [payments, setPayments] = useState<PayMethod[]>(['cash']);
  const [contactNote, setContactNote] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      const list = res.data.length ? res.data : demoCamps;
      setCamps(list);
      setCampId((prev) => prev || list[0]?.id || '');
    });
  }, []);

  const cat = marketplaceListingItems().find((c) => c.slug === category);
  const camp = camps.find((c) => c.id === campId);
  const imageUrls = photos.filter((p) => p.url).map((p) => p.url!);
  const coverPreview = photos[0]?.preview ?? photos.find((p) => p.url)?.url;
  const hasUploading = photos.some((p) => p.uploading);
  const hasUploadErrors = photos.some((p) => p.error);
  const priceNum = Number(price);

  const progress = (step / 4) * 100;
  const hasStructured = categoryHasStructuredAttributes(category);
  const descMin = getDescriptionMinLength(category);

  useEffect(() => {
    if (!hasStructured || title.trim()) return;
    const suggested = suggestListingTitle(category, attributes);
    if (suggested) setTitle(suggested);
  }, [attributes, category, hasStructured, title]);

  const fullDescription = useMemo(() => {
    const parts = [description.trim()];
    if (!hasStructured) {
      const cond = CONDITIONS.find((c) => c.id === condition);
      if (cond) parts.push(t('publish.conditionLabel', { label: t(cond.labelKey) }));
    }
    if (negotiable) parts.push(t('marketplace.negotiable'));
    if (contactNote.trim()) parts.push(t('publish.contactPrefix', { note: contactNote.trim() }));
    return parts.filter(Boolean).join('\n\n');
  }, [description, condition, negotiable, contactNote, hasStructured, t]);

  const canNext = useMemo(() => {
    if (step === 1) return !!category && !!campId;
    if (step === 2) {
      const descOk = description.trim().length >= descMin;
      const attrsOk = areRequiredAttributesFilled(category, attributes);
      return (
        title.trim().length >= 3 &&
        descOk &&
        attrsOk &&
        imageUrls.length >= 1 &&
        !hasUploading &&
        !hasUploadErrors
      );
    }
    if (step === 3) return priceNum > 0 && payments.length > 0;
    return true;
  }, [step, category, campId, title, description, descMin, attributes, imageUrls.length, hasUploading, hasUploadErrors, priceNum, payments.length]);

  const togglePayment = (id: PayMethod) => {
    setPayments((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]));
  };

  const publish = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!canNext) {
      setError(t('publish.completeRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authFetch('/auth/sync', { method: 'POST' });
      await authFetch('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: fullDescription,
          price: priceNum,
          currency,
          category,
          campId,
          images: imageUrls.length ? imageUrls : undefined,
          paymentMethods: payments,
          attributes: hasStructured ? attributes : undefined,
        }),
      });
      router.push('/marketplace');
    } catch (err) {
      const detail = err instanceof Error ? err.message.trim() : '';
      setError(detail && !detail.startsWith('API 5') ? detail.replace(/^API \d+:\s*/, '') : t('publish.publishError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pub">
      <header className="pub-hero">
        <div className="pub-hero__top">
          <Link href="/marketplace" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--pub-gold, #a8842d)" />
            {t('publish.backToMarket')}
          </Link>
          <span className="pub-badge">{t('publish.badge')}</span>
        </div>
        <h1>
          {t('publish.title')}
          <span className="pub-gradient"> {t('publish.titleAccent')}</span>
        </h1>
        <p className="pub-lead">{t('publish.lead')}</p>
        <div className="pub-progress">
          <div className="pub-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <nav className="pub-steps" aria-label={t('publish.stepsAria')}>
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              className={step === s.n ? 'pub-step pub-step--on' : step > s.n ? 'pub-step pub-step--done' : 'pub-step'}
              onClick={() => s.n < step && setStep(s.n)}
              disabled={s.n > step}
            >
              <span className="pub-step__n">{step > s.n ? '✓' : s.n}</span>
              <span>
                <strong>{t(s.labelKey)}</strong>
              </span>
            </button>
          ))}
        </nav>
      </header>

      <div className="pub-layout">
        <section className="pub-panel">
          {step === 1 && (
            <>
              <h2>{t('publish.whatSell')}</h2>
              <p className="pub-hint">{t('publish.categoryHint')}</p>
              {MARKETPLACE_DEPARTMENTS.filter((d) => d.items.some((i) => i.kind === 'listing')).map((dept) => (
                <div key={dept.id} className="pub-dept-block">
                  <h3 className="pub-subtitle">
                    {dept.icon} {locale === 'ar' ? dept.nameAr : dept.nameEs}
                  </h3>
                  <div className="pub-cats">
                    {dept.items
                      .filter((i) => i.kind === 'listing')
                      .map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          className={category === c.slug ? 'pub-cat pub-cat--on' : 'pub-cat'}
                          onClick={() => {
                            setCategory(c.slug);
                            setAttributes({});
                          }}
                        >
                          <span className="pub-cat__icon">{c.icon}</span>
                          <strong>{pickLocalized(c, locale)}</strong>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
              <h3 className="pub-subtitle">{t('publish.whereAreYou')}</h3>
              <div className="pub-camps">
                {camps.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={campId === c.id ? 'pub-camp pub-camp--on' : 'pub-camp'}
                    onClick={() => setCampId(c.id)}
                  >
                    <CountryFlag country={campCountry(c.slug)} size={16} />
                    <span>
                      <strong>{localizedCampFromSummary(c, locale)}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>{t('publish.productDetails')}</h2>
              <p className="pub-hint">{t('publish.photosHint')}</p>
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
              <ListingAttributeFields
                categorySlug={category}
                values={attributes}
                onChange={setAttributes}
              />
              <label className="pub-field">
                <span>{t('publish.listingTitle')}</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('publish.titlePlaceholder')}
                  maxLength={120}
                />
                <small>{title.length}/120</small>
              </label>
              <label className="pub-field">
                <span>{hasStructured ? t('publish.extraNotes') : t('publish.description')}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={hasStructured ? 3 : 5}
                  placeholder={hasStructured ? t('publish.notesPlaceholder') : t('publish.descPlaceholder')}
                  maxLength={2000}
                />
                <small>
                  {description.length}/2000
                  {descMin > 0
                    ? ` · ${t('publish.charsMin', { min: descMin })}`
                    : ` · ${t('common.optional')}`}
                </small>
              </label>
              {!hasStructured && (
                <>
              <p className="pub-subtitle">{t('publish.condition')}</p>
              <div className="pub-chips">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={condition === c.id ? 'pub-chip pub-chip--on' : 'pub-chip'}
                    onClick={() => setCondition(c.id)}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2>{t('publish.priceTitle')}</h2>
              <label className="pub-field pub-field--price">
                <span>{t('publish.priceLabel')}</span>
                <div className="pub-price-row">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    min={1}
                    placeholder="12500"
                  />
                </div>
              </label>
              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                locale={locale}
                label={t('publish.currencyLabel')}
              />
              <label className="pub-check">
                <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
                <span>{t('marketplace.negotiable')}</span>
              </label>
              <p className="pub-subtitle">{t('publish.paymentMethods')}</p>
              <div className="pub-payments">
                {PAYMENTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={payments.includes(p.id) ? 'pub-pay pub-pay--on' : 'pub-pay'}
                    onClick={() => togglePayment(p.id)}
                  >
                    <strong>{t(p.labelKey)}</strong>
                    <small>{t(p.descKey)}</small>
                  </button>
                ))}
              </div>
              <label className="pub-field">
                <span>{t('publish.contactNote')}</span>
                <input
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  placeholder={t('publish.contactPlaceholder')}
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2>{t('publish.reviewTitle')}</h2>
              <p className="pub-hint">{t('publish.reviewConfirmHint')}</p>
              <dl className="pub-review">
                <div>
                  <dt>{t('publish.reviewCategory')}</dt>
                  <dd>
                    {cat?.icon} {cat ? pickLocalized(cat, locale) : ''}
                  </dd>
                </div>
                <div>
                  <dt>{t('publish.reviewCamp')}</dt>
                  <dd>{camp ? localizedCampFromSummary(camp, locale) : ''}</dd>
                </div>
                <div>
                  <dt>{t('publish.listingTitle')}</dt>
                  <dd>{title}</dd>
                </div>
                {hasStructured && formatAttributeDetails(category, attributes).length > 0 && (
                  <div>
                    <dt>{t('marketplace.characteristics')}</dt>
                    <dd>
                      {formatAttributeDetails(category, attributes).map((row) => (
                        <span key={row.label} style={{ display: 'block' }}>
                          {row.label}: {row.value}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>{t('publish.reviewPrice')}</dt>
                  <dd>
                    {priceNum.toLocaleString('es-ES')} {currency}{' '}
                    {negotiable && `(${t('publish.negotiableShort')})`}
                  </dd>
                </div>
                <div>
                  <dt>{t('publish.reviewPayment')}</dt>
                  <dd>
                    {payments
                      .map((p) => {
                        const pay = PAYMENTS.find((x) => x.id === p);
                        return pay ? t(pay.labelKey) : p;
                      })
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>{t('publish.reviewPhotos')}</dt>
                  <dd>
                    {t('publish.reviewUploaded', { count: imageUrls.length })}
                    {photos.length > 0 && (
                      <div className="pub-review-thumbs">
                        {photos.slice(0, 4).map((p) => (
                          <img key={p.id} src={p.preview} alt="" />
                        ))}
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="pub-trust">
                <AppIcon name="shield" size={20} color="var(--pub-oasis, #2d8a62)" />
                <p>{t('publish.trustNote')}</p>
              </div>
            </>
          )}

          {error && <p className="pub-error">{error}</p>}

          <div className="pub-actions">
            {step > 1 && (
              <button type="button" className="pub-btn pub-btn--ghost" onClick={() => setStep((s) => (s - 1) as Step)}>
                {t('common.back')}
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                className="pub-btn pub-btn--gold"
                disabled={!canNext}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                {t('common.continue')}
                <AppIcon name="chevron-right" size={18} color="#1a1612" />
              </button>
            ) : (
              <button type="button" className="pub-btn pub-btn--gold" disabled={loading} onClick={publish}>
                {loading ? t('publish.publishing') : t('publish.publishNow')}
                <AppIcon name="arrow-up-right" size={18} color="#1a1612" />
              </button>
            )}
          </div>
        </section>

        <aside className="pub-aside">
          <div className="pub-tip">
            <span className="pub-tip__label">{t('publish.tip')}</span>
            <p>{t(TIP_KEYS[step])}</p>
          </div>

          <div className="pub-preview">
            <span className="pub-preview__label">{t('publish.preview')}</span>
            <article className="pub-card">
              <div
                className="pub-card__img"
                style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
              >
                {!coverPreview && <span>{cat?.icon ?? '📦'}</span>}
                <span className="pub-card__badge">💵 {t('common.cash')}</span>
              </div>
              <div className="pub-card__body">
                <h3>{title.trim() || t('publish.previewTitle')}</h3>
                <p className="pub-card__price">
                  {priceNum > 0
                    ? `${priceNum.toLocaleString('es-ES')} ${currency}`
                    : `— ${currency}`}
                  {negotiable && priceNum > 0 && <em>{t('publish.negotiableShort')}</em>}
                </p>
                <p className="pub-card__meta">
                  {cat ? pickLocalized(cat, locale) : t('publish.categoryFallback')} ·{' '}
                  {camp ? localizedCampFromSummary(camp, locale) : t('publish.campFallback')}
                </p>
              </div>
            </article>
          </div>

          <ul className="pub-checklist">
            <li className={category ? 'done' : ''}>{t('publish.checklistCategory')}</li>
            <li className={campId ? 'done' : ''}>{t('publish.checklistCamp')}</li>
            <li className={title.length >= 3 ? 'done' : ''}>{t('publish.checklistTitle')}</li>
            <li className={description.length >= descMin ? 'done' : ''}>
              {hasStructured ? t('publish.checklistAttrs') : t('publish.checklistDesc')}
            </li>
            {hasStructured && (
              <li className={areRequiredAttributesFilled(category, attributes) ? 'done' : ''}>
                {t('publish.checklistBrandYear')}
              </li>
            )}
            <li className={imageUrls.length >= 1 ? 'done' : ''}>{t('publish.checklistPhoto')}</li>
            <li className={priceNum > 0 ? 'done' : ''}>{t('publish.checklistPrice')}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

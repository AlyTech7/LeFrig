'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ImageUploader, type PhotoItem } from '@/components/marketplace/ImageUploader';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary } from '@lefrig/shared';

type Step = 1 | 2 | 3 | 4;
type ShopType = 'individual' | 'cooperative' | 'association' | 'workshop';

const STEPS: { n: Step; labelKey: string }[] = [
  { n: 1, labelKey: 'shops.studio.stepType' },
  { n: 2, labelKey: 'shops.studio.stepShop' },
  { n: 3, labelKey: 'shops.studio.stepPayments' },
  { n: 4, labelKey: 'shops.studio.stepPublish' },
];

const SHOP_TYPES: { id: ShopType; labelKey: string; descKey: string; icon: string }[] = [
  { id: 'individual', labelKey: 'shops.typeIndividual', descKey: 'shops.studio.typeIndividualDesc', icon: '🏪' },
  { id: 'cooperative', labelKey: 'shops.typeCooperative', descKey: 'shops.studio.typeCooperativeDesc', icon: '🤝' },
  { id: 'association', labelKey: 'shops.typeAssociation', descKey: 'shops.studio.typeAssociationDesc', icon: '👥' },
  { id: 'workshop', labelKey: 'shops.typeWorkshop', descKey: 'shops.studio.typeWorkshopDesc', icon: '🔧' },
];

const TIP_KEYS: Record<Step, string> = {
  1: 'shops.studio.tip1',
  2: 'shops.studio.tip2',
  3: 'shops.studio.tip3',
  4: 'shops.studio.tip4',
};

function campEmoji(slug: string) {
  if (slug === 'tindouf') return '🏜️';
  return 'ⵣ';
}

export function RegisterShopStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, getToken, syncUser } = useAuthFetch();

  const [step, setStep] = useState<Step>(1);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);

  const [shopType, setShopType] = useState<ShopType>('individual');
  const [campId, setCampId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [phone, setPhone] = useState('+222');
  const [whatsapp, setWhatsapp] = useState('');
  const [acceptsCash, setAcceptsCash] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      const list = res.data.length ? res.data : demoCamps;
      setCamps(list);
      setCampId((prev) => prev || list[0]?.id || '');
    });
  }, []);

  const typeInfo = SHOP_TYPES.find((x) => x.id === shopType);
  const camp = camps.find((c) => c.id === campId);
  const imageUrls = photos.filter((p) => p.url).map((p) => p.url!);
  const coverPreview = photos[0]?.preview ?? photos.find((p) => p.url)?.url;
  const hasUploading = photos.some((p) => p.uploading || p.processing);
  const hasUploadErrors = photos.some((p) => p.error);

  const progress = (step / 4) * 100;

  const canNext = useMemo(() => {
    if (step === 1) return !!shopType && !!campId;
    if (step === 2) {
      return (
        name.trim().length >= 2 &&
        description.trim().length >= 10 &&
        imageUrls.length >= 1 &&
        !hasUploading &&
        !hasUploadErrors
      );
    }
    if (step === 3) {
      const p = phone.trim();
      return p.length >= 8 && acceptsCash;
    }
    return true;
  }, [
    step,
    shopType,
    campId,
    name,
    description,
    imageUrls.length,
    hasUploading,
    hasUploadErrors,
    phone,
    acceptsCash,
  ]);

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
      await authFetch('/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || undefined,
          campId,
          shopType,
          acceptsCash: true,
          acceptsFiado: false,
          acceptsVouchers: false,
          imageUrl: imageUrls[0],
        }),
      });
      router.push('/shops');
    } catch {
      setError(t('shops.studio.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pub">
      <header className="pub-hero">
        <div className="pub-hero__top">
          <Link href="/shops" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--pub-gold, #a8842d)" />
            {t('shops.studio.back')}
          </Link>
          <span className="pub-badge">{t('shops.studio.badge')}</span>
        </div>
        <p className="pub-hero__ar">{t('shops.register.title')}</p>
        <h1>
          {t('shops.studio.title')}
          <span className="pub-gradient">{t('shops.studio.titleAccent')}</span>
        </h1>
        <p className="pub-lead">{t('shops.studio.lead')}</p>
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
              <span><strong>{t(s.labelKey)}</strong></span>
            </button>
          ))}
        </nav>
      </header>

      <div className="pub-layout">
        <section className="pub-panel">
          {step === 1 && (
            <>
              <h2>{t('shops.studio.whatType')}</h2>
              <p className="pub-hint">{t('shops.studio.typeHint')}</p>
              <div className="pub-cats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {SHOP_TYPES.map((shopTypeOpt) => (
                  <button
                    key={shopTypeOpt.id}
                    type="button"
                    className={shopType === shopTypeOpt.id ? 'pub-cat pub-cat--on' : 'pub-cat'}
                    onClick={() => setShopType(shopTypeOpt.id)}
                  >
                    <span className="pub-cat__icon">{shopTypeOpt.icon}</span>
                    <strong>{t(shopTypeOpt.labelKey)}</strong>
                  </button>
                ))}
              </div>
              {typeInfo && <p className="pub-hint pub-hint--tight">{t(typeInfo.descKey)}</p>}
              <h3 className="pub-subtitle">{t('shops.register.camp')}</h3>
              <div className="pub-camps">
                {camps.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={campId === c.id ? 'pub-camp pub-camp--on' : 'pub-camp'}
                    onClick={() => setCampId(c.id)}
                  >
                    <span>{campEmoji(c.slug)}</span>
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
              <h2>{t('shops.studio.yourShop')}</h2>
              <p className="pub-hint">{t('shops.studio.shopHint')}</p>
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
                <span>{t('shops.studio.nameLabel')}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('shops.studio.namePlaceholder')}
                  maxLength={100}
                />
                <small>{name.length}/100</small>
              </label>
              <label className="pub-field">
                <span>{t('shops.register.description')}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={t('shops.studio.descPlaceholder')}
                  maxLength={1000}
                />
                <small>{description.length}/1000 · {t('publish.charsMin', { min: 10 })}</small>
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <h2>{t('shops.studio.paymentsContact')}</h2>
              <p className="pub-hint">{t('shops.studio.paymentsHint')}</p>
              <div className="pub-payments">
                <button type="button" className="pub-pay pub-pay--on" disabled>
                  <strong>{t('shops.tagCash')}</strong>
                  <small>{t('shops.studio.cashDesc')}</small>
                </button>
              </div>
              <label className="pub-field">
                <span>{t('shops.studio.phone')}</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+222 XX XX XX XX"
                />
              </label>
              <label className="pub-field">
                <span>{t('shops.studio.whatsappOptional')}</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={t('shops.studio.whatsappPlaceholder')}
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2>{t('publish.reviewTitle')}</h2>
              <p className="pub-hint">{t('shops.studio.reviewHint')}</p>
              <dl className="pub-review">
                <div>
                  <dt>{t('shops.studio.reviewType')}</dt>
                  <dd>
                    {typeInfo?.icon} {typeInfo ? t(typeInfo.labelKey) : ''}
                  </dd>
                </div>
                <div>
                  <dt>{t('shops.register.camp')}</dt>
                  <dd>{camp ? localizedCampFromSummary(camp, locale) : ''}</dd>
                </div>
                <div>
                  <dt>{t('shops.studio.reviewName')}</dt>
                  <dd>{name}</dd>
                </div>
                <div>
                  <dt>{t('shops.studio.reviewPayments')}</dt>
                  <dd>{t('common.cash')}</dd>
                </div>
                <div>
                  <dt>{t('shops.studio.reviewContact')}</dt>
                  <dd>{phone}</dd>
                </div>
                <div>
                  <dt>{t('shops.studio.reviewPhoto')}</dt>
                  <dd>
                    {imageUrls.length ? t('shops.studio.coverUploaded') : '—'}
                    {photos[0] && (
                      <div className="pub-review-thumbs">
                        <img src={photos[0].preview} alt="" />
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="pub-trust">
                <AppIcon name="shield" size={20} color="var(--pub-oasis, #2d8a62)" />
                <p>{t('shops.studio.trustNote')}</p>
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
                {loading ? t('shops.studio.registering') : t('shops.studio.registerNow')}
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
                {!coverPreview && <span>{typeInfo?.icon ?? '🏪'}</span>}
                <span className="pub-card__badge">{acceptsCash && '💵'}</span>
              </div>
              <div className="pub-card__body">
                <h3>{name.trim() || t('shops.studio.previewName')}</h3>
                <p className="pub-card__meta">
                  {typeInfo ? t(typeInfo.labelKey) : t('shops.typeIndividual')} · {camp ? localizedCampFromSummary(camp, locale) : t('publish.campFallback')}
                </p>
              </div>
            </article>
          </div>

          <ul className="pub-checklist">
            <li className={shopType ? 'done' : ''}>{t('shops.studio.checklistType')}</li>
            <li className={campId ? 'done' : ''}>{t('publish.checklistCamp')}</li>
            <li className={name.length >= 2 ? 'done' : ''}>{t('shops.studio.checklistName')}</li>
            <li className={description.length >= 10 ? 'done' : ''}>{t('shops.studio.checklistDesc')}</li>
            <li className={imageUrls.length >= 1 ? 'done' : ''}>{t('shops.studio.checklistPhoto')}</li>
            <li className={phone.trim().length >= 8 ? 'done' : ''}>{t('shops.studio.checklistPhone')}</li>
            <li className={acceptsCash ? 'done' : ''}>{t('shops.studio.checklistPayment')}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

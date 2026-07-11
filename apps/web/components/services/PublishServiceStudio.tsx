'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SERVICE_CATEGORIES } from '@lefrig/shared';
import type { CampSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ImageUploader, type PhotoItem } from '@/components/marketplace/ImageUploader';
import { demoCamps, fetchWithMeta } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useLocale, useT } from '@/lib/locale';
import { localizedCampFromSummary, pickLocalized } from '@lefrig/shared';

type Step = 1 | 2 | 3 | 4;

const STEPS: { n: Step; labelKey: string }[] = [
  { n: 1, labelKey: 'services.studio.stepTrade' },
  { n: 2, labelKey: 'services.studio.stepProfile' },
  { n: 3, labelKey: 'services.studio.stepPrice' },
  { n: 4, labelKey: 'services.studio.stepPublish' },
];

const TIP_KEYS: Record<Step, string> = {
  1: 'services.studio.tip1',
  2: 'services.studio.tip2',
  3: 'services.studio.tip3',
  4: 'services.studio.tip4',
};

function campEmoji(slug: string) {
  if (slug === 'tindouf') return '🏜️';
  return 'ⵣ';
}

export function PublishServiceStudio() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { authFetch, isSignedIn, getToken, syncUser } = useAuthFetch();

  const [step, setStep] = useState<Step>(1);
  const [camps, setCamps] = useState<CampSummary[]>(demoCamps);

  const [categorySlug, setCategorySlug] = useState('electrician');
  const [campIds, setCampIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [contactNote, setContactNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', demoCamps).then((res) => {
      const list = res.data.length ? res.data : demoCamps;
      setCamps(list);
      setCampIds((prev) => (prev.length ? prev : [list[0]?.id ?? ''].filter(Boolean)));
    });
  }, []);

  const cat = SERVICE_CATEGORIES.find((c) => c.slug === categorySlug);
  const imageUrls = photos.filter((p) => p.url).map((p) => p.url!);
  const coverPreview = photos[0]?.preview ?? photos.find((p) => p.url)?.url;
  const hasUploading = photos.some((p) => p.uploading || p.processing);
  const hasUploadErrors = photos.some((p) => p.error);
  const priceFromNum = Number(priceFrom);
  const priceToNum = Number(priceTo);

  const progress = (step / 4) * 100;

  const selectedCamps = camps.filter((c) => campIds.includes(c.id));

  const fullDescription = useMemo(() => {
    const parts = [description.trim()];
    if (contactNote.trim()) parts.push(t('publish.contactPrefix', { note: contactNote.trim() }));
    return parts.filter(Boolean).join('\n\n');
  }, [description, contactNote]);

  const toggleCamp = (id: string) => {
    setCampIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const canNext = useMemo(() => {
    if (step === 1) return !!categorySlug && campIds.length > 0;
    if (step === 2) {
      return (
        title.trim().length >= 3 &&
        description.trim().length >= 15 &&
        imageUrls.length >= 1 &&
        !hasUploading &&
        !hasUploadErrors
      );
    }
    if (step === 3) return priceFromNum > 0 && (!priceTo || priceToNum >= priceFromNum);
    return true;
  }, [
    step,
    categorySlug,
    campIds.length,
    title,
    description,
    imageUrls.length,
    hasUploading,
    hasUploadErrors,
    priceFromNum,
    priceTo,
    priceToNum,
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
      await authFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug,
          title: title.trim(),
          description: fullDescription,
          priceFrom: priceFromNum,
          priceTo: priceTo ? priceToNum : undefined,
          campIds,
          images: imageUrls.length ? imageUrls : undefined,
        }),
      });
      router.push('/services');
    } catch {
      setError(t('publish.publishError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pub">
      <header className="pub-hero">
        <div className="pub-hero__top">
          <Link href="/services" className="pub-back">
            <AppIcon name="arrow-left" size={16} color="var(--pub-gold, #a8842d)" />
            {t('services.studio.back')}
          </Link>
          <span className="pub-badge">{t('services.studio.badge')}</span>
        </div>
        <p className="pub-hero__ar">{t('services.create.title')}</p>
        <h1>
          {t('services.studio.title')}
          <span className="pub-gradient">{t('services.studio.titleAccent')}</span>
        </h1>
        <p className="pub-lead">{t('services.studio.lead')}</p>
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
              <h2>{t('services.studio.whatService')}</h2>
              <p className="pub-hint">{t('services.studio.serviceHint')}</p>
              <div className="pub-cats">
                {SERVICE_CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    className={categorySlug === c.slug ? 'pub-cat pub-cat--on' : 'pub-cat'}
                    onClick={() => setCategorySlug(c.slug)}
                  >
                    <span className="pub-cat__icon">{c.icon}</span>
                    <strong>{pickLocalized(c, locale)}</strong>
                  </button>
                ))}
              </div>
              <h3 className="pub-subtitle">{t('services.studio.whichCamps')}</h3>
              <p className="pub-hint pub-hint--tight">{t('services.studio.multiCamp')}</p>
              <div className="pub-camps">
                {camps.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={campIds.includes(c.id) ? 'pub-camp pub-camp--on' : 'pub-camp'}
                    onClick={() => toggleCamp(c.id)}
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
              <h2>{t('services.studio.profileTitle')}</h2>
              <p className="pub-hint">{t('services.studio.profileHint')}</p>
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
                <span>{t('services.studio.titleLabel')}</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('services.studio.titlePlaceholder', { trade: cat ? pickLocalized(cat, locale) : t('services.studio.tradeFallback') })}
                  maxLength={100}
                />
                <small>{title.length}/100</small>
              </label>
              <label className="pub-field">
                <span>{t('publish.description')}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={t('services.studio.descPlaceholder')}
                  maxLength={2000}
                />
                <small>{description.length}/2000 · {t('services.studio.charsMin')}</small>
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <h2>{t('services.studio.priceTitle')}</h2>
              <p className="pub-hint">{t('services.studio.priceHint')}</p>
              <label className="pub-field pub-field--price">
                <span>{t('services.studio.priceFrom')}</span>
                <div className="pub-price-row">
                  <input
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    type="number"
                    min={1}
                    placeholder="500"
                  />
                  <span className="pub-currency">MRU</span>
                </div>
              </label>
              <label className="pub-field pub-field--price">
                <span>{t('services.studio.priceTo')}</span>
                <div className="pub-price-row">
                  <input
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    type="number"
                    min={1}
                    placeholder="2000"
                  />
                  <span className="pub-currency">MRU</span>
                </div>
              </label>
              <label className="pub-field">
                <span>{t('services.studio.contactOptional')}</span>
                <input
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  placeholder={t('services.studio.contactPlaceholder')}
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <h2>{t('publish.reviewTitle')}</h2>
              <p className="pub-hint">{t('services.studio.reviewHint')}</p>
              <dl className="pub-review">
                <div>
                  <dt>{t('services.studio.reviewTrade')}</dt>
                  <dd>
                    {cat?.icon} {cat ? pickLocalized(cat, locale) : ''}
                  </dd>
                </div>
                <div>
                  <dt>{t('services.studio.reviewCamps')}</dt>
                  <dd>{selectedCamps.map((c) => localizedCampFromSummary(c, locale)).join(', ')}</dd>
                </div>
                <div>
                  <dt>{t('publish.reviewFieldTitle')}</dt>
                  <dd>{title}</dd>
                </div>
                <div>
                  <dt>{t('services.studio.reviewPrice')}</dt>
                  <dd>
                    {priceToNum > 0
                      ? t('services.studio.priceRange', { from: priceFromNum.toLocaleString(), to: priceToNum.toLocaleString() })
                      : t('services.studio.priceFromTo', { from: priceFromNum.toLocaleString() })}
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
                <p>{t('services.studio.trustNote')}</p>
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
                {loading ? t('publish.publishing') : t('services.studio.publishNow')}
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
                {!coverPreview && <span>{cat?.icon ?? '🔧'}</span>}
                <span className="pub-card__badge">{t('services.verifiedBadge')}</span>
              </div>
              <div className="pub-card__body">
                <h3>{title.trim() || (cat ? pickLocalized(cat, locale) : t('services.studio.previewService'))}</h3>
                <p className="pub-card__price">
                  {priceFromNum > 0 ? t('services.studio.priceFromTo', { from: priceFromNum.toLocaleString() }) : '— MRU'}
                </p>
                <p className="pub-card__meta">
                  {cat ? pickLocalized(cat, locale) : t('services.studio.tradeFallback')} · {selectedCamps.map((c) => localizedCampFromSummary(c, locale)).join(', ') || t('publish.campFallback')}
                </p>
              </div>
            </article>
          </div>

          <ul className="pub-checklist">
            <li className={categorySlug ? 'done' : ''}>{t('services.studio.checklistTrade')}</li>
            <li className={campIds.length ? 'done' : ''}>{t('services.studio.checklistCamps')}</li>
            <li className={title.length >= 3 ? 'done' : ''}>{t('publish.checklistTitle')}</li>
            <li className={description.length >= 15 ? 'done' : ''}>{t('publish.checklistDesc')}</li>
            <li className={imageUrls.length >= 1 ? 'done' : ''}>{t('services.studio.checklistPhoto')}</li>
            <li className={priceFromNum > 0 ? 'done' : ''}>{t('publish.checklistPrice')}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

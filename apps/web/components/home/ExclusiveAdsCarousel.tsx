'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { HOME_VISUALS } from '@/lib/home-visuals';
import { useT } from '@/lib/locale';

const ADS = [
  {
    id: 'solar',
    titleKey: 'promo.solar',
    sponsor: 'Energía Camp',
    href: '/marketplace?q=solar',
    image: HOME_VISUALS.curated.solar,
    position: 'center 50%',
    accent: '#c9a24d',
  },
  {
    id: 'transport',
    titleKey: 'promo.transport',
    sponsor: 'Trans-Sahara',
    href: '/transport',
    image: HOME_VISUALS.pillars.transport,
    position: 'center 48%',
    accent: '#3d9a72',
  },
  {
    id: 'shop',
    titleKey: 'promo.shop',
    sponsor: 'Bazar Al-Nour',
    href: '/shops',
    image: HOME_VISUALS.society.shops,
    position: 'center 42%',
    accent: '#d4a574',
  },
] as const;

const MS = 5600;

export function ExclusiveAdsCarousel() {
  const t = useT();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setActive(((i % ADS.length) + ADS.length) % ADS.length), []);

  const ads = useMemo(
    () => ADS.map((item) => ({ ...item, title: t(item.titleKey) })),
    [t],
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % ADS.length), MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="lf-promo lf-promo--lead"
      aria-label={t('promo.label')}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <p className="lf-promo__label">{t('promo.sponsored')}</p>

      <div className="lf-promo__stage">
        <div className="lf-promo__card">
          {ads.map((item, i) => (
            <article
              key={item.id}
              className={`lf-promo__slide ${i === active ? 'lf-promo__slide--on' : ''}`}
              aria-hidden={i !== active}
              style={
                {
                  '--lf-promo-img': `url("${item.image}")`,
                  '--lf-promo-pos': item.position,
                  '--lf-promo-accent': item.accent,
                } as CSSProperties
              }
            >
              <div className="lf-promo__photo" aria-hidden />
              <div className="lf-promo__shade" aria-hidden />
              <div className="lf-promo__content">
                <div className="lf-promo__text">
                  <strong>{item.title}</strong>
                  <em>{item.sponsor}</em>
                </div>
                <Link
                  href={item.href}
                  className="lf-promo__btn"
                  tabIndex={i === active ? 0 : -1}
                >
                  {t('promo.view')}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="lf-promo__dots" role="tablist" aria-label={t('promo.adsAria')}>
          {ads.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={`lf-promo__dot ${i === active ? 'lf-promo__dot--on' : ''}`}
              aria-selected={i === active}
              aria-label={item.title}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

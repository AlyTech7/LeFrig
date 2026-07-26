'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  pickLocalized,
  type MarketplaceDepartment,
  type MarketplaceItem,
} from '@lefrig/shared';
import { VisLayers } from '@/components/home/VisLayers';
import { AppIcon } from '@/components/AppIcon';
import { atlasVisStyle, categoryVisStyle, visClass } from '@/lib/home-visuals';
import { useLocale, useT } from '@/lib/locale';

const PULSE_SLUGS = ['mobiles', 'cars', 'food', 'generators', 'camels', 'job-vacancies'] as const;
const DEFAULT_DEPT = 'vehicles';
const GRID_CAP = 8;

function allItems(): MarketplaceItem[] {
  return MARKETPLACE_DEPARTMENTS.flatMap((d) => d.items);
}

function itemBySlug(slug: string): MarketplaceItem | undefined {
  return allItems().find((i) => i.slug === slug);
}

function categoryHref(item: MarketplaceItem): string {
  const href = getMarketplaceItemHref(item);
  if (item.kind === 'listing') return href.split('#')[0]!;
  return href;
}

function deptHref(dept: MarketplaceDepartment): string {
  if (dept.id === 'services-shops') return '/services';
  const first = dept.items[0];
  if (!first) return '/marketplace';
  const base = getMarketplaceItemHref(first);
  return first.kind === 'listing' ? base.split('#')[0]! : base;
}

function accentSolid(accent: string): string {
  return accent.match(/#[0-9a-f]{6}/i)?.[0] ?? '#c9a84c';
}

function PulseChip({ item, rank }: { item: MarketplaceItem; rank: number }) {
  const { locale } = useLocale();
  const dept = MARKETPLACE_DEPARTMENTS.find((d) => d.items.some((i) => i.slug === item.slug));
  const name = pickLocalized(item, locale);

  return (
    <Link
      href={categoryHref(item)}
      className={`lf-console__pulse ${visClass('deep')}`}
      style={categoryVisStyle(item.slug, dept?.id) as CSSProperties}
      aria-label={name}
    >
      <VisLayers />
      <span className="lf-vis__content lf-console__pulse-inner">
        <span className="lf-console__pulse-rank" aria-hidden>
          {String(rank).padStart(2, '0')}
        </span>
        <span className="lf-console__pulse-name">{name}</span>
        <span className="lf-console__pulse-go" aria-hidden>
          <AppIcon name="arrow-up-right" size={11} />
        </span>
      </span>
    </Link>
  );
}

function GridCell({ item, deptId }: { item: MarketplaceItem; deptId: string }) {
  const { locale } = useLocale();
  const name = pickLocalized(item, locale);

  return (
    <Link
      href={categoryHref(item)}
      className={`lf-console__cell ${visClass('deep')}`}
      style={categoryVisStyle(item.slug, deptId) as CSSProperties}
      role="listitem"
      aria-label={name}
    >
      <VisLayers />
      <span className="lf-vis__content lf-console__cell-inner">
        <span className="lf-console__cell-ico" aria-hidden>
          {item.icon}
        </span>
        <span className="lf-console__cell-name">{name}</span>
        <span className="lf-console__cell-go" aria-hidden>
          <AppIcon name="arrow-up-right" size={10} />
        </span>
      </span>
    </Link>
  );
}

export function HomeDirectAccess() {
  const { locale } = useLocale();
  const t = useT();
  const [activeDeptId, setActiveDeptId] = useState(DEFAULT_DEPT);
  const railRef = useRef<HTMLElement>(null);

  const pulseSet = useMemo(() => new Set<string>(PULSE_SLUGS), []);
  const pulseItems = PULSE_SLUGS.map((slug) => itemBySlug(slug)).filter(Boolean) as MarketplaceItem[];

  const activeDept = MARKETPLACE_DEPARTMENTS.find((d) => d.id === activeDeptId) ?? MARKETPLACE_DEPARTMENTS[0]!;
  const deptName = pickLocalized(
    { slug: activeDept.id, nameEs: activeDept.nameEs, nameAr: activeDept.nameAr },
    locale,
  );
  const activeAccent = accentSolid(activeDept.accent);

  const gridItems = useMemo(() => {
    return activeDept.items.filter((i) => !pulseSet.has(i.slug)).slice(0, GRID_CAP);
  }, [activeDept, pulseSet]);

  const hiddenCount = activeDept.items.filter((i) => !pulseSet.has(i.slug)).length - gridItems.length;
  const isServices = activeDept.id === 'services-shops';
  const showMore = hiddenCount > 0 || isServices;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector('.lf-console__rail-btn--active');
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeDeptId]);

  return (
    <section className="lf-console" aria-labelledby="lf-console-title">
      <div className="lf-console__shell">
        <div className="lf-console__rim" aria-hidden />

        <header className="lf-console__head">
          <div className="lf-console__head-main">
            <p className="lf-console__kicker">
              <span className="lf-console__kicker-dot" aria-hidden />
              {t('home.bazaarKicker')}
            </p>
            <h2 id="lf-console-title">{t('home.consoleTitle')}</h2>
          </div>
          <p className="lf-console__lead">{t('home.consoleSub')}</p>
        </header>

        <div className="lf-console__panel">
          <div className="lf-console__pulse-band">
            <div className="lf-console__pulse-label">
              <AppIcon name="zap" size={12} />
              <span>{t('home.pulseLabel')}</span>
            </div>
            <div className="lf-console__pulse-row" role="list" aria-label={t('home.pulseAria')}>
              {pulseItems.map((item, i) => (
                <div key={item.slug} role="listitem" className="lf-console__pulse-slot">
                  <PulseChip item={item} rank={i + 1} />
                </div>
              ))}
            </div>
          </div>

          <div
            className="lf-console__deck"
            style={
              {
                ...atlasVisStyle(activeDept.id),
                '--lf-console-accent-solid': activeAccent,
              } as CSSProperties
            }
          >
            <div key={activeDeptId} className="lf-console__deck-bg" aria-hidden />
            <div className="lf-console__deck-scrim" aria-hidden />
            <div className="lf-console__deck-accent" aria-hidden />
            <div className="lf-console__deck-vignette" aria-hidden />

            <div className="lf-console__layout">
              <nav ref={railRef} className="lf-console__rail" aria-label={t('home.deptTabsAria')}>
                {MARKETPLACE_DEPARTMENTS.map((dept) => {
                  const name = pickLocalized(
                    { slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr },
                    locale,
                  );
                  const active = dept.id === activeDeptId;
                  const hue = accentSolid(dept.accent);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`lf-console__rail-btn${active ? ' lf-console__rail-btn--active' : ''}`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setActiveDeptId(dept.id)}
                      style={active ? ({ '--lf-rail-accent': hue } as CSSProperties) : undefined}
                    >
                      {active ? <span className="lf-console__rail-mark" aria-hidden /> : null}
                      <span className="lf-console__rail-ico" aria-hidden>
                        {dept.icon}
                      </span>
                      <span className="lf-console__rail-name">{name}</span>
                      <span className="lf-console__rail-count">{dept.items.length}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="lf-console__main">
                <nav className="lf-console__tabs" aria-label={t('home.deptTabsAria')}>
                  {MARKETPLACE_DEPARTMENTS.map((dept) => {
                    const name = pickLocalized(
                      { slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr },
                      locale,
                    );
                    const active = dept.id === activeDeptId;
                    const hue = accentSolid(dept.accent);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        className={`lf-console__tab${active ? ' lf-console__tab--active' : ''}`}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => setActiveDeptId(dept.id)}
                        style={active ? ({ '--lf-tab-accent': hue } as CSSProperties) : undefined}
                      >
                        {active ? <span className="lf-console__tab-mark" aria-hidden /> : null}
                        <span className="lf-console__tab-ico" aria-hidden>
                          {dept.icon}
                        </span>
                        <span className="lf-console__tab-name">{name}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="lf-console__stage" key={activeDeptId}>
                  <div className="lf-console__stage-head">
                    <div className="lf-console__stage-title">
                      <span
                        className="lf-console__stage-ico"
                        style={{ '--lf-stage-accent': activeAccent } as CSSProperties}
                        aria-hidden
                      >
                        {activeDept.icon}
                      </span>
                      <div className="lf-console__stage-copy">
                        <h3>{deptName}</h3>
                        <span className="lf-console__stage-count">
                          {t('atlas.vaultOptions', { count: activeDept.items.length })}
                        </span>
                      </div>
                    </div>
                    <Link href={deptHref(activeDept)} className="lf-console__stage-link">
                      <span className="lf-console__stage-link-text">{t('home.viewDept')}</span>
                      <AppIcon name="arrow-up-right" size={13} />
                    </Link>
                  </div>

                  {gridItems.length > 0 ? (
                    <div className="lf-console__grid" role="list">
                      {gridItems.map((item) => (
                        <GridCell key={item.slug} item={item} deptId={activeDept.id} />
                      ))}
                    </div>
                  ) : (
                    <p className="lf-console__empty">{t('home.consoleEmpty')}</p>
                  )}
                </div>

                <footer className={`lf-console__foot${showMore ? '' : ' lf-console__foot--solo'}`}>
                  {showMore ? (
                    <Link
                      href={isServices ? '/services' : deptHref(activeDept)}
                      className="lf-console__more"
                    >
                      <AppIcon name="package" size={14} />
                      <span>
                        {isServices
                          ? t('home.moreServicesFull')
                          : t('home.moreInDept', { count: hiddenCount })}
                      </span>
                    </Link>
                  ) : null}
                  <Link href="/marketplace" className="lf-console__cta">
                    <span className="lf-console__cta-shine" aria-hidden />
                    <span>{t('home.allListings')}</span>
                    <AppIcon name="arrow-right" size={15} />
                  </Link>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

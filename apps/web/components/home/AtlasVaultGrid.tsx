'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  MARKETPLACE_DEPARTMENTS,
  pickLocalized,
  type MarketplaceDepartment,
  type MarketplaceItem,
} from '@lefrig/shared';
import { atlasVisStyle, visClass } from '@/lib/home-visuals';
import { VisLayers } from '@/components/home/VisLayers';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';
import { deptHref, itemLink } from '@/components/home/atlas-links';

const SERVICES_GROUPS: { key: string; labelKey: string; slugs: string[] }[] = [
  {
    key: 'shops',
    labelKey: 'atlas.groups.shops',
    slugs: ['shops', 'shops-register', 'services-all'],
  },
  {
    key: 'essentials',
    labelKey: 'atlas.groups.essentials',
    slugs: ['construction', 'agua-potable', 'air-conditioners', 'maintenance-services', 'plumbing'],
  },
  {
    key: 'pros',
    labelKey: 'atlas.groups.pros',
    slugs: [
      'electrician',
      'mechanic',
      'henna',
      'classes',
      'education',
      'furniture-moving',
      'hairdressing',
      'phone_repair',
    ],
  },
];

function VaultLinks({
  items,
  compact,
  locale,
}: {
  items: MarketplaceItem[];
  compact?: boolean;
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  return (
    <ul className={compact ? 'lf-vault__list lf-vault__list--compact' : 'lf-vault__list'}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link href={itemLink(item)}>
            <span className="lf-vault__item-ico" aria-hidden>
              {item.icon}
            </span>
            <span className="lf-vault__item-copy">
              <span>{pickLocalized(item, locale)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ServicesVaultBody({
  items,
  locale,
}: {
  items: MarketplaceItem[];
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  const t = useT();
  const bySlug = new Map(items.map((i) => [i.slug, i]));

  return (
    <div className="lf-vault__services-scroll">
      {SERVICES_GROUPS.map((group) => {
        const groupItems = group.slugs.map((s) => bySlug.get(s)).filter(Boolean) as MarketplaceItem[];
        if (!groupItems.length) return null;

        return (
          <div key={group.key} className="lf-vault__svc-group">
            <h4 className="lf-vault__svc-label">
              <span>{t(group.labelKey)}</span>
            </h4>
            <VaultLinks items={groupItems} compact locale={locale} />
          </div>
        );
      })}
    </div>
  );
}

function VaultCard({
  dept,
  index,
  locale,
}: {
  dept: MarketplaceDepartment;
  index: number;
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  const t = useT();
  const num = String(index + 1).padStart(2, '0');
  const isServices = dept.id === 'services-shops';
  const isHero = dept.id === 'vehicles';
  const name = pickLocalized({ slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr }, locale);
  const previewTags = dept.items.slice(0, isHero ? 4 : 3);
  const linkLimit = isHero ? 5 : isServices ? 0 : 4;

  return (
    <article
      id={`atlas-${dept.id}`}
      className={`lf-vault ${visClass('atlas')} ${isServices ? 'lf-vault--services' : ''} ${isHero ? 'lf-vault--hero' : ''}`}
      style={
        {
          ...atlasVisStyle(dept.id),
          '--lf-vault-accent': dept.accent,
          '--vault-i': index,
        } as CSSProperties
      }
    >
      <span className="lf-vault__glow" aria-hidden />
      <VisLayers />
      <div className="lf-vis__content lf-vault__inner">
        <header className="lf-vault__head">
          <Link href={deptHref(dept)} className="lf-vault__head-link">
            <span className="lf-vault__num">{num}</span>
            <span className="lf-vault__icon" aria-hidden>
              {dept.icon}
            </span>
            <div className="lf-vault__head-copy">
              <h3>{name}</h3>
              <span className="lf-vault__count">{t('atlas.vaultOptions', { count: dept.items.length })}</span>
            </div>
          </Link>
        </header>

        {!isServices && previewTags.length > 0 ? (
          <div className="lf-vault__tags" aria-hidden>
            {previewTags.map((item) => (
              <span key={item.slug} className="lf-vault__tag">
                {item.icon} {pickLocalized(item, locale)}
              </span>
            ))}
          </div>
        ) : null}

        {isServices ? (
          <ServicesVaultBody items={dept.items} locale={locale} />
        ) : (
          <VaultLinks items={dept.items.slice(0, linkLimit)} locale={locale} />
        )}

        <footer className="lf-vault__foot">
          <Link href={deptHref(dept)} className="lf-vault__enter">
            {isServices ? t('atlas.vaultExploreServices') : t('atlas.vaultEnter')}
            <AppIcon name="arrow-up-right" size={14} />
          </Link>
          {!isServices && dept.items.length > linkLimit ? (
            <span className="lf-vault__more">{t('atlas.vaultMore', { count: dept.items.length - linkLimit })}</span>
          ) : null}
        </footer>
      </div>
    </article>
  );
}

/** El Atlas completo — bento editorial + subcategorías dentro de cada sala */
export function AtlasVaultGrid() {
  const { locale } = useLocale();

  return (
    <div className="lf-atlas__grid">
      {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
        <VaultCard key={dept.id} dept={dept} index={i} locale={locale} />
      ))}
    </div>
  );
}

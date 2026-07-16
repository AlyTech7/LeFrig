'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
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
  compact,
}: {
  items: MarketplaceItem[];
  locale: ReturnType<typeof useLocale>['locale'];
  compact?: boolean;
}) {
  const t = useT();
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  const groups = compact ? SERVICES_GROUPS.slice(0, 2) : SERVICES_GROUPS;

  return (
    <div className={compact ? 'lf-vault__services-scroll lf-vault__services-scroll--compact' : 'lf-vault__services-scroll'}>
      {groups.map((group) => {
        const groupItems = group.slugs.map((s) => bySlug.get(s)).filter(Boolean) as MarketplaceItem[];
        if (!groupItems.length) return null;

        return (
          <div key={group.key} className="lf-vault__svc-group">
            <h4 className="lf-vault__svc-label">
              <span>{t(group.labelKey)}</span>
            </h4>
            <VaultLinks items={groupItems.slice(0, compact ? 2 : undefined)} compact locale={locale} />
          </div>
        );
      })}
    </div>
  );
}

export type AtlasVaultLayout = 'grid' | 'deck';

export function AtlasVaultCard({
  dept,
  index,
  layout = 'grid',
}: {
  dept: MarketplaceDepartment;
  index: number;
  layout?: AtlasVaultLayout;
}) {
  const { locale } = useLocale();
  const t = useT();
  const num = String(index + 1).padStart(2, '0');
  const isServices = dept.id === 'services-shops';
  const isHero = dept.id === 'vehicles' && layout === 'grid';
  const isDeck = layout === 'deck';
  const name = pickLocalized({ slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr }, locale);
  const tagCount = isDeck ? 3 : isHero ? 4 : 3;
  const previewTags = dept.items.slice(0, tagCount);
  const linkLimit = isDeck ? 3 : isHero ? 5 : isServices ? 0 : 4;

  return (
    <article
      id={isDeck ? undefined : `atlas-${dept.id}`}
      className={`lf-vault ${visClass('atlas')} ${isServices ? 'lf-vault--services' : ''} ${isHero ? 'lf-vault--hero' : ''} ${isDeck ? 'lf-vault--deck' : ''}`}
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
          <ServicesVaultBody items={dept.items} locale={locale} compact={isDeck} />
        ) : (
          <VaultLinks items={dept.items.slice(0, linkLimit)} compact={isDeck} locale={locale} />
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

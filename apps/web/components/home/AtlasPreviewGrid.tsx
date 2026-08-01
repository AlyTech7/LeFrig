'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ATLAS_ROOM_COUNT,
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  pickLocalized,
  type MarketplaceDepartment,
} from '@lefrig/shared';
import { atlasVisStyle, visClass } from '@/lib/home-visuals';
import { VisLayers } from '@/components/home/VisLayers';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';

/** Salas del Atlas en home — sin transporte ni servicios/tiendas (ya están arriba) */
const PREVIEW_DEPT_IDS = ['vehicles', 'real-estate', 'electronics', 'animals', 'family', 'jobs'] as const;

function deptHref(dept: MarketplaceDepartment) {
  if (dept.id === 'services-shops') return '/services';
  const first = dept.items[0];
  if (!first) return '/marketplace';
  const base = getMarketplaceItemHref(first);
  return first.kind === 'listing' ? `${base}#listings` : base;
}

function PreviewTile({
  dept,
  featured,
  locale,
}: {
  dept: MarketplaceDepartment;
  featured?: boolean;
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  const t = useT();
  const name = pickLocalized({ slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr }, locale);

  return (
    <Link
      href={deptHref(dept)}
      className={`lf-atlas-tile ${visClass('atlas')} ${featured ? 'lf-atlas-tile--featured' : ''}`}
      style={
        {
          ...atlasVisStyle(dept.id),
          '--lf-vault-accent': dept.accent,
        } as CSSProperties
      }
    >
      <VisLayers />
      <span className="lf-vis__content lf-atlas-tile__inner">
        <span className="lf-atlas-tile__icon" aria-hidden>
          {dept.icon}
        </span>
        <span className="lf-atlas-tile__name">{name}</span>
        <span className="lf-atlas-tile__meta">
          {t(dept.items.length === 1 ? 'atlas.vaultOptionsOne' : 'atlas.vaultOptions', {
            count: dept.items.length,
          })}
        </span>
      </span>
    </Link>
  );
}

export function AtlasPreviewGrid() {
  const { locale } = useLocale();
  const t = useT();

  const departments = PREVIEW_DEPT_IDS.map((id) => MARKETPLACE_DEPARTMENTS.find((d) => d.id === id)).filter(
    Boolean,
  ) as MarketplaceDepartment[];

  const [featured, ...rest] = departments;

  return (
    <div className="lf-atlas-preview">
      <div className="lf-atlas-preview__grid">
        {featured ? <PreviewTile dept={featured} featured locale={locale} /> : null}
        {rest.map((dept) => (
          <PreviewTile key={dept.id} dept={dept} locale={locale} />
        ))}
      </div>
      <Link href="/marketplace" className="lf-atlas-preview__cta">
        <span>{t('atlas.seeAllRooms', { count: ATLAS_ROOM_COUNT })}</span>
        <AppIcon name="arrow-right" size={18} />
      </Link>
    </div>
  );
}

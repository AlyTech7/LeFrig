'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  type MarketplaceDepartment,
} from '@lefrig/shared';
import { atlasVisStyle, visClass } from '@/lib/home-visuals';
import { VisLayers } from '@/components/home/VisLayers';

function deptHref(dept: MarketplaceDepartment) {
  if (dept.id === 'services-shops') return '/services';
  const first = dept.items[0];
  if (!first) return '/marketplace';
  const base = getMarketplaceItemHref(first);
  return first.kind === 'listing' ? `${base}#listings` : base;
}

function MosaicCard({
  dept,
  index,
  variant,
}: {
  dept: MarketplaceDepartment;
  index: number;
  variant: 'hero' | 'tile' | 'wide';
}) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <Link
      href={deptHref(dept)}
      className={`lf-mosaic__card lf-mosaic__card--${variant} ${visClass('atlas')}`}
      style={
        {
          ...atlasVisStyle(dept.id),
          '--lf-vault-accent': dept.accent,
        } as CSSProperties
      }
    >
      <VisLayers />
      <span className="lf-vis__content lf-mosaic__inner">
        <span className="lf-mosaic__top">
          <span className="lf-mosaic__num">{num}</span>
          <span className="lf-mosaic__icon" aria-hidden>
            {dept.icon}
          </span>
        </span>
        <span className="lf-mosaic__copy">
          <span className="lf-mosaic__ar" lang="ar" dir="rtl">
            {dept.nameAr}
          </span>
          <em>{dept.nameEs}</em>
        </span>
        <span className="lf-mosaic__go" aria-hidden>
          Entrar →
        </span>
      </span>
    </Link>
  );
}

/** 10 salas del Atlas — solo foto + nombre. Un toque, sin listas. */
export function AtlasMosaicWeb() {
  const [hero, a, b, c, d, wide, e, f, g, h] = MARKETPLACE_DEPARTMENTS;
  if (!hero) return null;

  return (
    <div className="lf-mosaic">
      <MosaicCard dept={hero} index={0} variant="hero" />
      <div className="lf-mosaic__pair">
        {a && <MosaicCard dept={a} index={1} variant="tile" />}
        {b && <MosaicCard dept={b} index={2} variant="tile" />}
      </div>
      <div className="lf-mosaic__pair">
        {c && <MosaicCard dept={c} index={3} variant="tile" />}
        {d && <MosaicCard dept={d} index={4} variant="tile" />}
      </div>
      {wide && <MosaicCard dept={wide} index={5} variant="wide" />}
      <div className="lf-mosaic__pair">
        {e && <MosaicCard dept={e} index={6} variant="tile" />}
        {f && <MosaicCard dept={f} index={7} variant="tile" />}
      </div>
      <div className="lf-mosaic__pair">
        {g && <MosaicCard dept={g} index={8} variant="tile" />}
        {h && <MosaicCard dept={h} index={9} variant="tile" />}
      </div>
    </div>
  );
}

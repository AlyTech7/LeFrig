'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  MARKETPLACE_DEPARTMENTS,
  getMarketplaceItemHref,
  type MarketplaceDepartment,
} from '@lefrig/shared';
import { atlasVisStyle, visClass } from '@/lib/home-visuals';
import { VisLayers } from '@/components/home/VisLayers';

/** Índice global (0-based) que se muestra como banner ancho */
const WIDE_GLOBAL_INDEX = 5;

function deptHref(dept: MarketplaceDepartment) {
  if (dept.id === 'services-shops') return '/services';
  if (dept.id === 'health') return '/marketplace?category=health';
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

/** Atlas dinámico — héroe · pares · banner · resto (soporta N salas). */
export function AtlasMosaicWeb() {
  const depts = MARKETPLACE_DEPARTMENTS;
  const hero = depts[0];
  if (!hero) return null;

  const rest = depts.slice(1);
  const nodes: ReactNode[] = [
    <MosaicCard key={hero.id} dept={hero} index={0} variant="hero" />,
  ];

  let i = 0;
  while (i < rest.length) {
    const globalIndex = i + 1;
    const dept = rest[i]!;

    if (globalIndex === WIDE_GLOBAL_INDEX) {
      nodes.push(<MosaicCard key={dept.id} dept={dept} index={globalIndex} variant="wide" />);
      i += 1;
      continue;
    }

    const next = rest[i + 1];
    const nextGlobal = globalIndex + 1;
    if (next && nextGlobal !== WIDE_GLOBAL_INDEX) {
      nodes.push(
        <div key={`pair-${dept.id}`} className="lf-mosaic__pair">
          <MosaicCard dept={dept} index={globalIndex} variant="tile" />
          <MosaicCard dept={next} index={nextGlobal} variant="tile" />
        </div>,
      );
      i += 2;
      continue;
    }

    nodes.push(<MosaicCard key={dept.id} dept={dept} index={globalIndex} variant="wide" />);
    i += 1;
  }

  return <div className="lf-mosaic">{nodes}</div>;
}

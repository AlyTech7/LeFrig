'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  MARKETPLACE_DEPARTMENTS,
  pickLocalized,
  type MarketplaceDepartment,
} from '@lefrig/shared';
import { atlasVisStyle, visClass } from '@/lib/home-visuals';
import { VisLayers } from '@/components/home/VisLayers';
import { useLocale, useT } from '@/lib/locale';
import { deptHref } from '@/components/home/atlas-links';

function QuickChip({ dept, index }: { dept: MarketplaceDepartment; index: number }) {
  const { locale } = useLocale();
  const num = String(index + 1).padStart(2, '0');
  const name = pickLocalized({ slug: dept.id, nameEs: dept.nameEs, nameAr: dept.nameAr }, locale);

  return (
    <Link
      href={deptHref(dept)}
      className={`lf-atlas__chip ${visClass('atlas')}`}
      style={
        {
          ...atlasVisStyle(dept.id),
          '--lf-vault-accent': dept.accent,
          '--chip-i': index,
        } as CSSProperties
      }
    >
      <VisLayers />
      <span className="lf-vis__content lf-atlas__chip-inner">
        <span className="lf-atlas__chip-num">{num}</span>
        <span className="lf-atlas__chip-ico" aria-hidden>
          {dept.icon}
        </span>
        <span className="lf-atlas__chip-name">{name}</span>
      </span>
    </Link>
  );
}

/** 10 salas en 1 toque — solo móvil/tablet (escritorio usa el bento) */
export function AtlasQuickRail() {
  const t = useT();

  return (
    <nav className="lf-atlas__rail-wrap" aria-label={t('home.atlasQuickAria')}>
      <div className="lf-atlas__rail">
        {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
          <QuickChip key={dept.id} dept={dept} index={i} />
        ))}
      </div>
    </nav>
  );
}

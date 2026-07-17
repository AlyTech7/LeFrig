'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MARKETPLACE_DEPARTMENTS, pickLocalized } from '@lefrig/shared';
import { AtlasVaultCard } from '@/components/home/AtlasVaultCard';
import { useLocale, useT } from '@/lib/locale';

const ROOM_COUNT = MARKETPLACE_DEPARTMENTS.length;

/** Móvil/tablet: carrusel editorial con subcategorías por sala */
export function AtlasMobileDeck() {
  const t = useT();
  const { locale } = useLocale();
  const deckRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const syncActiveFromScroll = useCallback(() => {
    const el = deckRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll<HTMLElement>('.lf-vault--deck'));
    if (!cards.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let minDist = Number.POSITIVE_INFINITY;

    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });

    setActive(nearest);
  }, []);

  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;

    syncActiveFromScroll();
    el.addEventListener('scroll', syncActiveFromScroll, { passive: true });
    window.addEventListener('resize', syncActiveFromScroll);

    return () => {
      el.removeEventListener('scroll', syncActiveFromScroll);
      window.removeEventListener('resize', syncActiveFromScroll);
    };
  }, [syncActiveFromScroll]);

  const scrollToIndex = (index: number) => {
    const el = deckRef.current;
    if (!el) return;
    const card = el.querySelectorAll<HTMLElement>('.lf-vault--deck')[index];
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  };

  const activeDept = MARKETPLACE_DEPARTMENTS[active];
  const activeName = activeDept
    ? pickLocalized({ slug: activeDept.id, nameEs: activeDept.nameEs, nameAr: activeDept.nameAr }, locale)
    : '';

  return (
    <div className="lf-atlas__deck-wrap">
      <div className="lf-atlas__deck-status" aria-live="polite">
        <button
          type="button"
          className="lf-atlas__deck-progress"
          onClick={() => scrollToIndex((active + 1) % ROOM_COUNT)}
        >
          {t('atlas.deckProgress', { current: active + 1, total: ROOM_COUNT, name: activeName })}
        </button>
        <div className="lf-atlas__deck-bar" aria-hidden>
          <span className="lf-atlas__deck-bar-fill" style={{ width: `${((active + 1) / ROOM_COUNT) * 100}%` }} />
        </div>
      </div>

      <div className="lf-atlas__deck" ref={deckRef} aria-label={t('home.atlasQuickAria')}>
        {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
          <AtlasVaultCard key={dept.id} dept={dept} index={i} layout="deck" />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MARKETPLACE_DEPARTMENTS } from '@lefrig/shared';
import { AtlasVaultCard } from '@/components/home/AtlasVaultCard';
import { useT } from '@/lib/locale';

/** Móvil/tablet: carrusel enriquecido con subcategorías por sala */
export function AtlasMobileDeck() {
  const t = useT();
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

  return (
    <div className="lf-atlas__deck-wrap">
      <p className="lf-atlas__deck-hint">
        <span className="lf-atlas__rail-dot" aria-hidden />
        <span>{t('atlas.swipeRooms')}</span>
      </p>

      <div className="lf-atlas__deck" ref={deckRef}>
        {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
          <AtlasVaultCard key={dept.id} dept={dept} index={i} layout="deck" />
        ))}
      </div>

      <div className="lf-atlas__deck-dots" role="tablist" aria-label={t('home.atlasQuickAria')}>
        {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
          <button
            key={dept.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={dept.nameEs}
            className={i === active ? 'is-active' : undefined}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

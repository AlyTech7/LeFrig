'use client';

import Link from 'next/link';
import { ATLAS_ROOM_COUNT } from '@lefrig/shared';
import { AtlasMobileDeck } from '@/components/home/AtlasMobileDeck';
import { AtlasVaultGrid } from '@/components/home/AtlasVaultGrid';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';

/** El Atlas — navegación del mercado (N salas) */
export function HomeAtlas() {
  const t = useT();
  const { dir } = useLocale();
  const roomCount = ATLAS_ROOM_COUNT;

  return (
    <section className="lf-atlas lf-atlas--home" aria-labelledby="home-atlas-title" dir={dir}>
      <div className="lf-atlas__shell">
        <div className="lf-atlas__ambient" aria-hidden />
        <div className="lf-atlas__grain" aria-hidden />
        <div className="lf-atlas__rim" aria-hidden />

        <header className="lf-atlas__head lf-atlas__head--home">
          <h1 id="home-atlas-title">{t('home.atlasQuestion')}</h1>
          <p className="lf-atlas__sub">{t('home.atlasIntroSub', { count: roomCount })}</p>
        </header>

        <AtlasMobileDeck />

        <div className="lf-atlas__grid-frame">
          <span className="lf-atlas__corner lf-atlas__corner--tl" aria-hidden />
          <span className="lf-atlas__corner lf-atlas__corner--tr" aria-hidden />
          <span className="lf-atlas__corner lf-atlas__corner--bl" aria-hidden />
          <span className="lf-atlas__corner lf-atlas__corner--br" aria-hidden />
          <AtlasVaultGrid />
        </div>

        <Link href="/marketplace" className="lf-atlas__cta">
          <span className="lf-atlas__cta-shine" aria-hidden />
          <span>{t('atlas.seeAllRooms', { count: roomCount })}</span>
          <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={18} />
        </Link>
      </div>
    </section>
  );
}

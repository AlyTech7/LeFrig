'use client';

import { MARKETPLACE_DEPARTMENTS } from '@lefrig/shared';
import { AtlasVaultCard } from '@/components/home/AtlasVaultCard';

/** El Atlas completo — bento editorial + subcategorías dentro de cada sala */
export function AtlasVaultGrid() {
  return (
    <div className="lf-atlas__grid">
      {MARKETPLACE_DEPARTMENTS.map((dept, i) => (
        <AtlasVaultCard key={dept.id} dept={dept} index={i} layout="grid" />
      ))}
    </div>
  );
}

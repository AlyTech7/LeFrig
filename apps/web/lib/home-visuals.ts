import type { CSSProperties } from 'react';

/**
 * Imágenes de la home — curadas por categoría real de Lefrig.
 *
 * Fotos locales en `public/images/home/` (generadas con scripts/fetch-home-images.mjs).
 * Cada URL de Unsplash se verificó con `ixlib=rb-4.0.3` antes de descargar.
 */
const LOCAL = '/images/home';

/** true → archivos locales (recomendado); false → CDN Unsplash */
const USE_LOCAL = false;

const U = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${w}&q=85&fm=webp`;

function img(local: string, unsplash: string) {
  return USE_LOCAL ? `${LOCAL}${local}` : unsplash;
}

export type AtlasVisual = {
  src: string;
  position: string;
};

/**
 * Atlas — salas del mercado (MARKETPLACE_DEPARTMENTS).
 * Cada foto coincide con el departamento, no con otra categoría.
 */
export const ATLAS_VISUALS: Record<string, AtlasVisual> = {
  /** مركبات — coches, alquiler, repuestos */
  vehicles: {
    src: img('/atlas/vehicles.jpg', U('photo-1502877338535-766e1452684a')),
    position: 'center 48%',
  },
  /** خدمات ومتاجر */
  'services-shops': {
    src: img('/gate/shops.jpg', U('photo-1441986300917-64674bd600d8')),
    position: 'center 38%',
  },
  /** مواشي — camellos, corderos, ovejas */
  animals: {
    src: img('/atlas/animals.jpg', U('photo-1719689831010-be9fe130e88b')),
    position: 'center 58%',
  },
  /** نقل — local e internacional */
  transport: {
    src: img('/gate/transport.jpg', U('photo-1601584115197-04ecc0da31d7')),
    position: 'center 55%',
  },
  /** عقارات — vivienda, alquiler, terrenos, salones */
  'real-estate': {
    src: img('/atlas/real-estate.jpg', U('photo-1600596542815-ffad4c1539a9')),
    position: 'center 62%',
  },
  /** عمل — ofertas y búsqueda de empleo */
  jobs: {
    src: img('/atlas/jobs.jpg', U('photo-1600880292203-757bb62b4baf')),
    position: 'center 32%',
  },
  /** احتياجات عائلية — moda, niños, comida, cosmética */
  family: {
    src: img('/atlas/family.jpg', U('photo-1445205170230-053b83016050')),
    position: 'center 42%',
  },
  /** إلكترونيات — móviles, TPV, material */
  electronics: {
    src: img('/atlas/electronics.jpg', U('photo-1511707171634-5f897ff02aa9')),
    position: 'center 50%',
  },
  /** رياضة ولياقة */
  sport: {
    src: img('/atlas/sport.jpg', U('photo-1517836357463-d25dfeac3438')),
    position: 'center 28%',
  },
  /** صحة — necesidades médicas y farmacias */
  health: {
    src: img('/atlas/health.jpg', U('photo-1579684385127-1ef15d508118')),
    position: 'center 40%',
  },
  /** أخرى — bazar general, herramientas, miscelánea */
  others: {
    src: img('/atlas/others.jpg', U('photo-1578662996442-48f60103fc96')),
    position: 'center 50%',
  },
};

/** Puerta principal — بيع / نقل / خدمات / متاجر */
export const GATE_VISUALS = {
  /** Vender — publicar anuncio, punto de venta */
  publish: {
    src: img('/gate/publish.jpg', U('photo-1556742049-0cfed4f6a45d')),
    position: 'center 45%',
  },
  /** Transporte — furgoneta / reparto en ruta */
  transport: {
    src: img('/gate/transport.jpg', U('photo-1601584115197-04ecc0da31d7')),
    position: 'center 55%',
  },
  /** Servicios — oficio profesional a domicilio */
  services: {
    src: img('/gate/services.jpg', U('photo-1581578731548-c64695cc6952')),
    position: 'center 40%',
  },
  /** Tiendas — comercio local, estanterías */
  shops: {
    src: img('/gate/shops.jpg', U('photo-1441986300917-64674bd600d8')),
    position: 'center 38%',
  },
} as const;

export type GateVisualKey = keyof typeof GATE_VISUALS;

export type VisScrim = 'default' | 'deep' | 'light' | 'hero' | 'atlas';

export function visStyle(
  image: string,
  opts?: { position?: string },
): CSSProperties {
  return {
    '--lf-vis-image': `url("${image}")`,
    '--lf-vis-pos': opts?.position ?? 'center',
  } as CSSProperties;
}

export function getAtlasVisual(id: string): AtlasVisual {
  return ATLAS_VISUALS[id] ?? ATLAS_VISUALS.others;
}

export function getGateVisual(key: GateVisualKey): AtlasVisual {
  return GATE_VISUALS[key];
}

export function atlasVisStyle(id: string): CSSProperties {
  const v = getAtlasVisual(id);
  return visStyle(v.src, { position: v.position });
}

export function gateVisStyle(key: GateVisualKey): CSSProperties {
  const v = getGateVisual(key);
  return visStyle(v.src, { position: v.position });
}

/** Foto de fondo por categoría (curada → sala del Atlas → fallback) */
export function categoryVisStyle(slug: string, deptId?: string): CSSProperties {
  const curated = HOME_VISUALS.curated[slug as keyof typeof HOME_VISUALS.curated];
  if (curated) return visStyle(curated);
  if (deptId) {
    const v = getAtlasVisual(deptId);
    return visStyle(v.src, { position: v.position });
  }
  const v = getAtlasVisual('others');
  return visStyle(v.src, { position: v.position });
}

export function visClass(scrim: VisScrim = 'default') {
  return scrim === 'default' ? 'lf-vis' : `lf-vis lf-vis--${scrim}`;
}

export const HOME_VISUALS = {
  pillars: {
    marketplace: img('/atlas/others.jpg', U('photo-1578662996442-48f60103fc96')),
    publish: GATE_VISUALS.publish.src,
    transport: GATE_VISUALS.transport.src,
    services: GATE_VISUALS.services.src,
  },

  curated: {
    mobiles: img('/curated/mobiles.jpg', U('photo-1511707171634-5f897ff02aa9')),
    cars: img('/curated/cars.jpg', U('photo-1492144534655-ae79c964c9d7')),
    cosmetics: img('/curated/cosmetics.jpg', U('photo-1596462502278-27bfdc403348')),
    henna: img('/curated/henna.jpg', U('photo-1612817288484-6f916006741a')),
    'agua-potable': img('/curated/agua.jpg', U('photo-1523362628745-0c100150b504')),
    solar: img('/curated/solar.jpg', U('photo-1509391366360-2e959784a276')),
    furniture: img('/curated/furniture.jpg', U('photo-1555041469-a586c61ea9bc')),
    'salons-carpets': img('/curated/salons.jpg', U('photo-1618220179428-22790b461013')),
    health: img('/curated/health.jpg', U('photo-1579684385127-1ef15d508118')),
    food: img('/curated/food.jpg', U('photo-1565299624946-b28f40a0ae38')),
  },

  /** @deprecated Usa getAtlasVisual() */
  atlas: Object.fromEntries(
    Object.entries(ATLAS_VISUALS).map(([k, v]) => [k, v.src]),
  ) as Record<keyof typeof ATLAS_VISUALS, string>,

  society: {
    shops: GATE_VISUALS.shops.src,
    jobs: img('/atlas/jobs.jpg', U('photo-1600880292203-757bb62b4baf')),
    diaspora: img('/atlas/others.jpg', U('photo-1578662996442-48f60103fc96')),
    community: img('/atlas/family.jpg', U('photo-1445205170230-053b83016050')),
    cash: img('/gate/publish.jpg', U('photo-1556742049-0cfed4f6a45d')),
  },
} as const;

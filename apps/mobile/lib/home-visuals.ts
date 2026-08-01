/** Imágenes home — URLs Unsplash (paridad con web `home-visuals.ts`) */
const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${w}&q=80`;

export type HomeVisual = { uri: string };

export const ATLAS_VISUALS: Record<string, HomeVisual> = {
  vehicles: { uri: U('photo-1502877338535-766e1452684a') },
  'services-shops': { uri: U('photo-1441986300917-64674bd600d8') },
  animals: { uri: U('photo-1719689831010-be9fe130e88b') },
  transport: { uri: U('photo-1601584115197-04ecc0da31d7') },
  'real-estate': { uri: U('photo-1600596542815-ffad4c1539a9') },
  jobs: { uri: U('photo-1600880292203-757bb62b4baf') },
  family: { uri: U('photo-1445205170230-053b83016050') },
  electronics: { uri: U('photo-1511707171634-5f897ff02aa9') },
  sport: { uri: U('photo-1517836357463-d25dfeac3438') },
  health: { uri: U('photo-1579684385127-1ef15d508118') },
  others: { uri: U('photo-1578662996442-48f60103fc96') },
};

export const GATE_VISUALS = {
  publish: { uri: U('photo-1556742049-0cfed4f6a45d') },
  transport: { uri: U('photo-1601584115197-04ecc0da31d7') },
  services: { uri: U('photo-1581578731548-c64695cc6952') },
  shops: { uri: U('photo-1441986300917-64674bd600d8') },
} as const;

export type GateVisualKey = keyof typeof GATE_VISUALS;

export const CURATED_VISUALS: Record<string, HomeVisual> = {
  mobiles: { uri: U('photo-1511707171634-5f897ff02aa9', 800) },
  cars: { uri: U('photo-1492144534655-ae79c964c9d7', 800) },
  cosmetics: { uri: U('photo-1596462502278-27bfdc403348', 800) },
  henna: { uri: U('photo-1612817288484-6f916006741a', 800) },
  'agua-potable': { uri: U('photo-1523362628745-0c100150b504', 800) },
  solar: { uri: U('photo-1509391366360-2e959784a276', 800) },
  furniture: { uri: U('photo-1555041469-a586c61ea9bc', 800) },
  'salons-carpets': { uri: U('photo-1618220179428-22790b461013', 800) },
  health: { uri: U('photo-1579684385127-1ef15d508118', 800) },
  food: { uri: U('photo-1565299624946-b28f40a0ae38', 800) },
  camels: { uri: U('photo-1719689831010-be9fe130e88b', 800) },
  'residential-sale': { uri: U('photo-1600596542815-ffad4c1539a9', 800) },
  'job-vacancies': { uri: U('photo-1600880292203-757bb62b4baf', 800) },
};

export function getAtlasVisual(id: string): HomeVisual {
  return ATLAS_VISUALS[id] ?? ATLAS_VISUALS.others;
}

/** Foto por categoría — curada → sala del Atlas → fallback */
export function getCategoryVisual(slug: string, deptId?: string): HomeVisual {
  const curated = CURATED_VISUALS[slug];
  if (curated) return curated;
  if (deptId) return getAtlasVisual(deptId);
  return getAtlasVisual('others');
}

export function accentColors(accent: string): [string, string] {
  const hex = accent.match(/#[0-9a-f]{6}/gi);
  if (hex && hex.length >= 2) return [hex[0], hex[1]];
  return ['#a8842d', '#c9a84c'];
}

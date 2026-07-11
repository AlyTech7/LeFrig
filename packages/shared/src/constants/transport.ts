/** Catálogo de puntos para conectar pasajeros y conductores — sin pagos en plataforma */

import { ALGERIA_WILAYA_HUBS } from './transport-hubs-algeria.js';
import { FRANCE_DEPARTMENT_HUBS, FRANCE_HUB_ALIASES } from './transport-hubs-france.js';
import { SPAIN_PROVINCE_HUBS } from './transport-hubs-spain.js';

export type TransportRouteScope = 'local' | 'international';

export type TransportHubZone =
  | 'wilaya'
  | 'tindouf'
  | 'argelia'
  | 'mauritania'
  | 'espana'
  | 'francia';

export type TransportHub = {
  slug: string;
  zone: TransportHubZone;
  nameEs: string;
  nameAr: string;
  /** Slug de camp si zone === wilaya | tindouf */
  campSlug?: string;
  country: string;
  flag: string;
  popular?: boolean;
};

export type TransportCorridor = {
  origin: string;
  destination: string;
  labelEs: string;
  tag?: string;
  scope: TransportRouteScope;
};

export const TRANSPORT_SCOPE_ZONES: Record<TransportRouteScope, TransportHubZone[]> = {
  local: ['wilaya', 'tindouf', 'argelia', 'mauritania'],
  international: ['espana', 'francia'],
};

export const TRANSPORT_HUB_ZONES: { id: TransportHubZone; labelEs: string; labelAr: string; icon: string }[] = [
  { id: 'wilaya', labelEs: 'Wilayas saharauis', labelAr: 'الولايات', icon: '🏕️' },
  { id: 'tindouf', labelEs: 'Tindouf', labelAr: 'تندوف', icon: '🏜️' },
  { id: 'argelia', labelEs: 'Argelia (58 wilayas)', labelAr: 'الجزائر', icon: '🇩🇿' },
  { id: 'mauritania', labelEs: 'Mauritania', labelAr: 'موريتانيا', icon: '🐪' },
  { id: 'espana', labelEs: 'España (provincias)', labelAr: 'إسبانيا', icon: '🇪🇸' },
  { id: 'francia', labelEs: 'Francia (departamentos)', labelAr: 'فرنسا', icon: '🇫🇷' },
];

const CORE_HUBS: TransportHub[] = [
  // Wilayas saharauis
  { slug: 'aaiun', zone: 'wilaya', nameEs: 'Aaiún / Laayoune', nameAr: 'العيون', campSlug: 'aaiun', country: 'EH', flag: 'ⵣ', popular: true },
  { slug: 'smara', zone: 'wilaya', nameEs: 'Smara', nameAr: 'السمارة', campSlug: 'smara', country: 'EH', flag: 'ⵣ', popular: true },
  { slug: 'auserd', zone: 'wilaya', nameEs: 'Auserd', nameAr: 'أوسرد', campSlug: 'auserd', country: 'EH', flag: 'ⵣ' },
  { slug: 'dakhla', zone: 'wilaya', nameEs: 'Dakhla', nameAr: 'الداخلة', campSlug: 'dakhla', country: 'EH', flag: 'ⵣ', popular: true },
  { slug: 'rabouni', zone: 'wilaya', nameEs: 'Rabouni', nameAr: 'ربوني', campSlug: 'rabouni', country: 'EH', flag: 'ⵣ', popular: true },
  { slug: '27-febrero', zone: 'wilaya', nameEs: '27 de Febrero / Boujdour', nameAr: '27 فبراير', campSlug: '27-febrero', country: 'EH', flag: 'ⵣ' },
  { slug: 'tindouf', zone: 'tindouf', nameEs: 'Tindouf (Argelia)', nameAr: 'تندوف', campSlug: 'tindouf', country: 'DZ', flag: '🇩🇿', popular: true },

  // Mauritania — corredor saharaui
  { slug: 'nouakchott', zone: 'mauritania', nameEs: 'Nuakchott', nameAr: 'نواكشوط', country: 'MR', flag: '🇲🇷', popular: true },
  { slug: 'nouadhibou', zone: 'mauritania', nameEs: 'Nuadibú', nameAr: 'نواذيبو', country: 'MR', flag: '🇲🇷', popular: true },
  { slug: 'zouerate', zone: 'mauritania', nameEs: 'Zouérate', nameAr: 'ازويرات', country: 'MR', flag: '🇲🇷', popular: true },
  { slug: 'bir-moghrein', zone: 'mauritania', nameEs: 'Bir Moghrein', nameAr: 'بئر امغريين', country: 'MR', flag: '🇲🇷', popular: true },
  { slug: 'atar', zone: 'mauritania', nameEs: 'Atar', nameAr: 'أطار', country: 'MR', flag: '🇲🇷' },
  { slug: 'rosso', zone: 'mauritania', nameEs: 'Rosso (frontera SN)', nameAr: 'روصو', country: 'MR', flag: '🇲🇷' },
];

/** Alias Bilbao — compatibilidad con rutas guardadas */
const SPAIN_ALIASES: TransportHub[] = [
  {
    slug: 'bilbao',
    zone: 'espana',
    nameEs: 'Bilbao / Vizcaya',
    nameAr: 'بيلباو',
    country: 'ES',
    flag: '🇪🇸',
    popular: true,
  },
];

export const TRANSPORT_HUBS: TransportHub[] = [
  ...CORE_HUBS,
  ...ALGERIA_WILAYA_HUBS,
  ...SPAIN_PROVINCE_HUBS,
  ...SPAIN_ALIASES,
  ...FRANCE_DEPARTMENT_HUBS,
  ...FRANCE_HUB_ALIASES,
];

/** Rutas estrella — un toque y listo */
export const TRANSPORT_CORRIDORS: TransportCorridor[] = [
  // Local — Mauritania
  { origin: 'rabouni', destination: 'nouakchott', labelEs: 'Rabouni → Nuakchott', tag: 'mauritania', scope: 'local' },
  { origin: 'rabouni', destination: 'zouerate', labelEs: 'Rabouni → Zouérate', tag: 'mauritania', scope: 'local' },
  { origin: 'rabouni', destination: 'bir-moghrein', labelEs: 'Rabouni → Bir Moghrein', tag: 'mauritania', scope: 'local' },
  { origin: 'rabouni', destination: 'nouadhibou', labelEs: 'Rabouni → Nuadibú', tag: 'mauritania', scope: 'local' },
  // Local — Tindouf / wilayas
  { origin: 'tindouf', destination: 'rabouni', labelEs: 'Tindouf → Rabouni', tag: 'tindouf', scope: 'local' },
  { origin: 'tindouf', destination: 'smara', labelEs: 'Tindouf → Smara', tag: 'tindouf', scope: 'local' },
  { origin: 'smara', destination: 'aaiun', labelEs: 'Smara → Aaiún', tag: 'wilaya', scope: 'local' },
  { origin: 'dakhla', destination: 'aaiun', labelEs: 'Dakhla → Aaiún', tag: 'wilaya', scope: 'local' },
  // Local — Argelia (todas las wilayas)
  { origin: 'tindouf', destination: 'dz-alger', labelEs: 'Tindouf → Argel', tag: 'argelia', scope: 'local' },
  { origin: 'rabouni', destination: 'dz-oran', labelEs: 'Rabouni → Orán', tag: 'argelia', scope: 'local' },
  { origin: 'rabouni', destination: 'dz-constantine', labelEs: 'Rabouni → Constantina', tag: 'argelia', scope: 'local' },
  { origin: 'dz-alger', destination: 'dz-annaba', labelEs: 'Argel → Annaba', tag: 'argelia', scope: 'local' },
  { origin: 'dz-oran', destination: 'dz-tlemcen', labelEs: 'Orán → Tlemcen', tag: 'argelia', scope: 'local' },
  { origin: 'dz-setif', destination: 'dz-alger', labelEs: 'Sétif → Argel', tag: 'argelia', scope: 'local' },
  // Internacional — diáspora
  { origin: 'madrid', destination: 'rabouni', labelEs: 'Madrid → Rabouni', tag: 'europa', scope: 'international' },
  { origin: 'barcelona', destination: 'tindouf', labelEs: 'Barcelona → Tindouf', tag: 'europa', scope: 'international' },
  { origin: 'paris', destination: 'rabouni', labelEs: 'París → Rabouni', tag: 'europa', scope: 'international' },
  { origin: 'marseille', destination: 'smara', labelEs: 'Marsella → Smara', tag: 'europa', scope: 'international' },
  { origin: 'las-palmas', destination: 'dakhla', labelEs: 'Canarias → Dakhla', tag: 'europa', scope: 'international' },
  { origin: 'almeria', destination: 'aaiun', labelEs: 'Almería → Aaiún', tag: 'europa', scope: 'international' },
  { origin: 'valencia', destination: 'tindouf', labelEs: 'Valencia → Tindouf', tag: 'europa', scope: 'international' },
  { origin: 'fr-59-nord', destination: 'rabouni', labelEs: 'Nord → Rabouni', tag: 'europa', scope: 'international' },
  { origin: 'fr-31-haute-garonne', destination: 'tindouf', labelEs: 'Toulouse → Tindouf', tag: 'europa', scope: 'international' },
];

export function getTransportHub(slug: string): TransportHub | undefined {
  return TRANSPORT_HUBS.find((h) => h.slug === slug);
}

export function hubsInZone(zone: TransportHubZone): TransportHub[] {
  return TRANSPORT_HUBS.filter((h) => h.zone === zone);
}

export function hubScope(zone: TransportHubZone): TransportRouteScope {
  return TRANSPORT_SCOPE_ZONES.international.includes(zone) ? 'international' : 'local';
}

export function hubsInScope(scope: TransportRouteScope): TransportHub[] {
  const zones = TRANSPORT_SCOPE_ZONES[scope];
  return TRANSPORT_HUBS.filter((h) => zones.includes(h.zone));
}

export function zonesForScope(scope: TransportRouteScope) {
  const allowed = new Set(TRANSPORT_SCOPE_ZONES[scope]);
  return TRANSPORT_HUB_ZONES.filter((z) => allowed.has(z.id));
}

export function corridorsForScope(scope: TransportRouteScope): TransportCorridor[] {
  return TRANSPORT_CORRIDORS.filter((c) => c.scope === scope);
}

export function hubLabel(slug: string, lang: 'es' | 'ar' = 'es'): string {
  const h = getTransportHub(slug);
  if (!h) return slug;
  return lang === 'ar' ? h.nameAr : h.nameEs;
}

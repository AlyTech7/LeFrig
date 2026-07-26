/** Árbol de departamentos del mercado — El Atlas Lefrig (10 salas) */

export type MarketplaceItemKind = 'listing' | 'service' | 'job';

export type MarketplaceItem = {
  slug: string;
  nameEs: string;
  nameAr: string;
  icon: string;
  kind: MarketplaceItemKind;
};

export type MarketplaceDepartment = {
  id: string;
  nameEs: string;
  nameAr: string;
  icon: string;
  accent: string;
  items: MarketplaceItem[];
};

/** Orden fijo del Atlas: 1 Vehículos … 10 Otros */
export const MARKETPLACE_DEPARTMENTS: MarketplaceDepartment[] = [
  {
    id: 'vehicles',
    nameEs: 'Vehículos',
    nameAr: 'مركبات',
    icon: '🚗',
    accent: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
    items: [
      { slug: 'cars', nameEs: 'Coches', nameAr: 'سيارات', icon: '🚙', kind: 'listing' },
      { slug: 'car-rentals', nameEs: 'Alquiler de coches', nameAr: 'تأجير سيارات', icon: '🚘', kind: 'listing' },
      { slug: 'spare_parts', nameEs: 'Repuestos', nameAr: 'قطع غيار', icon: '🔧', kind: 'listing' },
      { slug: 'car-services', nameEs: 'Servicios de coches', nameAr: 'خدمات السيارات', icon: '⚙️', kind: 'service' },
    ],
  },
  {
    id: 'services-shops',
    nameEs: 'Servicios y tiendas',
    nameAr: 'خدمات ومتاجر',
    icon: '🛠️',
    accent: 'linear-gradient(135deg, #9a3412 0%, #e07a5f 100%)',
    items: [
      { slug: 'shops', nameEs: 'Tiendas del campamento', nameAr: 'متاجر', icon: '🏪', kind: 'service' },
      { slug: 'services-all', nameEs: 'Directorio de servicios', nameAr: 'دليل الخدمات', icon: '🧰', kind: 'service' },
      { slug: 'shops-register', nameEs: 'Abrir tienda', nameAr: 'فتح متجر', icon: '➕', kind: 'service' },
      { slug: 'construction', nameEs: 'Construcción', nameAr: 'بناء', icon: '🧱', kind: 'service' },
      { slug: 'generators', nameEs: 'Generadores', nameAr: 'مولدات', icon: '⚡', kind: 'service' },
      { slug: 'agua-potable', nameEs: 'Agua potable', nameAr: 'ماء صالح', icon: '💧', kind: 'service' },
      { slug: 'air-conditioners', nameEs: 'Aire acondicionado', nameAr: 'تكييف', icon: '❄️', kind: 'service' },
      { slug: 'maintenance-services', nameEs: 'Mantenimiento', nameAr: 'صيانة', icon: '🔩', kind: 'service' },
      { slug: 'pest-control', nameEs: 'Control de plagas', nameAr: 'مكافحة آفات', icon: '🐛', kind: 'service' },
      { slug: 'plumbing', nameEs: 'Fontanería', nameAr: 'سباكة', icon: '🚿', kind: 'service' },
      { slug: 'electrician', nameEs: 'Electricista', nameAr: 'كهربائي', icon: '⚡', kind: 'service' },
      { slug: 'mechanic', nameEs: 'Mecánico', nameAr: 'ميكانيكي', icon: '🔧', kind: 'service' },
      { slug: 'henna', nameEs: 'Henna', nameAr: 'حناء', icon: '🌺', kind: 'service' },
      { slug: 'classes', nameEs: 'Clases y formación', nameAr: 'دروس', icon: '📚', kind: 'service' },
      { slug: 'education', nameEs: 'Educación', nameAr: 'تعليم', icon: '🎓', kind: 'service' },
      { slug: 'furniture-moving', nameEs: 'Mudanzas', nameAr: 'نقل أثاث', icon: '📦', kind: 'service' },
      { slug: 'hairdressing', nameEs: 'Peluquería', nameAr: 'حلاقة', icon: '💇', kind: 'service' },
      { slug: 'phone_repair', nameEs: 'Reparación móviles', nameAr: 'إصلاح هواتف', icon: '📲', kind: 'service' },
    ],
  },
  {
    id: 'animals',
    nameEs: 'Animales',
    nameAr: 'مواشي',
    icon: '🐪',
    accent: 'linear-gradient(135deg, #a16207 0%, #fbbf24 100%)',
    items: [
      { slug: 'camels', nameEs: 'Camellos', nameAr: 'إبل', icon: '🐪', kind: 'listing' },
      { slug: 'lambs', nameEs: 'Corderos', nameAr: 'حملان', icon: '🐑', kind: 'listing' },
      { slug: 'sheep', nameEs: 'Ovejas', nameAr: 'أغنام', icon: '🐏', kind: 'listing' },
      { slug: 'sheep-camels', nameEs: 'Ganado mixto', nameAr: 'ماشية', icon: '🐑', kind: 'listing' },
    ],
  },
  {
    id: 'transport',
    nameEs: 'Transporte',
    nameAr: 'نقل',
    icon: '🚐',
    accent: 'linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)',
    items: [
      { slug: 'transport-local', nameEs: 'Transporte local', nameAr: 'نقل محلي', icon: '📍', kind: 'service' },
      { slug: 'transport-international', nameEs: 'Transporte internacional', nameAr: 'نقل دولي', icon: '🌍', kind: 'service' },
      { slug: 'transport-register', nameEs: 'Registrar ruta', nameAr: 'تسجيل مسار', icon: '🛣️', kind: 'service' },
    ],
  },
  {
    id: 'real-estate',
    nameEs: 'Inmobiliaria',
    nameAr: 'عقارات',
    icon: '🏠',
    accent: 'linear-gradient(135deg, #0d9488 0%, #34d399 100%)',
    items: [
      { slug: 'residential-sale', nameEs: 'Venta residencial', nameAr: 'بيع سكني', icon: '🏡', kind: 'listing' },
      { slug: 'lands', nameEs: 'Terrenos', nameAr: 'أراضي', icon: '🏜️', kind: 'listing' },
      { slug: 'furniture', nameEs: 'Muebles', nameAr: 'أثاث', icon: '🛋️', kind: 'listing' },
      { slug: 'residential-rent', nameEs: 'Alquiler residencial', nameAr: 'إيجار سكني', icon: '🔑', kind: 'listing' },
      { slug: 'commercial-sale', nameEs: 'Venta comercial', nameAr: 'بيع تجاري', icon: '🏢', kind: 'listing' },
      { slug: 'commercial-rent', nameEs: 'Alquiler comercial', nameAr: 'إيجار تجاري', icon: '🏪', kind: 'listing' },
    ],
  },
  {
    id: 'jobs',
    nameEs: 'Trabajo',
    nameAr: 'عمل',
    icon: '💼',
    accent: 'linear-gradient(135deg, #365314 0%, #84cc16 100%)',
    items: [
      { slug: 'job-vacancies', nameEs: 'Ofertas de empleo', nameAr: 'وظائف شاغرة', icon: '📋', kind: 'job' },
      { slug: 'job-seekers', nameEs: 'Busco trabajo', nameAr: 'باحث عن عمل', icon: '🔍', kind: 'job' },
    ],
  },
  {
    id: 'family',
    nameEs: 'Necesidades familiares',
    nameAr: 'احتياجات عائلية',
    icon: '👨‍👩‍👧',
    accent: 'linear-gradient(135deg, #be185d 0%, #f472b6 100%)',
    items: [
      { slug: 'men-fashion', nameEs: 'Moda hombre', nameAr: 'ملابس الرجال', icon: '👔', kind: 'listing' },
      { slug: 'women-fashion', nameEs: 'Moda mujer', nameAr: 'ملابس النساء', icon: '👗', kind: 'listing' },
      { slug: 'kids-products', nameEs: 'Productos infantiles', nameAr: 'ملابس ومنتجات أطفال', icon: '🧸', kind: 'listing' },
      { slug: 'food', nameEs: 'Comida', nameAr: 'خدمات ومتاجر ومطاعم', icon: '🍞', kind: 'listing' },
      { slug: 'cosmetics', nameEs: 'Cosmética', nameAr: 'مستحضرات تجميل', icon: '💄', kind: 'listing' },
      { slug: 'gifts-flowers', nameEs: 'Regalos y flores', nameAr: 'هدايا وزهور', icon: '💐', kind: 'listing' },
    ],
  },
  {
    id: 'electronics',
    nameEs: 'Electrónica',
    nameAr: 'إلكترونيات',
    icon: '📱',
    accent: 'linear-gradient(135deg, #312e81 0%, #818cf8 100%)',
    items: [
      { slug: 'mobiles', nameEs: 'Móviles', nameAr: 'هواتف', icon: '📱', kind: 'listing' },
      { slug: 'electronics', nameEs: 'Electrónica', nameAr: 'إلكترونيات', icon: '💻', kind: 'listing' },
      { slug: 'pos', nameEs: 'TPV / POS', nameAr: 'نقاط بيع', icon: '🖥️', kind: 'listing' },
    ],
  },
  {
    id: 'sport',
    nameEs: 'Deporte y salud',
    nameAr: 'رياضة وصحة',
    icon: '💪',
    accent: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)',
    items: [
      { slug: 'health', nameEs: 'Salud', nameAr: 'صحة', icon: '🩺', kind: 'listing' },
      { slug: 'sports-fitness', nameEs: 'Deporte y fitness', nameAr: 'رياضة ولياقة', icon: '🏋️', kind: 'listing' },
    ],
  },
  {
    id: 'others',
    nameEs: 'Otros',
    nameAr: 'أخرى',
    icon: '✨',
    accent: 'linear-gradient(135deg, #57534e 0%, #a8a29e 100%)',
    items: [
      { slug: 'tools', nameEs: 'Herramientas', nameAr: 'أدوات', icon: '🛠️', kind: 'listing' },
      { slug: 'special-currencies', nameEs: 'Divisas especiales', nameAr: 'عملات خاصة', icon: '💱', kind: 'listing' },
      { slug: 'other', nameEs: 'General', nameAr: 'عام', icon: '📦', kind: 'listing' },
    ],
  },
];

/** Enlaces de navegación del Atlas (no son categorías de listado) */
const ATLAS_NAV_HREFS: Record<string, string> = {
  shops: '/shops',
  'services-all': '/services',
  'shops-register': '/shops/register',
  'transport-local': '/transport?scope=local',
  'transport-international': '/transport?scope=international',
  'transport-register': '/transport/register',
};

export function marketplaceListingItems(): MarketplaceItem[] {
  return MARKETPLACE_DEPARTMENTS.flatMap((d) => d.items.filter((i) => i.kind === 'listing'));
}

/** Lista plana para filtros API y publicar anuncio */
export const LISTING_CATEGORIES = marketplaceListingItems().map((i) => ({
  slug: i.slug,
  nameEs: i.nameEs,
  nameAr: i.nameAr,
  icon: i.icon,
}));

export function getMarketplaceItemHref(item: MarketplaceItem): string {
  const nav = ATLAS_NAV_HREFS[item.slug];
  if (nav) return nav;

  if (item.kind === 'job') {
    return item.slug === 'job-seekers' ? '/jobs?type=seeker' : '/jobs';
  }
  if (item.kind === 'service') {
    if (item.slug === 'transport-services') return '/transport';
    return `/services?category=${item.slug}`;
  }
  return `/marketplace?category=${item.slug}`;
}

export function findDepartmentForSlug(slug: string): MarketplaceDepartment | undefined {
  return MARKETPLACE_DEPARTMENTS.find((d) => d.items.some((i) => i.slug === slug));
}

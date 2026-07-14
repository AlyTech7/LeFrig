export const CAMPS = [
  { slug: 'aaiun', nameAr: 'العيون', nameEs: 'Aaiún / Laayoune', nameEn: 'Aaiun / Laayoune', isTindouf: false },
  { slug: 'smara', nameAr: 'السمارة', nameEs: 'Smara', nameEn: 'Smara', isTindouf: false },
  { slug: 'auserd', nameAr: 'أوسرد', nameEs: 'Auserd', nameEn: 'Auserd', isTindouf: false },
  { slug: 'dakhla', nameAr: 'الداخلة', nameEs: 'Dakhla', nameEn: 'Dakhla', isTindouf: false },
  { slug: 'rabouni', nameAr: 'ربوني', nameEs: 'Rabouni', nameEn: 'Rabouni', isTindouf: false },
  { slug: '27-febrero', nameAr: '27 فبراير', nameEs: '27 de Febrero / Boujdour', nameEn: '27 February / Boujdour', isTindouf: false },
  { slug: 'tindouf', nameAr: 'تندوف', nameEs: 'Tindouf', nameEn: 'Tindouf', isTindouf: true },
] as const;

export {
  LISTING_CATEGORIES,
  MARKETPLACE_DEPARTMENTS,
  marketplaceListingItems,
  getMarketplaceItemHref,
  findDepartmentForSlug,
} from './marketplace.js';
export type { MarketplaceDepartment, MarketplaceItem, MarketplaceItemKind } from './marketplace.js';

export const SERVICE_CATEGORIES = [
  { slug: 'electrician', nameAr: 'كهربائي', nameEs: 'Electricista', icon: '⚡' },
  { slug: 'mechanic', nameAr: 'ميكانيكي', nameEs: 'Mecánico', icon: '🔩' },
  { slug: 'phone_repair', nameAr: 'إصلاح هواتف', nameEs: 'Reparación móviles', icon: '📲' },
  { slug: 'transport', nameAr: 'نقل', nameEs: 'Transporte', icon: '🚐' },
  { slug: 'sewing', nameAr: 'خياطة', nameEs: 'Costura', icon: '🧵' },
  { slug: 'hairdressing', nameAr: 'حلاقة', nameEs: 'Peluquería', icon: '💇' },
  { slug: 'classes', nameAr: 'دروس', nameEs: 'Clases', icon: '📚' },
  { slug: 'it', nameAr: 'حاسوب', nameEs: 'Informática', icon: '💾' },
  { slug: 'catering', nameAr: 'طبخ', nameEs: 'Cocina/catering', icon: '🍲' },
  { slug: 'masonry', nameAr: 'بناء', nameEs: 'Albañilería', icon: '🧱' },
  { slug: 'plumbing', nameAr: 'سباكة', nameEs: 'Fontanería', icon: '🚿' },
  { slug: 'solar_install', nameAr: 'تركيب شمسي', nameEs: 'Instalación solar', icon: '🌞' },
  { slug: 'translation', nameAr: 'ترجمة', nameEs: 'Traducción', icon: '🌐' },
  { slug: 'henna', nameAr: 'حناء', nameEs: 'Henna', icon: '🌺' },
  { slug: 'agua-potable', nameAr: 'ماء صالح للشرب', nameEs: 'Agua potable', icon: '💧' },
  { slug: 'other', nameAr: 'أخرى', nameEs: 'Otros', icon: '✨' },
] as const;

export const HOME_ACTIONS = [
  { id: 'buy', labelAr: 'شراء', labelEs: 'Comprar', icon: '🛒', color: '#1B5E4B' },
  { id: 'sell', labelAr: 'بيع', labelEs: 'Vender', icon: '📢', color: '#C45C26' },
  { id: 'services', labelAr: 'خدمات', labelEs: 'Servicios', icon: '🔧', color: '#2D6A4F' },
  { id: 'transport', labelAr: 'نقل', labelEs: 'Transporte', icon: '🚐', color: '#B8860B' },
  { id: 'jobs', labelAr: 'عمل', labelEs: 'Trabajo', icon: '💼', color: '#4A6741' },
  { id: 'diaspora', labelAr: 'العائلة بالخارج', labelEs: 'Familia fuera', icon: '🌍', color: '#8B4513' },
] as const;

export * from './transport.js';
export * from './locale.js';
export { DEFAULT_CURRENCY as CURRENCY } from './locale.js';
export const DEFAULT_LOCALE = 'es';

export const PAYMENT_LABELS = {
  cash: { ar: 'ادفع نقداً عند الاستلام', es: 'Paga en efectivo al recibir' },
  cash_on_delivery: { ar: 'نقداً عند التسليم', es: 'Efectivo contra entrega' },
  fiado: { ar: 'شراء بال fiado', es: 'Comprar fiado' },
  manual_transfer: { ar: 'تحويل يدوي', es: 'Transferencia manual' },
  voucher: { ar: 'قسيمة', es: 'Voucher' },
} as const;

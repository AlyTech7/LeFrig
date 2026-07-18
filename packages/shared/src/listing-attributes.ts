import { z } from 'zod';

export type AttributeFieldType = 'text' | 'number' | 'select';

export type AttributeFieldOption = {
  value: string;
  labelEs: string;
  labelAr: string;
};

export type AttributeFieldDef = {
  key: string;
  labelEs: string;
  labelAr: string;
  type: AttributeFieldType;
  required?: boolean;
  placeholder?: string;
  options?: AttributeFieldOption[];
  min?: number;
  max?: number;
};

export type ListingAttributeSchema = {
  id: string;
  categorySlugs: string[];
  fields: AttributeFieldDef[];
  /** Descripción libre más corta cuando hay campos estructurados */
  descriptionMinLength: number;
};

const CAR_BRANDS: AttributeFieldOption[] = [
  { value: 'toyota', labelEs: 'Toyota', labelAr: 'تويوتا' },
  { value: 'renault', labelEs: 'Renault', labelAr: 'رينو' },
  { value: 'peugeot', labelEs: 'Peugeot', labelAr: 'بيجو' },
  { value: 'dacia', labelEs: 'Dacia', labelAr: 'داسيا' },
  { value: 'hyundai', labelEs: 'Hyundai', labelAr: 'هيونداي' },
  { value: 'kia', labelEs: 'Kia', labelAr: 'كيا' },
  { value: 'mercedes', labelEs: 'Mercedes', labelAr: 'مرسيدس' },
  { value: 'bmw', labelEs: 'BMW', labelAr: 'BMW' },
  { value: 'nissan', labelEs: 'Nissan', labelAr: 'نيسان' },
  { value: 'ford', labelEs: 'Ford', labelAr: 'فورد' },
  { value: 'other', labelEs: 'Otra marca', labelAr: 'ماركة أخرى' },
];

const FUEL_OPTIONS: AttributeFieldOption[] = [
  { value: 'petrol', labelEs: 'Gasolina', labelAr: 'بنزين' },
  { value: 'diesel', labelEs: 'Diésel', labelAr: 'ديزل' },
  { value: 'hybrid', labelEs: 'Híbrido', labelAr: 'هجين' },
  { value: 'electric', labelEs: 'Eléctrico', labelAr: 'كهربائي' },
  { value: 'lpg', labelEs: 'GLP', labelAr: 'غاز' },
];

const TRANSMISSION_OPTIONS: AttributeFieldOption[] = [
  { value: 'manual', labelEs: 'Manual', labelAr: 'يدوي' },
  { value: 'automatic', labelEs: 'Automático', labelAr: 'أوتوماتيك' },
];

const PROPERTY_TYPE_RESIDENTIAL: AttributeFieldOption[] = [
  { value: 'apartment', labelEs: 'Piso / apartamento', labelAr: 'شقة' },
  { value: 'house', labelEs: 'Casa', labelAr: 'منزل' },
  { value: 'villa', labelEs: 'Villa / chalet', labelAr: 'فيلا' },
];

const PROPERTY_TYPE_COMMERCIAL: AttributeFieldOption[] = [
  { value: 'shop', labelEs: 'Local comercial', labelAr: 'محل تجاري' },
  { value: 'office', labelEs: 'Oficina', labelAr: 'مكتب' },
  { value: 'warehouse', labelEs: 'Almacén', labelAr: 'مستودع' },
];

const currentYear = new Date().getFullYear();

const PHONE_BRANDS: AttributeFieldOption[] = [
  { value: 'samsung', labelEs: 'Samsung', labelAr: 'سامسونج' },
  { value: 'apple', labelEs: 'Apple / iPhone', labelAr: 'آيفون' },
  { value: 'xiaomi', labelEs: 'Xiaomi', labelAr: 'شاومي' },
  { value: 'huawei', labelEs: 'Huawei', labelAr: 'هواوي' },
  { value: 'oppo', labelEs: 'Oppo', labelAr: 'أوبو' },
  { value: 'realme', labelEs: 'Realme', labelAr: 'ريلمي' },
  { value: 'other', labelEs: 'Otra marca', labelAr: 'ماركة أخرى' },
];

const PHONE_STORAGE: AttributeFieldOption[] = [
  { value: '32', labelEs: '32 GB', labelAr: '32 GB' },
  { value: '64', labelEs: '64 GB', labelAr: '64 GB' },
  { value: '128', labelEs: '128 GB', labelAr: '128 GB' },
  { value: '256', labelEs: '256 GB', labelAr: '256 GB' },
  { value: '512', labelEs: '512 GB', labelAr: '512 GB' },
];

const PHONE_CONDITION: AttributeFieldOption[] = [
  { value: 'new', labelEs: 'Nuevo', labelAr: 'جديد' },
  { value: 'like_new', labelEs: 'Como nuevo', labelAr: 'كالجديد' },
  { value: 'used', labelEs: 'Usado', labelAr: 'مستعمل' },
];

export const LISTING_ATTRIBUTE_SCHEMAS: ListingAttributeSchema[] = [
  {
    id: 'vehicle',
    categorySlugs: ['cars', 'car-rentals'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        required: true,
        options: CAR_BRANDS,
      },
      {
        key: 'brandOther',
        labelEs: 'Nombre de la marca',
        labelAr: 'اسم الماركة',
        type: 'text',
        placeholder: 'Ej: Mitsubishi',
      },
      {
        key: 'model',
        labelEs: 'Modelo',
        labelAr: 'الموديل',
        type: 'text',
        placeholder: 'Ej: Corolla, Logan…',
      },
      {
        key: 'year',
        labelEs: 'Año',
        labelAr: 'السنة',
        type: 'number',
        required: true,
        min: 1980,
        max: currentYear + 1,
        placeholder: String(currentYear),
      },
      {
        key: 'mileageKm',
        labelEs: 'Kilómetros (opcional)',
        labelAr: 'الكيلومترات (اختياري)',
        type: 'number',
        min: 0,
        placeholder: '85000',
      },
      {
        key: 'fuel',
        labelEs: 'Combustible',
        labelAr: 'الوقود',
        type: 'select',
        options: FUEL_OPTIONS,
      },
      {
        key: 'transmission',
        labelEs: 'Cambio',
        labelAr: 'ناقل الحركة',
        type: 'select',
        options: TRANSMISSION_OPTIONS,
      },
    ],
  },
  {
    id: 'residential',
    categorySlugs: ['residential-sale', 'residential-rent'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de vivienda',
        labelAr: 'نوع السكن',
        type: 'select',
        required: true,
        options: PROPERTY_TYPE_RESIDENTIAL,
      },
      {
        key: 'areaM2',
        labelEs: 'Metros cuadrados',
        labelAr: 'المتر المربع',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '85',
      },
      {
        key: 'rooms',
        labelEs: 'Habitaciones (opcional)',
        labelAr: 'الغرف (اختياري)',
        type: 'number',
        min: 0,
        max: 20,
        placeholder: '3',
      },
    ],
  },
  {
    id: 'lands',
    categorySlugs: ['lands'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'areaM2',
        labelEs: 'Superficie (m²)',
        labelAr: 'المساحة (م²)',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '500',
      },
    ],
  },
  {
    id: 'commercial',
    categorySlugs: ['commercial-sale', 'commercial-rent'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'propertyType',
        labelEs: 'Tipo de local',
        labelAr: 'نوع المحل',
        type: 'select',
        required: true,
        options: PROPERTY_TYPE_COMMERCIAL,
      },
      {
        key: 'areaM2',
        labelEs: 'Metros cuadrados',
        labelAr: 'المتر المربع',
        type: 'number',
        required: true,
        min: 1,
        placeholder: '120',
      },
    ],
  },
  {
    id: 'mobile',
    categorySlugs: ['mobiles'],
    descriptionMinLength: 0,
    fields: [
      {
        key: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        required: true,
        options: PHONE_BRANDS,
      },
      {
        key: 'brandOther',
        labelEs: 'Nombre de la marca',
        labelAr: 'اسم الماركة',
        type: 'text',
        placeholder: 'Ej: Infinix',
      },
      {
        key: 'storage',
        labelEs: 'Almacenamiento',
        labelAr: 'التخزين',
        type: 'select',
        options: PHONE_STORAGE,
      },
      {
        key: 'condition',
        labelEs: 'Estado',
        labelAr: 'الحالة',
        type: 'select',
        options: PHONE_CONDITION,
      },
    ],
  },
];

const vehicleAttributesSchema = z
  .object({
    brand: z.string().min(1),
    brandOther: z.string().max(60).optional(),
    model: z.string().max(80).optional(),
    year: z.coerce.number().int().min(1980).max(currentYear + 1),
    mileageKm: z.coerce.number().min(0).optional(),
    fuel: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'lpg']).optional(),
    transmission: z.enum(['manual', 'automatic']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.brand === 'other' && !data.brandOther?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Indica la marca', path: ['brandOther'] });
    }
  });

const residentialAttributesSchema = z.object({
  propertyType: z.enum(['apartment', 'house', 'villa']),
  areaM2: z.coerce.number().positive(),
  rooms: z.coerce.number().int().min(0).max(20).optional(),
});

const landsAttributesSchema = z.object({
  areaM2: z.coerce.number().positive(),
});

const commercialAttributesSchema = z.object({
  propertyType: z.enum(['shop', 'office', 'warehouse']),
  areaM2: z.coerce.number().positive(),
});

const mobileAttributesSchema = z
  .object({
    brand: z.string().min(1),
    brandOther: z.string().max(60).optional(),
    storage: z.enum(['32', '64', '128', '256', '512']).optional(),
    condition: z.enum(['new', 'like_new', 'used']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.brand === 'other' && !data.brandOther?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Indica la marca', path: ['brandOther'] });
    }
  });

const SCHEMA_BY_ID: Record<string, z.ZodTypeAny> = {
  vehicle: vehicleAttributesSchema,
  residential: residentialAttributesSchema,
  lands: landsAttributesSchema,
  commercial: commercialAttributesSchema,
  mobile: mobileAttributesSchema,
};

export function getListingAttributeSchema(categorySlug: string): ListingAttributeSchema | null {
  return LISTING_ATTRIBUTE_SCHEMAS.find((s) => s.categorySlugs.includes(categorySlug)) ?? null;
}

export function categoryHasStructuredAttributes(categorySlug: string): boolean {
  return getListingAttributeSchema(categorySlug) !== null;
}

export function getDescriptionMinLength(categorySlug: string): number {
  return getListingAttributeSchema(categorySlug)?.descriptionMinLength ?? 10;
}

/** Valida y normaliza attributes; lanza ZodError si falla */
export function validateListingAttributes(
  categorySlug: string,
  attributes: unknown,
): Record<string, unknown> {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) {
    if (attributes == null || (typeof attributes === 'object' && !Object.keys(attributes as object).length)) {
      return {};
    }
    throw new Error('Esta categoría no admite campos estructurados');
  }

  const zodSchema = SCHEMA_BY_ID[schema.id];
  if (!zodSchema) return {};

  const parsed = zodSchema.parse(attributes ?? {});
  return stripEmpty(parsed as Record<string, unknown>);
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

/** Comprueba si el vendedor completó los campos obligatorios (UI) */
export function areRequiredAttributesFilled(
  categorySlug: string,
  attributes: Record<string, unknown>,
): boolean {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return true;

  try {
    validateListingAttributes(categorySlug, attributes);
    return true;
  } catch {
    return false;
  }
}

function labelForOption(options: AttributeFieldOption[] | undefined, value: string): string {
  return options?.find((o) => o.value === value)?.labelEs ?? value;
}

function brandLabel(attrs: Record<string, unknown>): string {
  const brand = String(attrs.brand ?? '');
  if (brand === 'other') return String(attrs.brandOther ?? 'Otra marca');
  const fromCars = labelForOption(CAR_BRANDS, brand);
  if (fromCars !== brand) return fromCars;
  return labelForOption(PHONE_BRANDS, brand);
}

const FUEL_LABELS: Record<string, string> = Object.fromEntries(
  FUEL_OPTIONS.map((o) => [o.value, o.labelEs]),
);
const TRANS_LABELS: Record<string, string> = Object.fromEntries(
  TRANSMISSION_OPTIONS.map((o) => [o.value, o.labelEs]),
);
const RES_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_RESIDENTIAL.map((o) => [o.value, o.labelEs]),
);
const COM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPE_COMMERCIAL.map((o) => [o.value, o.labelEs]),
);

/** Chips cortos para tarjetas y fichas */
export function formatAttributeHighlights(
  categorySlug: string,
  attributes: Record<string, unknown> | undefined,
): string[] {
  if (!attributes || !Object.keys(attributes).length) return [];

  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return [];

  const chips: string[] = [];

  if (schema.id === 'vehicle') {
    if (attributes.brand) chips.push(brandLabel(attributes));
    if (attributes.year) chips.push(String(attributes.year));
    if (attributes.model) chips.push(String(attributes.model));
    if (attributes.mileageKm != null) {
      chips.push(`${Number(attributes.mileageKm).toLocaleString('es-ES')} km`);
    }
    if (attributes.fuel) chips.push(FUEL_LABELS[String(attributes.fuel)] ?? String(attributes.fuel));
    if (attributes.transmission) {
      chips.push(TRANS_LABELS[String(attributes.transmission)] ?? String(attributes.transmission));
    }
    return chips.slice(0, 4);
  }

  if (schema.id === 'residential' || schema.id === 'commercial') {
    const typeKey = String(attributes.propertyType ?? '');
    const typeLabels = schema.id === 'residential' ? RES_TYPE_LABELS : COM_TYPE_LABELS;
    if (typeKey) chips.push(typeLabels[typeKey] ?? typeKey);
    if (attributes.areaM2) chips.push(`${attributes.areaM2} m²`);
    if (attributes.rooms != null && schema.id === 'residential') {
      chips.push(`${attributes.rooms} hab.`);
    }
    return chips;
  }

  if (schema.id === 'lands') {
    if (attributes.areaM2) chips.push(`${attributes.areaM2} m²`);
    return chips;
  }

  if (schema.id === 'mobile') {
    if (attributes.brand) chips.push(brandLabel(attributes));
    if (attributes.storage) chips.push(`${attributes.storage} GB`);
    if (attributes.condition) {
      chips.push(PHONE_CONDITION.find((c) => c.value === attributes.condition)?.labelEs ?? String(attributes.condition));
    }
    return chips;
  }

  return chips;
}

/** Pares etiqueta-valor para ficha detalle */
export function formatAttributeDetails(
  categorySlug: string,
  attributes: Record<string, unknown> | undefined,
): { label: string; labelAr: string; value: string }[] {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema || !attributes) return [];

  const rows: { label: string; labelAr: string; value: string }[] = [];

  for (const field of schema.fields) {
    const raw = attributes[field.key];
    if (raw === undefined || raw === null || raw === '') continue;
    if (field.key === 'brandOther' && attributes.brand !== 'other') continue;

    let value = String(raw);
    if (field.key === 'brand') value = brandLabel(attributes);
    else if (field.type === 'select' && field.options) {
      value = labelForOption(field.options, String(raw));
    } else if (field.key === 'mileageKm') {
      value = `${Number(raw).toLocaleString('es-ES')} km`;
    } else if (field.key === 'areaM2') {
      value = `${raw} m²`;
    }

    rows.push({ label: field.labelEs, labelAr: field.labelAr, value });
  }

  return rows;
}

/** Filtros de búsqueda por categoría (comprador) */
export type ListingAttributeFilterDef = {
  param: string;
  labelEs: string;
  labelAr: string;
  type: 'select' | 'number';
  options?: AttributeFieldOption[];
  placeholder?: string;
};

export const listingAttributeFilterSchema = z.object({
  brand: z.string().optional(),
  yearMin: z.coerce.number().int().optional(),
  yearMax: z.coerce.number().int().optional(),
  areaMin: z.coerce.number().positive().optional(),
  propertyType: z.string().optional(),
  fuel: z.string().optional(),
  storage: z.string().optional(),
});

export type ListingAttributeFilterValues = z.infer<typeof listingAttributeFilterSchema>;

export function hasActiveAttributeFilters(filters: ListingAttributeFilterValues): boolean {
  return Object.values(filters).some((v) => v !== undefined && v !== '');
}

export function getListingAttributeFilters(categorySlug: string): ListingAttributeFilterDef[] {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return [];

  if (schema.id === 'vehicle') {
    return [
      {
        param: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        options: CAR_BRANDS.filter((b) => b.value !== 'other'),
      },
      {
        param: 'yearMin',
        labelEs: 'Año desde',
        labelAr: 'من سنة',
        type: 'number',
        placeholder: '2015',
      },
      {
        param: 'fuel',
        labelEs: 'Combustible',
        labelAr: 'الوقود',
        type: 'select',
        options: FUEL_OPTIONS,
      },
    ];
  }

  if (schema.id === 'residential' || schema.id === 'commercial') {
    const opts = schema.id === 'residential' ? PROPERTY_TYPE_RESIDENTIAL : PROPERTY_TYPE_COMMERCIAL;
    return [
      {
        param: 'propertyType',
        labelEs: 'Tipo',
        labelAr: 'النوع',
        type: 'select',
        options: opts,
      },
      {
        param: 'areaMin',
        labelEs: 'M² mínimo',
        labelAr: 'م² كحد أدنى',
        type: 'number',
        placeholder: '60',
      },
    ];
  }

  if (schema.id === 'lands') {
    return [
      {
        param: 'areaMin',
        labelEs: 'M² mínimo',
        labelAr: 'م² كحد أدنى',
        type: 'number',
        placeholder: '200',
      },
    ];
  }

  if (schema.id === 'mobile') {
    return [
      {
        param: 'brand',
        labelEs: 'Marca',
        labelAr: 'الماركة',
        type: 'select',
        options: PHONE_BRANDS.filter((b) => b.value !== 'other'),
      },
      {
        param: 'storage',
        labelEs: 'Almacenamiento',
        labelAr: 'التخزين',
        type: 'select',
        options: PHONE_STORAGE,
      },
    ];
  }

  return [];
}

/** Título sugerido para el vendedor a partir de attributes */
export function suggestListingTitle(
  categorySlug: string,
  attributes: Record<string, unknown>,
): string | null {
  const schema = getListingAttributeSchema(categorySlug);
  if (!schema) return null;

  if (schema.id === 'vehicle') {
    if (!attributes.brand || !attributes.year) return null;
    const model = attributes.model ? ` ${String(attributes.model)}` : '';
    return `${brandLabel(attributes)}${model} ${attributes.year}`;
  }

  if (schema.id === 'mobile') {
    if (!attributes.brand) return null;
    const storage = attributes.storage ? ` ${attributes.storage}GB` : '';
    return `${brandLabel(attributes)}${storage}`;
  }

  if (schema.id === 'residential' || schema.id === 'commercial') {
    if (!attributes.propertyType || !attributes.areaM2) return null;
    const typeLabels = schema.id === 'residential' ? RES_TYPE_LABELS : COM_TYPE_LABELS;
    const type = typeLabels[String(attributes.propertyType)] ?? String(attributes.propertyType);
    return `${type} · ${attributes.areaM2} m²`;
  }

  if (schema.id === 'lands' && attributes.areaM2) {
    return `Terreno ${attributes.areaM2} m²`;
  }

  return null;
}

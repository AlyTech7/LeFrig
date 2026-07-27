import { z } from 'zod';
import {
  categoryHasStructuredAttributes,
  getDescriptionMinLength,
  validateListingAttributes,
  listingAttributeFilterSchema,
} from '../listing-attributes.js';
import { CURRENCY_CODES, DEFAULT_CURRENCY } from '../constants/locale.js';
import { isValidPhoneE164 } from '../phone.js';

export const currencySchema = z.enum(CURRENCY_CODES).default(DEFAULT_CURRENCY);

export const phoneSchema = z
  .string()
  .refine((v) => isValidPhoneE164(v), 'Teléfono inválido (formato internacional +213…)');

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
});

const listingBodySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000),
  price: z.number().positive(),
  currency: currencySchema,
  category: z.string(),
  campId: z.string().uuid(),
  dairaId: z.string().uuid().optional(),
  images: z.array(z.string().url()).max(8).optional(),
  paymentMethods: z.array(z.enum(['cash', 'cash_on_delivery'])).default(['cash']),
  attributes: z.record(z.unknown()).optional(),
});

function refineListingBody(
  data: {
    category?: string;
    description?: string;
    attributes?: Record<string, unknown>;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.category) return;
  const descMin = getDescriptionMinLength(data.category);
  if (data.description !== undefined && (data.description?.length ?? 0) < descMin) {
    ctx.addIssue({
      code: 'custom',
      message: descMin === 0 ? 'Descripción opcional' : `Descripción mínimo ${descMin} caracteres`,
      path: ['description'],
    });
  }

  if (categoryHasStructuredAttributes(data.category) && data.attributes !== undefined) {
    try {
      validateListingAttributes(data.category, data.attributes ?? {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Campos de categoría incompletos';
      ctx.addIssue({ code: 'custom', message: msg, path: ['attributes'] });
    }
  }
}

export const createListingSchema = listingBodySchema.superRefine(refineListingBody);

export const updateListingSchema = listingBodySchema.partial().superRefine(refineListingBody);

export const listingFilterSchema = listingAttributeFilterSchema.merge(
  z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  campId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  }),
);

export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  campId: z.string().uuid(),
  dairaId: z.string().uuid().optional(),
  marsaId: z.string().uuid().optional(),
  phone: phoneSchema,
  whatsapp: phoneSchema.optional(),
  acceptsCash: z.boolean().default(true),
  shopType: z
    .enum(['individual', 'restaurant', 'cooperative', 'association', 'workshop'])
    .default('individual'),
  imageUrl: z.string().url().optional(),
});

export const updateShopSchema = createShopSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    /** Allow clearing optional WhatsApp */
    whatsapp: phoneSchema.optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

export const moneyAmountSchema = z.number().finite().positive().max(10_000_000);

export const createShopProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  price: moneyAmountSchema,
  currency: currencySchema,
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
});

export const updateShopProductSchema = createShopProductSchema.partial();

export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(50),
  paymentMethod: z.enum(['cash', 'cash_on_delivery']),
  beneficiaryId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
});

export const createTransportSchema = z.object({
  type: z.enum(['collective_taxi', 'delivery', 'tindouf_import', 'errand', 'shared_ride', 'package', 'person']),
  originHubSlug: z.string().min(1),
  destinationHubSlug: z.string().min(1),
  /** Preferencia de pestaña UI; el servidor deriva y valida el scope real */
  scope: z.enum(['local', 'international']).optional(),
  originCampId: z.string().uuid().optional(),
  destinationCampId: z.string().uuid().optional(),
  pickupPointId: z.string().uuid().optional(),
  dropoffPointId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  priceEstimate: z.coerce.number().positive().max(1_000_000).optional(),
  seatsRequested: z.coerce.number().int().min(1).max(50).default(1),
  seatsAvailable: z.coerce.number().int().min(1).max(50).optional(),
  packageCapacity: z.string().max(120).optional(),
  departureAt: z.string().datetime().optional(),
  contactPhone: phoneSchema.optional(),
  luggageNote: z.string().max(300).optional(),
});

export const createDriverProfileSchema = z.object({
  vehicleType: z.enum(['car', 'pickup', 'van', 'truck', 'motorcycle']).optional(),
  vehiclePlate: z.string().min(2).max(20).optional(),
  licenseNumber: z.string().min(2).max(40).optional(),
  seatsCapacity: z.coerce.number().int().min(1).max(50).default(4),
  preferredHubSlugs: z.array(z.string().min(1).max(64)).max(40).optional(),
  routes: z
    .array(
      z.object({
        originCampId: z.string().uuid(),
        destinationCampId: z.string().uuid(),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).default('weekly'),
      }),
    )
    .max(5)
    .optional(),
});

export const transportCompleteSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN de 4 dígitos'),
});

export const pinConfirmSchema = z.object({
  operationCode: z.string().min(1).max(64),
  pin: z.string().regex(/^\d{4}$/),
});

export const createCreditEntrySchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['debt', 'payment']),
  notes: z.string().max(300).optional(),
});

export const createNeedSchema = z.object({
  type: z.enum(['product', 'service', 'transport', 'job', 'tindouf']),
  title: z.string().min(3).max(120),
  description: z.string().max(1000),
  campId: z.string().uuid(),
  category: z.string().optional(),
});

export const createReviewSchema = z.object({
  targetType: z.enum(['user', 'shop', 'driver', 'service']),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const createDisputeSchema = z.object({
  reason: z.enum(['not_received', 'not_as_described', 'payment_issue', 'fraud', 'harassment', 'other']),
  description: z.string().min(10).max(2000),
  respondentId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  transportId: z.string().uuid().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
export type CreateDriverProfileInput = z.infer<typeof createDriverProfileSchema>;

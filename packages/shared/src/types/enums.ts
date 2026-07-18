// User & Auth
export enum UserRole {
  CITIZEN = 'citizen',
  SELLER = 'seller',
  SHOP_OWNER = 'shop_owner',
  DRIVER = 'driver',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  NGO = 'ngo',
  DIASPORA = 'diaspora',
}

export enum VerificationLevel {
  UNVERIFIED = 'unverified',
  PHONE = 'phone',
  COMMUNITY = 'community',
  VERIFIED = 'verified',
  PARTNER = 'partner',
}

export enum PreferredLanguage {
  AR = 'ar',
  ES = 'es',
  FR = 'fr',
  EN = 'en',
}

// Listing
export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RESERVED = 'reserved',
  SOLD = 'sold',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  DISPUTED = 'disputed',
}

export enum ListingCategory {
  MOBILES = 'mobiles',
  ELECTRONICS = 'electronics',
  VEHICLES = 'vehicles',
  HOME = 'home',
  CLOTHING = 'clothing',
  FOOD = 'food',
  ANIMALS = 'animals',
  SPARE_PARTS = 'spare_parts',
  SOLAR = 'solar',
  TOOLS = 'tools',
  OTHER = 'other',
}

// Payment — fiado/voucher conservados solo para datos históricos; no se aceptan en altas nuevas
export enum PaymentMethod {
  CASH = 'cash',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  /** @deprecated No aceptado en nuevos pedidos */
  FIADO = 'fiado',
  MANUAL_TRANSFER = 'manual_transfer',
  /** @deprecated No aceptado en nuevos pedidos */
  VOUCHER = 'voucher',
  FUTURE_ONLINE = 'future_online',
}

/** Métodos permitidos al crear pedidos / listados */
export const ACTIVE_PAYMENT_METHODS = ['cash', 'cash_on_delivery', 'manual_transfer'] as const;
export type ActivePaymentMethod = (typeof ACTIVE_PAYMENT_METHODS)[number];

export enum PaymentStatus {
  PENDING = 'pending',
  AGREED = 'agreed',
  PAID_CASH = 'paid_cash',
  PARTIAL_PAID = 'partial_paid',
  /** @deprecated Solo histórico */
  FIADO = 'fiado',
  MANUAL_PENDING = 'manual_pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  PENDING_MANUAL_CONFIRMATION = 'pending_manual_confirmation',
}

// Order
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  ASSIGNED_TO_DRIVER = 'assigned_to_driver',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

// Transport
export enum TransportType {
  COLLECTIVE_TAXI = 'collective_taxi',
  DELIVERY = 'delivery',
  TINDOUF_IMPORT = 'tindouf_import',
  ERRAND = 'errand',
  SHARED_RIDE = 'shared_ride',
  PACKAGE = 'package',
  PERSON = 'person',
}

export enum TransportStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

// Service
export enum ServiceCategory {
  ELECTRICIAN = 'electrician',
  MECHANIC = 'mechanic',
  PHONE_REPAIR = 'phone_repair',
  TRANSPORT = 'transport',
  SEWING = 'sewing',
  HAIRDRESSING = 'hairdressing',
  CLASSES = 'classes',
  IT = 'it',
  CATERING = 'catering',
  MASONRY = 'masonry',
  PLUMBING = 'plumbing',
  SOLAR_INSTALL = 'solar_install',
  TRANSLATION = 'translation',
  OTHER = 'other',
}

// Job
export enum JobType {
  OFFER = 'offer',
  SEEKING = 'seeking',
}

export enum JobCategory {
  DAILY = 'daily',
  SKILLED = 'skilled',
  TRAINING = 'training',
  INTERNSHIP = 'internship',
  OTHER = 'other',
}

// Need
export enum NeedType {
  PRODUCT = 'product',
  SERVICE = 'service',
  TRANSPORT = 'transport',
  JOB = 'job',
  TINDOUF = 'tindouf',
}

export enum NeedStatus {
  OPEN = 'open',
  MATCHED = 'matched',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

// Community
export enum CommunityPostType {
  ANNOUNCEMENT = 'announcement',
  LOST_FOUND = 'lost_found',
  EVENT = 'event',
  CAMPAIGN = 'campaign',
  ALERT = 'alert',
  OPPORTUNITY = 'opportunity',
  COURSE = 'course',
  INSTITUTIONAL = 'institutional',
  URGENT_HELP = 'urgent_help',
}

// Dispute
export enum DisputeStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DisputeReason {
  NOT_RECEIVED = 'not_received',
  NOT_AS_DESCRIBED = 'not_as_described',
  PAYMENT_ISSUE = 'payment_issue',
  FRAUD = 'fraud',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

// Voucher
export enum VoucherStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Badge
export enum TrustBadge {
  PHONE_VERIFIED = 'phone_verified',
  SHOP_VERIFIED = 'shop_verified',
  DRIVER_VERIFIED = 'driver_verified',
  COOPERATIVE = 'cooperative',
  WOMEN_ENTREPRENEUR = 'women_entrepreneur',
  YOUNG_PROFESSIONAL = 'young_professional',
  COMMUNITY_RECOMMENDED = 'community_recommended',
  GOOD_PAYER = 'good_payer',
  DELIVERY_CONFIRMED = 'delivery_confirmed',
}

// Shop
export enum ShopType {
  INDIVIDUAL = 'individual',
  COOPERATIVE = 'cooperative',
  ASSOCIATION = 'association',
  WORKSHOP = 'workshop',
}

// Credit/Ledger
export enum CreditEntryType {
  DEBT = 'debt',
  PAYMENT = 'payment',
  ADJUSTMENT = 'adjustment',
}

export enum CreditAgreementStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
}

// Message
export enum ConversationType {
  LISTING = 'listing',
  ORDER = 'order',
  TRANSPORT = 'transport',
  DIRECT = 'direct',
}

// Notification
export enum NotificationType {
  MESSAGE = 'message',
  ORDER_UPDATE = 'order_update',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  VOUCHER_USED = 'voucher_used',
  TRANSPORT_ASSIGNED = 'transport_assigned',
  CASH_CONFIRMED = 'cash_confirmed',
  CREDIT_UPDATED = 'credit_updated',
  DISPUTE_UPDATE = 'dispute_update',
  DRIVER_VERIFIED = 'driver_verified',
  DRIVER_REVOKED = 'driver_revoked',
  GENERAL = 'general',
}

// Moderation
export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  ACTION_TAKEN = 'action_taken',
}

export enum ReportTargetType {
  LISTING = 'listing',
  USER = 'user',
  SHOP = 'shop',
  SERVICE = 'service',
  MESSAGE = 'message',
}

// Diaspora
export enum DiasporaOrderType {
  GIFT = 'gift',
  ESSENTIALS = 'essentials',
  CUSTOM = 'custom',
}

// Escrow (future)
export enum EscrowStatus {
  MOCK_PENDING = 'mock_pending',
  MOCK_HELD = 'mock_held',
  MOCK_RELEASED = 'mock_released',
  MOCK_DISPUTED = 'mock_disputed',
  MOCK_REFUNDED = 'mock_refunded',
}

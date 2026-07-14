-- Cambiar moneda por defecto de MRU a DZD (registros existentes conservan su currency).
ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "cash_agreements" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "manual_payments" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "credit_accounts" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "services" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "shop_products" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "jobs" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "diaspora_orders" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "voucher_programs" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "vouchers" ALTER COLUMN "currency" SET DEFAULT 'DZD';
ALTER TABLE "escrow_transactions" ALTER COLUMN "currency" SET DEFAULT 'DZD';

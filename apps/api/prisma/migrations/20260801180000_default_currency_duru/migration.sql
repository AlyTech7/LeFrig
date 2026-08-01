-- Moneda por defecto: duro (DURU). Relación de cuenta: 20 duros = 1 DZD.
-- Convierte importes existentes etiquetados como DZD a duros (×20).

UPDATE "order_items" AS oi
SET
  "unit_price" = oi."unit_price" * 20,
  "subtotal" = oi."subtotal" * 20
FROM "orders" AS o
WHERE oi."order_id" = o."id" AND o."currency" = 'DZD';

UPDATE "listings" SET "price" = "price" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "cash_agreements" SET "amount" = "amount" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "manual_payments" SET "amount" = "amount" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "credit_accounts" SET "balance" = "balance" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "services"
SET
  "price_from" = CASE WHEN "price_from" IS NULL THEN NULL ELSE "price_from" * 20 END,
  "price_to" = CASE WHEN "price_to" IS NULL THEN NULL ELSE "price_to" * 20 END,
  "currency" = 'DURU'
WHERE "currency" = 'DZD';
UPDATE "shop_products" SET "price" = "price" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "orders" SET "total_amount" = "total_amount" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "jobs"
SET
  "salary" = CASE WHEN "salary" IS NULL THEN NULL ELSE "salary" * 20 END,
  "currency" = 'DURU'
WHERE "currency" = 'DZD';
UPDATE "diaspora_orders"
SET
  "budget" = CASE WHEN "budget" IS NULL THEN NULL ELSE "budget" * 20 END,
  "currency" = 'DURU'
WHERE "currency" = 'DZD';
UPDATE "voucher_programs"
SET
  "total_budget" = CASE WHEN "total_budget" IS NULL THEN NULL ELSE "total_budget" * 20 END,
  "currency" = 'DURU'
WHERE "currency" = 'DZD';
UPDATE "vouchers" SET "balance" = "balance" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';
UPDATE "escrow_transactions" SET "amount" = "amount" * 20, "currency" = 'DURU' WHERE "currency" = 'DZD';

ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "cash_agreements" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "manual_payments" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "credit_accounts" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "services" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "shop_products" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "jobs" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "diaspora_orders" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "voucher_programs" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "vouchers" ALTER COLUMN "currency" SET DEFAULT 'DURU';
ALTER TABLE "escrow_transactions" ALTER COLUMN "currency" SET DEFAULT 'DURU';

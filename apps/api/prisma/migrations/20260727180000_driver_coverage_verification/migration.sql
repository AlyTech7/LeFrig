-- Driver profile: coverage modes, contact, docs, verification status
ALTER TABLE "driver_profiles"
  ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "coverage_mode" TEXT NOT NULL DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS "coverage_origin_hub_slug" TEXT,
  ADD COLUMN IF NOT EXISTS "coverage_zones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "corridor_pairs" JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS "coverage_scope" TEXT,
  ADD COLUMN IF NOT EXISTS "contact_phone" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "license_doc_url" TEXT,
  ADD COLUMN IF NOT EXISTS "vehicle_photo_url" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "driver_profiles"
SET "verification_status" = CASE WHEN "is_verified" THEN 'verified' ELSE 'basic' END
WHERE "verification_status" = 'basic' OR "verification_status" IS NULL;

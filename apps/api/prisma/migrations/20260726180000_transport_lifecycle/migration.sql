-- Transport lifecycle: scope, bilateral PIN confirmations, preferred hubs

ALTER TABLE "transport_requests" ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN IF NOT EXISTS "completion_pin" TEXT;
ALTER TABLE "transport_requests" ADD COLUMN IF NOT EXISTS "requester_confirmed_at" TIMESTAMP(3);
ALTER TABLE "transport_requests" ADD COLUMN IF NOT EXISTS "driver_confirmed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "transport_requests_scope_idx" ON "transport_requests"("scope");

ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "preferred_hub_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add unguessable public share tokens for contracts.
-- Existing rows are backfilled before the column becomes NOT NULL + UNIQUE.

ALTER TABLE "Contract" ADD COLUMN "shareToken" TEXT;

-- Two UUIDs → 32 bytes of entropy, then base64url encoding (no pgcrypto required).
UPDATE "Contract"
SET "shareToken" = rtrim(
  replace(
    replace(
      encode(
        decode(
          replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
          'hex'
        ),
        'base64'
      ),
      '+',
      '-'
    ),
    '/',
    '_'
  ),
  '='
)
WHERE "shareToken" IS NULL;

ALTER TABLE "Contract" ALTER COLUMN "shareToken" SET NOT NULL;

CREATE UNIQUE INDEX "Contract_shareToken_key" ON "Contract"("shareToken");

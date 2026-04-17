-- Structured persona template. Replaces the single systemPrompt blob with
-- four editable fields that PromptBuilder assembles at runtime.
-- Pre-launch: copy existing systemPrompt content into backstory so no
-- character data is lost; admins clean it up post-migration.

ALTER TABLE "Character"
  ADD COLUMN "backstory"        TEXT,
  ADD COLUMN "speechQuirks"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "bannedPhrases"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "signaturePhrases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Data-preserving copy: existing systemPrompt becomes backstory.
UPDATE "Character" SET "backstory" = "systemPrompt" WHERE "systemPrompt" IS NOT NULL;

-- Drop the old blob.
ALTER TABLE "Character" DROP COLUMN "systemPrompt";

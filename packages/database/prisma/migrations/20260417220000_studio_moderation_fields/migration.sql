-- Character Studio: Visual DNA + NSFW double-key
ALTER TABLE "Character"
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "nsfwAllowed" BOOLEAN NOT NULL DEFAULT false;

-- User: Age-gate compliance
ALTER TABLE "User"
  ADD COLUMN "dob" TIMESTAMP(3),
  ADD COLUMN "ageVerified" BOOLEAN NOT NULL DEFAULT false;

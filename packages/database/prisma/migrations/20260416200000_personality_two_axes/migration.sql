-- Collapse the 4-axis personality model into 2 axes (warmth, playfulness)
-- to reduce admin UI surface and prompt complexity. Pre-launch, so no
-- data-preservation step is needed.
ALTER TABLE "Character"
  DROP COLUMN "shynessBold",
  DROP COLUMN "romanticPragmatic",
  DROP COLUMN "playfulSerious",
  DROP COLUMN "dominantSubmissive",
  ADD COLUMN "warmth" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN "playfulness" INTEGER NOT NULL DEFAULT 50;

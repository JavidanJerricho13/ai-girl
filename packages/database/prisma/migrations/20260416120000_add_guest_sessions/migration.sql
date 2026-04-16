-- Add guest / anonymous session fields to User
ALTER TABLE "User"
  ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "guestExpiresAt" TIMESTAMP(3);

CREATE INDEX "User_isGuest_guestExpiresAt_idx"
  ON "User" ("isGuest", "guestExpiresAt");

-- Flag temporary (guest preview) conversations
ALTER TABLE "Conversation"
  ADD COLUMN "isTemporary" BOOLEAN NOT NULL DEFAULT false;

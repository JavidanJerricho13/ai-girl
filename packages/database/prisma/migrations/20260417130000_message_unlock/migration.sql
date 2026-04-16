-- Premium media gating for inline chat: free users see a blurred preview
-- until they spend a credit to unlock. `isLocked` is set at message-creation
-- time based on user.isPremium; unlocks are tracked per-user in the
-- MessageUnlock ledger so reloads don't re-lock already-paid content.
ALTER TABLE "Message"
  ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "MessageUnlock" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "messageId"    TEXT NOT NULL,
    "creditsSpent" INTEGER NOT NULL,
    "unlockedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageUnlock_userId_messageId_key"
    ON "MessageUnlock"("userId", "messageId");

CREATE INDEX "MessageUnlock_userId_idx"
    ON "MessageUnlock"("userId");

ALTER TABLE "MessageUnlock"
    ADD CONSTRAINT "MessageUnlock_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageUnlock"
    ADD CONSTRAINT "MessageUnlock_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Track character-initiated re-engagement messages so the scheduler can
-- rate-limit how many a user receives per day.
CREATE TABLE "ProactiveLog" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId"      TEXT NOT NULL,
    "trigger"        TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProactiveLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProactiveLog_userId_createdAt_idx"
    ON "ProactiveLog"("userId", "createdAt");

CREATE INDEX "ProactiveLog_conversationId_idx"
    ON "ProactiveLog"("conversationId");

ALTER TABLE "ProactiveLog"
    ADD CONSTRAINT "ProactiveLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProactiveLog"
    ADD CONSTRAINT "ProactiveLog_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

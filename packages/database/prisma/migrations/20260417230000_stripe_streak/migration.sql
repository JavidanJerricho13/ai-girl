-- Streak tracking for the daily reward loop.
ALTER TABLE "User"
  ADD COLUMN "loginStreak"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastStreakDate" TIMESTAMP(3);

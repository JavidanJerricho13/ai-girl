-- Credit gamification: daily login rewards + profile-completion bonuses
ALTER TABLE "User"
  ADD COLUMN "lastDailyRewardAt" TIMESTAMP(3),
  ADD COLUMN "bonusesClaimed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

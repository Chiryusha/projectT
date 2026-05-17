-- Backfill and align schema with auth + chemistry + AI simulation fields.

-- User: auth fields + not-null email.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;

UPDATE "User"
SET "email" = CONCAT('legacy_user_', "id", '@futdraft.local')
WHERE "email" IS NULL;

UPDATE "User"
SET "passwordHash" = '$2a$10$6MNBpSnt5uuj24iHEdoLceXQViPaDScWuzU6TkRI3vVwHXRg0AYIy'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Player: add required league and backfill from known clubs.
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "league" TEXT;

UPDATE "Player"
SET "league" = CASE "club"
  WHEN 'PSG' THEN 'Ligue 1'
  WHEN 'Man City' THEN 'Premier League'
  WHEN 'Liverpool' THEN 'Premier League'
  WHEN 'Arsenal' THEN 'Premier League'
  WHEN 'Man United' THEN 'Premier League'
  WHEN 'Tottenham' THEN 'Premier League'
  WHEN 'Aston Villa' THEN 'Premier League'
  WHEN 'Bayern' THEN 'Bundesliga'
  WHEN 'Leverkusen' THEN 'Bundesliga'
  WHEN 'Dortmund' THEN 'Bundesliga'
  WHEN 'Union Berlin' THEN 'Bundesliga'
  WHEN 'Real Madrid' THEN 'LaLiga'
  WHEN 'Barcelona' THEN 'LaLiga'
  WHEN 'Atletico' THEN 'LaLiga'
  WHEN 'Inter' THEN 'Serie A'
  WHEN 'AC Milan' THEN 'Serie A'
  WHEN 'Napoli' THEN 'Serie A'
  ELSE 'Unknown League'
END
WHERE "league" IS NULL;

ALTER TABLE "Player" ALTER COLUMN "league" SET NOT NULL;

-- Draft session constraints for 18-slot drafts with 2 goalkeepers.
ALTER TABLE "DraftSession" ADD COLUMN IF NOT EXISTS "goalkeepersRequired" INTEGER NOT NULL DEFAULT 2;
UPDATE "DraftSession" SET "totalSlots" = 18 WHERE "totalSlots" < 18;
ALTER TABLE "DraftSession" ALTER COLUMN "totalSlots" SET DEFAULT 18;

-- Ensure tournament enum types exist for DBs created from older schema snapshots.
DO $$
BEGIN
  CREATE TYPE "TournamentStatus" AS ENUM ('IN_PROGRESS', 'ELIMINATED', 'CHAMPION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "TournamentStage" AS ENUM ('QUARTERFINAL', 'SEMIFINAL', 'FINAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tournament tables (for legacy DBs that do not have them yet).
CREATE TABLE IF NOT EXISTS "Tournament" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "status" "TournamentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "userTeamName" TEXT NOT NULL DEFAULT 'User Squad',
  "championTeam" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TournamentMatch" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "stage" "TournamentStage" NOT NULL,
  "bracketIndex" INTEGER NOT NULL,
  "homeTeamName" TEXT NOT NULL,
  "awayTeamName" TEXT NOT NULL,
  "homeStrength" INTEGER NOT NULL,
  "awayStrength" INTEGER NOT NULL,
  "homeChemistry" INTEGER NOT NULL DEFAULT 0,
  "awayChemistry" INTEGER NOT NULL DEFAULT 0,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "winnerTeamName" TEXT NOT NULL,
  "isUserMatch" BOOLEAN NOT NULL DEFAULT false,
  "wentToPenalties" BOOLEAN NOT NULL DEFAULT false,
  "simulationProvider" TEXT NOT NULL DEFAULT 'local',
  "simulationReason" TEXT,
  "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- Add missing tournament metadata columns for DBs where table already exists.
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "homeChemistry" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "awayChemistry" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "simulationProvider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "TournamentMatch" ADD COLUMN IF NOT EXISTS "simulationReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_sessionId_key" ON "Tournament"("sessionId");
CREATE INDEX IF NOT EXISTS "TournamentMatch_tournamentId_stage_idx" ON "TournamentMatch"("tournamentId", "stage");
CREATE UNIQUE INDEX IF NOT EXISTS "TournamentMatch_tournamentId_stage_bracketIndex_key"
  ON "TournamentMatch"("tournamentId", "stage", "bracketIndex");

DO $$
BEGIN
  ALTER TABLE "Tournament"
    ADD CONSTRAINT "Tournament_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "DraftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TournamentMatch"
    ADD CONSTRAINT "TournamentMatch_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
CREATE TYPE "DraftSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('IN_PROGRESS', 'ELIMINATED', 'CHAMPION');

-- CreateEnum
CREATE TYPE "TournamentStage" AS ENUM ('QUARTERFINAL', 'SEMIFINAL', 'FINAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nation" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "primaryPosition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCard" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "pace" INTEGER NOT NULL,
    "shooting" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "physical" INTEGER NOT NULL,
    "basePosition" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'gold',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formation" TEXT NOT NULL DEFAULT '4-3-3',
    "seed" TEXT NOT NULL,
    "status" "DraftSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentSlot" INTEGER NOT NULL DEFAULT 1,
    "totalSlots" INTEGER NOT NULL DEFAULT 18,
    "goalkeepersRequired" INTEGER NOT NULL DEFAULT 2,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DraftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftOption" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slotNo" INTEGER NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "playerCardId" TEXT NOT NULL,
    "chemistryBoost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slotNo" INTEGER NOT NULL,
    "playerCardId" TEXT NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
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

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stage" "TournamentStage" NOT NULL,
    "bracketIndex" INTEGER NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "homeStrength" INTEGER NOT NULL,
    "awayStrength" INTEGER NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "winnerTeamName" TEXT NOT NULL,
    "isUserMatch" BOOLEAN NOT NULL DEFAULT false,
    "wentToPenalties" BOOLEAN NOT NULL DEFAULT false,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_fullName_key" ON "Player"("fullName");

-- CreateIndex
CREATE INDEX "PlayerCard_overall_idx" ON "PlayerCard"("overall");

-- CreateIndex
CREATE INDEX "PlayerCard_basePosition_idx" ON "PlayerCard"("basePosition");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCard_playerId_rarity_overall_basePosition_key" ON "PlayerCard"("playerId", "rarity", "overall", "basePosition");

-- CreateIndex
CREATE INDEX "DraftSession_userId_status_idx" ON "DraftSession"("userId", "status");

-- CreateIndex
CREATE INDEX "DraftOption_sessionId_slotNo_idx" ON "DraftOption"("sessionId", "slotNo");

-- CreateIndex
CREATE UNIQUE INDEX "DraftOption_sessionId_slotNo_optionIndex_key" ON "DraftOption"("sessionId", "slotNo", "optionIndex");

-- CreateIndex
CREATE INDEX "DraftPick_sessionId_pickedAt_idx" ON "DraftPick"("sessionId", "pickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_sessionId_slotNo_key" ON "DraftPick"("sessionId", "slotNo");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_sessionId_key" ON "Tournament"("sessionId");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_stage_idx" ON "TournamentMatch"("tournamentId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_tournamentId_stage_bracketIndex_key" ON "TournamentMatch"("tournamentId", "stage", "bracketIndex");

-- AddForeignKey
ALTER TABLE "PlayerCard" ADD CONSTRAINT "PlayerCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftSession" ADD CONSTRAINT "DraftSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOption" ADD CONSTRAINT "DraftOption_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DraftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOption" ADD CONSTRAINT "DraftOption_playerCardId_fkey" FOREIGN KEY ("playerCardId") REFERENCES "PlayerCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DraftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_playerCardId_fkey" FOREIGN KEY ("playerCardId") REFERENCES "PlayerCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DraftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;


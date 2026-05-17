-- Profile avatar and immutable saved squad snapshots.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

CREATE TABLE IF NOT EXISTS "SavedSquad" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "formation" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "chemistry" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedSquad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedSquad_userId_sessionId_key"
  ON "SavedSquad"("userId", "sessionId");

CREATE INDEX IF NOT EXISTS "SavedSquad_userId_createdAt_idx"
  ON "SavedSquad"("userId", "createdAt");

DO $$
BEGIN
  ALTER TABLE "SavedSquad"
    ADD CONSTRAINT "SavedSquad_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "SavedSquad"
    ADD CONSTRAINT "SavedSquad_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "DraftSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

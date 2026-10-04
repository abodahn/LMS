-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "titleTr" TEXT,
    "description" TEXT,
    "metric" TEXT NOT NULL DEFAULT 'POINTS',
    "target" INTEGER,
    "departmentId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChallengeEntrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "ChallengeEntrant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeEntrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Challenge_isActive_endsAt_idx" ON "Challenge"("isActive", "endsAt");

-- CreateIndex
CREATE INDEX "ChallengeEntrant_userId_idx" ON "ChallengeEntrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeEntrant_challengeId_userId_key" ON "ChallengeEntrant"("challengeId", "userId");

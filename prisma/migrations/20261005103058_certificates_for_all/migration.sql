-- AlterTable
ALTER TABLE "User" ADD COLUMN "certificateName" TEXT;
ALTER TABLE "User" ADD COLUMN "certificateNameConfirmedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT,
    "pathId" TEXT,
    "levelId" TEXT,
    "attemptId" TEXT,
    "learningHours" REAL NOT NULL DEFAULT 0,
    "finalScore" REAL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "revokedAt" DATETIME,
    "revokedById" TEXT,
    "revokeReason" TEXT,
    "issuer" TEXT NOT NULL DEFAULT 'TC',
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "SkillLevel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("attemptId", "code", "courseId", "expiresAt", "finalScore", "id", "issuedAt", "learningHours", "levelId", "pathId", "revokeReason", "revokedAt", "revokedById", "status", "title", "type", "userId") SELECT "attemptId", "code", "courseId", "expiresAt", "finalScore", "id", "issuedAt", "learningHours", "levelId", "pathId", "revokeReason", "revokedAt", "revokedById", "status", "title", "type", "userId" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_code_key" ON "Certificate"("code");
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "company" TEXT NOT NULL DEFAULT 'TC'
);
INSERT INTO "new_Location" ("country", "id", "name") SELECT "country", "id", "name" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- The Tolba Group head office's people receive T-CAP certificates.
UPDATE "Location" SET "company" = 'TCAP' WHERE "name" = 'T-CAP Head Office';

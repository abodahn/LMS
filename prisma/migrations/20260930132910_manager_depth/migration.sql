-- AlterTable
ALTER TABLE "User" ADD COLUMN "shift" TEXT;

-- CreateTable
CREATE TABLE "RecurringAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'EVERYONE',
    "audienceValue" TEXT,
    "everyMonths" INTEGER NOT NULL DEFAULT 12,
    "dueDays" INTEGER NOT NULL DEFAULT 30,
    "source" TEXT NOT NULL DEFAULT 'MANDATORY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticalSignOff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "signedById" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "skillId" TEXT,
    "skillLevel" INTEGER,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticalSignOff_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticalSignOff_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "titleTr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionTr" TEXT,
    "outcomes" TEXT NOT NULL DEFAULT '[]',
    "outcomesAr" TEXT NOT NULL DEFAULT '[]',
    "outcomesTr" TEXT NOT NULL DEFAULT '[]',
    "providerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "estimatedHours" REAL NOT NULL DEFAULT 1,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "price" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "certificateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "certificateCost" REAL,
    "aiLevelId" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "requiresSignOff" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "youtubePlaylistId" TEXT,
    "rating" REAL,
    "ratingSource" TEXT,
    "qualityScore" REAL NOT NULL DEFAULT 0.7,
    "lastVerifiedAt" DATETIME,
    "verifiedById" TEXT,
    "linkWorking" BOOLEAN NOT NULL DEFAULT true,
    "linkFailCount" INTEGER NOT NULL DEFAULT 0,
    "linkNote" TEXT,
    "stillAvailable" BOOLEAN NOT NULL DEFAULT true,
    "reviewIntervalDays" INTEGER NOT NULL DEFAULT 180,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CourseProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CourseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_aiLevelId_fkey" FOREIGN KEY ("aiLevelId") REFERENCES "SkillLevel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("aiLevelId", "categoryId", "certificateAvailable", "certificateCost", "code", "createdAt", "createdById", "currency", "description", "descriptionAr", "descriptionTr", "difficulty", "estimatedHours", "id", "isFree", "isInternal", "isMandatory", "isRecommended", "isTechnical", "language", "lastVerifiedAt", "linkFailCount", "linkNote", "linkWorking", "outcomes", "outcomesAr", "outcomesTr", "platform", "price", "providerId", "qualityScore", "rating", "ratingSource", "reviewIntervalDays", "slug", "status", "stillAvailable", "thumbnailUrl", "title", "titleAr", "titleTr", "updatedAt", "url", "verifiedById", "youtubePlaylistId") SELECT "aiLevelId", "categoryId", "certificateAvailable", "certificateCost", "code", "createdAt", "createdById", "currency", "description", "descriptionAr", "descriptionTr", "difficulty", "estimatedHours", "id", "isFree", "isInternal", "isMandatory", "isRecommended", "isTechnical", "language", "lastVerifiedAt", "linkFailCount", "linkNote", "linkWorking", "outcomes", "outcomesAr", "outcomesTr", "platform", "price", "providerId", "qualityScore", "rating", "ratingSource", "reviewIntervalDays", "slug", "status", "stillAvailable", "thumbnailUrl", "title", "titleAr", "titleTr", "updatedAt", "url", "verifiedById", "youtubePlaylistId" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Course_providerId_idx" ON "Course"("providerId");
CREATE INDEX "Course_aiLevelId_idx" ON "Course"("aiLevelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecurringAssignment_isActive_idx" ON "RecurringAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PracticalSignOff_enrollmentId_key" ON "PracticalSignOff"("enrollmentId");

-- CreateIndex
CREATE INDEX "PracticalSignOff_signedById_idx" ON "PracticalSignOff"("signedById");

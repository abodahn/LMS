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
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "contentType" TEXT NOT NULL DEFAULT 'COURSE',
    "sourceKey" TEXT,
    "attribution" TEXT,
    "discoveredAt" DATETIME,
    "reviewNote" TEXT,
    "qualityBreakdown" TEXT NOT NULL DEFAULT '{}',
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
INSERT INTO "new_Course" ("aiGenerated", "aiLevelId", "categoryId", "certificateAvailable", "certificateCost", "code", "createdAt", "createdById", "currency", "description", "descriptionAr", "descriptionTr", "difficulty", "estimatedHours", "id", "isFree", "isInternal", "isMandatory", "isRecommended", "isTechnical", "language", "lastVerifiedAt", "linkFailCount", "linkNote", "linkWorking", "outcomes", "outcomesAr", "outcomesTr", "platform", "price", "providerId", "qualityScore", "rating", "ratingSource", "requiresSignOff", "reviewIntervalDays", "slug", "status", "stillAvailable", "thumbnailUrl", "title", "titleAr", "titleTr", "updatedAt", "url", "verifiedById", "youtubePlaylistId") SELECT "aiGenerated", "aiLevelId", "categoryId", "certificateAvailable", "certificateCost", "code", "createdAt", "createdById", "currency", "description", "descriptionAr", "descriptionTr", "difficulty", "estimatedHours", "id", "isFree", "isInternal", "isMandatory", "isRecommended", "isTechnical", "language", "lastVerifiedAt", "linkFailCount", "linkNote", "linkWorking", "outcomes", "outcomesAr", "outcomesTr", "platform", "price", "providerId", "qualityScore", "rating", "ratingSource", "requiresSignOff", "reviewIntervalDays", "slug", "status", "stillAvailable", "thumbnailUrl", "title", "titleAr", "titleTr", "updatedAt", "url", "verifiedById", "youtubePlaylistId" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Course_providerId_idx" ON "Course"("providerId");
CREATE INDEX "Course_aiLevelId_idx" ON "Course"("aiLevelId");
CREATE INDEX "Course_status_contentType_idx" ON "Course"("status", "contentType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill for courses that existed before these columns did. Derived from what
-- each row already records about itself: the platform and code prefix set by the
-- harvester that imported it. Order matters — the more specific rules run last.
UPDATE "Course" SET "sourceKey" = 'MS_LEARN' WHERE "code" LIKE 'MSL-%';
UPDATE "Course" SET "sourceKey" = 'YOUTUBE' WHERE "platform" LIKE '%YouTube%';
UPDATE "Course" SET "sourceKey" = 'BTK' WHERE "platform" LIKE '%BTK%';
UPDATE "Course" SET "sourceKey" = 'MANUAL' WHERE "sourceKey" IS NULL;

UPDATE "Course" SET "contentType" = 'VIDEO' WHERE "platform" LIKE '%YouTube%';
UPDATE "Course" SET "contentType" = 'PLAYLIST' WHERE "youtubePlaylistId" IS NOT NULL;
UPDATE "Course" SET "contentType" = 'PATH' WHERE "platform" LIKE '%learning path%';
-- Short external modules are what the brief calls micro-courses.
UPDATE "Course" SET "contentType" = 'MICRO'
  WHERE "contentType" = 'COURSE' AND "isInternal" = 0 AND "estimatedHours" < 1;

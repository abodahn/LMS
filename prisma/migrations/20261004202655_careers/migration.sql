-- CreateTable
CREATE TABLE "CareerPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameTr" TEXT,
    "description" TEXT,
    "jobFamily" TEXT NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "CareerStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathId" TEXT NOT NULL,
    "jobTitleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CareerStep_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "CareerPath" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareerStep_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "jobFamily" TEXT NOT NULL,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "isManagerial" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "JobTitle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobTitle" ("departmentId", "id", "isManagerial", "isTechnical", "jobFamily", "name") SELECT "departmentId", "id", "isManagerial", "isTechnical", "jobFamily", "name" FROM "JobTitle";
DROP TABLE "JobTitle";
ALTER TABLE "new_JobTitle" RENAME TO "JobTitle";
CREATE UNIQUE INDEX "JobTitle_name_key" ON "JobTitle"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CareerPath_key_key" ON "CareerPath"("key");

-- CreateIndex
CREATE INDEX "CareerStep_jobTitleId_idx" ON "CareerStep"("jobTitleId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerStep_pathId_jobTitleId_key" ON "CareerStep"("pathId", "jobTitleId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerStep_pathId_order_key" ON "CareerStep"("pathId", "order");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssessmentPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "definitionId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "difficulty" TEXT,
    "bankId" TEXT,
    "count" INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT "AssessmentPool_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AssessmentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentPool_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentPool_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AssessmentPool" ("competencyId", "count", "definitionId", "difficulty", "id") SELECT "competencyId", "count", "definitionId", "difficulty", "id" FROM "AssessmentPool";
DROP TABLE "AssessmentPool";
ALTER TABLE "new_AssessmentPool" RENAME TO "AssessmentPool";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

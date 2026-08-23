-- CreateTable
CREATE TABLE "ScormPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entryHref" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "masteryScore" REAL,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScormPackage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScormPackage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScormState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cmi" TEXT NOT NULL DEFAULT '{}',
    "lessonStatus" TEXT NOT NULL DEFAULT 'not attempted',
    "scoreRaw" REAL,
    "scoreMin" REAL,
    "scoreMax" REAL,
    "location" TEXT,
    "suspendData" TEXT,
    "sessionSeconds" INTEGER NOT NULL DEFAULT 0,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScormState_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ScormPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScormState_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScormState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "titleTr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "descriptionTr" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "mode" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "locationId" TEXT,
    "room" TEXT,
    "meetingUrl" TEXT,
    "instructorId" TEXT,
    "instructorName" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "creditHours" REAL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waitlistOrder" INTEGER,
    "attendanceById" TEXT,
    "attendanceAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "SessionRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionRegistration_attendanceById_fkey" FOREIGN KEY ("attendanceById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScormPackage_lessonId_key" ON "ScormPackage"("lessonId");

-- CreateIndex
CREATE INDEX "ScormState_userId_idx" ON "ScormState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScormState_packageId_enrollmentId_key" ON "ScormState"("packageId", "enrollmentId");

-- CreateIndex
CREATE INDEX "TrainingSession_startsAt_idx" ON "TrainingSession"("startsAt");

-- CreateIndex
CREATE INDEX "TrainingSession_courseId_idx" ON "TrainingSession"("courseId");

-- CreateIndex
CREATE INDEX "TrainingSession_status_startsAt_idx" ON "TrainingSession"("status", "startsAt");

-- CreateIndex
CREATE INDEX "SessionRegistration_userId_status_idx" ON "SessionRegistration"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRegistration_sessionId_userId_key" ON "SessionRegistration"("sessionId", "userId");

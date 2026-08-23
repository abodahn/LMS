"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { unpackScormPackage, deleteScormPackage, MAX_PACKAGE_BYTES } from "@/lib/scorm/package";
import { ScormUploadError } from "@/lib/scorm/paths";

export type ScormUploadState = { error?: string; success?: string };

/**
 * Attaches an uploaded SCORM package to a lesson.
 *
 * The lesson row is created first so the package has an id to unpack under, and
 * the whole thing is rolled back if unpacking fails — a lesson of type SCORM
 * with no package behind it renders an empty frame, which is worse than an
 * error message.
 */
export async function uploadScormAction(
  _previous: ScormUploadState,
  formData: FormData,
): Promise<ScormUploadState> {
  const admin = await requirePermission("catalog.manage");

  const lessonId = String(formData.get("lessonId") ?? "");
  const file = formData.get("file");

  if (!lessonId) return { error: "errors.required" };
  if (!(file instanceof File) || file.size === 0) return { error: "scorm.noFile" };
  if (file.size > MAX_PACKAGE_BYTES) return { error: "scorm.tooLarge" };

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { scorm: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return { error: "errors.notFound" };

  // Replacing a package throws away the old files; learner state survives,
  // because the state rows hang off the package that is about to be recreated
  // only if the new upload succeeds.
  const previousPackageId = lesson.scorm?.id ?? null;

  const created = await prisma.scormPackage.upsert({
    where: { lessonId },
    update: {},
    create: {
      lessonId,
      version: "1.2",
      title: lesson.title,
      entryHref: "",
      storagePath: "",
      uploadedById: admin.id,
    },
  });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await unpackScormPackage(buffer, created.id);

    await prisma.scormPackage.update({
      where: { id: created.id },
      data: {
        version: result.manifest.version,
        title: result.manifest.title,
        entryHref: result.manifest.entryHref,
        storagePath: result.storagePath,
        fileCount: result.fileCount,
        sizeBytes: result.sizeBytes,
        masteryScore: result.manifest.masteryScore,
        uploadedById: admin.id,
      },
    });

    await prisma.courseLesson.update({
      where: { id: lessonId },
      data: { type: "SCORM", url: null },
    });

    await audit({
      actorId: admin.id,
      actorName: admin.fullName,
      action: previousPackageId ? "SCORM_PACKAGE_REPLACED" : "SCORM_PACKAGE_UPLOADED",
      entity: "CourseLesson",
      entityId: lessonId,
      summary: `${file.name} — SCORM ${result.manifest.version}, ${result.fileCount} files, entry ${result.manifest.entryHref}`.slice(
        0,
        500,
      ),
    });

    revalidatePath(`/admin/courses/${lesson.module.courseId}`);
    return { success: "scorm.uploaded" };
  } catch (e) {
    // Only remove the row this call created; a package that was already there
    // keeps its files and its learner state.
    if (!previousPackageId) await deleteScormPackage(created.id).catch(() => {});
    if (e instanceof ScormUploadError) return { error: e.message };
    console.error("SCORM upload failed", e);
    return { error: "errors.unexpected" };
  }
}

export async function removeScormAction(lessonId: string): Promise<ScormUploadState> {
  const admin = await requirePermission("catalog.manage");

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { scorm: true, module: { select: { courseId: true } } },
  });
  if (!lesson?.scorm) return { error: "errors.notFound" };

  await deleteScormPackage(lesson.scorm.id);
  await prisma.courseLesson.update({ where: { id: lessonId }, data: { type: "TEXT" } });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "SCORM_PACKAGE_REMOVED",
    entity: "CourseLesson",
    entityId: lessonId,
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  return { success: "common.saved" };
}

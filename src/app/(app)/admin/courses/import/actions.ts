"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  commitCourseImport,
  previewCourseImport,
  validateCourseRows,
  type CourseImportPreview,
} from "@/lib/import/courses";

export type CourseImportState = {
  error?: string;
  success?: string;
  params?: Record<string, number>;
  preview?: CourseImportPreview;
};

export async function previewCourseImportAction(
  _prev: CourseImportState,
  formData: FormData,
): Promise<CourseImportState> {
  await requirePermission("catalog.manage");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "errors.validation" };
  // A thousand-row catalog export is comfortably under this.
  if (file.size > 8 * 1024 * 1024) return { error: "errors.fileTooLarge:8 MB" };

  try {
    const preview = await previewCourseImport(file);
    if (preview.rows.length === 0) return { error: "common.noResults" };
    return { preview };
  } catch {
    return { error: "errors.fileType:XLSX, CSV" };
  }
}

export async function commitCourseImportAction(
  _prev: CourseImportState,
  formData: FormData,
): Promise<CourseImportState> {
  const admin = await requirePermission("catalog.manage");
  const payload = String(formData.get("payload") ?? "");

  let parsed: { headers: string[]; rows: Record<string, string>[] };
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { error: "errors.generic" };
  }

  const trustLinks = formData.get("trustLinks") === "on";

  // Re-validate server-side: the browser's verdict is never trusted.
  const preview = await validateCourseRows(parsed.headers, parsed.rows);
  const result = await commitCourseImport(preview, { trustLinks });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "COURSE_IMPORT",
    entity: "Course",
    summary: `Imported ${result.created} new and updated ${result.updated} courses (${result.skipped} skipped), ${
      result.verified ? "marked verified from a trusted source" : "left unverified pending link review"
    }`,
  });

  revalidatePath("/admin/courses");
  return {
    success: result.verified ? "form.coursesImportedVerified" : "form.coursesImportedUnverified",
    params: { created: result.created, updated: result.updated, skipped: result.skipped, queued: result.queued },
  };
}

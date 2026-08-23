"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { awardBadges } from "@/lib/badges";
import { notify } from "@/lib/notifications";
import { recalcEnrollmentProgress, recordActivity } from "@/lib/learner";
import { enrollFromRecommendations, targetDateFor } from "@/lib/recommendation/service";
import { saveUpload, UploadError } from "@/lib/storage";
import { issueCourseCertificate } from "@/lib/certificates";

export type LearningState = { error?: string; success?: string };

export async function enrollFromRecommendationAction(runId: string) {
  const user = await requireUser();
  const { enrolled } = await enrollFromRecommendations(user.id, runId);
  await prisma.employeeProfile.updateMany({ where: { userId: user.id }, data: { onboardingStep: "DONE" } });
  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "ENROLL_PATH",
    entity: "RecommendationRun",
    entityId: runId,
    summary: `${enrolled} courses`,
  });
  revalidatePath("/");
  redirect("/learning");
}

export async function enrollCourseAction(courseId: string) {
  const user = await requireUser();
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!existing) {
    await prisma.enrollment.create({ data: { userId: user.id, courseId, source: "SELF" } });
    await audit({ actorId: user.id, actorName: user.fullName, action: "ENROLL_COURSE", entity: "Course", entityId: courseId });
  }
  revalidatePath("/learning");
  redirect("/learning");
}

async function ownedEnrollment(enrollmentId: string, userId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.userId !== userId) throw new Error("Not found");
  return enrollment;
}

const lessonSchema = z.object({
  enrollmentId: z.string().min(1),
  lessonId: z.string().min(1),
  secondsSpent: z.number().int().min(0).max(24 * 3600).optional(),
  completed: z.boolean().optional(),
});

export async function saveLessonProgressAction(input: z.infer<typeof lessonSchema>): Promise<LearningState> {
  const user = await requireUser();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { error: "errors.validation" };

  try {
    const enrollment = await ownedEnrollment(parsed.data.enrollmentId, user.id);
    const lesson = await prisma.courseLesson.findUniqueOrThrow({ where: { id: parsed.data.lessonId } });

    const existing = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    });
    const wasComplete = existing?.status === "COMPLETED";
    const nowComplete = parsed.data.completed ?? wasComplete;

    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
      update: {
        status: nowComplete ? "COMPLETED" : "IN_PROGRESS",
        secondsSpent: { increment: parsed.data.secondsSpent ?? 0 },
        completedAt: nowComplete ? (existing?.completedAt ?? new Date()) : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        status: nowComplete ? "COMPLETED" : "IN_PROGRESS",
        secondsSpent: parsed.data.secondsSpent ?? 0,
        completedAt: nowComplete ? new Date() : null,
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        timeSpentMinutes: { increment: Math.round((parsed.data.secondsSpent ?? 0) / 60) },
        lastAccessedAt: new Date(),
      },
    });

    await recordActivity(user.id, (parsed.data.secondsSpent ?? 0) / 60, !wasComplete && nowComplete ? 1 : 0);
    const updated = await recalcEnrollmentProgress(enrollment.id);

    if (updated?.status === "COMPLETED") {
      await onCourseCompleted(user.id, enrollment.id);
    }

    revalidatePath(`/learn/${enrollment.id}`);
    return { success: "common.saved" };
  } catch {
    return { error: "errors.saveProgress" };
  }
}

async function onCourseCompleted(userId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { course: true },
  });
  await notify(userId, {
    category: "LEARNING",
    title: `Course complete: ${enrollment.course.title}`,
    body: "Nice work. Your progress and learning hours have been updated.",
    link: `/learning/${enrollmentId}`,
  });
  await issueCourseCertificate(userId, enrollmentId);
  await awardBadges(userId);
}

export async function markExternalCompleteAction(enrollmentId: string): Promise<LearningState> {
  const user = await requireUser();
  const enrollment = await ownedEnrollment(enrollmentId, user.id);

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      selfReportedDone: true,
      status: "PENDING_VERIFICATION",
      progressPercent: 100,
      completedAt: new Date(),
      lastAccessedAt: new Date(),
    },
  });

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "EXTERNAL_COMPLETION_CLAIMED",
    entity: "Enrollment",
    entityId: enrollment.id,
    summary: enrollment.course.title,
  });

  revalidatePath(`/learning/${enrollmentId}`);
  return { success: "learning.proofPending" };
}

export async function uploadProofAction(_prev: LearningState, formData: FormData): Promise<LearningState> {
  const user = await requireUser();
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500);
  const file = formData.get("file");

  if (!(file instanceof File)) return { error: "errors.validation" };

  try {
    const enrollment = await ownedEnrollment(enrollmentId, user.id);
    const stored = await saveUpload(file, `proofs/${user.id}`);

    await prisma.externalCompletionProof.create({
      data: {
        enrollmentId: enrollment.id,
        fileName: stored.originalName,
        filePath: stored.relativePath,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        note: note || null,
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "PENDING_VERIFICATION", selfReportedDone: true, progressPercent: 100 },
    });

    await audit({
      actorId: user.id,
      actorName: user.fullName,
      action: "PROOF_UPLOAD",
      entity: "Enrollment",
      entityId: enrollment.id,
    });

    revalidatePath(`/learning/${enrollmentId}`);
    return { success: "learning.proofPending" };
  } catch (err) {
    if (err instanceof UploadError) {
      return { error: err.code === "TOO_LARGE" ? "errors.fileTooLarge:8 MB" : "errors.fileType:PDF, PNG, JPG" };
    }
    return { error: "errors.generic" };
  }
}

const feedbackSchema = z.object({
  enrollmentId: z.string().min(1),
  usefulness: z.coerce.number().int().min(1).max(5),
  relevance: z.coerce.number().int().min(1).max(5),
  wouldRecommend: z.enum(["yes", "no"]),
  comment: z.string().max(1000).optional(),
});

export async function submitFeedbackAction(_prev: LearningState, formData: FormData): Promise<LearningState> {
  const user = await requireUser();
  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const enrollment = await ownedEnrollment(parsed.data.enrollmentId, user.id);

  await prisma.courseFeedback.upsert({
    where: { enrollmentId: enrollment.id },
    update: {
      usefulness: parsed.data.usefulness,
      relevance: parsed.data.relevance,
      wouldRecommend: parsed.data.wouldRecommend === "yes",
      comment: parsed.data.comment || null,
    },
    create: {
      enrollmentId: enrollment.id,
      userId: user.id,
      courseId: enrollment.courseId,
      usefulness: parsed.data.usefulness,
      relevance: parsed.data.relevance,
      wouldRecommend: parsed.data.wouldRecommend === "yes",
      comment: parsed.data.comment || null,
    },
  });

  revalidatePath(`/learning/${enrollment.id}`);
  return { success: "learning.feedbackThanks" };
}

export async function setPaceAction(hoursPerWeek: number): Promise<LearningState> {
  const user = await requireUser();
  const hours = Math.max(0.5, Math.min(20, hoursPerWeek));

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { not: "COMPLETED" } },
    include: { course: true },
  });
  const remaining = enrollments.reduce(
    (s, e) => s + e.course.estimatedHours * (1 - e.progressPercent / 100),
    0,
  );

  await prisma.learningPlan.upsert({
    where: { userId: user.id },
    update: { hoursPerWeek: hours, targetDate: targetDateFor(remaining, hours) },
    create: { userId: user.id, hoursPerWeek: hours, targetDate: targetDateFor(remaining, hours) },
  });
  await prisma.employeeProfile.updateMany({ where: { userId: user.id }, data: { weeklyLearningHours: hours } });

  revalidatePath("/learning");
  return { success: "common.saved" };
}

export async function saveNoteAction(_prev: LearningState, formData: FormData): Promise<LearningState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  const title = String(formData.get("title") ?? "").trim().slice(0, 120) || "Note";
  const lessonId = String(formData.get("lessonId") ?? "") || null;
  const courseId = String(formData.get("courseId") ?? "") || null;
  if (!body) return { error: "errors.validation" };

  await prisma.userNote.create({ data: { userId: user.id, title, body, lessonId, courseId } });
  revalidatePath("/toolbox");
  return { success: "common.saved" };
}

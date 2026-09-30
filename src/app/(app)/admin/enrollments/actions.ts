"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { issueCourseCertificate } from "@/lib/certificates";
import { awardBadges } from "@/lib/badges";
import { assignCourse, AUDIENCES } from "@/lib/assignments";
import { canComplete } from "@/lib/completion-rule";

export type EnrollmentState = { error?: string; success?: string };

const assignSchema = z.object({
  courseId: z.string().min(1),
  audience: z.enum(AUDIENCES),
  audienceValue: z.string().trim().optional(),
  dueDays: z.coerce.number().int().min(1).max(365),
  source: z.enum(["ASSIGNED", "MANDATORY"]),
});

/**
 * Bulk assignment to an audience.
 *
 * Every audience except EVERYONE needs something to select on, and assigning to
 * an empty value would quietly become "the whole company" — which is the sort
 * of mistake that lands mandatory training on two thousand people at once.
 */
export async function assignLearningAction(_prev: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const admin = await requirePermission("enrollments.manage");
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  if (d.audience !== "EVERYONE" && !d.audienceValue) return { error: "errors.validation" };

  const result = await assignCourse({
    courseId: d.courseId,
    audience: d.audience,
    audienceValue: d.audienceValue,
    dueDays: d.dueDays,
    source: d.source,
    assignedById: admin.id,
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "LEARNING_ASSIGNED",
    entity: "Course",
    entityId: d.courseId,
    summary: `${d.audience}${d.audienceValue ? `:${d.audienceValue}` : ""} — ${result.assigned} assigned, ${result.skipped} already had it`,
  });

  revalidatePath("/admin/enrollments");
  // A message code with its count, translated on the client like every other
  // form result; this was the one place returning English text directly.
  return { success: `form.assignedCount:${result.assigned}` };
}

const recurringSchema = z.object({
  courseId: z.string().min(1),
  audience: z.enum(AUDIENCES),
  audienceValue: z.string().trim().optional(),
  everyMonths: z.coerce.number().int().min(1).max(60),
  dueDays: z.coerce.number().int().min(1).max(365),
  source: z.enum(["ASSIGNED", "MANDATORY"]),
});

/**
 * A rule for training that comes round again.
 *
 * Saved rather than run: the scheduler picks it up, so the same path assigns it
 * the first time and every time after, and there is no first run that behaves
 * differently from the rest.
 */
export async function createRecurringAction(_prev: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const admin = await requirePermission("enrollments.manage");
  const parsed = recurringSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;
  if (d.audience !== "EVERYONE" && !d.audienceValue) return { error: "errors.validation" };

  await prisma.recurringAssignment.create({
    data: {
      courseId: d.courseId,
      audience: d.audience,
      audienceValue: d.audienceValue || null,
      everyMonths: d.everyMonths,
      dueDays: d.dueDays,
      source: d.source,
      createdById: admin.id,
    },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "RECURRING_ASSIGNMENT_CREATED",
    entity: "Course",
    entityId: d.courseId,
    summary: `every ${d.everyMonths} month(s) — ${d.audience}`,
  });

  revalidatePath("/admin/enrollments");
  return { success: "common.saved" };
}

export async function toggleRecurringAction(_prev: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const admin = await requirePermission("enrollments.manage");
  const id = String(formData.get("id") ?? "");
  const rule = await prisma.recurringAssignment.findUnique({ where: { id } });
  if (!rule) return { error: "errors.validation" };

  await prisma.recurringAssignment.update({ where: { id }, data: { isActive: !rule.isActive } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: rule.isActive ? "RECURRING_ASSIGNMENT_PAUSED" : "RECURRING_ASSIGNMENT_RESUMED",
    entity: "RecurringAssignment",
    entityId: id,
  });

  revalidatePath("/admin/enrollments");
  return { success: "common.saved" };
}

const reviewSchema = z.object({
  proofId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().trim().max(1000).optional(),
});

export async function reviewProofAction(_prev: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const admin = await requirePermission("proofs.verify");
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const proof = await prisma.externalCompletionProof.update({
    where: { id: d.proofId },
    data: {
      status: d.decision,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewNote: d.note || null,
    },
    include: { enrollment: { include: { course: true, signOff: true } } },
  });

  // Verifying a proof is one more route to completion, so it asks the same rule
  // as the rest. A proof shows the content was done; for a course that must be
  // demonstrated it cannot stand in for the supervisor, and the enrolment waits
  // at 100% for the sign-off, which then completes it.
  const completes =
    d.decision === "VERIFIED" &&
    canComplete({
      requiresSignOff: proof.enrollment.course.requiresSignOff,
      progressPercent: 100,
      hasSignOff: !!proof.enrollment.signOff,
    }).ok;

  await prisma.enrollment.update({
    where: { id: proof.enrollmentId },
    data:
      d.decision !== "VERIFIED"
        ? { status: "IN_PROGRESS", selfReportedDone: false, completedAt: null }
        : completes
          ? { status: "COMPLETED", progressPercent: 100, completedAt: proof.enrollment.completedAt ?? new Date() }
          : { status: "IN_PROGRESS", progressPercent: 100, completedAt: null },
  });

  if (completes) {
    await issueCourseCertificate(proof.enrollment.userId, proof.enrollmentId);
    await awardBadges(proof.enrollment.userId);
  }

  await notify(proof.enrollment.userId, {
    category: "LEARNING",
    title:
      d.decision === "VERIFIED"
        ? `Completion verified: ${proof.enrollment.course.title}`
        : `We need another look at your proof for ${proof.enrollment.course.title}`,
    body: d.note || (d.decision === "VERIFIED" ? "Your learning record has been updated." : "Please upload a clearer certificate."),
    link: `/learning/${proof.enrollmentId}`,
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "PROOF_REVIEW",
    entity: "ExternalCompletionProof",
    entityId: proof.id,
    summary: d.decision,
  });

  revalidatePath("/admin/enrollments");
  return { success: "common.saved" };
}

const historySchema = z.object({
  employeeCode: z.string().trim().min(2),
  courseName: z.string().trim().min(2).max(200),
  provider: z.string().trim().max(120).optional(),
  completedAt: z.string().trim().min(4),
  hours: z.coerce.number().min(0).max(1000),
  certificateUrl: z.string().trim().url().or(z.literal("")).optional(),
  note: z.string().trim().max(500).optional(),
});

/** Historical learning so the academy does not start from zero. */
export async function addHistoricalTrainingAction(
  _prev: EnrollmentState,
  formData: FormData,
): Promise<EnrollmentState> {
  const admin = await requirePermission("history.import");
  const parsed = historySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const user = await prisma.user.findUnique({ where: { employeeCode: d.employeeCode } });
  if (!user) return { error: "errors.notFound" };

  const completedAt = new Date(d.completedAt);
  if (Number.isNaN(completedAt.getTime())) return { error: "errors.validation" };

  await prisma.historicalTraining.create({
    data: {
      userId: user.id,
      courseName: d.courseName,
      provider: d.provider || null,
      completedAt,
      hours: d.hours,
      certificateUrl: d.certificateUrl || null,
      note: d.note || null,
      recordedById: admin.id,
    },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "HISTORICAL_TRAINING_ADDED",
    entity: "HistoricalTraining",
    entityId: user.id,
    summary: `${d.courseName} (${d.hours}h)`,
  });

  revalidatePath("/admin/enrollments");
  return { success: "common.saved" };
}

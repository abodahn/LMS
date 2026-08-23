"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { issueCourseCertificate } from "@/lib/certificates";
import { awardBadges } from "@/lib/badges";

export type EnrollmentState = { error?: string; success?: string };

const assignSchema = z.object({
  courseId: z.string().min(1),
  departmentId: z.string().optional(),
  jobFamily: z.string().optional(),
  dueDays: z.coerce.number().int().min(1).max(365),
  source: z.enum(["ASSIGNED", "MANDATORY"]),
});

/** Bulk assignment by department or job family. */
export async function assignLearningAction(_prev: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const admin = await requirePermission("enrollments.manage");
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  if (!d.departmentId && !d.jobFamily) return { error: "errors.validation" };

  const course = await prisma.course.findUniqueOrThrow({ where: { id: d.courseId } });
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(d.departmentId ? { departmentId: d.departmentId } : {}),
      ...(d.jobFamily ? { jobTitle: { jobFamily: d.jobFamily } } : {}),
    },
    select: { id: true },
  });

  const dueAt = new Date(Date.now() + d.dueDays * 86400000);
  let assigned = 0;

  for (const u of users) {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: u.id, courseId: d.courseId } },
    });
    if (existing) continue;
    await prisma.enrollment.create({
      data: { userId: u.id, courseId: d.courseId, source: d.source, assignedById: admin.id, dueAt },
    });
    await notify(u.id, {
      category: "LEARNING",
      title: `New learning assigned: ${course.title}`,
      body: `Due ${dueAt.toDateString()}.`,
      link: "/learning",
    });
    assigned++;
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "LEARNING_ASSIGNED",
    entity: "Course",
    entityId: d.courseId,
    summary: `${assigned} employees`,
  });

  revalidatePath("/admin/enrollments");
  return { success: `${assigned} employees assigned` };
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
    include: { enrollment: { include: { course: true } } },
  });

  await prisma.enrollment.update({
    where: { id: proof.enrollmentId },
    data:
      d.decision === "VERIFIED"
        ? { status: "COMPLETED", progressPercent: 100, completedAt: proof.enrollment.completedAt ?? new Date() }
        : { status: "IN_PROGRESS", selfReportedDone: false, completedAt: null },
  });

  if (d.decision === "VERIFIED") {
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

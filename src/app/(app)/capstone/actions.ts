"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { awardBadges } from "@/lib/badges";
import { notify } from "@/lib/notifications";
import { issueProgramCertificate } from "@/lib/certificates";

export type CapstoneState = { error?: string; success?: string };

export const CAPSTONE_FIELDS = [
  "title",
  "businessProblem",
  "currentProcess",
  "whereAiHelps",
  "promptWorkflow",
  "expectedOutput",
  "risks",
  "validationMethod",
  "estimatedBenefit",
] as const;

const contentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  businessProblem: z.string().trim().max(4000),
  currentProcess: z.string().trim().max(4000),
  whereAiHelps: z.string().trim().max(4000),
  promptWorkflow: z.string().trim().max(6000),
  expectedOutput: z.string().trim().max(4000),
  risks: z.string().trim().max(4000),
  validationMethod: z.string().trim().max(4000),
  estimatedBenefit: z.string().trim().max(2000),
});

async function resolveAssignment(jobFamily: string) {
  return (
    (await prisma.assignment.findFirst({ where: { type: "CAPSTONE", jobFamily } })) ??
    (await prisma.assignment.findFirstOrThrow({ where: { key: "CAP-GENERAL" } }))
  );
}

export async function saveCapstoneAction(_prev: CapstoneState, formData: FormData): Promise<CapstoneState> {
  const user = await requireUser();
  const submit = formData.get("intent") === "submit";
  const raw = Object.fromEntries(CAPSTONE_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));

  if (submit) {
    const parsed = contentSchema.safeParse(raw);
    if (!parsed.success) return { error: "errors.validation" };
    const empty = CAPSTONE_FIELDS.filter((f) => f !== "title" && !raw[f].trim());
    if (empty.length > 0) return { error: "errors.validation" };
  }

  const assignment = await resolveAssignment(user.jobFamily);
  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_userId: { assignmentId: assignment.id, userId: user.id } },
  });

  if (existing && (existing.status === "SUBMITTED" || existing.status === "UNDER_REVIEW" || existing.status === "APPROVED")) {
    return { error: "capstone.underReview" };
  }

  const data = {
    content: JSON.stringify(raw),
    status: submit ? "SUBMITTED" : "DRAFT",
    submittedAt: submit ? new Date() : null,
  };

  const submission = existing
    ? await prisma.assignmentSubmission.update({ where: { id: existing.id }, data })
    : await prisma.assignmentSubmission.create({
        data: { assignmentId: assignment.id, userId: user.id, ...data },
      });

  if (submit) {
    await audit({
      actorId: user.id,
      actorName: user.fullName,
      action: "CAPSTONE_SUBMIT",
      entity: "AssignmentSubmission",
      entityId: submission.id,
    });
    const manager = user.managerId;
    if (manager) {
      await notify(manager, {
        category: "MANAGER",
        title: "A workplace challenge needs your review",
        body: `${user.fullName} submitted "${raw.title}".`,
        link: "/team/reviews",
      });
    }
    await awardBadges(user.id);
  }

  revalidatePath("/capstone");
  return { success: submit ? "capstone.submitted" : "capstone.draftSaved" };
}

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["APPROVED", "NEEDS_WORK"]),
  score: z.coerce.number().min(0).max(100).optional(),
  feedback: z.string().trim().max(3000),
});

/** Manager or L&D review. Approved capstones feed the AI opportunity pipeline. */
export async function reviewCapstoneAction(_prev: CapstoneState, formData: FormData): Promise<CapstoneState> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const submission = await prisma.assignmentSubmission.findUniqueOrThrow({
    where: { id: parsed.data.submissionId },
    include: { user: { select: { managerId: true, departmentId: true, fullName: true } }, assignment: true },
  });

  const allowed =
    user.permissions.includes("team.review") &&
    (submission.user.managerId === user.id || user.permissions.includes("enrollments.manage"));
  if (!allowed) return { error: "errors.forbidden" };

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      status: parsed.data.decision,
      score: parsed.data.score ?? null,
      feedback: parsed.data.feedback,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });

  await notify(submission.userId, {
    category: "LEARNING",
    title:
      parsed.data.decision === "APPROVED"
        ? "Your workplace challenge was approved"
        : "Your workplace challenge needs a little more work",
    body: parsed.data.feedback.slice(0, 300),
    link: "/capstone",
  });

  if (parsed.data.decision === "APPROVED") {
    const content = JSON.parse(submission.content) as Record<string, string>;
    await prisma.aiOpportunity.upsert({
      where: { submissionId: submission.id },
      update: {},
      create: {
        submissionId: submission.id,
        departmentId: submission.user.departmentId,
        title: content.title || submission.assignment.title,
        problem: content.businessProblem ?? "",
        opportunity: content.whereAiHelps ?? "",
        ownerId: submission.userId,
        status: "IDENTIFIED",
      },
    });
    await awardBadges(submission.userId);
    await issueProgramCertificate(submission.userId);
  }

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "CAPSTONE_REVIEW",
    entity: "AssignmentSubmission",
    entityId: submission.id,
    summary: parsed.data.decision,
  });

  revalidatePath("/team/reviews");
  return { success: "common.saved" };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export type ContentState = { error?: string; success?: string };

const promptSchema = z.object({
  promptId: z.string().optional(),
  title: z.string().trim().min(3).max(200),
  titleAr: z.string().trim().max(200).optional(),
  titleTr: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10).max(8000),
  description: z.string().trim().max(500).optional(),
  departmentId: z.string().optional(),
  taskCategory: z.string().trim().min(2).max(40),
  difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED"]),
  tool: z.string().trim().max(40),
  isApproved: z.string().optional(),
});

export async function savePromptAction(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const admin = await requirePermission("content.manage");
  const parsed = promptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const data = {
    title: d.title,
    titleAr: d.titleAr || null,
    titleTr: d.titleTr || null,
    body: d.body,
    description: d.description || null,
    departmentId: d.departmentId || null,
    taskCategory: d.taskCategory.toUpperCase(),
    difficulty: d.difficulty,
    tool: d.tool || "ANY",
    isApproved: !!d.isApproved,
  };

  const prompt = d.promptId
    ? await prisma.promptTemplate.update({ where: { id: d.promptId }, data })
    : await prisma.promptTemplate.create({
        data: { key: `PR-${slugify(d.title).toUpperCase().slice(0, 40)}-${Date.now().toString(36)}`, createdById: admin.id, ...data },
      });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.promptId ? "PROMPT_UPDATE" : "PROMPT_CREATE",
    entity: "PromptTemplate",
    entityId: prompt.id,
  });

  revalidatePath("/admin/content");
  revalidatePath("/prompts");
  return { success: "common.saved" };
}

export async function deletePromptAction(promptId: string) {
  const admin = await requirePermission("content.manage");
  await prisma.promptTemplate.delete({ where: { id: promptId } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "PROMPT_DELETE",
    entity: "PromptTemplate",
    entityId: promptId,
  });
  revalidatePath("/admin/content");
  revalidatePath("/prompts");
}

const useCaseSchema = z.object({
  useCaseId: z.string().optional(),
  title: z.string().trim().min(3).max(200),
  titleAr: z.string().trim().max(200).optional(),
  departmentId: z.string().optional(),
  problem: z.string().trim().min(10).max(2000),
  howAiHelps: z.string().trim().min(10).max(2000),
  workflow: z.string().trim().max(3000),
  examplePrompt: z.string().trim().min(10).max(6000),
  dataSensitivityWarning: z.string().trim().min(5).max(1500),
  estimatedTimeSaved: z.string().trim().max(120).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function saveUseCaseAction(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const admin = await requirePermission("content.manage");
  const parsed = useCaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const data = {
    title: d.title,
    titleAr: d.titleAr || null,
    departmentId: d.departmentId || null,
    problem: d.problem,
    howAiHelps: d.howAiHelps,
    workflow: JSON.stringify(
      d.workflow
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    examplePrompt: d.examplePrompt,
    dataSensitivityWarning: d.dataSensitivityWarning,
    estimatedTimeSaved: d.estimatedTimeSaved || null,
    difficulty: d.difficulty,
    status: d.status,
  };

  const useCase = d.useCaseId
    ? await prisma.aiUseCase.update({ where: { id: d.useCaseId }, data })
    : await prisma.aiUseCase.create({
        data: { key: `UC-${slugify(d.title).toUpperCase().slice(0, 40)}-${Date.now().toString(36)}`, createdById: admin.id, ...data },
      });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.useCaseId ? "USECASE_UPDATE" : "USECASE_CREATE",
    entity: "AiUseCase",
    entityId: useCase.id,
  });

  revalidatePath("/admin/content");
  revalidatePath("/use-cases");
  return { success: "common.saved" };
}

export async function deleteUseCaseAction(useCaseId: string) {
  const admin = await requirePermission("content.manage");
  await prisma.aiUseCase.delete({ where: { id: useCaseId } });
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "USECASE_DELETE",
    entity: "AiUseCase",
    entityId: useCaseId,
  });
  revalidatePath("/admin/content");
  revalidatePath("/use-cases");
}

const opportunitySchema = z.object({
  opportunityId: z.string().min(1),
  status: z.enum(["IDENTIFIED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS", "DELIVERED", "REJECTED"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  hoursBefore: z.coerce.number().min(0).max(10000).optional(),
  hoursAfter: z.coerce.number().min(0).max(10000).optional(),
  hoursSavedMonthly: z.coerce.number().min(0).max(10000).optional(),
  financialBenefit: z.coerce.number().min(0).max(100000000).optional(),
  qualityImprovement: z.string().trim().max(500).optional(),
});

export async function updateOpportunityAction(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const admin = await requirePermission("opportunities.manage");
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  // Annual saving is derived, never typed in — it cannot drift from the monthly figure.
  const annual = d.hoursSavedMonthly != null ? d.hoursSavedMonthly * 12 : null;

  await prisma.aiOpportunity.update({
    where: { id: d.opportunityId },
    data: {
      status: d.status,
      impact: d.impact,
      complexity: d.complexity,
      hoursBefore: d.hoursBefore ?? null,
      hoursAfter: d.hoursAfter ?? null,
      hoursSavedMonthly: d.hoursSavedMonthly ?? null,
      annualHoursSaved: annual,
      financialBenefit: d.financialBenefit ?? null,
      qualityImprovement: d.qualityImprovement || null,
    },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "OPPORTUNITY_UPDATE",
    entity: "AiOpportunity",
    entityId: d.opportunityId,
    after: { status: d.status, impact: d.impact, annualHoursSaved: annual },
  });

  revalidatePath("/admin/opportunities");
  return { success: "common.saved" };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { QUESTION_TYPES } from "@/lib/constants";

export type QuestionState = { error?: string; success?: string };

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1).max(600),
  textAr: z.string().trim().max(600).optional(),
  textTr: z.string().trim().max(600).optional(),
  isCorrect: z.boolean(),
  feedback: z.string().trim().max(600).optional(),
});

const questionSchema = z.object({
  questionId: z.string().optional(),
  bankId: z.string().optional(),
  competencyId: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED"]),
  text: z.string().trim().min(5).max(2000),
  textAr: z.string().trim().max(2000).optional(),
  textTr: z.string().trim().max(2000).optional(),
  explanation: z.string().trim().max(2000).optional(),
  points: z.coerce.number().min(0.5).max(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isTechnical: z.boolean(),
  options: z.array(optionSchema).max(10),
});

export async function saveQuestionAction(input: z.infer<typeof questionSchema>): Promise<QuestionState> {
  const admin = await requirePermission("assessments.manage");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const needsOptions = !["SHORT_ANSWER", "PROMPT_TASK"].includes(d.type);
  if (needsOptions) {
    if (d.options.length < 2) return { error: "A question needs at least two options." };
    if (!d.options.some((o) => o.isCorrect)) return { error: "Mark at least one option as correct." };
    if (d.type !== "MULTI" && d.options.filter((o) => o.isCorrect).length > 1) {
      return { error: "Only a multi-select question can have more than one correct option." };
    }
  }

  const data = {
    bankId: d.bankId || null,
    competencyId: d.competencyId,
    type: d.type,
    difficulty: d.difficulty,
    text: d.text,
    textAr: d.textAr || null,
    textTr: d.textTr || null,
    explanation: d.explanation || null,
    points: d.points,
    status: d.status,
    isTechnical: d.isTechnical,
  };

  const before = d.questionId ? await prisma.assessmentQuestion.findUnique({ where: { id: d.questionId } }) : null;
  const question = d.questionId
    ? await prisma.assessmentQuestion.update({ where: { id: d.questionId }, data })
    : await prisma.assessmentQuestion.create({ data });

  await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
  for (const [i, o] of d.options.entries()) {
    await prisma.questionOption.create({
      data: {
        questionId: question.id,
        text: o.text,
        textAr: o.textAr || null,
        textTr: o.textTr || null,
        isCorrect: o.isCorrect,
        feedback: o.feedback || null,
        order: i,
      },
    });
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.questionId ? "QUESTION_UPDATE" : "QUESTION_CREATE",
    entity: "AssessmentQuestion",
    entityId: question.id,
    before: before ?? undefined,
    after: data,
  });

  revalidatePath("/admin/questions");
  if (!d.questionId) redirect(`/admin/questions/${question.id}`);
  return { success: "common.saved" };
}

export async function deleteQuestionAction(questionId: string) {
  const admin = await requirePermission("assessments.manage");
  const used = await prisma.attemptQuestion.count({ where: { questionId } });
  if (used > 0) {
    // Retiring keeps historical attempts intact.
    await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { status: "ARCHIVED" } });
  } else {
    await prisma.assessmentQuestion.delete({ where: { id: questionId } });
  }
  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: used > 0 ? "QUESTION_ARCHIVE" : "QUESTION_DELETE",
    entity: "AssessmentQuestion",
    entityId: questionId,
  });
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

const definitionSchema = z.object({
  definitionId: z.string().optional(),
  key: z.string().trim().min(3).max(60),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(["PLACEMENT", "TECHNICAL", "MODULE", "FINAL", "RESPONSIBLE_AI"]),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  passingScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(1).max(20),
  cooldownMinutes: z.coerce.number().int().min(0).max(1000000),
  randomizeQuestions: z.string().optional(),
  randomizeOptions: z.string().optional(),
  isAdaptive: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function saveDefinitionAction(_prev: QuestionState, formData: FormData): Promise<QuestionState> {
  const admin = await requirePermission("assessments.manage");
  const parsed = definitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const clash = await prisma.assessmentDefinition.findFirst({
    where: { key: d.key, ...(d.definitionId ? { NOT: { id: d.definitionId } } : {}) },
  });
  if (clash) return { error: "errors.validation" };

  // Pools arrive as pool.<competencyId>.<difficulty> = count
  const pools: { competencyId: string; difficulty: string | null; count: number }[] = [];
  for (const [name, value] of formData.entries()) {
    if (!name.startsWith("pool.")) continue;
    const [, competencyId, difficulty] = name.split(".");
    const count = Number(value);
    if (!Number.isFinite(count) || count <= 0) continue;
    pools.push({ competencyId, difficulty: difficulty === "ANY" ? null : difficulty, count });
  }

  const questionCount = pools.reduce((s, p) => s + p.count, 0);

  const data = {
    title: d.title,
    description: d.description || null,
    type: d.type,
    durationMinutes: d.durationMinutes,
    questionCount,
    passingScore: d.passingScore,
    maxAttempts: d.maxAttempts,
    cooldownMinutes: d.cooldownMinutes,
    randomizeQuestions: !!d.randomizeQuestions,
    randomizeOptions: !!d.randomizeOptions,
    isAdaptive: !!d.isAdaptive,
    status: d.status,
  };

  const definition = d.definitionId
    ? await prisma.assessmentDefinition.update({ where: { id: d.definitionId }, data: { ...data, key: d.key } })
    : await prisma.assessmentDefinition.create({ data: { key: d.key, ...data } });

  await prisma.assessmentPool.deleteMany({ where: { definitionId: definition.id } });
  for (const p of pools) {
    await prisma.assessmentPool.create({
      data: { definitionId: definition.id, competencyId: p.competencyId, difficulty: p.difficulty, count: p.count },
    });
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.definitionId ? "ASSESSMENT_UPDATE" : "ASSESSMENT_CREATE",
    entity: "AssessmentDefinition",
    entityId: definition.id,
    after: { ...data, pools },
  });

  revalidatePath("/admin/assessments");
  if (!d.definitionId) redirect(`/admin/assessments/${definition.id}`);
  return { success: "common.saved" };
}

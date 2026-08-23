"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { JOB_FAMILIES, LEVEL_CODES } from "@/lib/constants";

export type PathState = { error?: string; success?: string };

const pathSchema = z.object({
  pathId: z.string().optional(),
  code: z.string().trim().min(3).max(60),
  title: z.string().trim().min(3).max(200),
  titleAr: z.string().trim().max(200).optional(),
  titleTr: z.string().trim().max(200).optional(),
  description: z.string().trim().min(10).max(2000),
  targetHours: z.coerce.number().min(1).max(300),
  targetLevelId: z.string().optional(),
  audienceLevel: z.enum(LEVEL_CODES).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isDefault: z.string().optional(),
  isTechnical: z.string().optional(),
});

export async function savePathAction(_prev: PathState, formData: FormData): Promise<PathState> {
  const admin = await requirePermission("paths.manage");
  const parsed = pathSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  const clash = await prisma.learningPath.findFirst({
    where: { code: d.code, ...(d.pathId ? { NOT: { id: d.pathId } } : {}) },
  });
  if (clash) return { error: "errors.validation" };

  const jobFamilies = formData
    .getAll("jobFamilies")
    .map(String)
    .filter((f) => (JOB_FAMILIES as readonly string[]).includes(f));

  const data = {
    title: d.title,
    titleAr: d.titleAr || null,
    titleTr: d.titleTr || null,
    description: d.description,
    targetHours: d.targetHours,
    targetLevelId: d.targetLevelId || null,
    audienceLevel: d.audienceLevel || null,
    jobFamilies: JSON.stringify(jobFamilies),
    status: d.status,
    isDefault: !!d.isDefault,
    isTechnical: !!d.isTechnical,
  };

  const path = d.pathId
    ? await prisma.learningPath.update({ where: { id: d.pathId }, data })
    : await prisma.learningPath.create({ data: { code: d.code, createdById: admin.id, ...data } });

  // Only one path can be the corporate default.
  if (data.isDefault) {
    await prisma.learningPath.updateMany({ where: { NOT: { id: path.id } }, data: { isDefault: false } });
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.pathId ? "PATH_UPDATE" : "PATH_CREATE",
    entity: "LearningPath",
    entityId: path.id,
    after: { ...data, jobFamilies },
  });

  revalidatePath("/admin/paths");
  if (!d.pathId) redirect(`/admin/paths/${path.id}`);
  return { success: "common.saved" };
}

const structureSchema = z.object({
  pathId: z.string().min(1),
  phases: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(1000).optional(),
      courses: z.array(
        z.object({
          courseId: z.string().min(1),
          isRequired: z.boolean(),
          sequenceLock: z.boolean(),
          minScore: z.coerce.number().min(0).max(100).nullable().optional(),
        }),
      ),
    }),
  ),
});

export async function savePathStructureAction(input: z.infer<typeof structureSchema>): Promise<PathState> {
  const admin = await requirePermission("paths.manage");
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) return { error: "errors.validation" };
  const { pathId, phases } = parsed.data;

  const seen = new Set<string>();
  for (const phase of phases) {
    for (const c of phase.courses) {
      if (seen.has(c.courseId)) return { error: "A course can appear only once in a path." };
      seen.add(c.courseId);
    }
  }

  await prisma.learningPathCourse.deleteMany({ where: { pathId } });
  await prisma.learningPathPhase.deleteMany({ where: { pathId } });

  let order = 0;
  for (const [i, phase] of phases.entries()) {
    const created = await prisma.learningPathPhase.create({
      data: { pathId, title: phase.title, description: phase.description || null, order: i },
    });
    for (const c of phase.courses) {
      await prisma.learningPathCourse.create({
        data: {
          pathId,
          phaseId: created.id,
          courseId: c.courseId,
          order: order++,
          isRequired: c.isRequired,
          sequenceLock: c.sequenceLock,
          minScore: c.minScore ?? null,
        },
      });
    }
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "PATH_STRUCTURE_UPDATE",
    entity: "LearningPath",
    entityId: pathId,
    summary: `${phases.length} phases, ${order} courses`,
  });

  revalidatePath(`/admin/paths/${pathId}`);
  return { success: "common.saved" };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { DIFFICULTIES, JOB_FAMILIES, LEARNING_GOALS, LESSON_TYPES } from "@/lib/constants";

export type CourseState = { error?: string; success?: string; warning?: string; courseId?: string };

const courseSchema = z.object({
  courseId: z.string().optional(),
  code: z.string().trim().min(2).max(40),
  title: z.string().trim().min(3).max(200),
  titleAr: z.string().trim().max(200).optional(),
  titleTr: z.string().trim().max(200).optional(),
  description: z.string().trim().min(10).max(4000),
  descriptionAr: z.string().trim().max(4000).optional(),
  descriptionTr: z.string().trim().max(4000).optional(),
  outcomes: z.string().trim().max(4000).optional(),
  providerId: z.string().min(1),
  platform: z.string().trim().min(2).max(80),
  url: z.string().trim().url().or(z.literal("")).optional(),
  language: z.string().trim().min(2).max(5),
  difficulty: z.enum(DIFFICULTIES),
  estimatedHours: z.coerce.number().min(0.25).max(400),
  isFree: z.enum(["yes", "no"]),
  price: z.coerce.number().min(0).max(100000).optional(),
  certificateAvailable: z.enum(["yes", "no"]),
  certificateCost: z.coerce.number().min(0).max(100000).optional(),
  aiLevelId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isInternal: z.enum(["yes", "no"]),
  isTechnical: z.enum(["yes", "no"]),
  isMandatory: z.enum(["yes", "no"]),
  requiresSignOff: z.enum(["yes", "no"]),
  isRecommended: z.enum(["yes", "no"]),
  youtubePlaylistId: z.string().trim().max(120).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  qualityScore: z.coerce.number().min(0).max(1),
  reviewIntervalDays: z.coerce.number().int().min(30).max(1095),
});

const yes = (v: string | undefined) => v === "yes";

export async function saveCourseAction(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const admin = await requirePermission("catalog.manage");
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;

  // Duplicate control: same URL, or a near-identical title from the same provider.
  const potentialDuplicates = await prisma.course.findMany({
    where: {
      ...(d.courseId ? { NOT: { id: d.courseId } } : {}),
      OR: [
        ...(d.url ? [{ url: d.url }] : []),
        { AND: [{ providerId: d.providerId }, { title: { contains: d.title.slice(0, 24) } }] },
      ],
    },
    select: { code: true, title: true },
    take: 3,
  });
  const acknowledged = formData.get("acknowledgeDuplicate") === "yes";
  if (potentialDuplicates.length > 0 && !acknowledged) {
    return {
      warning: `Possible duplicate of: ${potentialDuplicates.map((c) => `${c.title} (${c.code})`).join(", ")}. Save again to confirm.`,
    };
  }

  const codeClash = await prisma.course.findFirst({
    where: { code: d.code, ...(d.courseId ? { NOT: { id: d.courseId } } : {}) },
  });
  if (codeClash) return { error: "errors.validation" };

  const data = {
    code: d.code,
    slug: slugify(d.title) || slugify(d.code),
    title: d.title,
    titleAr: d.titleAr || null,
    titleTr: d.titleTr || null,
    description: d.description,
    descriptionAr: d.descriptionAr || null,
    descriptionTr: d.descriptionTr || null,
    outcomes: JSON.stringify(
      (d.outcomes ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    providerId: d.providerId,
    platform: d.platform,
    url: d.url || null,
    language: d.language,
    difficulty: d.difficulty,
    estimatedHours: d.estimatedHours,
    isFree: yes(d.isFree),
    price: yes(d.isFree) ? null : (d.price ?? null),
    certificateAvailable: yes(d.certificateAvailable),
    certificateCost: yes(d.certificateAvailable) ? (d.certificateCost ?? null) : null,
    aiLevelId: d.aiLevelId || null,
    categoryId: d.categoryId || null,
    status: d.status,
    isInternal: yes(d.isInternal),
    isTechnical: yes(d.isTechnical),
    isMandatory: yes(d.isMandatory),
    requiresSignOff: yes(d.requiresSignOff),
    isRecommended: yes(d.isRecommended),
    youtubePlaylistId: d.youtubePlaylistId || null,
    rating: d.rating ?? null,
    qualityScore: d.qualityScore,
    reviewIntervalDays: d.reviewIntervalDays,
  };

  const before = d.courseId ? await prisma.course.findUnique({ where: { id: d.courseId } }) : null;
  const course = d.courseId
    ? await prisma.course.update({ where: { id: d.courseId }, data })
    : await prisma.course.create({ data: { ...data, createdById: admin.id } });

  // Relations are replaced wholesale — the form always submits the full set.
  const competencies = formData.getAll("competencies").map(String).filter(Boolean);
  await prisma.courseCompetency.deleteMany({ where: { courseId: course.id } });
  for (const competencyId of competencies) {
    const weight = Number(formData.get(`competencyWeight.${competencyId}`) ?? 1) || 1;
    await prisma.courseCompetency.create({ data: { courseId: course.id, competencyId, weight } });
  }

  const departments = formData.getAll("departments").map(String).filter(Boolean);
  await prisma.courseDepartment.deleteMany({ where: { courseId: course.id } });
  for (const departmentId of departments) {
    await prisma.courseDepartment.create({ data: { courseId: course.id, departmentId, weight: 2 } });
  }

  const families = formData
    .getAll("jobFamilies")
    .map(String)
    .filter((f) => (JOB_FAMILIES as readonly string[]).includes(f));
  await prisma.courseJobFamily.deleteMany({ where: { courseId: course.id } });
  for (const jobFamily of families) {
    await prisma.courseJobFamily.create({ data: { courseId: course.id, jobFamily, weight: 3 } });
  }

  const goals = formData
    .getAll("goals")
    .map(String)
    .filter((g) => (LEARNING_GOALS as readonly string[]).includes(g));
  await prisma.courseGoal.deleteMany({ where: { courseId: course.id } });
  for (const goalKey of goals) {
    await prisma.courseGoal.create({ data: { courseId: course.id, goalKey, weight: 2 } });
  }

  const prerequisites = formData.getAll("prerequisites").map(String).filter(Boolean);
  await prisma.coursePrerequisite.deleteMany({ where: { courseId: course.id } });
  for (const prerequisiteId of prerequisites) {
    if (prerequisiteId === course.id) continue;
    await prisma.coursePrerequisite.create({ data: { courseId: course.id, prerequisiteId } });
  }

  const subtitles = formData.getAll("subtitles").map(String).filter(Boolean);
  await prisma.courseLanguage.deleteMany({ where: { courseId: course.id } });
  await prisma.courseLanguage.create({ data: { courseId: course.id, language: d.language, isSubtitle: false } });
  for (const language of subtitles) {
    if (language === d.language) continue;
    await prisma.courseLanguage.create({ data: { courseId: course.id, language, isSubtitle: true } });
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.courseId ? "COURSE_UPDATE" : "COURSE_CREATE",
    entity: "Course",
    entityId: course.id,
    before: before ?? undefined,
    after: data,
  });

  revalidatePath("/admin/courses");
  if (!d.courseId) redirect(`/admin/courses/${course.id}`);
  return { success: "common.saved", courseId: course.id };
}

const structureSchema = z.object({
  courseId: z.string().min(1),
  modules: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(1000).optional(),
      lessons: z.array(
        z.object({
          id: z.string().optional(),
          title: z.string().trim().min(1).max(200),
          type: z.enum(LESSON_TYPES),
          durationMinutes: z.coerce.number().int().min(1).max(600),
          isRequired: z.boolean(),
          url: z.string().trim().max(500).optional(),
          content: z.string().trim().max(40000).optional(),
        }),
      ),
    }),
  ),
});

/** Saves the whole module/lesson tree in one go, preserving existing progress. */
export async function saveCourseStructureAction(input: z.infer<typeof structureSchema>): Promise<CourseState> {
  const admin = await requirePermission("catalog.manage");
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) return { error: "errors.validation" };
  const { courseId, modules } = parsed.data;

  const existingModules = await prisma.courseModule.findMany({
    where: { courseId },
    include: { lessons: true },
  });

  const keptModuleIds = modules.map((m) => m.id).filter(Boolean) as string[];
  const keptLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id).filter(Boolean)) as string[];

  // Deleting a module or lesson also removes its progress rows via cascade,
  // so removals are deliberate and audited.
  await prisma.courseLesson.deleteMany({
    where: { module: { courseId }, id: { notIn: keptLessonIds.length ? keptLessonIds : ["-"] } },
  });
  await prisma.courseModule.deleteMany({
    where: { courseId, id: { notIn: keptModuleIds.length ? keptModuleIds : ["-"] } },
  });

  for (const [mi, m] of modules.entries()) {
    const courseModule = m.id
      ? await prisma.courseModule.update({
          where: { id: m.id },
          data: { title: m.title, description: m.description || null, order: mi },
        })
      : await prisma.courseModule.create({
          data: { courseId, title: m.title, description: m.description || null, order: mi },
        });

    for (const [li, l] of m.lessons.entries()) {
      const data = {
        title: l.title,
        type: l.type,
        durationMinutes: l.durationMinutes,
        isRequired: l.isRequired,
        url: l.url || null,
        content: l.content || null,
        order: li,
        moduleId: courseModule.id,
      };
      if (l.id) await prisma.courseLesson.update({ where: { id: l.id }, data });
      else await prisma.courseLesson.create({ data });
    }
  }

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "COURSE_STRUCTURE_UPDATE",
    entity: "Course",
    entityId: courseId,
    summary: `${modules.length} modules, ${modules.reduce((s, m) => s + m.lessons.length, 0)} lessons`,
    before: existingModules.map((m) => ({ title: m.title, lessons: m.lessons.length })),
    after: modules.map((m) => ({ title: m.title, lessons: m.lessons.length })),
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return { success: "common.saved" };
}

const verifySchema = z.object({
  courseId: z.string().min(1),
  linkWorking: z.enum(["yes", "no"]),
  stillAvailable: z.enum(["yes", "no"]),
  durationUpdated: z.string().optional(),
  priceUpdated: z.string().optional(),
  ratingUpdated: z.string().optional(),
  archive: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function verifyCourseAction(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const admin = await requirePermission("catalog.verify");
  const parsed = verifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };
  const d = parsed.data;
  const archive = d.archive === "on" || d.archive === "yes";

  await prisma.courseVerification.create({
    data: {
      courseId: d.courseId,
      verifiedById: admin.id,
      linkWorking: yes(d.linkWorking),
      stillAvailable: yes(d.stillAvailable),
      durationUpdated: !!d.durationUpdated,
      priceUpdated: !!d.priceUpdated,
      ratingUpdated: !!d.ratingUpdated,
      archived: archive,
      notes: d.notes || null,
    },
  });

  await prisma.course.update({
    where: { id: d.courseId },
    data: {
      lastVerifiedAt: new Date(),
      verifiedById: admin.id,
      linkWorking: yes(d.linkWorking),
      stillAvailable: yes(d.stillAvailable),
      ...(archive ? { status: "ARCHIVED" } : {}),
    },
  });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "COURSE_VERIFY",
    entity: "Course",
    entityId: d.courseId,
    summary: archive ? "archived" : "verified",
  });

  revalidatePath(`/admin/courses/${d.courseId}`);
  return { success: "common.saved" };
}

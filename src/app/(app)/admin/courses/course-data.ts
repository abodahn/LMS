import "server-only";
import { prisma } from "@/lib/db";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";
import type { CourseFormValues } from "./course-form";

export async function loadCourseFormOptions(locale: Locale = "en") {
  const [providers, categories, levels, competencies, departments] = await Promise.all([
    prisma.courseProvider.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.courseCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.skillLevel.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, ...NAME_I18N_SELECT } }),
    prisma.competency.findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } }),
    prisma.department.findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } }),
  ]);
  return {
    providers,
    categories,
    levels: localizeNames(levels, locale),
    competencies: localizeNames(competencies, locale),
    departments: localizeNames(departments, locale),
  };
}

export function emptyCourseValues(providerId: string): CourseFormValues {
  return {
    code: "",
    title: "",
    titleAr: "",
    titleTr: "",
    description: "",
    descriptionAr: "",
    descriptionTr: "",
    outcomes: "",
    providerId,
    platform: "",
    url: "",
    language: "en",
    difficulty: "BEGINNER",
    estimatedHours: 4,
    isFree: true,
    price: null,
    certificateAvailable: false,
    certificateCost: null,
    aiLevelId: "",
    categoryId: "",
    status: "DRAFT",
    isInternal: false,
    isTechnical: false,
    isMandatory: false,
    requiresSignOff: false,
    isRecommended: false,
    youtubePlaylistId: "",
    rating: null,
    qualityScore: 0.7,
    reviewIntervalDays: 180,
    competencies: [],
    departments: [],
    jobFamilies: [],
    goals: [],
    prerequisites: [],
    subtitles: [],
  };
}

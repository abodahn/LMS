import "server-only";
import { prisma } from "@/lib/db";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";

/** Published question counts per competency+difficulty, for the pool editor. */
export async function loadAssessmentBuilderData(locale: Locale = "en") {
  const [competencies, counts] = await Promise.all([
    prisma.competency.findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } }),
    prisma.assessmentQuestion.groupBy({
      by: ["competencyId", "difficulty"],
      where: { status: "PUBLISHED", definitionId: null },
      _count: { _all: true },
    }),
  ]);

  const available: Record<string, number> = {};
  for (const c of counts) available[`${c.competencyId}.${c.difficulty}`] = c._count._all;

  return { competencies: localizeNames(competencies, locale), available };
}

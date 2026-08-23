import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { parseJson } from "@/lib/utils";
import { SectionHeading, StatCard } from "@/components/ui/primitives";
import { PathForm } from "../path-form";
import { PathBuilder } from "../path-builder";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Edit learning path" };

export default async function EditPathPage({ params }: PageProps<"/admin/paths/[pathId]">) {
  await requirePermission("paths.manage");
  const { pathId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [path, levels, courses] = await Promise.all([
    prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        phases: { orderBy: { order: "asc" }, include: { courses: { orderBy: { order: "asc" } } } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.skillLevel
      .findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, ...NAME_I18N_SELECT } })
      .then((rows) => localizeNames(rows, locale)),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, estimatedHours: true },
    }),
  ]);
  if (!path) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/paths"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.paths")}
      </Link>
      <SectionHeading title={path.title} subtitle={path.code} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("common.employees")} value={path._count.enrollments} />
        <StatCard label={t("form.phases")} value={path.phases.length} />
        <StatCard label={t("common.courses")} value={path.phases.reduce((s, p) => s + p.courses.length, 0)} />
      </div>

      <PathForm
        levels={levels}
        values={{
          id: path.id,
          code: path.code,
          title: path.title,
          titleAr: path.titleAr ?? "",
          titleTr: path.titleTr ?? "",
          description: path.description,
          targetHours: path.targetHours,
          targetLevelId: path.targetLevelId ?? "",
          audienceLevel: path.audienceLevel ?? "",
          status: path.status,
          isDefault: path.isDefault,
          isTechnical: path.isTechnical,
          jobFamilies: parseJson<string[]>(path.jobFamilies, []),
        }}
      />

      <PathBuilder
        pathId={path.id}
        targetHours={path.targetHours}
        courses={courses.map((c) => ({ id: c.id, title: c.title, hours: c.estimatedHours }))}
        initial={path.phases.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? "",
          courses: p.courses.map((c) => ({
            courseId: c.courseId,
            isRequired: c.isRequired,
            sequenceLock: c.sequenceLock,
            minScore: c.minScore,
          })),
        }))}
      />
    </div>
  );
}

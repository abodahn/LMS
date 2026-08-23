import { Link as LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { STRIKES_BEFORE_WITHDRAWAL } from "@/lib/links";
import { translate } from "@/lib/i18n";
import { formatDate, parseJson } from "@/lib/utils";
import { Alert, Card, SectionHeading, StatCard, StatusPill } from "@/components/ui/primitives";
import { CourseForm } from "../course-form";
import { loadCourseFormOptions } from "../course-data";
import { StructureBuilder } from "../structure-builder";
import { VerificationForm } from "../verification-form";
import { ScormPanel } from "../scorm-panel";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: PageProps<"/admin/courses/[courseId]">) {
  const admin = await requirePermission("catalog.view");
  const { courseId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [course, options] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        competencies: true,
        departments: true,
        jobFamilies: true,
        goals: true,
        prerequisites: true,
        languages: true,
        modules: {
          include: { lessons: { orderBy: { order: "asc" }, include: { scorm: true } } },
          orderBy: { order: "asc" },
        },
        verifications: { include: { verifiedBy: { select: { fullName: true } } }, orderBy: { verifiedAt: "desc" }, take: 5 },
        feedback: true,
        _count: { select: { enrollments: true } },
      },
    }),
    loadCourseFormOptions(locale),
  ]);
  if (!course) notFound();

  const completed = await prisma.enrollment.count({ where: { courseId, status: "COMPLETED" } });
  const usefulness =
    course.feedback.length === 0
      ? null
      : Math.round((course.feedback.reduce((s, f) => s + f.usefulness, 0) / course.feedback.length) * 10) / 10;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.catalog")}
      </Link>

      <SectionHeading
        title={course.title}
        subtitle={`${course.code} · ${course.platform}`}
        action={<StatusPill status={course.status} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("common.employees")} value={course._count.enrollments} />
        <StatCard label={t("common.completed")} value={completed} />
        <StatCard
          label={t("learning.feedbackUsefulness")}
          value={usefulness == null ? "—" : `${usefulness} / 5`}
        />
        <StatCard
          label={t("form.lastVerified")}
          value={course.lastVerifiedAt ? formatDate(course.lastVerifiedAt, locale) : t("admin.needsReview")}
          tone={course.lastVerifiedAt ? "neutral" : "warning"}
        />
      </div>

      {!course.linkWorking ? (
        <Alert tone="warning" icon={<LinkIcon size={16} aria-hidden />}>
          {course.stillAvailable
            ? translate(dict, "form.linkCheckFailed", {
                count: String(course.linkFailCount),
                limit: String(STRIKES_BEFORE_WITHDRAWAL),
              })
            : t("form.withdrawnFromCatalog")}
          {course.linkNote ? <span className="block opacity-80">{course.linkNote}</span> : null}
        </Alert>
      ) : null}

      <CourseForm
        values={{
          id: course.id,
          code: course.code,
          title: course.title,
          titleAr: course.titleAr ?? "",
          titleTr: course.titleTr ?? "",
          description: course.description,
          descriptionAr: course.descriptionAr ?? "",
          descriptionTr: course.descriptionTr ?? "",
          outcomes: parseJson<string[]>(course.outcomes, []).join("\n"),
          providerId: course.providerId,
          platform: course.platform,
          url: course.url ?? "",
          language: course.language,
          difficulty: course.difficulty,
          estimatedHours: course.estimatedHours,
          isFree: course.isFree,
          price: course.price,
          certificateAvailable: course.certificateAvailable,
          certificateCost: course.certificateCost,
          aiLevelId: course.aiLevelId ?? "",
          categoryId: course.categoryId ?? "",
          status: course.status,
          isInternal: course.isInternal,
          isTechnical: course.isTechnical,
          isMandatory: course.isMandatory,
          isRecommended: course.isRecommended,
          youtubePlaylistId: course.youtubePlaylistId ?? "",
          rating: course.rating,
          qualityScore: course.qualityScore,
          reviewIntervalDays: course.reviewIntervalDays,
          competencies: course.competencies.map((c) => ({ id: c.competencyId, weight: c.weight })),
          departments: course.departments.map((d) => d.departmentId),
          jobFamilies: course.jobFamilies.map((j) => j.jobFamily),
          goals: course.goals.map((g) => g.goalKey),
          prerequisites: course.prerequisites.map((p) => p.prerequisiteId),
          subtitles: course.languages.filter((l) => l.isSubtitle).map((l) => l.language),
        }}
        {...options}
      />

      <ScormPanel
        lessons={course.modules.flatMap((m) =>
          m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            moduleTitle: m.title,
            type: l.type,
            scorm: l.scorm
              ? {
                  id: l.scorm.id,
                  version: l.scorm.version,
                  title: l.scorm.title,
                  entryHref: l.scorm.entryHref,
                  fileCount: l.scorm.fileCount,
                  sizeBytes: l.scorm.sizeBytes,
                  masteryScore: l.scorm.masteryScore,
                }
              : null,
          })),
        )}
      />

      <StructureBuilder
        courseId={course.id}
        initial={course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description ?? "",
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            durationMinutes: l.durationMinutes,
            isRequired: l.isRequired,
            url: l.url ?? "",
            content: l.content ?? "",
          })),
        }))}
      />

      {admin.permissions.includes("catalog.verify") ? <VerificationForm courseId={course.id} /> : null}

      {course.verifications.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.reviewHistory")}</h2>
          <ul className="mt-3 space-y-2">
            {course.verifications.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span>
                  <span className="font-medium text-[var(--brand-ink)]">{v.verifiedBy.fullName}</span>
                  <span className="ms-2 text-[var(--brand-muted)]">{formatDate(v.verifiedAt, locale)}</span>
                </span>
                <span className="text-[var(--brand-muted)]">
                  {v.linkWorking ? t("form.linkOk") : t("form.linkBroken")} ·{" "}
                  {v.stillAvailable ? t("form.available") : t("form.unavailable")}
                  {v.archived ? ` · ${t("form.archivedLabel")}` : ""}
                  {v.notes ? ` · ${v.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

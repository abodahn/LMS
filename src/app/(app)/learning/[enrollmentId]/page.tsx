import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CircleCheck, Circle, Clock, ExternalLink, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { findNextLesson } from "@/lib/learner";
import { formatDate, formatHours, parseJson } from "@/lib/utils";
import { Alert, Badge, Card, Progress, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { ExternalCourseActions } from "./external-actions";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage({ params }: PageProps<"/learning/[enrollmentId]">) {
  const user = await requireUser();
  const { enrollmentId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          provider: true,
          aiLevel: true,
          modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        },
      },
      lessonProgress: true,
      proofs: { orderBy: { uploadedAt: "desc" } },
      feedback: true,
    },
  });
  if (!enrollment || enrollment.userId !== user.id) notFound();

  const { course } = enrollment;
  const outcomes = parseJson<string[]>(
    locale === "ar" ? course.outcomesAr : locale === "tr" ? course.outcomesTr : course.outcomes,
    parseJson<string[]>(course.outcomes, []),
  );
  const internal = course.modules.length > 0;
  const done = new Set(enrollment.lessonProgress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId));
  const next = internal ? findNextLesson(enrollment) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/learning"
          className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
        >
          ← {t("learning.myLearning")}
        </Link>
      </div>

      <SectionHeading
        title={localized(course, "title", locale)}
        subtitle={`${course.provider.name} · ${formatHours(course.estimatedHours)}${course.aiLevel ? ` · ${course.aiLevel.code}` : ""}`}
        action={<StatusPill status={enrollment.status} />}
      />

      <Card className="p-5">
        <p className="text-sm leading-relaxed text-[var(--brand-charcoal)]">
          {localized(course, "description", locale)}
        </p>
        {outcomes.length > 0 ? (
          <div className="mt-4">
            <p className="section-title">{t("assessment.expectedOutcome")}</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[13px] text-[var(--brand-charcoal)]">
                  <CircleCheck size={14} className="mt-0.5 shrink-0 text-[var(--brand-success)]" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {enrollment.status !== "NOT_STARTED" ? (
          <div className="mt-5">
            <Progress
              value={enrollment.progressPercent}
              label={`${Math.round(enrollment.progressPercent)}%`}
              tone={enrollment.status === "COMPLETED" ? "success" : "brand"}
            />
            <p className="mt-1.5 text-[12px] text-[var(--brand-muted)]">
              {Math.round(enrollment.progressPercent)}% · {formatHours(enrollment.timeSpentMinutes / 60)}
            </p>
          </div>
        ) : null}
      </Card>

      {internal ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">{t("learning.modules")}</h2>
            {next ? (
              <LinkButton href={`/learn/${enrollment.id}/${next.lessonId}`} size="md">
                {enrollment.status === "NOT_STARTED" ? t("learning.startCourse") : t("learning.resumeCourse")}
                <ArrowRight size={16} className="rtl:rotate-180" />
              </LinkButton>
            ) : null}
          </div>

          <ol className="space-y-3">
            {course.modules.map((m) => (
              <li key={m.id}>
                <Card>
                  <div className="border-b border-[var(--brand-line)] px-5 py-3.5">
                    <h3 className="text-sm font-semibold text-[var(--brand-ink)]">
                      {localized(m, "title", locale)}
                    </h3>
                    {m.description ? (
                      <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">{m.description}</p>
                    ) : null}
                  </div>
                  <ul className="divide-y divide-[var(--brand-line)]">
                    {m.lessons.map((l) => {
                      const complete = done.has(l.id);
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/learn/${enrollment.id}/${l.id}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--brand-canvas)]"
                          >
                            {complete ? (
                              <CircleCheck size={17} className="shrink-0 text-[var(--brand-success)]" aria-hidden />
                            ) : (
                              <Circle size={17} className="shrink-0 text-[var(--brand-line)]" aria-hidden />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-[var(--brand-ink)]">
                                {localized(l, "title", locale)}
                              </span>
                              <span className="mt-0.5 block text-[12px] text-[var(--brand-muted)]">
                                {l.type === "QUIZ"
                                  ? t("learning.quizTitle")
                                  : l.type === "ASSIGNMENT"
                                    ? t("learning.capstoneTitle")
                                    : l.type}{" "}
                                · {l.durationMinutes} {t("common.minutesShort")}
                                {complete ? ` · ${t("learning.lessonCompleted")}` : ""}
                              </span>
                            </span>
                            {!l.isRequired ? <Badge tone="muted">{t("common.optional")}</Badge> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <ExternalCourseActions
          enrollmentId={enrollment.id}
          courseUrl={course.url ?? "#"}
          providerName={course.provider.name}
          status={enrollment.status}
          proofs={enrollment.proofs.map((p) => ({
            id: p.id,
            fileName: p.fileName,
            status: p.status,
            uploadedAt: formatDate(p.uploadedAt, locale),
            reviewNote: p.reviewNote,
          }))}
          certificateAvailable={course.certificateAvailable}
          certificateCost={course.certificateCost}
        />
      )}

      {enrollment.status === "COMPLETED" ? (
        enrollment.feedback ? (
          <Alert tone="success" icon={<CircleCheck size={16} />}>
            {t("learning.feedbackThanks")}
          </Alert>
        ) : (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("learning.feedbackTitle")}</h2>
            <div className="mt-4">
              <FeedbackForm enrollmentId={enrollment.id} />
            </div>
          </Card>
        )
      ) : null}

      {course.url ? (
        <p className="flex items-center gap-1.5 text-[12px] text-[var(--brand-muted)]">
          <FileText size={13} aria-hidden />
          {t("learning.externalCourseTitle", { provider: course.provider.name })}
          {course.lastVerifiedAt ? (
            <>
              {" · "}
              <Clock size={12} aria-hidden /> {formatDate(course.lastVerifiedAt, locale)}
            </>
          ) : null}
          <a
            href={course.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-medium text-[var(--brand-red)] underline-offset-4 hover:underline"
          >
            {t("common.openExternal")}
            <ExternalLink size={11} aria-hidden />
          </a>
        </p>
      ) : null}
    </div>
  );
}

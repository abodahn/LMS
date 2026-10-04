import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, ExternalLink, FileText, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { parseJson } from "@/lib/utils";
import { Prose } from "@/components/prose";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { LessonSidebar } from "./sidebar";
import { LessonFooter } from "./footer";
import { AiCoachLauncher } from "@/components/coach/coach-launcher";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { StartAssessmentButton } from "@/app/(app)/assessments/start-button";
import { extractYouTubeId, youTubeEmbedUrl } from "@/lib/youtube";
import { ScormPlayer } from "@/components/scorm/scorm-player";
import { scormOrigin, signLaunch } from "@/lib/scorm/origin";
import { scormSnapshot } from "@/lib/scorm/service";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: PageProps<"/learn/[enrollmentId]/[lessonId]">) {
  const user = await requireUser();
  const { enrollmentId, lessonId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" }, include: { scorm: true } },
              assessments: { where: { status: "PUBLISHED" } },
            },
          },
        },
      },
      lessonProgress: true,
    },
  });
  if (!enrollment || enrollment.userId !== user.id) notFound();

  const flat = enrollment.course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ lesson: l, module: m })),
  );
  const index = flat.findIndex((f) => f.lesson.id === lessonId);
  if (index === -1) notFound();

  const { lesson, module } = flat[index];
  const previous = index > 0 ? flat[index - 1].lesson.id : null;
  const next = index < flat.length - 1 ? flat[index + 1].lesson.id : null;
  const progress = enrollment.lessonProgress.find((p) => p.lessonId === lesson.id);
  const completed = progress?.status === "COMPLETED";
  const doneIds = enrollment.lessonProgress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId);

  // The runtime needs the learner's stored CMI before the frame loads.
  const scorm =
    lesson.type === "SCORM" && lesson.scorm
      ? await scormSnapshot(lesson.scorm.id, enrollment.id, { id: user.id, name: user.fullName })
      : null;

  const content = localized(lesson, "content", locale);
  const resources = parseJson<{ label: string; url: string }[]>(lesson.resources, []);
  const moduleAssessment = module.assessments[0] ?? null;

  const capstone =
    lesson.type === "ASSIGNMENT"
      ? await prisma.assignment.findFirst({
          where: { OR: [{ courseId: enrollment.courseId }, { jobFamily: user.jobFamily }] },
          orderBy: { courseId: "desc" },
        })
      : null;

  const coachEnabled = await getSetting<boolean>(SETTING_KEYS.AI_ENABLED, false);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          href={`/learning/${enrollment.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden />
          {localized(enrollment.course, "title", locale)}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <LessonSidebar
          enrollmentId={enrollment.id}
          currentLessonId={lesson.id}
          completedLessonIds={doneIds}
          modules={enrollment.course.modules.map((m) => ({
            id: m.id,
            title: localized(m, "title", locale),
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: localized(l, "title", locale),
              minutes: l.durationMinutes,
              type: l.type,
            })),
          }))}
        />

        <article className="min-w-0">
          <header className="card px-5 py-5 sm:px-6">
            <p className="section-title">{localized(module, "title", locale)}</p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-2xl">
              {localized(lesson, "title", locale)}
            </h1>
            <p className="mt-1.5 text-[13px] text-[var(--brand-muted)]">
              {t("dashboard.lessonOf", { current: index + 1, total: flat.length })} · {lesson.durationMinutes}{" "}
              {t("common.minutesShort")}
            </p>
          </header>

          <div className="card mt-4 px-5 py-5 sm:px-6 sm:py-6">
            {lesson.type === "SCORM" && lesson.scorm && scorm ? (
              <ScormPlayer
                packageId={lesson.scorm.id}
                enrollmentId={enrollment.id}
                launchUrl={`/api/scorm/${lesson.scorm.id}/${lesson.scorm.entryHref
                  .split("/")
                  .map(encodeURIComponent)
                  .join("/")}`}
                initialCmi={scorm.cmi}
                title={localized(lesson, "title", locale)}
                bridge={(() => {
                  const origin = scormOrigin();
                  return origin
                    ? { origin, url: `${origin}/api/scorm/${lesson.scorm.id}/${signLaunch(lesson.scorm.id, user.id)}/~bridge` }
                    : undefined;
                })()}
              />
            ) : null}

            {lesson.type === "YOUTUBE" && lesson.url ? (
              <YouTubeEmbed url={lesson.url} title={lesson.title} />
            ) : null}

            {lesson.type === "VIDEO" && lesson.url ? (
              <video controls className="w-full rounded-[var(--radius-control)]" preload="metadata">
                <source src={lesson.url} />
              </video>
            ) : null}

            {lesson.type === "PDF" && lesson.url ? (
              <object data={lesson.url} type="application/pdf" className="h-[70vh] w-full rounded-[var(--radius-control)]">
                <a href={lesson.url} className="text-[var(--brand-red)] underline">
                  {t("common.download")}
                </a>
              </object>
            ) : null}

            {lesson.type === "IMAGE" && lesson.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lesson.url} alt={lesson.title} className="w-full rounded-[var(--radius-control)]" />
            ) : null}

            {lesson.type === "EXTERNAL" && lesson.url ? (
              <a
                href={lesson.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand-red)] px-5 text-[15px] font-semibold text-white hover:bg-[var(--brand-red-dark)]"
              >
                {t("common.openExternal")}
                <ExternalLink size={16} aria-hidden />
              </a>
            ) : null}

            {content ? <Prose>{content}</Prose> : null}

            {lesson.type === "QUIZ" ? (
              <div className="mt-5">
                {moduleAssessment ? (
                  <Alert tone="info" title={t("learning.quizTitle")} icon={<ClipboardList size={16} />}>
                    <p>{moduleAssessment.description}</p>
                    <div className="mt-3">
                      <StartAssessmentButton
                        definitionId={moduleAssessment.id}
                        label={t("learning.startQuiz")}
                        size="sm"
                      />
                    </div>
                  </Alert>
                ) : (
                  <Alert tone="warning">{t("common.noResults")}</Alert>
                )}
              </div>
            ) : null}

            {lesson.type === "ASSIGNMENT" || lesson.type === "TASK" ? (
              <div className="mt-5">
                <Alert tone="brand" title={t("learning.capstoneTitle")} icon={<Target size={16} />}>
                  <p>{t("learning.capstoneIntro")}</p>
                  {capstone ? (
                    <div className="mt-3">
                      <LinkButton href="/capstone" size="sm">
                        {t("capstone.submitForReview")}
                      </LinkButton>
                    </div>
                  ) : null}
                </Alert>
              </div>
            ) : null}

            {resources.length > 0 ? (
              <div className="mt-6 border-t border-[var(--brand-line)] pt-4">
                <p className="section-title">{t("learning.resources")}</p>
                <ul className="mt-2 space-y-1.5">
                  {resources.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-red)] underline-offset-4 hover:underline"
                      >
                        <FileText size={13} aria-hidden />
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <LessonFooter
            userId={user.id}
            enrollmentId={enrollment.id}
            lessonId={lesson.id}
            completed={completed}
            previousHref={previous ? `/learn/${enrollment.id}/${previous}` : null}
            nextHref={next ? `/learn/${enrollment.id}/${next}` : `/learning/${enrollment.id}`}
            isLast={!next}
          />
        </article>
      </div>

      <AiCoachLauncher enabled={coachEnabled} lessonId={lesson.id} />
    </div>
  );
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = extractYouTubeId(url);
  if (!id) return null;
  const src = youTubeEmbedUrl(id);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-control)] bg-black">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

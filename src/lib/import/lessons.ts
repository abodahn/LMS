import { prisma } from "../db";
import { extractYouTubeId } from "../youtube";
import type { Locale } from "../constants";

/**
 * Gives a video course somewhere to be watched inside the academy.
 *
 * Without a module, `learning/[enrollmentId]` treats a course as external: the
 * learner opens the provider's site, comes back, uploads a screenshot, and an
 * administrator approves it by hand. That is the right flow for Coursera or
 * edX, where the course genuinely lives behind someone else's login — but a
 * YouTube video can simply play here, which means real progress, real time on
 * task, and no approval queue.
 *
 * One lesson per course on purpose. A video's internal chapters are not
 * something the search results expose, so inventing module boundaries would be
 * inventing structure that is not there.
 *
 * Nothing here mints a certificate: `issueCourseCertificate` only issues for
 * `isInternal` courses, and harvested rows are external.
 */

const TITLES: Record<Locale, { module: string; lesson: string }> = {
  en: { module: "Course", lesson: "Watch the course" },
  ar: { module: "الدورة", lesson: "شاهد الدورة" },
  tr: { module: "Kurs", lesson: "Kursu izleyin" },
};

export type VideoLessonResult = "created" | "skipped-not-youtube" | "skipped-has-modules";

/**
 * Adds a single playable lesson to a YouTube-hosted course.
 *
 * Idempotent: a course that already has any module is left alone, so this is
 * safe to run on every import and safe to re-run as a backfill. It never edits
 * a module an administrator built.
 */
export async function ensureVideoLesson(course: {
  id: string;
  url: string | null;
  estimatedHours: number;
}): Promise<VideoLessonResult> {
  if (!course.url || !extractYouTubeId(course.url)) return "skipped-not-youtube";

  const existing = await prisma.courseModule.count({ where: { courseId: course.id } });
  if (existing > 0) return "skipped-has-modules";

  // The real runtime, so a learner sees how long this will take and an
  // administrator can compare it against the time actually recorded.
  const minutes = Math.max(1, Math.round(course.estimatedHours * 60));

  await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: TITLES.en.module,
      titleAr: TITLES.ar.module,
      titleTr: TITLES.tr.module,
      order: 0,
      lessons: {
        create: {
          title: TITLES.en.lesson,
          titleAr: TITLES.ar.lesson,
          titleTr: TITLES.tr.lesson,
          type: "YOUTUBE",
          url: course.url,
          durationMinutes: minutes,
          isRequired: true,
          order: 0,
        },
      },
    },
  });

  return "created";
}

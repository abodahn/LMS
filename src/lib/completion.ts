import { prisma } from "./db";
import { notifyTranslated } from "./notifications";
import { issueCourseCertificate } from "./certificates";
import { awardBadges } from "./badges";

/**
 * What happens when a course is finished, whichever route finished it.
 *
 * This lived inside the lesson-progress action, so only that route issued a
 * certificate: a SCORM package passing, a supervisor signing off a practical and
 * an administrator verifying proof each marked the enrolment complete and then
 * stopped, leaving someone with a completed course and no certificate for it.
 * One function, called from all of them.
 */
export async function onCourseCompleted(userId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { title: true, titleAr: true, titleTr: true } } },
  });
  if (!enrollment || enrollment.status !== "COMPLETED") return;

  await notifyTranslated(userId, {
    category: "LEARNING",
    titleKey: "notify.courseCompleteTitle",
    bodyKey: "notify.courseCompleteBody",
    params: { course: { row: enrollment.course, field: "title" } },
    link: `/learning/${enrollmentId}`,
  });
  await issueCourseCertificate(userId, enrollmentId);
  await awardBadges(userId);
}

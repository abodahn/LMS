import type { Db } from "./client";
import { hasCertificateEvidence, issuerKey, nextCertificateCode } from "../../src/lib/certificate-code";

/**
 * Certificates for courses finished before every course earned one.
 *
 * Until now only internal courses issued a certificate; outside courses with
 * a verified proof, attendance or a sign-off did not. This gives each completed
 * enrolment without a certificate its own, dated the day the course was
 * completed. Once per database (recorded in SystemSetting), quietly — no
 * notification storm on the day it runs.
 */
const MARKER = "certificates.backfilledAllCourses";

export async function backfillCourseCertificates(prisma: Db) {
  if (await prisma.systemSetting.findUnique({ where: { key: MARKER } })) return { issued: 0, skipped: true };

  const completed = await prisma.enrollment.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      userId: true,
      courseId: true,
      completedAt: true,
      course: { select: { title: true, estimatedHours: true, isInternal: true } },
      user: { select: { location: { select: { company: true } } } },
    },
  });
  // Latest VALID certificate per person and course, as issueCourseCertificate
  // judges it: one counts only if it was issued on or after the completion.
  const latest = new Map<string, Date>();
  for (const c of await prisma.certificate.findMany({
    where: { type: "COURSE", status: "VALID" },
    select: { userId: true, courseId: true, issuedAt: true },
  })) {
    const key = `${c.userId}:${c.courseId}`;
    const seen = latest.get(key);
    if (!seen || c.issuedAt > seen) latest.set(key, c.issuedAt);
  }

  let issued = 0;
  for (const e of completed) {
    const covered = latest.get(`${e.userId}:${e.courseId}`);
    if (covered && (!e.completedAt || covered >= e.completedAt)) continue;
    // The same rule as issuing: a self-ticked outside course earns nothing.
    if (!(await hasCertificateEvidence(prisma, e))) continue;
    const at = e.completedAt ?? new Date();
    await prisma.certificate.create({
      data: {
        code: await nextCertificateCode(prisma, at.getFullYear()),
        userId: e.userId,
        type: "COURSE",
        title: e.course.title,
        courseId: e.courseId,
        learningHours: e.course.estimatedHours,
        issuedAt: at,
        issuer: issuerKey(e.user.location?.company),
      },
    });
    latest.set(`${e.userId}:${e.courseId}`, at);
    issued++;
  }

  await prisma.systemSetting.create({
    data: {
      key: MARKER,
      value: JSON.stringify(new Date().toISOString()),
      type: "STRING",
      group: "CERTIFICATES",
      label: "Certificates backfilled for every completed course",
      description: "When completed courses without a certificate were given one. Removing it would run the backfill again on the next boot.",
    },
  });
  return { issued, skipped: false };
}

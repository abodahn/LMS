import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Certificate numbering and issuers, with no other imports: the boot-time
 * backfill (prisma/seed/certificates.ts) uses these before the app is up.
 */

export const ISSUERS = ["TC", "TCAP"] as const;
export type IssuerKey = (typeof ISSUERS)[number];

export function issuerKey(value: string | null | undefined): IssuerKey {
  return value === "TCAP" ? "TCAP" : "TC";
}

/** Next certificate number, TCAI-<year>-NNNNNN. Takes the client so the boot-time backfill can use it too. */
export async function nextCertificateCode(prisma: PrismaClient, year = new Date().getFullYear()) {
  const prefix = `TCAI-${year}-`;
  const last = await prisma.certificate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(6, "0")}`;
}

/**
 * Whether a completion is evidence enough for a certificate signed by the
 * company's executives. An internal course is: its lessons, quizzes and
 * sign-offs are ours. An outside course counts only with something a person
 * vouched for — a verified proof, attendance taken at a classroom session, or
 * a supervisor's sign-off. Ticking "Mark complete" on an imported video is not.
 *
 * Only evidence from this enrolment counts: recurring training re-enrols from
 * `enrolledAt`, and last cycle's proof or attendance must not earn this one's
 * certificate. (A renewal drops the old sign-off itself.)
 */
export async function hasCertificateEvidence(
  prisma: PrismaClient,
  e: { id: string; userId: string; courseId: string; enrolledAt: Date; course: { isInternal: boolean } },
) {
  if (e.course.isInternal) return true;
  const since = { gte: e.enrolledAt };
  const [proof, signOff, attended] = await Promise.all([
    prisma.externalCompletionProof.count({ where: { enrollmentId: e.id, status: "VERIFIED", uploadedAt: since } }),
    prisma.practicalSignOff.count({ where: { enrollmentId: e.id } }),
    prisma.sessionRegistration.count({
      where: { userId: e.userId, status: "ATTENDED", attendanceAt: since, session: { courseId: e.courseId } },
    }),
  ]);
  return proof + signOff + attended > 0;
}

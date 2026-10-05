import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { getCertificationPolicy } from "./settings";
import { branding } from "./branding";
import { audit } from "./audit";
import { notify } from "./notifications";
import { emit } from "./webhooks";
import { drawCertificate } from "./certificate-pdf";
import { certificateSettings, issuerKey, nextCertificateCode as nextCode } from "./certificate-settings";
import { hasCertificateEvidence } from "./certificate-code";

/** TCAI-2026-000001 — sequential within the year, unique across the system. */
async function emitCertificate(id: string) {
  const c = await prisma.certificate.findUnique({
    where: { id },
    include: { user: { select: { id: true, employeeCode: true, email: true } } },
  });
  if (!c) return;
  await emit("certificate.issued", {
    certificateId: c.id,
    code: c.code,
    type: c.type,
    title: c.title,
    courseId: c.courseId,
    issuedAt: c.issuedAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
    employee: c.user,
  });
}

export function nextCertificateCode() {
  return nextCode(prisma);
}

/**
 * Creates a certificate with the next free number. Two completions at the same
 * moment can read the same last number; the second insert then hits the
 * unique code, so it takes the following number and tries again.
 */
async function createNumbered(data: Omit<Prisma.CertificateUncheckedCreateInput, "code">) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.certificate.create({ data: { ...data, code: await nextCode(prisma) } });
    } catch (error) {
      const clash = (error as { code?: string }).code === "P2002";
      if (!clash || attempt >= 4) throw error;
    }
  }
}

/**
 * Issued for every completed course that has evidence behind it (see
 * hasCertificateEvidence): internal courses, and outside courses once a proof
 * is verified, attendance is taken or a supervisor signs off. Issued by the
 * company the person works for — their location's company, T&C or T-CAP.
 */
export async function issueCourseCertificate(userId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true, user: { select: { location: { select: { company: true } } } } },
  });
  if (!enrollment || enrollment.userId !== userId) return null;
  if (enrollment.status !== "COMPLETED") return null;
  if (!(await hasCertificateEvidence(prisma, enrollment))) return null;

  // Reused only when it already covers this completion. Recurring training
  // completes the same course again a year later, and handing back last year's
  // certificate would leave the renewal with no proof of its own — the one date
  // an auditor asks about would be the old one. Earlier certificates are kept:
  // they are the history.
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId: enrollment.courseId, type: "COURSE", status: "VALID" },
    orderBy: { issuedAt: "desc" },
  });
  if (existing && (!enrollment.completedAt || existing.issuedAt >= enrollment.completedAt)) return existing;

  const certificate = await createNumbered({
      userId,
      type: "COURSE",
      title: enrollment.course.title,
      courseId: enrollment.courseId,
      learningHours: enrollment.course.estimatedHours,
      issuer: issuerKey(enrollment.user.location?.company),
  });

  await notify(userId, {
    category: "CERTIFICATE",
    title: "Certificate issued",
    body: `Your certificate for ${enrollment.course.title} is ready to download.`,
    link: "/certificates",
  });
  await audit({ actorId: userId, action: "CERTIFICATE_ISSUE", entity: "Certificate", entityId: certificate.id });
  await emitCertificate(certificate.id);
  return certificate;
}

export type ProgramEligibility = {
  eligible: boolean;
  completionPercent: number;
  requiredCompletion: number;
  finalPassed: boolean;
  finalScore: number | null;
  responsibleAiPassed: boolean;
  capstoneApproved: boolean;
  policy: Awaited<ReturnType<typeof getCertificationPolicy>>;
};

export async function programEligibility(userId: string): Promise<ProgramEligibility> {
  const policy = await getCertificationPolicy();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { not: "DROPPED" } },
    include: { course: true },
  });
  const totalHours = enrollments.reduce((s, e) => s + e.course.estimatedHours, 0);
  const doneHours = enrollments.reduce(
    (s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100,
    0,
  );
  const completionPercent = totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100);

  const finalAttempt = await prisma.assessmentAttempt.findFirst({
    where: { userId, status: "GRADED", definition: { type: "FINAL" } },
    orderBy: { percentage: "desc" },
  });
  const responsibleAttempt = await prisma.assessmentAttempt.findFirst({
    where: { userId, status: "GRADED", passed: true, definition: { type: "RESPONSIBLE_AI" } },
  });
  const capstone = await prisma.assignmentSubmission.findFirst({
    where: { userId, status: "APPROVED", assignment: { type: "CAPSTONE" } },
  });

  const finalPassed = !!finalAttempt && finalAttempt.percentage >= policy.finalPassScore;
  const responsibleAiPassed = !!responsibleAttempt;
  const capstoneApproved = !!capstone;

  return {
    eligible:
      completionPercent >= policy.completionThreshold &&
      finalPassed &&
      (!policy.responsibleAiMandatory || responsibleAiPassed) &&
      (!policy.capstoneRequired || capstoneApproved),
    completionPercent,
    requiredCompletion: policy.completionThreshold,
    finalPassed,
    finalScore: finalAttempt?.percentage ?? null,
    responsibleAiPassed,
    capstoneApproved,
    policy,
  };
}

export async function issueProgramCertificate(userId: string) {
  const eligibility = await programEligibility(userId);
  if (!eligibility.eligible) return null;

  const existing = await prisma.certificate.findFirst({
    where: { userId, type: "PROGRAM", status: "VALID" },
  });
  if (existing) return existing;

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { userId, status: "GRADED", definition: { type: "FINAL" } },
    orderBy: { percentage: "desc" },
  });
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "COMPLETED" },
    include: { course: true },
  });
  const holder = await prisma.user.findUnique({ where: { id: userId }, select: { location: { select: { company: true } } } });

  const certificate = await createNumbered({
      userId,
      type: "PROGRAM",
      title: `${branding.platformName} — AI Capability Programme`,
      levelId: attempt?.levelId ?? null,
      attemptId: attempt?.id ?? null,
      finalScore: eligibility.finalScore,
      learningHours: enrollments.reduce((s, e) => s + e.course.estimatedHours, 0),
      issuer: issuerKey(holder?.location?.company),
  });

  await notify(userId, {
    category: "CERTIFICATE",
    title: "Your programme certificate is ready",
    body: "You have met every requirement. Download your certificate from the Certificates page.",
    link: "/certificates",
  });
  await audit({ actorId: userId, action: "CERTIFICATE_ISSUE", entity: "Certificate", entityId: certificate.id });
  await emitCertificate(certificate.id);
  return certificate;
}

export async function revokeCertificate(certificateId: string, actorId: string, reason: string) {
  const certificate = await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "REVOKED", revokedAt: new Date(), revokedById: actorId, revokeReason: reason },
  });
  await audit({
    actorId,
    action: "CERTIFICATE_REVOKE",
    entity: "Certificate",
    entityId: certificateId,
    summary: reason,
  });
  return certificate;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function renderCertificatePdf(certificateId: string): Promise<Uint8Array> {
  const certificate = await prisma.certificate.findUniqueOrThrow({
    where: { id: certificateId },
    include: { user: true, course: { include: { provider: true } }, level: true },
  });
  const settings = await certificateSettings();
  const key = issuerKey(certificate.issuer);
  const course = certificate.course;

  return drawCertificate({
    issuer: { key, name: settings.issuers[key] },
    recipient: certificate.user.certificateName ?? certificate.user.fullName,
    kind: certificate.type,
    title: certificate.title,
    // An outside course says whose it was: T&C certifies the completion, not the authorship.
    provider: course && !course.isInternal ? (course.provider?.name ?? course.platform ?? null) : null,
    issuedAt: certificate.issuedAt,
    hours: certificate.learningHours,
    level: certificate.level ? `${certificate.level.code} — ${certificate.level.name}` : null,
    finalScore: certificate.finalScore,
    code: certificate.code,
    verifyUrl: `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "")}/verify/${certificate.code}`,
    signatories: settings.signatories[key],
  });
}

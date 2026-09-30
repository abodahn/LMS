import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { prisma } from "./db";
import { getCertificationPolicy } from "./settings";
import { branding } from "./branding";
import { audit } from "./audit";
import { notify } from "./notifications";

/** TCAI-2026-000001 — sequential within the year, unique across the system. */
export async function nextCertificateCode() {
  const year = new Date().getFullYear();
  const prefix = `TCAI-${year}-`;
  const last = await prisma.certificate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(6, "0")}`;
}

/** Issued when an internal course is finished, or an external one is verified. */
export async function issueCourseCertificate(userId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.userId !== userId) return null;
  if (enrollment.status !== "COMPLETED") return null;
  if (!enrollment.course.isInternal) return null;

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

  const certificate = await prisma.certificate.create({
    data: {
      code: await nextCertificateCode(),
      userId,
      type: "COURSE",
      title: enrollment.course.title,
      courseId: enrollment.courseId,
      learningHours: enrollment.course.estimatedHours,
    },
  });

  await notify(userId, {
    category: "CERTIFICATE",
    title: "Certificate issued",
    body: `Your certificate for ${enrollment.course.title} is ready to download.`,
    link: "/certificates",
  });
  await audit({ actorId: userId, action: "CERTIFICATE_ISSUE", entity: "Certificate", entityId: certificate.id });
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

  const certificate = await prisma.certificate.create({
    data: {
      code: await nextCertificateCode(),
      userId,
      type: "PROGRAM",
      title: `${branding.platformName} — AI Capability Programme`,
      levelId: attempt?.levelId ?? null,
      attemptId: attempt?.id ?? null,
      finalScore: eligibility.finalScore,
      learningHours: enrollments.reduce((s, e) => s + e.course.estimatedHours, 0),
    },
  });

  await notify(userId, {
    category: "CERTIFICATE",
    title: "Your programme certificate is ready",
    body: "You have met every requirement. Download your certificate from the Certificates page.",
    link: "/certificates",
  });
  await audit({ actorId: userId, action: "CERTIFICATE_ISSUE", entity: "Certificate", entityId: certificate.id });
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

const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  return rgb(
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255,
  );
};

export async function renderCertificatePdf(certificateId: string): Promise<Uint8Array> {
  const certificate = await prisma.certificate.findUniqueOrThrow({
    where: { id: certificateId },
    include: { user: true, course: true, path: true, level: true },
  });

  const verifyUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/verify/${certificate.code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 240 });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${certificate.title} — ${certificate.user.fullName}`);
  pdf.setAuthor(branding.organizationName);
  pdf.setSubject("Certificate of completion");

  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = hexToRgb(branding.colors.ink);
  const red = hexToRgb(branding.colors.red);
  const muted = hexToRgb(branding.colors.muted);
  const line = hexToRgb(branding.colors.line);

  // Frame
  page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: red });
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 66,
    borderColor: line,
    borderWidth: 1,
  });

  const centre = (text: string, y: number, size: number, font = regular, color = ink) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centre(branding.organizationName.toUpperCase(), height - 78, 11, bold, red);
  centre(branding.platformName, height - 106, 22, bold, ink);
  centre("CERTIFICATE OF COMPLETION", height - 140, 10, regular, muted);

  centre(certificate.user.fullName, height - 196, 32, bold, ink);
  centre("has successfully completed", height - 222, 11, regular, muted);

  const title = certificate.title.length > 68 ? `${certificate.title.slice(0, 65)}…` : certificate.title;
  centre(title, height - 258, 18, bold, ink);

  if (certificate.level) {
    centre(`AI Level achieved: ${certificate.level.code} — ${certificate.level.name}`, height - 284, 11, regular, muted);
  }

  // Detail row
  const details: [string, string][] = [
    ["Completion date", certificate.issuedAt.toISOString().slice(0, 10)],
    ["Learning hours", `${certificate.learningHours}`],
    ["Certificate ID", certificate.code],
  ];
  if (certificate.finalScore != null) {
    details.splice(2, 0, ["Final assessment", `${Math.round(certificate.finalScore)}%`]);
  }

  const colWidth = (width - 200) / details.length;
  details.forEach(([label, value], i) => {
    const x = 100 + i * colWidth;
    page.drawText(label.toUpperCase(), { x, y: 190, size: 7.5, font: bold, color: muted });
    page.drawText(value, { x, y: 172, size: 11, font: regular, color: ink });
  });

  page.drawLine({ start: { x: 100, y: 160 }, end: { x: width - 100, y: 160 }, color: line, thickness: 1 });

  // Signature blocks
  const sigY = 96;
  const blocks = ["Head of Learning & Development", "Human Resources"];
  blocks.forEach((label, i) => {
    const x = 100 + i * 260;
    page.drawLine({ start: { x, y: sigY + 22 }, end: { x: x + 190, y: sigY + 22 }, color: line, thickness: 1 });
    page.drawText(label, { x, y: sigY + 6, size: 8, font: regular, color: muted });
  });

  // QR + verification
  const qrImage = await pdf.embedPng(qrBytes);
  const qrSize = 92;
  page.drawImage(qrImage, { x: width - 100 - qrSize, y: sigY - 8, width: qrSize, height: qrSize });
  page.drawText("Verify at", { x: width - 100 - qrSize, y: sigY - 24, size: 7.5, font: bold, color: muted });
  page.drawText(verifyUrl.replace(/^https?:\/\//, ""), {
    x: width - 100 - qrSize,
    y: sigY - 36,
    size: 7,
    font: regular,
    color: muted,
  });

  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: ink });

  return pdf.save();
}

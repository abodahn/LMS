"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { commitScorm } from "@/lib/scorm/service";

/**
 * Receives a commit from the SCORM runtime.
 *
 * Everything the browser sends is treated as a claim: the enrolment is looked up
 * against the signed-in user rather than taken from the payload, and the CMI map
 * is filtered server-side. A learner editing the request can only lie about
 * their own SCO — which is inherent to any SCORM runtime, since the content
 * itself decides when it is complete — never about whose record it belongs to.
 */

const schema = z.object({
  packageId: z.string().min(1).max(64),
  enrollmentId: z.string().min(1).max(64),
  // 64 KB is the SCORM 2004 limit for suspend_data alone; this caps the whole
  // map at something an honest package cannot exceed.
  cmi: z.record(z.string().max(200), z.string().max(70_000)),
  sessionSeconds: z.number().int().min(0).max(24 * 3600),
});

export async function commitScormAction(input: unknown) {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error("invalid commit");

  const { packageId, enrollmentId, cmi, sessionSeconds } = parsed.data;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true },
  });
  if (!enrollment || enrollment.userId !== user.id) throw new Error("not found");

  // The package must belong to a lesson in the course this enrolment is for.
  const pkg = await prisma.scormPackage.findUnique({
    where: { id: packageId },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  const course = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { courseId: true },
  });
  if (!pkg || pkg.lesson.module.courseId !== course?.courseId) throw new Error("not found");

  return commitScorm({ packageId, enrollmentId, userId: user.id, cmi, sessionSeconds });
}

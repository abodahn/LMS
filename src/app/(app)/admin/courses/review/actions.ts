"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { matchSkills } from "@/lib/course-skill-map";

export type ReviewState = { error?: string; success?: string };

const schema = z.object({
  decision: z.enum(["APPROVE", "FEATURE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
});

/**
 * Decides on discovered courses, one or many at a time.
 *
 * Every decision is a CourseVerification row as well as a status change — the
 * same record a routine re-check leaves — so "who let this in, and when" has
 * one answer whichever route it came through.
 *
 * A rejection needs a reason, and the course is archived rather than deleted:
 * the next harvest finds the same code, sees it already exists, and does not
 * propose it again. Deleting it would put it straight back in the queue.
 */
export async function reviewCoursesAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const reviewer = await requirePermission("catalog.verify");
  const parsed = schema.safeParse({ decision: formData.get("decision"), note: formData.get("note") || undefined });
  const ids = formData.getAll("courseId").map(String).filter(Boolean).slice(0, 200);
  if (!parsed.success || ids.length === 0) return { error: "errors.validation" };
  const { decision, note } = parsed.data;
  if (decision === "REJECT" && !note) return { error: "review.reasonRequired" };

  // Only what is actually waiting. A stale page submitting an id that someone
  // else already decided must not overturn their decision.
  const pending = await prisma.course.findMany({
    where: { id: { in: ids }, status: "PENDING_REVIEW" },
    select: { id: true, title: true, linkWorking: true, stillAvailable: true },
  });
  if (pending.length === 0) return { error: "review.nothingPending" };

  const skills = await prisma.skill.findMany({ select: { id: true, key: true } });
  const skillId = new Map(skills.map((s) => [s.key, s.id]));
  const now = new Date();

  let decided = 0;
  for (const course of pending) {
    const done = await prisma.$transaction(async (tx) => {
      // Conditional on still being pending, inside the transaction: two
      // reviewers deciding at once must not overturn each other, and the
      // earlier check alone cannot promise that.
      const changed = await tx.course.updateMany({
        where: { id: course.id, status: "PENDING_REVIEW" },
        data:
          decision === "REJECT"
            ? { status: "ARCHIVED", reviewNote: note ?? null }
            : {
                status: "PUBLISHED",
                isRecommended: decision === "FEATURE",
                lastVerifiedAt: now,
                verifiedById: reviewer.id,
                reviewNote: note ?? null,
              },
      });
      if (changed.count === 0) return false;
      await tx.courseVerification.create({
        data: {
          courseId: course.id,
          verifiedById: reviewer.id,
          // What the record says about the link is what is actually known
          // about it — approving a course is not the same as checking its URL.
          linkWorking: course.linkWorking,
          stillAvailable: course.stillAvailable,
          archived: decision === "REJECT",
          notes: `${decision}${note ? `: ${note}` : ""}`,
        },
      });
      // Mapped to skills now rather than at the next boot, so an approved
      // course can appear on someone's development plan straight away.
      if (decision !== "REJECT") {
        for (const m of matchSkills(course.title)) {
          const id = skillId.get(m.skill);
          if (!id) continue;
          await tx.courseSkill.upsert({
            where: { courseId_skillId: { courseId: course.id, skillId: id } },
            update: { targetLevel: m.at },
            create: { courseId: course.id, skillId: id, targetLevel: m.at },
          });
        }
      }
      return true;
    });
    if (done) decided++;
  }
  if (decided === 0) return { error: "review.nothingPending" };

  await audit({
    actorId: reviewer.id,
    actorName: reviewer.fullName,
    action: `COURSE_REVIEW_${decision}`,
    entity: "Course",
    entityId: pending.length === 1 ? pending[0].id : `${decided} courses`,
    summary: `${decided} course(s)${note ? ` — ${note}` : ""}`,
  });

  revalidatePath("/admin/courses/review");
  revalidatePath("/admin/courses");
  return { success: `review.decided:${decided}` };
}

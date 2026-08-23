import "server-only";
import { prisma } from "./db";
import { computeStreak } from "./utils";
import { notify } from "./notifications";

/**
 * Light, professional gamification. Badges are recognition only — they never
 * affect recommendations, levels or certification.
 */
export async function awardBadges(userId: string) {
  const [badges, owned, attempts, enrollments, activities, capstone] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    prisma.assessmentAttempt.findMany({
      where: { userId, status: "GRADED" },
      include: { level: true, definition: true, scores: { include: { competency: true } } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.enrollment.findMany({ where: { userId } }),
    prisma.learningActivity.findMany({ where: { userId }, orderBy: { day: "desc" }, take: 60 }),
    prisma.assignmentSubmission.findFirst({
      where: { userId, status: "APPROVED", assignment: { type: "CAPSTONE" } },
    }),
  ]);

  const has = new Set(owned.map((o) => o.badgeId));
  const earn = async (key: string) => {
    const badge = badges.find((b) => b.key === key);
    if (!badge || has.has(badge.id)) return;
    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    has.add(badge.id);
    await notify(userId, {
      category: "LEARNING",
      title: `Badge earned: ${badge.name}`,
      body: badge.description,
      link: "/passport",
    });
  };

  if (attempts.length > 0) await earn("AI_EXPLORER");

  const completedCourses = enrollments.filter((e) => e.status === "COMPLETED").length;
  if (completedCourses >= 1) await earn("FIRST_COURSE");
  if (enrollments.length > 0 && completedCourses === enrollments.length) await earn("PATH_COMPLETE");

  const latest = attempts.find((a) => a.definition.type === "PLACEMENT" || a.definition.type === "FINAL");
  const levelCode = latest?.level?.code;
  if (levelCode === "L2" || levelCode === "L3" || levelCode === "L4") await earn("AI_PRACTITIONER");
  if (levelCode === "L3" || levelCode === "L4") await earn("AI_POWER_USER");
  if (levelCode === "L4") await earn("AI_BUILDER");

  const prompting = latest?.scores.find((s) => s.competency.key === "PROMPTING");
  if (prompting && prompting.percentage >= 80) await earn("PROMPT_PRO");

  if (attempts.some((a) => a.definition.type === "RESPONSIBLE_AI" && a.passed)) await earn("RESPONSIBLE_AI");
  if (capstone) await earn("APPLIED_AI");
  if (computeStreak(activities.map((a) => a.day)) >= 7) await earn("STREAK_7");
}

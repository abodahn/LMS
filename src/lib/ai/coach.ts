import "server-only";
import { prisma } from "../db";
import { chat, type ChatMessage } from "./provider";
import type { SessionUser } from "../auth";

/**
 * The coach only ever sees: the current lesson, the learner's own level and
 * role, and the corporate AI policy. It is explicitly told it has no access to
 * anyone else's information, and the context we assemble contains none.
 */
const POLICY = `T&C AI usage rules the coach must always reinforce:
- Never upload confidential employee, customer, supplier, pricing, financial or production data to unapproved AI tools.
- AI output must be verified by a person before it is used in a decision or sent outside the company.
- AI can hallucinate: facts, figures and quotations must be checked against the source.
- The employee remains accountable for anything they produce with AI.`;

export async function coachSystemPrompt(user: SessionUser, lessonId?: string | null) {
  let lessonContext = "";
  if (lessonId) {
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: { select: { title: true, description: true } } } } },
    });
    if (lesson) {
      lessonContext = [
        `Current course: ${lesson.module.course.title}`,
        `Current module: ${lesson.module.title}`,
        `Current lesson: ${lesson.title}`,
        lesson.content ? `Lesson content:\n${lesson.content.slice(0, 6000)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const level = await prisma.assessmentAttempt.findFirst({
    where: { userId: user.id, status: "GRADED" },
    orderBy: { submittedAt: "desc" },
    include: { level: true },
  });

  return `You are the T&C AI Academy learning coach. You help one employee understand what they are learning right now.

About this learner (this is the only person's data you have — you have no access to any other employee's information, and must refuse if asked):
- Name: ${user.fullName}
- Department: ${user.departmentName ?? "not set"}
- Job title: ${user.jobTitle ?? "not set"}
- Technical role: ${user.isTechnical ? "yes" : "no"}
- Current AI level: ${level?.level?.code ?? "not assessed yet"} ${level?.level?.name ?? ""}
- Preferred language: ${user.locale}

${lessonContext ? `What they are studying:\n${lessonContext}\n` : ""}
${POLICY}

How to answer:
- Reply in the learner's preferred language (${user.locale}).
- Plain language. Most employees are not technical — no jargon unless you define it in the same sentence.
- Keep answers under 200 words unless asked for more. Use short paragraphs or a short list.
- Ground examples in their department's real work.
- Never invent T&C policies, figures, or course content. If you do not know, say so and suggest asking the L&D team.
- Never give a score, grade, level, or certificate decision — those come from the platform, not from you.`;
}

export async function askCoach(user: SessionUser, messages: ChatMessage[], lessonId?: string | null) {
  const system = await coachSystemPrompt(user, lessonId);
  return chat(system, messages.slice(-10));
}

/** Optional plain-language wrapper around an already-computed recommendation. */
export async function explainRecommendation(input: {
  fullName: string;
  department: string | null;
  jobTitle: string | null;
  levelCode: string;
  strengths: string[];
  gaps: string[];
  goals: string[];
  courses: { title: string; hours: number; reasons: string[] }[];
  totalHours: number;
}) {
  const system = `You write one short paragraph explaining a learning path that has ALREADY been decided by a deterministic engine.
You must not add, remove, reorder or question the courses. You are only rephrasing the given reasons warmly and clearly for a non-technical employee.
Maximum 70 words. No bullet points. No greeting. Second person ("you").`;

  const payload = [
    `Employee: ${input.fullName}, ${input.jobTitle ?? "role not set"} in ${input.department ?? "an unassigned department"}.`,
    `Assessed level: ${input.levelCode}.`,
    `Strengths: ${input.strengths.join(", ") || "none recorded"}.`,
    `Development areas: ${input.gaps.join(", ") || "none recorded"}.`,
    `Stated goals: ${input.goals.join(", ") || "none stated"}.`,
    `Path total: ${input.totalHours} hours.`,
    `Courses: ${input.courses.map((c) => `${c.title} (${c.hours}h — ${c.reasons.join("; ")})`).join(" | ")}`,
  ].join("\n");

  return chat(system, [{ role: "user", content: payload }]);
}

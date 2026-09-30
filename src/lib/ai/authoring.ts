import "server-only";
import { z } from "zod";
import { prisma } from "../db";
import { slugify } from "../utils";
import { audit } from "../audit";
import { AiBadOutputError, chat, chatJson } from "./provider";

/** Too little lesson text to write fair questions from. */
export class AiNoMaterialError extends Error {
  constructor() {
    super("Not enough course material to write questions from");
  }
}

/** Characters of lesson text below which a quiz would be guesswork. */
const MIN_QUIZ_MATERIAL = 400;

/**
 * AI drafting for Learning & Development.
 *
 * Everything here produces a draft and nothing here publishes. A generated
 * course is created DRAFT and marked aiGenerated for good; generated questions
 * go into a bank as DRAFT, which the assessment engine never serves. Summaries
 * and translations are returned to the course form, where a person reads them
 * and presses Save — nothing is written behind their back.
 *
 * The model is told what T&C is and that it must not invent T&C policy or
 * figures; it is not trusted to have listened. Output is parsed against a strict
 * shape, and anything that does not fit is refused rather than repaired.
 */

const HOUSE = `You write training material for T&C Garments, a garment manufacturer with factories in Egypt and an office in Istanbul.
Write for adult employees, most of them not technical: short sentences, concrete examples from garment manufacturing, no jargon without an explanation.
Never invent T&C policies, procedures, figures, names or quotations. Where a real procedure would be needed, write "[Insert T&C procedure]" so a reviewer can fill it in.`;

const LANG_NAME: Record<string, string> = { en: "English", ar: "Arabic", tr: "Turkish" };

// ---------------------------------------------------------------------------
// Course builder
// ---------------------------------------------------------------------------

const outlineSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
  outcomes: z.array(z.string().trim().min(3).max(300)).min(1).max(8),
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(200),
        lessons: z
          .array(
            z.object({
              title: z.string().trim().min(2).max(200),
              minutes: z.coerce.number().int().min(2).max(120),
              content: z.string().trim().min(10).max(12000),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(8),
});

export type CourseBrief = {
  topic: string;
  audience: string;
  language: "en" | "ar" | "tr";
  hours: number;
};

/**
 * Drafts a whole course — outline, lesson text, outcomes — as a DRAFT internal
 * course. Returns its id so the caller can send the author straight to review.
 */
export async function draftCourse(brief: CourseBrief, author: { id: string; fullName: string }) {
  const outline = await chatJson(
    `${HOUSE}\nYou design short practical courses.`,
    [
      `Topic: ${brief.topic}`,
      `Audience: ${brief.audience}`,
      `Language to write in: ${LANG_NAME[brief.language]}`,
      `Total length: about ${brief.hours} hour(s).`,
      "Return: { title, description, outcomes: string[], modules: [{ title, lessons: [{ title, minutes, content }] }] }.",
      "Each lesson's content is the lesson text itself in Markdown, not a summary of what it would cover — 150 to 350 words per lesson.",
      `Use at most ${Math.max(2, Math.ceil(brief.hours * 2))} modules and at most ${Math.max(3, Math.ceil(brief.hours * 5))} lessons in total.`,
    ].join("\n"),
    { feature: "COURSE_BUILDER", role: "REASONING", userId: author.id, maxTokens: 8000 },
    (v) => outlineSchema.parse(v),
  );

  const provider = await prisma.courseProvider.findUniqueOrThrow({ where: { key: "TC_ACADEMY" } });
  const code = `AI-${Date.now().toString(36).toUpperCase()}`;
  const minutes = outline.modules.flatMap((m) => m.lessons).reduce((sum, l) => sum + l.minutes, 0);

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        code,
        slug: `${slugify(outline.title).slice(0, 100) || "course"}-${code.toLowerCase()}`,
        title: outline.title,
        description: outline.description,
        outcomes: JSON.stringify(outline.outcomes),
        providerId: provider.id,
        platform: "T&C AI Academy",
        language: brief.language,
        isInternal: true,
        isFree: true,
        status: "DRAFT",
        aiGenerated: true,
        // Quarter hours, as the course form accepts; a draft that fails the
        // form's own validation on its first save is a draft nobody finishes.
        estimatedHours: Math.max(0.25, Math.round(minutes / 15) / 4),
        createdById: author.id,
      },
    });
    for (const [mi, m] of outline.modules.entries()) {
      const mod = await tx.courseModule.create({ data: { courseId: created.id, title: m.title, order: mi } });
      for (const [li, l] of m.lessons.entries()) {
        await tx.courseLesson.create({
          data: {
            moduleId: mod.id,
            title: l.title,
            type: "TEXT",
            content: l.content,
            durationMinutes: l.minutes,
            order: li,
          },
        });
      }
    }
    return created;
  });

  await audit({
    actorId: author.id,
    actorName: author.fullName,
    action: "AI_COURSE_DRAFTED",
    entity: "Course",
    entityId: course.id,
    summary: `${outline.title} (${brief.language}, ${outline.modules.length} modules)`,
  });
  return course.id;
}

// ---------------------------------------------------------------------------
// Quiz generator
// ---------------------------------------------------------------------------

const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().trim().min(5).max(1000),
        difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED"]).catch("MEDIUM"),
        explanation: z.string().trim().max(1000).optional(),
        options: z
          .array(z.object({ text: z.string().trim().min(1).max(400), correct: z.boolean() }))
          .min(3)
          .max(6)
          // Exactly one right answer, or the question cannot be marked.
          .refine((opts) => opts.filter((o) => o.correct).length === 1),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * Writes draft multiple-choice questions from a course's own lesson text.
 *
 * Only from the lesson text: a question about something the course never taught
 * would mark a learner down for the course's gap. Drafts land in a bank of
 * their own per course, status DRAFT, which no assessment draws from until a
 * person publishes them one by one.
 */
export async function draftQuiz(courseId: string, count: number, author: { id: string; fullName: string }) {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      competencies: { orderBy: { weight: "desc" }, take: 1 },
    },
  });

  // Only lessons with text of their own. A video or external lesson has a
  // title and nothing else, and questions written from headings test whether
  // somebody can guess, not whether they learned.
  const material = course.modules
    .flatMap((m) => m.lessons.filter((l) => l.content?.trim()).map((l) => `## ${m.title} — ${l.title}\n${l.content}`))
    .join("\n\n")
    .slice(0, 24_000);
  const source = material.trim() || course.description.trim();
  if (source.length < MIN_QUIZ_MATERIAL) throw new AiNoMaterialError();

  const quiz = await chatJson(
    `${HOUSE}\nYou write fair multiple-choice questions that test understanding, not memory of wording.`,
    [
      `Write ${count} questions in ${LANG_NAME[course.language] ?? "English"} using ONLY the material below.`,
      "Each has 4 options with exactly one correct, plausible wrong answers, and a one-sentence explanation.",
      'Return: { questions: [{ text, difficulty: "EASY"|"MEDIUM"|"ADVANCED", explanation, options: [{ text, correct }] }] }.',
      "",
      `Course: ${course.title}`,
      source,
    ].join("\n"),
    // About 300 tokens a question with its options and explanation.
    { feature: "QUIZ", role: "REASONING", userId: author.id, maxTokens: Math.min(8000, 300 * count + 500) },
    (v) => quizSchema.parse(v),
  );

  // Every question needs a competency; the course's strongest one, or the
  // foundations band when the course has none.
  const competencyId =
    course.competencies[0]?.competencyId ??
    (await prisma.competency.findFirstOrThrow({ where: { key: "FUNDAMENTALS" } })).id;

  const bank = await prisma.questionBank.upsert({
    where: { key: `AI-DRAFTS-${course.code}` },
    update: {},
    create: {
      key: `AI-DRAFTS-${course.code}`,
      name: `AI drafts — ${course.title}`.slice(0, 200),
      description: "Questions drafted by AI. Each must be reviewed and published before any assessment can use it.",
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const q of quiz.questions) {
      await tx.assessmentQuestion.create({
        data: {
          bankId: bank.id,
          competencyId,
          type: "SINGLE",
          difficulty: q.difficulty,
          text: q.text,
          explanation: q.explanation ?? null,
          status: "DRAFT",
          tags: JSON.stringify(["ai-draft", course.code]),
          options: { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.correct, order: i })) },
        },
      });
    }
  });

  await audit({
    actorId: author.id,
    actorName: author.fullName,
    action: "AI_QUIZ_DRAFTED",
    entity: "QuestionBank",
    entityId: bank.id,
    summary: `${quiz.questions.length} draft questions for ${course.title}`,
  });
  return { bankId: bank.id, created: quiz.questions.length };
}

// ---------------------------------------------------------------------------
// Summaries and translation — returned to the form, never saved here
// ---------------------------------------------------------------------------

export async function summarizeCourse(input: { title: string; text: string; language: string }, userId: string) {
  const text = await chat(
    `${HOUSE}\nYou write course descriptions for a catalogue: two or three sentences saying who it is for and what they will be able to do afterwards. No marketing language.`,
    [
      {
        role: "user",
        content: `Write the description in ${LANG_NAME[input.language] ?? "English"}.\n\nCourse: ${input.title}\n\n${input.text.slice(0, 16_000)}`,
      },
    ],
    { feature: "SUMMARY", role: "FAST", userId, maxTokens: 400 },
  );
  // Billed either way; an empty reply has to say so rather than leave the
  // button looking as though it did nothing.
  if (!text.trim()) throw new AiBadOutputError();
  return text.trim();
}

const translationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  outcomes: z.array(z.string().trim().max(300)).max(8).default([]),
});

/**
 * Translates a course's catalogue text into Arabic or Turkish.
 *
 * Returned, not saved: it fills the Arabic or Turkish fields of the form in
 * front of an administrator who can read it. A machine translation of a
 * compliance course published unread is how a safety instruction ends up
 * saying something else.
 */
export async function translateCourse(
  input: { title: string; description: string; outcomes: string[] },
  to: "ar" | "tr",
  userId: string,
) {
  return chatJson(
    `You translate corporate training text for T&C Garments into ${LANG_NAME[to]}. Keep product names, acronyms and numbers unchanged. Use the register of a professional workplace, not a literal word-for-word rendering.`,
    JSON.stringify({ title: input.title, description: input.description, outcomes: input.outcomes }),
    // Arabic and Turkish run longer than the English they come from.
    {
      feature: "TRANSLATE",
      role: "TRANSLATION",
      userId,
      maxTokens: Math.min(4000, Math.ceil(JSON.stringify(input).length / 2) + 300),
    },
    (v) => translationSchema.parse(v),
  );
}

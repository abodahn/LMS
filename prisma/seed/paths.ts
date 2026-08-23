import type { Db } from "./client";

type PathSeed = {
  code: string;
  title: string;
  titleAr?: string;
  titleTr?: string;
  description: string;
  targetHours: number;
  targetLevel: string;
  audienceLevel: string;
  jobFamilies: string[];
  isDefault?: boolean;
  isTechnical?: boolean;
  phases: { title: string; description: string; courses: { code: string; required?: boolean; lock?: boolean }[] }[];
};

const PATHS: PathSeed[] = [
  {
    code: "PATH-FOUNDATION",
    title: "AI Productivity Foundation",
    titleAr: "أساسيات الإنتاجية بالذكاء الاصطناعي",
    titleTr: "AI Verimlilik Temeli",
    description:
      "The default T&C pathway for every non-technical employee. Around 35 hours taking you from no practical AI experience to confidently using AI in your daily work.",
    targetHours: 35,
    targetLevel: "L2",
    audienceLevel: "L0",
    jobFamilies: [],
    isDefault: true,
    phases: [
      {
        title: "Phase 1 — Understand AI",
        description: "What AI actually is, and what it can realistically do for your job.",
        courses: [{ code: "EXT-AI4E", required: true }],
      },
      {
        title: "Phase 2 — Understand Generative AI",
        description: "How generative AI works and where it fits in your week.",
        courses: [{ code: "EXT-GENAI4E", required: true, lock: true }],
      },
      {
        title: "Phase 3 — Master Practical AI",
        description: "Writing prompts that work the first time.",
        courses: [{ code: "EXT-GOOG-PROMPT", required: true }],
      },
      {
        title: "Phase 4 — AI for Your Job",
        description: "T&C-specific application, taught with examples from your department.",
        courses: [{ code: "INT-AI-TC", required: true }],
      },
      {
        title: "Phase 5 — Responsible AI & Capstone",
        description: "The mandatory responsible-use module and your workplace challenge.",
        courses: [{ code: "INT-RAI-TC", required: true }],
      },
    ],
  },
  {
    code: "PATH-PRACTITIONER",
    title: "AI Practitioner Pathway",
    titleTr: "AI Uygulayıcı Yolu",
    description:
      "For employees who already use AI regularly. Deeper prompting, document and data analysis, and a role-specific application module.",
    targetHours: 36,
    targetLevel: "L3",
    audienceLevel: "L2",
    jobFamilies: [],
    phases: [
      {
        title: "Phase 1 — Advanced prompting",
        description: "Prompt patterns, templates and systematic refinement.",
        courses: [{ code: "EXT-VU-PROMPT", required: true }],
      },
      {
        title: "Phase 2 — Workplace application",
        description: "Applying AI to the work your department actually does.",
        courses: [{ code: "INT-ROLE-FIN", required: false }],
      },
      {
        title: "Phase 3 — Responsible AI & Capstone",
        description: "Mandatory responsible-use module and your workplace challenge.",
        courses: [{ code: "INT-RAI-TC", required: true }],
      },
    ],
  },
  {
    code: "PATH-TECHNICAL",
    title: "AI Builder Technical Pathway",
    titleTr: "AI Geliştirici Teknik Yolu",
    description:
      "For IT, data and development colleagues. APIs, RAG, agents, AI security and evaluation, plus the machine learning foundations.",
    targetHours: 38,
    targetLevel: "L4",
    audienceLevel: "L3",
    jobFamilies: ["IT"],
    isTechnical: true,
    phases: [
      {
        title: "Phase 1 — Foundations",
        description: "How generative AI works, from a builder's perspective.",
        courses: [{ code: "EXT-MS-GENAI", required: true }],
      },
      {
        title: "Phase 2 — Machine learning",
        description: "Enough ML to evaluate what you are building.",
        courses: [
          { code: "EXT-KAGGLE-PROG", required: false },
          { code: "EXT-KAGGLE-ML", required: true, lock: true },
        ],
      },
      {
        title: "Phase 3 — Building at T&C",
        description: "Our technical track: APIs, RAG, agents, AI security and evaluation.",
        courses: [{ code: "INT-ROLE-IT", required: true }],
      },
      {
        title: "Phase 4 — Responsible AI & Capstone",
        description: "Mandatory responsible-use module and your technical capstone.",
        courses: [{ code: "INT-RAI-TC", required: true }],
      },
    ],
  },
  {
    code: "PATH-LEADERSHIP",
    title: "AI for Leaders",
    titleTr: "Liderler İçin AI",
    description:
      "For managers and executives. Decision support, scenario analysis, governance and how to lead AI adoption in your function — no programming.",
    targetHours: 30,
    targetLevel: "L3",
    audienceLevel: "L1",
    jobFamilies: ["MANAGEMENT"],
    phases: [
      {
        title: "Phase 1 — Understand AI",
        description: "A clear, non-technical grounding.",
        courses: [{ code: "EXT-AI4E", required: true }],
      },
      {
        title: "Phase 2 — Generative AI in business",
        description: "Where the value and the risk actually sit.",
        courses: [{ code: "EXT-GENAI4E", required: true }],
      },
      {
        title: "Phase 3 — Leading with AI",
        description: "Decision support, delegation and governance.",
        courses: [{ code: "INT-ROLE-MGT", required: true }],
      },
      {
        title: "Phase 4 — Responsible AI & Capstone",
        description: "Mandatory responsible-use module and your governance capstone.",
        courses: [{ code: "INT-RAI-TC", required: true }],
      },
    ],
  },
];

export async function seedPaths(prisma: Db) {
  for (const p of PATHS) {
    const level = await prisma.skillLevel.findUnique({ where: { code: p.targetLevel } });
    const data = {
      title: p.title,
      titleAr: p.titleAr ?? null,
      titleTr: p.titleTr ?? null,
      description: p.description,
      targetHours: p.targetHours,
      targetLevelId: level?.id ?? null,
      audienceLevel: p.audienceLevel,
      jobFamilies: JSON.stringify(p.jobFamilies),
      status: "PUBLISHED",
      isDefault: p.isDefault ?? false,
      isTechnical: p.isTechnical ?? false,
    };
    const path = await prisma.learningPath.upsert({
      where: { code: p.code },
      update: data,
      create: { code: p.code, ...data },
    });

    await prisma.learningPathCourse.deleteMany({ where: { pathId: path.id } });
    await prisma.learningPathPhase.deleteMany({ where: { pathId: path.id } });

    let order = 0;
    for (const [i, phase] of p.phases.entries()) {
      const created = await prisma.learningPathPhase.create({
        data: { pathId: path.id, title: phase.title, description: phase.description, order: i },
      });
      for (const c of phase.courses) {
        const course = await prisma.course.findUnique({ where: { code: c.code } });
        if (!course) continue;
        await prisma.learningPathCourse.create({
          data: {
            pathId: path.id,
            phaseId: created.id,
            courseId: course.id,
            order: order++,
            isRequired: c.required ?? true,
            sequenceLock: c.lock ?? false,
          },
        });
      }
    }
  }
}

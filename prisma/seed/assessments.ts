import type { Db } from "./client";
import { FUNDAMENTALS_QUESTIONS, WORKPLACE_QUESTIONS, type QuestionSeed } from "./questions-core";
import { PLACEMENT_QUESTIONS } from "./questions-placement";
import { questionI18n } from "./questions-i18n";
import {
  DATA_QUESTIONS,
  PROMPTING_QUESTIONS,
  RESPONSIBLE_AI_QUESTIONS,
  TECHNICAL_QUESTIONS,
} from "./questions-more";

const BANKS = [
  { key: "BANK_CORE", name: "Corporate AI question bank", description: "Non-technical questions used by placement, module and final assessments." },
  { key: "BANK_TECHNICAL", name: "Technical AI question bank", description: "Optional technical track for IT, data and development roles." },
  { key: "BANK_PRACTICAL", name: "Practical task bank", description: "Written prompt tasks graded against a rubric." },
  {
    key: "BANK_PLACEMENT",
    name: "Placement question bank",
    description:
      "Deliberately easy, plain-language questions in English, Arabic and Turkish. Used only by the placement assessment, so the final exam can stay demanding.",
  },
];

export const ALL_QUESTIONS: QuestionSeed[] = [
  ...PLACEMENT_QUESTIONS,
  ...FUNDAMENTALS_QUESTIONS,
  ...WORKPLACE_QUESTIONS,
  ...PROMPTING_QUESTIONS,
  ...RESPONSIBLE_AI_QUESTIONS,
  ...DATA_QUESTIONS,
  ...TECHNICAL_QUESTIONS,
];

async function upsertQuestion(prisma: Db, q: QuestionSeed, opts: { definitionKey?: string } = {}) {
  const competency = await prisma.competency.findUniqueOrThrow({ where: { key: q.competency } });
  const bankKey =
    q.bank ?? (q.type === "PROMPT_TASK" ? "BANK_PRACTICAL" : q.competency === "TECHNICAL" ? "BANK_TECHNICAL" : "BANK_CORE");
  const bank = await prisma.questionBank.findUniqueOrThrow({ where: { key: bankKey } });
  const rubric = q.type === "PROMPT_TASK" ? await prisma.rubric.findUnique({ where: { key: "PROMPT_QUALITY" } }) : null;
  const definition = opts.definitionKey
    ? await prisma.assessmentDefinition.findUnique({ where: { key: opts.definitionKey } })
    : null;

  // Seed questions are identified by their text so re-running is idempotent.
  const existing = await prisma.assessmentQuestion.findFirst({ where: { text: q.text } });

  const data = {
    bankId: bank.id,
    competencyId: competency.id,
    definitionId: definition?.id ?? null,
    type: q.type,
    difficulty: q.difficulty,
    text: q.text,
    // Inline first, then the shared translation table (prisma/seed/questions-i18n.ts).
    textAr: q.textAr ?? questionI18n(q.text).textAr,
    textTr: q.textTr ?? questionI18n(q.text).textTr,
    explanation: q.explanation,
    points: q.points ?? 1,
    status: "PUBLISHED",
    tags: JSON.stringify(q.tags ?? []),
    rubricId: rubric?.id ?? null,
    isTechnical: q.isTechnical ?? q.competency === "TECHNICAL",
  };

  const question = existing
    ? await prisma.assessmentQuestion.update({ where: { id: existing.id }, data })
    : await prisma.assessmentQuestion.create({ data });

  await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
  for (const [i, o] of q.options.entries()) {
    await prisma.questionOption.create({
      data: {
        questionId: question.id,
        text: o.text,
        textAr: o.textAr ?? questionI18n(o.text).textAr,
        textTr: o.textTr ?? questionI18n(o.text).textTr,
        isCorrect: o.isCorrect ?? false,
        order: i,
        feedback: o.feedback ?? null,
      },
    });
  }
  return question;
}

type PoolSpec = { competency: string; difficulty?: string; count: number; bank?: string };

async function upsertDefinition(
  prisma: Db,
  def: {
    key: string;
    title: string;
    titleAr?: string;
    titleTr?: string;
    description: string;
    descriptionAr?: string;
    descriptionTr?: string;
    type: string;
    durationMinutes: number;
    questionCount: number;
    passingScore: number;
    maxAttempts: number;
    cooldownMinutes?: number;
    isAdaptive?: boolean;
    courseCode?: string;
    moduleTitle?: string;
  },
  pools: PoolSpec[],
) {
  let courseId: string | null = null;
  let moduleId: string | null = null;
  if (def.courseCode) {
    const course = await prisma.course.findUnique({ where: { code: def.courseCode } });
    courseId = course?.id ?? null;
    if (course && def.moduleTitle) {
      const moduleRow = await prisma.courseModule.findFirst({
        where: { courseId: course.id, title: def.moduleTitle },
      });
      moduleId = moduleRow?.id ?? null;
    }
  }

  const data = {
    title: def.title,
    titleAr: def.titleAr ?? null,
    titleTr: def.titleTr ?? null,
    description: def.description,
    descriptionAr: def.descriptionAr ?? null,
    descriptionTr: def.descriptionTr ?? null,
    type: def.type,
    durationMinutes: def.durationMinutes,
    questionCount: def.questionCount,
    passingScore: def.passingScore,
    maxAttempts: def.maxAttempts,
    cooldownMinutes: def.cooldownMinutes ?? 0,
    randomizeQuestions: true,
    randomizeOptions: true,
    isAdaptive: def.isAdaptive ?? false,
    status: "PUBLISHED",
    courseId,
    moduleId,
  };

  const definition = await prisma.assessmentDefinition.upsert({
    where: { key: def.key },
    update: data,
    create: { key: def.key, ...data },
  });

  await prisma.assessmentPool.deleteMany({ where: { definitionId: definition.id } });
  for (const p of pools) {
    const competency = await prisma.competency.findUnique({ where: { key: p.competency } });
    if (!competency) continue;
    const bank = p.bank ? await prisma.questionBank.findUnique({ where: { key: p.bank } }) : null;
    await prisma.assessmentPool.create({
      data: {
        definitionId: definition.id,
        competencyId: competency.id,
        difficulty: p.difficulty ?? null,
        bankId: bank?.id ?? null,
        count: p.count,
      },
    });
  }
  return definition;
}

export async function seedAssessments(prisma: Db) {
  for (const b of BANKS) {
    await prisma.questionBank.upsert({ where: { key: b.key }, update: b, create: b });
  }

  // --- corporate placement assessment (20 easy questions, ~25 minutes) -----
  await upsertDefinition(
    prisma,
    {
      key: "PLACEMENT_V1",
      title: "AI Placement Assessment",
      titleAr: "تقييم تحديد المستوى في الذكاء الاصطناعي",
      titleTr: "AI Seviye Belirleme Değerlendirmesi",
      description:
        "Twenty short questions about using AI at work, in your own language. Nothing to prepare, no trick questions, no programming, and no pass mark — it only decides where your learning starts. Your answers save automatically.",
      descriptionAr:
        "عشرون سؤالًا قصيرًا عن استخدام الذكاء الاصطناعي في العمل، بلغتك. لا شيء للتحضير، ولا أسئلة تعجيزية، ولا برمجة، ولا درجة نجاح — الهدف الوحيد هو تحديد نقطة بداية تعلّمك. إجاباتك تُحفظ تلقائيًا.",
      descriptionTr:
        "İşte yapay zekâ kullanımı hakkında kendi dilinizde yirmi kısa soru. Hazırlanacak bir şey yok, kurgu soru yok, kodlama yok ve geçme notu yok — yalnızca öğrenmenizin nereden başlayacağını belirler. Cevaplarınız otomatik kaydedilir.",
      type: "PLACEMENT",
      durationMinutes: 25,
      questionCount: 20,
      passingScore: 0,
      maxAttempts: 2,
      cooldownMinutes: 60 * 24 * 30,
      isAdaptive: false,
    },
    // Every question comes from the easy, fully-translated placement bank. The
    // mix follows the competency weights (20/25/25/20/10) so the level it
    // produces is still meaningful, and adaptivity is off — stepping a nervous
    // first-time learner up into harder questions is the opposite of the point.
    [
      { competency: "FUNDAMENTALS", difficulty: "EASY", bank: "BANK_PLACEMENT", count: 4 },
      { competency: "WORKPLACE", difficulty: "EASY", bank: "BANK_PLACEMENT", count: 5 },
      { competency: "PROMPTING", difficulty: "EASY", bank: "BANK_PLACEMENT", count: 5 },
      { competency: "RESPONSIBLE_AI", difficulty: "EASY", bank: "BANK_PLACEMENT", count: 4 },
      { competency: "DATA_AUTOMATION", difficulty: "EASY", bank: "BANK_PLACEMENT", count: 2 },
    ],
  );

  // --- optional technical assessment ---------------------------------------
  await upsertDefinition(
    prisma,
    {
      key: "TECHNICAL_V1",
      title: "Technical AI Assessment",
      titleAr: "التقييم التقني للذكاء الاصطناعي",
      titleTr: "Teknik AI Değerlendirmesi",
      description:
        "Optional additional assessment for IT, data and development roles: APIs, RAG, agents, AI security and evaluation. About 15 minutes.",
      descriptionAr:
        "تقييم إضافي اختياري لأدوار تقنية المعلومات والبيانات والتطوير: الواجهات البرمجية، وRAG، والوكلاء، وأمن الذكاء الاصطناعي، والتقييم. نحو 15 دقيقة.",
      descriptionTr:
        "BT, veri ve geliştirme rolleri için isteğe bağlı ek değerlendirme: API'ler, RAG, ajanlar, yapay zekâ güvenliği ve değerlendirme. Yaklaşık 15 dakika.",
      type: "TECHNICAL",
      durationMinutes: 18,
      questionCount: 12,
      passingScore: 60,
      maxAttempts: 3,
    },
    [
      { competency: "TECHNICAL", difficulty: "EASY", bank: "BANK_TECHNICAL", count: 3 },
      { competency: "TECHNICAL", difficulty: "MEDIUM", bank: "BANK_TECHNICAL", count: 5 },
      { competency: "TECHNICAL", difficulty: "ADVANCED", bank: "BANK_TECHNICAL", count: 4 },
    ],
  );

  // --- mandatory responsible AI assessment ---------------------------------
  await upsertDefinition(
    prisma,
    {
      key: "RESPONSIBLE_AI_V1",
      title: "Responsible AI Assessment",
      titleAr: "تقييم الاستخدام المسؤول",
      titleTr: "Sorumlu AI Değerlendirmesi",
      description:
        "Mandatory. You must pass this before any T&C AI Academy certificate can be issued. It can be retaken after review.",
      descriptionAr:
        "إلزامي. يجب اجتيازه قبل إصدار أي شهادة من أكاديمية T&C للذكاء الاصطناعي. ويمكن إعادته بعد المراجعة.",
      descriptionTr:
        "Zorunludur. T&C AI Academy sertifikası verilmeden önce bunu geçmeniz gerekir. Gözden geçirmenin ardından tekrar alınabilir.",
      type: "RESPONSIBLE_AI",
      durationMinutes: 20,
      questionCount: 12,
      passingScore: 80,
      maxAttempts: 5,
      cooldownMinutes: 60,
      courseCode: "INT-RAI-TC",
      moduleTitle: "4. Assessment",
    },
    [
      { competency: "RESPONSIBLE_AI", difficulty: "EASY", bank: "BANK_CORE", count: 4 },
      { competency: "RESPONSIBLE_AI", difficulty: "MEDIUM", bank: "BANK_CORE", count: 5 },
      { competency: "RESPONSIBLE_AI", difficulty: "ADVANCED", bank: "BANK_CORE", count: 3 },
    ],
  );

  // --- final certification assessment --------------------------------------
  await upsertDefinition(
    prisma,
    {
      key: "FINAL_V1",
      title: "Final AI Capability Assessment",
      titleAr: "التقييم النهائي لقدرات الذكاء الاصطناعي",
      titleTr: "Final AI Yetkinlik Değerlendirmesi",
      description:
        "Your closing assessment. It is scored against the same competencies as your placement assessment, so you can see exactly how far you have come.",
      descriptionAr:
        "تقييمك الختامي. يُقاس على الكفاءات نفسها التي قِيس عليها تقييم تحديد المستوى، لترى بالضبط مقدار ما تقدّمت.",
      descriptionTr:
        "Kapanış değerlendirmeniz. Seviye belirleme değerlendirmenizle aynı yetkinlikler üzerinden puanlanır, böylece ne kadar yol aldığınızı tam olarak görürsünüz.",
      type: "FINAL",
      durationMinutes: 40,
      questionCount: 30,
      passingScore: 70,
      maxAttempts: 3,
      cooldownMinutes: 60 * 24,
    },
    [
      { competency: "FUNDAMENTALS", difficulty: "MEDIUM", bank: "BANK_CORE", count: 3 },
      { competency: "FUNDAMENTALS", difficulty: "ADVANCED", bank: "BANK_CORE", count: 2 },
      { competency: "WORKPLACE", difficulty: "MEDIUM", bank: "BANK_CORE", count: 4 },
      { competency: "WORKPLACE", difficulty: "ADVANCED", bank: "BANK_CORE", count: 3 },
      { competency: "PROMPTING", difficulty: "MEDIUM", bank: "BANK_CORE", count: 4 },
      { competency: "PROMPTING", difficulty: "ADVANCED", bank: "BANK_CORE", count: 3 },
      { competency: "RESPONSIBLE_AI", difficulty: "MEDIUM", bank: "BANK_CORE", count: 4 },
      { competency: "RESPONSIBLE_AI", difficulty: "ADVANCED", bank: "BANK_CORE", count: 3 },
      { competency: "DATA_AUTOMATION", difficulty: "MEDIUM", bank: "BANK_CORE", count: 2 },
      { competency: "DATA_AUTOMATION", difficulty: "ADVANCED", bank: "BANK_CORE", count: 2 },
    ],
  );

  // --- practical prompt task (fixed question, rubric graded) ---------------
  await upsertDefinition(
    prisma,
    {
      key: "PRACTICAL_PROMPT_V1",
      title: "Practical Prompt Assessment",
      titleAr: "تقييم عملي لصياغة الأوامر",
      titleTr: "Uygulamalı Prompt Değerlendirmesi",
      description:
        "One realistic task. Write the prompt you would actually give an AI assistant. Graded against the five-part prompt rubric with written feedback.",
      descriptionAr:
        "مهمة واقعية واحدة. اكتب الأمر الذي ستعطيه فعليًا لمساعد ذكاء اصطناعي. يُقيَّم وفق معيار الأمر المكوّن من خمسة أجزاء مع ملاحظات مكتوبة.",
      descriptionTr:
        "Tek bir gerçekçi görev. Bir yapay zekâ asistanına gerçekten vereceğiniz promptu yazın. Beş parçalı prompt ölçütüne göre, yazılı geri bildirimle değerlendirilir.",
      type: "MODULE",
      durationMinutes: 20,
      questionCount: 1,
      passingScore: 60,
      maxAttempts: 3,
    },
    [],
  );

  // --- questions -----------------------------------------------------------
  for (const q of ALL_QUESTIONS) {
    await upsertQuestion(prisma, q, q.type === "PROMPT_TASK" ? { definitionKey: "PRACTICAL_PROMPT_V1" } : {});
  }

  // --- internal course module quizzes --------------------------------------
  const courseQuizzes: {
    key: string;
    courseCode: string;
    moduleTitle: string;
    title: string;
    pools: PoolSpec[];
  }[] = [
    {
      key: "COURSE_AI_TC_SAFETY",
      courseCode: "INT-AI-TC",
      moduleTitle: "2. How to Use AI Safely",
      title: "AI at T&C — safety check",
      pools: [
        { competency: "RESPONSIBLE_AI", difficulty: "EASY", bank: "BANK_CORE", count: 4 },
        { competency: "RESPONSIBLE_AI", difficulty: "MEDIUM", bank: "BANK_CORE", count: 2 },
      ],
    },
    {
      key: "COURSE_AI_TC_FINAL",
      courseCode: "INT-AI-TC",
      moduleTitle: "8. Final Assessment",
      title: "AI at T&C — course assessment",
      pools: [
        { competency: "FUNDAMENTALS", difficulty: "EASY", bank: "BANK_CORE", count: 3 },
        { competency: "WORKPLACE", difficulty: "EASY", bank: "BANK_CORE", count: 3 },
        { competency: "PROMPTING", difficulty: "EASY", bank: "BANK_CORE", count: 3 },
        { competency: "RESPONSIBLE_AI", difficulty: "MEDIUM", bank: "BANK_CORE", count: 3 },
      ],
    },
    ...[
      { code: "INT-ROLE-FIN", label: "AI for Finance" },
      { code: "INT-ROLE-HR", label: "AI for HR" },
      { code: "INT-ROLE-PRD", label: "AI for Production" },
      { code: "INT-ROLE-QLT", label: "AI for Quality" },
      { code: "INT-ROLE-SCM", label: "AI for Supply Chain" },
      { code: "INT-ROLE-COM", label: "AI for Sales & Marketing" },
      { code: "INT-ROLE-MGT", label: "AI for Management" },
    ].map((r) => ({
      key: `COURSE_${r.code.replace(/-/g, "_")}`,
      courseCode: r.code,
      moduleTitle: "5. Module assessment",
      title: `${r.label} — assessment`,
      pools: [
        { competency: "WORKPLACE", difficulty: "MEDIUM", bank: "BANK_CORE", count: 4 },
        { competency: "PROMPTING", difficulty: "MEDIUM", bank: "BANK_CORE", count: 3 },
        { competency: "DATA_AUTOMATION", difficulty: "MEDIUM", bank: "BANK_CORE", count: 2 },
        { competency: "RESPONSIBLE_AI", difficulty: "MEDIUM", bank: "BANK_CORE", count: 1 },
      ] as PoolSpec[],
    })),
    {
      key: "COURSE_INT_ROLE_IT",
      courseCode: "INT-ROLE-IT",
      moduleTitle: "5. Module assessment",
      title: "AI for IT — assessment",
      pools: [
        { competency: "TECHNICAL", difficulty: "MEDIUM", bank: "BANK_TECHNICAL", count: 5 },
        { competency: "TECHNICAL", difficulty: "ADVANCED", bank: "BANK_TECHNICAL", count: 3 },
        { competency: "RESPONSIBLE_AI", difficulty: "ADVANCED", bank: "BANK_CORE", count: 2 },
      ],
    },
  ];

  for (const q of courseQuizzes) {
    await upsertDefinition(
      prisma,
      {
        key: q.key,
        title: q.title,
        description: "A short scenario-based check on this course.",
        descriptionAr: "فحص قصير قائم على سيناريوهات لهذا المقرر.",
        descriptionTr: "Bu kurs için kısa, senaryo temelli bir kontrol.",
        type: "MODULE",
        durationMinutes: 15,
        questionCount: q.pools.reduce((s, p) => s + p.count, 0),
        passingScore: 70,
        maxAttempts: 3,
        courseCode: q.courseCode,
        moduleTitle: q.moduleTitle,
      },
      q.pools,
    );
  }
}

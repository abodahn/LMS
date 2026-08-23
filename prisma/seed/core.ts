import type { Db } from "./client";

export async function seedCore(prisma: Db) {
  // --- roles & permissions -------------------------------------------------
  const { PERMISSIONS, ROLE_PERMISSIONS, ROLE_META } = await import("../../src/lib/rbac");

  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description, group: key.split(".")[0] },
      create: { key, description, group: key.split(".")[0] },
    });
  }

  for (const [roleKey, meta] of Object.entries(ROLE_META)) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: meta.name, description: meta.description, rank: meta.rank },
      create: { key: roleKey, name: meta.name, description: meta.description, rank: meta.rank },
    });
    const perms = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS];
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const p of perms) {
      const permission = await prisma.permission.findUnique({ where: { key: p } });
      if (permission) {
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
      }
    }
  }

  // --- competencies --------------------------------------------------------
  const competencies = [
    {
      key: "FUNDAMENTALS",
      name: "AI Fundamentals",
      nameAr: "أساسيات الذكاء الاصطناعي",
      nameTr: "AI Temelleri",
      description: "What AI is and is not, generative AI, large language models, limitations and hallucinations.",
      weight: 0.2,
      order: 1,
    },
    {
      key: "WORKPLACE",
      name: "Practical Workplace AI",
      nameAr: "الاستخدام العملي في العمل",
      nameTr: "İş Yerinde Pratik AI",
      description: "Choosing the right AI workflow for a real task at work.",
      weight: 0.25,
      order: 2,
    },
    {
      key: "PROMPTING",
      name: "Prompting",
      nameAr: "صياغة الأوامر",
      nameTr: "Prompt Yazımı",
      description: "Context, objective, constraints, output shape, iteration and verification.",
      weight: 0.25,
      order: 3,
    },
    {
      key: "RESPONSIBLE_AI",
      name: "Responsible AI & Information Security",
      nameAr: "الاستخدام المسؤول وأمن المعلومات",
      nameTr: "Sorumlu AI ve Bilgi Güvenliği",
      description: "Confidential data, verification, bias, accountability and approval.",
      weight: 0.2,
      order: 4,
    },
    {
      key: "DATA_AUTOMATION",
      name: "Data & Automation Awareness",
      nameAr: "الوعي بالبيانات والأتمتة",
      nameTr: "Veri ve Otomasyon Farkındalığı",
      description: "Structured vs unstructured data, repeatable processes, where automation helps.",
      weight: 0.1,
      order: 5,
    },
    {
      key: "TECHNICAL",
      name: "Technical AI",
      nameAr: "الذكاء الاصطناعي التقني",
      nameTr: "Teknik AI",
      description: "APIs, Python, embeddings, RAG, agents and model evaluation.",
      weight: 1,
      order: 6,
      isCore: false,
    },
  ];

  for (const c of competencies) {
    await prisma.competency.upsert({ where: { key: c.key }, update: c, create: c });
  }

  // --- skill levels --------------------------------------------------------
  const levels = [
    {
      code: "L0",
      name: "AI Explorer",
      nameAr: "مستكشف الذكاء الاصطناعي",
      nameTr: "AI Kâşifi",
      description: "Little practical knowledge yet. Start with what AI is, what it can do, and how to use it safely.",
      minScore: 0,
      maxScore: 24.99,
      order: 0,
      focusAreas: JSON.stringify(["AI basics", "Generative AI basics", "Safe AI usage", "Simple prompting"]),
    },
    {
      code: "L1",
      name: "AI Beginner",
      nameAr: "مبتدئ",
      nameTr: "AI Başlangıç",
      description: "Some exposure to AI tools. Build everyday productivity habits and structured prompting.",
      minScore: 25,
      maxScore: 44.99,
      order: 1,
      focusAreas: JSON.stringify(["Productivity", "Structured prompting", "Workplace applications"]),
    },
    {
      code: "L2",
      name: "AI Practitioner",
      nameAr: "ممارس",
      nameTr: "AI Uygulayıcı",
      description: "A regular AI user. Move into advanced prompting, document and data analysis, repeatable workflows.",
      minScore: 45,
      maxScore: 64.99,
      order: 2,
      focusAreas: JSON.stringify(["Advanced prompting", "Document analysis", "Data analysis", "Repeatable workflows"]),
    },
    {
      code: "L3",
      name: "AI Power User",
      nameAr: "مستخدم متقدم",
      nameTr: "AI İleri Kullanıcı",
      description: "A strong business AI user. Design workflows, automate, and lead AI use cases in your department.",
      minScore: 65,
      maxScore: 84.99,
      order: 3,
      focusAreas: JSON.stringify(["Workflow design", "Automation", "Advanced data use", "AI agents", "Department use cases"]),
    },
    {
      code: "L4",
      name: "AI Builder",
      nameAr: "مطوّر حلول",
      nameTr: "AI Geliştirici",
      description: "Technical capability. Build with APIs, Python, RAG, agents and evaluate models.",
      minScore: 85,
      maxScore: 100,
      order: 4,
      focusAreas: JSON.stringify(["APIs", "Python", "LLM applications", "Agents", "RAG", "Machine learning", "AI architecture"]),
    },
  ];

  for (const l of levels) {
    await prisma.skillLevel.upsert({ where: { code: l.code }, update: l, create: l });
  }

  // --- recommendation weights ---------------------------------------------
  const { DEFAULT_RECOMMENDATION_WEIGHTS } = await import("../../src/lib/constants");
  const weightLabels: Record<string, string> = {
    AI_LEVEL_MATCH: "AI level match",
    ROLE_MATCH: "Role match",
    COMPETENCY_GAP: "Competency gap",
    LEARNING_GOAL: "Learning goal",
    COURSE_QUALITY: "Course quality",
    TIME_FIT: "Time fit",
    LANGUAGE_FIT: "Language fit",
  };
  const weightHelp: Record<string, string> = {
    AI_LEVEL_MATCH: "How close the course level is to the employee's assessed level.",
    ROLE_MATCH: "How well the course targets the employee's department and job family.",
    COMPETENCY_GAP: "How much the course addresses the competencies the employee scored lowest in.",
    LEARNING_GOAL: "Overlap with the goals the employee selected after their assessment.",
    COURSE_QUALITY: "Provider trust, curated quality score, public rating and learner feedback.",
    TIME_FIT: "Whether the course fits the employee's stated weekly learning time.",
    LANGUAGE_FIT: "Availability in the employee's preferred language, including subtitles.",
  };

  for (const [key, weight] of Object.entries(DEFAULT_RECOMMENDATION_WEIGHTS)) {
    await prisma.recommendationWeight.upsert({
      where: { key },
      update: { label: weightLabels[key], description: weightHelp[key] },
      create: { key, label: weightLabels[key], weight, description: weightHelp[key] },
    });
  }

  // --- system settings -----------------------------------------------------
  const settings: { key: string; value: string; type: string; group: string; label: string; description?: string }[] = [
    { key: "learning.targetHours", value: "35", type: "NUMBER", group: "LEARNING", label: "Target learning hours", description: "Hours the recommendation engine aims for in a personalised path." },
    { key: "learning.minHours", value: "30", type: "NUMBER", group: "LEARNING", label: "Minimum learning hours" },
    { key: "learning.maxHours", value: "40", type: "NUMBER", group: "LEARNING", label: "Maximum learning hours" },
    { key: "certification.completionThreshold", value: "90", type: "NUMBER", group: "CERTIFICATION", label: "Required path completion %", description: "How much of the learning path must be finished before certification." },
    { key: "certification.finalPassScore", value: "70", type: "NUMBER", group: "CERTIFICATION", label: "Final assessment pass score %" },
    { key: "certification.responsibleAiMandatory", value: "true", type: "BOOLEAN", group: "CERTIFICATION", label: "Responsible AI must be passed" },
    { key: "certification.capstoneRequired", value: "true", type: "BOOLEAN", group: "CERTIFICATION", label: "Workplace capstone required" },
    { key: "catalog.reviewIntervalDays", value: "180", type: "NUMBER", group: "CATALOG", label: "Course review interval (days)" },
    {
      key: "readiness.weights",
      value: JSON.stringify({ assessment: 30, training: 20, improvement: 25, responsibleAi: 15, application: 10 }),
      type: "JSON",
      group: "ANALYTICS",
      label: "AI Readiness Index weights",
      description: "Shown to leadership alongside the index so the number is never unexplained.",
    },
    { key: "security.sessionHours", value: "12", type: "NUMBER", group: "SECURITY", label: "Session length (hours)" },
    { key: "security.maxFailedLogins", value: "5", type: "NUMBER", group: "SECURITY", label: "Failed logins before lockout" },
    { key: "security.lockoutMinutes", value: "15", type: "NUMBER", group: "SECURITY", label: "Lockout duration (minutes)" },
    { key: "ai.enabled", value: "false", type: "BOOLEAN", group: "AI", label: "Enable AI features", description: "Requires an API key in the server environment." },
    { key: "ai.provider", value: "anthropic", type: "STRING", group: "AI", label: "AI provider" },
    { key: "ai.model", value: "claude-sonnet-5", type: "STRING", group: "AI", label: "AI model" },
    { key: "general.defaultLocale", value: "en", type: "STRING", group: "GENERAL", label: "Default language" },
    { key: "branding.orgName", value: "T&C Garments", type: "STRING", group: "BRANDING", label: "Organisation name" },
    { key: "branding.platformName", value: "T&C AI Academy", type: "STRING", group: "BRANDING", label: "Platform name" },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { label: s.label, group: s.group, type: s.type, description: s.description },
      create: s,
    });
  }

  // --- integrations (disabled until configured) ---------------------------
  await prisma.integration.upsert({
    where: { key: "ai" },
    update: {},
    create: {
      key: "ai",
      name: "AI provider",
      type: "AI_PROVIDER",
      enabled: false,
      config: JSON.stringify({ provider: "anthropic", model: "claude-sonnet-5", maxTokens: 1024 }),
    },
  });
  await prisma.integration.upsert({
    where: { key: "smtp" },
    update: {},
    create: {
      key: "smtp",
      name: "SMTP email",
      type: "SMTP",
      enabled: false,
      config: JSON.stringify({ host: "", port: 587, user: "", from: "no-reply@tcgarments.com" }),
    },
  });

  // --- badges --------------------------------------------------------------
  const badges = [
    { key: "AI_EXPLORER", name: "AI Explorer", description: "Completed your first AI placement assessment.", icon: "compass", tier: "BRONZE", criteria: JSON.stringify({ event: "ASSESSMENT_COMPLETED" }) },
    { key: "FIRST_COURSE", name: "First Course", description: "Finished your first course in the academy.", icon: "book", tier: "BRONZE", criteria: JSON.stringify({ event: "COURSE_COMPLETED", count: 1 }) },
    { key: "PROMPT_PRO", name: "Prompt Pro", description: "Scored 80% or more in Prompting.", icon: "message-square", tier: "SILVER", criteria: JSON.stringify({ competency: "PROMPTING", min: 80 }) },
    { key: "RESPONSIBLE_AI", name: "Responsible AI", description: "Passed the mandatory Responsible AI assessment.", icon: "shield-check", tier: "SILVER", criteria: JSON.stringify({ assessment: "RESPONSIBLE_AI" }) },
    { key: "AI_PRACTITIONER", name: "AI Practitioner", description: "Reached level L2.", icon: "award", tier: "SILVER", criteria: JSON.stringify({ level: "L2" }) },
    { key: "AI_POWER_USER", name: "AI Power User", description: "Reached level L3.", icon: "zap", tier: "GOLD", criteria: JSON.stringify({ level: "L3" }) },
    { key: "AI_BUILDER", name: "AI Builder", description: "Reached level L4.", icon: "cpu", tier: "GOLD", criteria: JSON.stringify({ level: "L4" }) },
    { key: "PATH_COMPLETE", name: "Path Complete", description: "Completed a full learning path.", icon: "flag", tier: "GOLD", criteria: JSON.stringify({ event: "PATH_COMPLETED" }) },
    { key: "APPLIED_AI", name: "Applied AI", description: "Had a workplace capstone approved.", icon: "target", tier: "GOLD", criteria: JSON.stringify({ event: "CAPSTONE_APPROVED" }) },
    { key: "STREAK_7", name: "Seven Day Streak", description: "Learned on seven consecutive days.", icon: "flame", tier: "BRONZE", criteria: JSON.stringify({ streak: 7 }) },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { key: b.key }, update: b, create: b });
  }

  // --- reminder rules ------------------------------------------------------
  const reminders = [
    {
      key: "INACTIVE_7",
      name: "Inactive for a week",
      triggerType: "INACTIVITY",
      thresholdDays: 7,
      template: "You haven't continued your AI learning this week. {course} is waiting for you.",
      channel: "IN_APP",
      description: "Sent once, not repeated, so employees are never spammed.",
    },
    {
      key: "MODULE_INCOMPLETE",
      name: "Module left unfinished",
      triggerType: "MODULE_INCOMPLETE",
      thresholdDays: 3,
      template: "You have {minutes} minutes remaining in {module}.",
      channel: "IN_APP",
    },
    {
      key: "DUE_SOON",
      name: "Learning due soon",
      triggerType: "DUE_SOON",
      thresholdDays: 7,
      template: "{course} is due on {date}.",
      channel: "EMAIL",
    },
    {
      key: "OVERDUE",
      name: "Learning overdue",
      triggerType: "OVERDUE",
      thresholdDays: 1,
      template: "{course} is now overdue. Let your manager know if you need more time.",
      channel: "IN_APP",
    },
    {
      key: "FINAL_READY",
      name: "Final assessment available",
      triggerType: "ASSESSMENT_READY",
      thresholdDays: 0,
      template: "Your final assessment is now available.",
      channel: "IN_APP",
    },
  ];
  for (const r of reminders) {
    await prisma.reminderRule.upsert({ where: { key: r.key }, update: r, create: r });
  }

  // --- rubrics -------------------------------------------------------------
  await prisma.rubric.upsert({
    where: { key: "PROMPT_QUALITY" },
    update: {},
    create: {
      key: "PROMPT_QUALITY",
      name: "Prompt quality rubric",
      criteria: JSON.stringify([
        { key: "context", label: "Context", weight: 20, description: "Explains the situation, the data and who the output is for." },
        { key: "objective", label: "Clear objective", weight: 20, description: "States precisely what the AI must produce." },
        { key: "constraints", label: "Data & constraints", weight: 20, description: "Gives limits, criteria, tone or formatting rules." },
        { key: "output", label: "Expected output", weight: 20, description: "Describes the structure of the answer wanted." },
        { key: "verification", label: "Verification / accuracy", weight: 20, description: "Asks for sources, assumptions or a checking step." },
      ]),
    },
  });

  await prisma.rubric.upsert({
    where: { key: "CAPSTONE" },
    update: {},
    create: {
      key: "CAPSTONE",
      name: "Workplace capstone rubric",
      criteria: JSON.stringify([
        { key: "problem", label: "Business problem", weight: 15, description: "A real, specific problem from the employee's own work." },
        { key: "process", label: "Current process", weight: 10, description: "How the task is done today, with the time it takes." },
        { key: "aiFit", label: "Where AI helps", weight: 20, description: "A realistic, well-scoped role for AI." },
        { key: "workflow", label: "Prompt / workflow", weight: 20, description: "A usable prompt or step-by-step workflow." },
        { key: "risks", label: "Risks & data sensitivity", weight: 15, description: "Names the data risk and how it is handled." },
        { key: "validation", label: "Validation method", weight: 10, description: "How the output will be checked before use." },
        { key: "benefit", label: "Estimated benefit", weight: 10, description: "A grounded estimate, not an invented figure." },
      ]),
    },
  });
}

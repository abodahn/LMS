import bcrypt from "bcryptjs";
import type { Db } from "./client";

/**
 * Demo dataset. Only runs when SEED_DEMO is not "false" — production installs
 * run `npm run db:seed:core`, which never creates these accounts.
 */

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Academy2026!";

/** Deterministic PRNG so re-seeding produces the same demo story. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Person = {
  code: string;
  name: string;
  email: string;
  dept: string;
  title: string;
  roles: string[];
  managerCode?: string;
  locale?: string;
  /** Target placement percentage, drives generated answers and level. */
  baseline: number;
  /** Optional final assessment percentage, for before/after analytics. */
  final?: number;
  aiExperience: string;
  weeklyHours: number;
  goals: string[];
  progress?: "none" | "started" | "half" | "most" | "complete";
  location?: string;
  years?: number;
};

const PEOPLE: Person[] = [
  // --- leadership & administration -----------------------------------------
  {
    code: "TC-0001",
    name: "Ahmed Elgohary",
    email: "ahmed.elgohary@tcgarments.com",
    dept: "MGT",
    title: "Chief Operating Officer",
    roles: ["SUPER_ADMIN", "MANAGER"],
    baseline: 72,
    final: 88,
    aiExperience: "ADVANCED",
    weeklyHours: 3,
    goals: ["DECISION_MAKING", "RESEARCH", "REPORTS", "AUTOMATION"],
    progress: "most",
    location: "Head Office",
    years: 14,
  },
  {
    code: "TC-0002",
    name: "Yasmin Farouk",
    email: "yasmin.farouk@tcgarments.com",
    dept: "HR",
    title: "Learning & Development Specialist",
    roles: ["ADMIN"],
    baseline: 64,
    final: 84,
    aiExperience: "REGULAR",
    weeklyHours: 5,
    goals: ["WRITING", "REPORTS", "RESEARCH"],
    progress: "complete",
    location: "Head Office",
    years: 7,
  },
  {
    code: "TC-0003",
    name: "Mahmoud Sabry",
    email: "mahmoud.sabry@tcgarments.com",
    dept: "MGT",
    title: "Chief Executive Officer",
    roles: ["MANAGER"],
    baseline: 45,
    aiExperience: "OCCASIONAL",
    weeklyHours: 1,
    goals: ["DECISION_MAKING", "RESEARCH"],
    progress: "started",
    location: "Head Office",
    years: 22,
  },

  // --- finance --------------------------------------------------------------
  {
    code: "TC-1001",
    name: "Hala Mansour",
    email: "hala.mansour@tcgarments.com",
    dept: "FIN",
    title: "Finance Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 58,
    final: 79,
    aiExperience: "REGULAR",
    weeklyHours: 3,
    goals: ["EXCEL", "REPORTS", "DATA_ANALYSIS"],
    progress: "complete",
    location: "Head Office",
    years: 11,
  },
  {
    code: "TC-1002",
    name: "Karim Adel",
    email: "karim.adel@tcgarments.com",
    dept: "FIN",
    title: "Senior Accountant",
    roles: ["EMPLOYEE"],
    managerCode: "TC-1001",
    baseline: 55,
    aiExperience: "OCCASIONAL",
    weeklyHours: 2,
    goals: ["EXCEL", "REPORTS", "DATA_ANALYSIS"],
    progress: "half",
    location: "Head Office",
    years: 6,
  },
  {
    code: "TC-1003",
    name: "Nourhan Saleh",
    email: "nourhan.saleh@tcgarments.com",
    dept: "FIN",
    title: "Cost Analyst",
    roles: ["EMPLOYEE"],
    managerCode: "TC-1001",
    baseline: 41,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["EXCEL", "DATA_ANALYSIS"],
    progress: "started",
    location: "Head Office",
    years: 3,
  },
  {
    code: "TC-1004",
    name: "Omar Zaki",
    email: "omar.zaki@tcgarments.com",
    dept: "FIN",
    title: "Accountant",
    roles: ["EMPLOYEE"],
    managerCode: "TC-1001",
    baseline: 28,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["EXCEL", "EMAIL"],
    progress: "none",
    location: "Head Office",
    years: 2,
  },
  {
    code: "TC-1005",
    name: "Rana Ibrahim",
    email: "rana.ibrahim@tcgarments.com",
    dept: "FIN",
    title: "Treasury Officer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-1001",
    baseline: 47,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["REPORTS", "EXCEL"],
    progress: "half",
    location: "Head Office",
    years: 5,
  },

  // --- HR ------------------------------------------------------------------
  {
    code: "TC-2001",
    name: "Dina Kamal",
    email: "dina.kamal@tcgarments.com",
    dept: "HR",
    title: "HR Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 52,
    final: 76,
    aiExperience: "OCCASIONAL",
    weeklyHours: 2,
    goals: ["WRITING", "DOCUMENT_ANALYSIS", "REPORTS"],
    progress: "most",
    location: "Head Office",
    years: 12,
  },
  {
    code: "TC-2002",
    name: "Mostafa Helmy",
    email: "mostafa.helmy@tcgarments.com",
    dept: "HR",
    title: "Recruitment Specialist",
    roles: ["EMPLOYEE"],
    managerCode: "TC-2001",
    baseline: 38,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["WRITING", "DOCUMENT_ANALYSIS"],
    progress: "half",
    location: "Head Office",
    years: 4,
  },
  {
    code: "TC-2003",
    name: "Salma Ashraf",
    email: "salma.ashraf@tcgarments.com",
    dept: "HR",
    title: "HR Business Partner",
    roles: ["EMPLOYEE"],
    managerCode: "TC-2001",
    baseline: 44,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["WRITING", "EMAIL", "REPORTS"],
    progress: "started",
    location: "Factory 1",
    years: 6,
  },
  {
    code: "TC-2004",
    name: "Hossam Nabil",
    email: "hossam.nabil@tcgarments.com",
    dept: "HR",
    title: "Payroll Officer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-2001",
    baseline: 22,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["EXCEL", "EMAIL"],
    progress: "none",
    location: "Head Office",
    years: 9,
  },

  // --- IT ------------------------------------------------------------------
  {
    code: "TC-3001",
    name: "Tarek Fouad",
    email: "tarek.fouad@tcgarments.com",
    dept: "IT",
    title: "IT Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 81,
    final: 93,
    aiExperience: "ADVANCED",
    weeklyHours: 5,
    goals: ["PROGRAMMING", "AUTOMATION", "DATA_ANALYSIS"],
    progress: "complete",
    location: "Head Office",
    years: 13,
  },
  {
    code: "TC-3002",
    name: "Mina Botros",
    email: "mina.botros@tcgarments.com",
    dept: "IT",
    title: "Software Developer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-3001",
    baseline: 76,
    aiExperience: "ADVANCED",
    weeklyHours: 5,
    goals: ["PROGRAMMING", "AUTOMATION"],
    progress: "most",
    location: "Head Office",
    years: 5,
  },
  {
    code: "TC-3003",
    name: "Aya Refaat",
    email: "aya.refaat@tcgarments.com",
    dept: "IT",
    title: "Data Analyst",
    roles: ["EMPLOYEE"],
    managerCode: "TC-3001",
    baseline: 68,
    aiExperience: "REGULAR",
    weeklyHours: 4,
    goals: ["DATA_ANALYSIS", "PROGRAMMING", "REPORTS"],
    progress: "half",
    location: "Head Office",
    years: 4,
  },
  {
    code: "TC-3004",
    name: "Bassem Farid",
    email: "bassem.farid@tcgarments.com",
    dept: "IT",
    title: "IT Support Specialist",
    roles: ["EMPLOYEE"],
    managerCode: "TC-3001",
    baseline: 49,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["AUTOMATION", "PROGRAMMING"],
    progress: "started",
    location: "Factory 1",
    years: 3,
  },

  // --- production ----------------------------------------------------------
  {
    code: "TC-4001",
    name: "Sherif Abdelrahman",
    email: "sherif.abdelrahman@tcgarments.com",
    dept: "PRD",
    title: "Production Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 30,
    final: 61,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["PRODUCTION_IMPROVEMENT", "REPORTS", "DATA_ANALYSIS"],
    progress: "most",
    location: "Factory 1",
    years: 16,
  },
  {
    code: "TC-4002",
    name: "Walid Gaber",
    email: "walid.gaber@tcgarments.com",
    dept: "PRD",
    title: "Production Supervisor",
    roles: ["EMPLOYEE"],
    managerCode: "TC-4001",
    baseline: 24,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["PRODUCTION_IMPROVEMENT", "REPORTS"],
    progress: "started",
    location: "Factory 1",
    years: 10,
  },
  {
    code: "TC-4003",
    name: "Eman Sayed",
    email: "eman.sayed@tcgarments.com",
    dept: "PRD",
    title: "Industrial Engineer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-4001",
    baseline: 53,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["DATA_ANALYSIS", "PRODUCTION_IMPROVEMENT", "AUTOMATION"],
    progress: "half",
    location: "Factory 1",
    years: 5,
  },
  {
    code: "TC-4004",
    name: "Ashraf Younis",
    email: "ashraf.younis@tcgarments.com",
    dept: "PRD",
    title: "Line Leader",
    roles: ["EMPLOYEE"],
    managerCode: "TC-4001",
    baseline: 18,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["PRODUCTION_IMPROVEMENT"],
    progress: "none",
    location: "Factory 2",
    years: 8,
  },
  {
    code: "TC-4005",
    name: "Ghada Lotfy",
    email: "ghada.lotfy@tcgarments.com",
    dept: "PRD",
    title: "Production Supervisor",
    roles: ["EMPLOYEE"],
    managerCode: "TC-4001",
    baseline: 33,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["REPORTS", "PRODUCTION_IMPROVEMENT"],
    progress: "started",
    location: "Factory 2",
    years: 7,
  },

  // --- quality -------------------------------------------------------------
  {
    code: "TC-5001",
    name: "Nadia Shukri",
    email: "nadia.shukri@tcgarments.com",
    dept: "QLT",
    title: "Quality Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 46,
    final: 72,
    aiExperience: "OCCASIONAL",
    weeklyHours: 2,
    goals: ["DATA_ANALYSIS", "REPORTS", "DOCUMENT_ANALYSIS"],
    progress: "most",
    location: "Factory 1",
    years: 10,
  },
  {
    code: "TC-5002",
    name: "Youssef Nagy",
    email: "youssef.nagy@tcgarments.com",
    dept: "QLT",
    title: "Quality Engineer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-5001",
    baseline: 51,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["DATA_ANALYSIS", "PRODUCTION_IMPROVEMENT"],
    progress: "half",
    location: "Factory 1",
    years: 4,
  },
  {
    code: "TC-5003",
    name: "Marwa Tawfik",
    email: "marwa.tawfik@tcgarments.com",
    dept: "QLT",
    title: "Quality Inspector",
    roles: ["EMPLOYEE"],
    managerCode: "TC-5001",
    baseline: 20,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["REPORTS"],
    progress: "none",
    location: "Factory 2",
    years: 6,
  },

  // --- supply chain / warehouse / planning ---------------------------------
  {
    code: "TC-6001",
    name: "Ehab Mostafa",
    email: "ehab.mostafa@tcgarments.com",
    dept: "SCM",
    title: "Supply Chain Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 49,
    final: 74,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["DOCUMENT_ANALYSIS", "EMAIL", "DATA_ANALYSIS"],
    progress: "most",
    location: "Head Office",
    years: 9,
  },
  {
    code: "TC-6002",
    name: "Sara Anwar",
    email: "sara.anwar@tcgarments.com",
    dept: "SCM",
    title: "Procurement Officer",
    roles: ["EMPLOYEE"],
    managerCode: "TC-6001",
    baseline: 43,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["DOCUMENT_ANALYSIS", "EMAIL"],
    progress: "half",
    location: "Head Office",
    years: 3,
  },
  {
    code: "TC-6003",
    name: "Islam Sherif",
    email: "islam.sherif@tcgarments.com",
    dept: "SCM",
    title: "Logistics Coordinator",
    roles: ["EMPLOYEE"],
    managerCode: "TC-6001",
    baseline: 35,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["EMAIL", "REPORTS"],
    progress: "started",
    location: "Factory 1",
    years: 5,
  },
  {
    code: "TC-6004",
    name: "Hany Mokhtar",
    email: "hany.mokhtar@tcgarments.com",
    dept: "WHS",
    title: "Warehouse Supervisor",
    roles: ["MANAGER"],
    managerCode: "TC-6001",
    baseline: 26,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["REPORTS", "EXCEL"],
    progress: "started",
    location: "Factory 1",
    years: 11,
  },
  {
    code: "TC-6005",
    name: "Amr Sultan",
    email: "amr.sultan@tcgarments.com",
    dept: "WHS",
    title: "Store Keeper",
    roles: ["EMPLOYEE"],
    managerCode: "TC-6004",
    baseline: 15,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["EXCEL"],
    progress: "none",
    location: "Factory 1",
    years: 4,
  },
  {
    code: "TC-6006",
    name: "Reem Halim",
    email: "reem.halim@tcgarments.com",
    dept: "PLN",
    title: "Production Planner",
    roles: ["EMPLOYEE"],
    managerCode: "TC-6001",
    baseline: 48,
    aiExperience: "OCCASIONAL",
    weeklyHours: 3,
    goals: ["DATA_ANALYSIS", "EXCEL", "AUTOMATION"],
    progress: "half",
    location: "Head Office",
    years: 6,
  },

  // --- maintenance ---------------------------------------------------------
  {
    code: "TC-7001",
    name: "Fathy Abdelaziz",
    email: "fathy.abdelaziz@tcgarments.com",
    dept: "MNT",
    title: "Maintenance Supervisor",
    roles: ["MANAGER"],
    managerCode: "TC-4001",
    baseline: 29,
    aiExperience: "TRIED",
    weeklyHours: 1,
    goals: ["PRODUCTION_IMPROVEMENT", "REPORTS"],
    progress: "started",
    location: "Factory 1",
    years: 15,
  },
  {
    code: "TC-7002",
    name: "Sameh Roushdy",
    email: "sameh.roushdy@tcgarments.com",
    dept: "MNT",
    title: "Maintenance Technician",
    roles: ["EMPLOYEE"],
    managerCode: "TC-7001",
    baseline: 17,
    aiExperience: "NONE",
    weeklyHours: 1,
    goals: ["PRODUCTION_IMPROVEMENT"],
    progress: "none",
    location: "Factory 1",
    years: 7,
  },

  // --- commercial ----------------------------------------------------------
  {
    code: "TC-8001",
    name: "Laila Hegazy",
    email: "laila.hegazy@tcgarments.com",
    dept: "COM",
    title: "Commercial Manager",
    roles: ["MANAGER"],
    managerCode: "TC-0001",
    baseline: 57,
    final: 81,
    aiExperience: "REGULAR",
    weeklyHours: 3,
    goals: ["WRITING", "RESEARCH", "PRESENTATIONS"],
    progress: "complete",
    location: "Head Office",
    years: 8,
  },
  {
    code: "TC-8002",
    name: "Nada Fahmy",
    email: "nada.fahmy@tcgarments.com",
    dept: "COM",
    title: "Merchandiser",
    roles: ["EMPLOYEE"],
    managerCode: "TC-8001",
    baseline: 42,
    aiExperience: "OCCASIONAL",
    weeklyHours: 2,
    goals: ["WRITING", "EMAIL", "PRESENTATIONS"],
    progress: "half",
    location: "Head Office",
    years: 3,
  },
  {
    code: "TC-8003",
    name: "Peter Aziz",
    email: "peter.aziz@tcgarments.com",
    dept: "COM",
    title: "Sales Executive",
    roles: ["EMPLOYEE"],
    managerCode: "TC-8001",
    baseline: 39,
    aiExperience: "TRIED",
    weeklyHours: 2,
    goals: ["WRITING", "RESEARCH", "EMAIL"],
    progress: "started",
    location: "Istanbul Office",
    locale: "tr",
    years: 4,
  },
  {
    code: "TC-8004",
    name: "Emre Yılmaz",
    email: "emre.yilmaz@tcgarments.com",
    dept: "COM",
    title: "Merchandiser",
    roles: ["EMPLOYEE"],
    managerCode: "TC-8001",
    baseline: 54,
    aiExperience: "REGULAR",
    weeklyHours: 4,
    goals: ["RESEARCH", "PRESENTATIONS", "WRITING"],
    progress: "half",
    location: "Istanbul Office",
    locale: "tr",
    years: 6,
  },
];

const PROGRESS_FRACTION: Record<NonNullable<Person["progress"]>, number> = {
  none: 0,
  started: 0.15,
  half: 0.5,
  most: 0.85,
  complete: 1,
};

/** Spread a target percentage across competencies so the profile looks real. */
function competencyProfile(target: number, seed: number, isTechnical: boolean) {
  const rand = rng(seed);
  const spread = (bias: number) => Math.max(4, Math.min(98, Math.round(target + bias + (rand() * 16 - 8))));
  return {
    FUNDAMENTALS: spread(8),
    WORKPLACE: spread(2),
    PROMPTING: spread(-9),
    RESPONSIBLE_AI: spread(isTechnical ? 4 : -4),
    DATA_AUTOMATION: spread(isTechnical ? 10 : -12),
  } as Record<string, number>;
}

export async function seedDemo(prisma: Db) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const levels = await prisma.skillLevel.findMany({ orderBy: { order: "asc" } });
  const competencies = await prisma.competency.findMany();
  const placement = await prisma.assessmentDefinition.findUniqueOrThrow({ where: { key: "PLACEMENT_V1" } });
  const finalDef = await prisma.assessmentDefinition.findUniqueOrThrow({ where: { key: "FINAL_V1" } });
  const roles = await prisma.role.findMany();
  const levelFor = (pct: number, technical: boolean) => {
    const match = levels.find((l) => pct >= l.minScore && pct <= l.maxScore) ?? levels[0];
    if (match.code === "L4" && !technical) return levels.find((l) => l.code === "L3") ?? match;
    return match;
  };

  // --- users ---------------------------------------------------------------
  for (const p of PEOPLE) {
    const dept = await prisma.department.findUniqueOrThrow({ where: { code: p.dept } });
    const jobTitle = await prisma.jobTitle.findUniqueOrThrow({ where: { name: p.title } });
    const location = p.location ? await prisma.location.findUnique({ where: { name: p.location } }) : null;
    const section = await prisma.section.findFirst({ where: { departmentId: dept.id } });

    const data = {
      email: p.email.toLowerCase(),
      passwordHash,
      fullName: p.name,
      status: "ACTIVE",
      preferredLanguage: p.locale ?? "en",
      departmentId: dept.id,
      sectionId: section?.id ?? null,
      jobTitleId: jobTitle.id,
      locationId: location?.id ?? null,
      mustChangePassword: false,
    };

    const user = await prisma.user.upsert({
      where: { employeeCode: p.code },
      update: data,
      create: { employeeCode: p.code, ...data },
    });

    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        aiExperience: p.aiExperience,
        isTechnical: jobTitle.isTechnical,
        weeklyLearningHours: p.weeklyHours,
        yearsExperience: p.years ?? 5,
        onboardingStep: "DONE",
        onboardedAt: new Date(),
      },
      create: {
        userId: user.id,
        aiExperience: p.aiExperience,
        isTechnical: jobTitle.isTechnical,
        weeklyLearningHours: p.weeklyHours,
        yearsExperience: p.years ?? 5,
        onboardingStep: "DONE",
        onboardedAt: new Date(),
        mainTasks: null,
      },
    });

    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    for (const key of p.roles) {
      const role = roles.find((r) => r.key === key);
      if (role) await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }

    await prisma.userLearningGoal.deleteMany({ where: { userId: user.id } });
    for (const [i, g] of p.goals.entries()) {
      await prisma.userLearningGoal.create({ data: { userId: user.id, goalKey: g, priority: i + 1 } });
    }
  }

  // --- manager links (second pass, once everyone exists) -------------------
  for (const p of PEOPLE) {
    if (!p.managerCode) continue;
    const manager = await prisma.user.findUnique({ where: { employeeCode: p.managerCode } });
    if (manager) {
      await prisma.user.update({ where: { employeeCode: p.code }, data: { managerId: manager.id } });
    }
  }

  // --- assessment history --------------------------------------------------
  for (const [index, p] of PEOPLE.entries()) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { employeeCode: p.code },
      include: { jobTitle: true },
    });
    const technical = user.jobTitle?.isTechnical ?? false;

    await prisma.assessmentAttempt.deleteMany({ where: { userId: user.id } });

    const baselineDate = new Date();
    baselineDate.setDate(baselineDate.getDate() - (90 - (index % 20)));

    const baselineScores = competencyProfile(p.baseline, index * 7919 + 13, technical);
    await createGradedAttempt(prisma, {
      userId: user.id,
      definitionId: placement.id,
      percentage: p.baseline,
      scores: baselineScores,
      competencies,
      levelId: levelFor(p.baseline, technical).id,
      isBaseline: true,
      at: baselineDate,
      passingScore: placement.passingScore,
    });

    // L4 requires a passed technical assessment in the app, so the demo data
    // must contain one rather than asserting the level directly.
    if (technical && (p.final ?? p.baseline) >= 70) {
      const technicalDef = await prisma.assessmentDefinition.findUnique({ where: { key: "TECHNICAL_V1" } });
      if (technicalDef) {
        const technicalDate = new Date();
        technicalDate.setDate(technicalDate.getDate() - (index % 15) - 5);
        await createGradedAttempt(prisma, {
          userId: user.id,
          definitionId: technicalDef.id,
          percentage: Math.min(96, (p.final ?? p.baseline) + 4),
          scores: { TECHNICAL: Math.min(96, (p.final ?? p.baseline) + 4) },
          competencies,
          isBaseline: false,
          at: technicalDate,
          passingScore: technicalDef.passingScore,
        });
      }
    }

    if (["complete", "most", "half"].includes(p.progress ?? "none")) {
      const responsibleDef = await prisma.assessmentDefinition.findUnique({
        where: { key: "RESPONSIBLE_AI_V1" },
      });
      if (responsibleDef) {
        const at = new Date();
        at.setDate(at.getDate() - (index % 20) - 3);
        const score = 82 + (index % 15);
        await createGradedAttempt(prisma, {
          userId: user.id,
          definitionId: responsibleDef.id,
          percentage: score,
          scores: { RESPONSIBLE_AI: score },
          competencies,
          isBaseline: false,
          at,
          passingScore: responsibleDef.passingScore,
        });
      }
    }

    if (p.final !== undefined) {
      const finalDate = new Date();
      finalDate.setDate(finalDate.getDate() - (index % 12) - 2);
      const finalScores = competencyProfile(p.final, index * 104729 + 7, technical);
      await createGradedAttempt(prisma, {
        userId: user.id,
        definitionId: finalDef.id,
        percentage: p.final,
        scores: finalScores,
        competencies,
        levelId: levelFor(p.final, technical).id,
        isBaseline: false,
        at: finalDate,
        passingScore: finalDef.passingScore,
      });
    }
  }

  // --- enrolments & progress ----------------------------------------------
  const foundation = await prisma.learningPath.findUnique({
    where: { code: "PATH-FOUNDATION" },
    include: { courses: { include: { course: true, phase: true }, orderBy: { order: "asc" } } },
  });
  const technicalPath = await prisma.learningPath.findUnique({
    where: { code: "PATH-TECHNICAL" },
    include: { courses: { include: { course: true, phase: true }, orderBy: { order: "asc" } } },
  });
  const leadershipPath = await prisma.learningPath.findUnique({
    where: { code: "PATH-LEADERSHIP" },
    include: { courses: { include: { course: true, phase: true }, orderBy: { order: "asc" } } },
  });

  for (const [index, p] of PEOPLE.entries()) {
    const fraction = PROGRESS_FRACTION[p.progress ?? "none"];
    if (fraction === 0) continue;

    const user = await prisma.user.findUniqueOrThrow({
      where: { employeeCode: p.code },
      include: { jobTitle: true },
    });
    const path =
      user.jobTitle?.isTechnical && technicalPath
        ? technicalPath
        : user.jobTitle?.jobFamily === "MANAGEMENT" && leadershipPath
          ? leadershipPath
          : foundation;
    if (!path) continue;

    await prisma.enrollment.deleteMany({ where: { userId: user.id } });

    const total = path.courses.length;
    const completedCount = Math.floor(total * fraction);

    for (const [i, pc] of path.courses.entries()) {
      const isComplete = i < completedCount;
      const isCurrent = i === completedCount && fraction < 1;
      const enrolledAt = new Date();
      enrolledAt.setDate(enrolledAt.getDate() - (70 - i * 8));

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: pc.courseId,
          pathId: path.id,
          source: "RECOMMENDED",
          status: isComplete ? "COMPLETED" : isCurrent ? "IN_PROGRESS" : "NOT_STARTED",
          enrolledAt,
          startedAt: isComplete || isCurrent ? enrolledAt : null,
          completedAt: isComplete ? new Date(enrolledAt.getTime() + 12 * 86400000) : null,
          progressPercent: isComplete ? 100 : isCurrent ? 35 + ((index * 13) % 45) : 0,
          timeSpentMinutes: isComplete
            ? Math.round(pc.course.estimatedHours * 60)
            : isCurrent
              ? Math.round(pc.course.estimatedHours * 60 * 0.4)
              : 0,
          lastAccessedAt: isComplete || isCurrent ? new Date(Date.now() - (index % 9) * 86400000) : null,
          order: pc.order,
          phase: pc.phase?.title ?? null,
        },
      });

      // Internal courses have lessons, so give them believable lesson progress.
      if (isComplete || isCurrent) {
        const lessons = await prisma.courseLesson.findMany({
          where: { module: { courseId: pc.courseId } },
          orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
        });
        const cutoff = isComplete ? lessons.length : Math.floor(lessons.length * 0.4);
        for (const [li, lesson] of lessons.entries()) {
          if (li >= cutoff) break;
          await prisma.lessonProgress.create({
            data: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
              status: "COMPLETED",
              secondsSpent: lesson.durationMinutes * 60,
              completedAt: new Date(enrolledAt.getTime() + li * 86400000),
            },
          });
        }
      }

      if (isComplete && (index + i) % 3 === 0) {
        await prisma.courseFeedback.create({
          data: {
            enrollmentId: enrollment.id,
            userId: user.id,
            courseId: pc.courseId,
            usefulness: 4 + ((index + i) % 2),
            wouldRecommend: true,
            relevance: 4,
            comment: i === 0 ? "Good starting point — the examples made sense for our work." : null,
          },
        });
      }
    }

    // Learning plan + activity streak
    await prisma.learningPlan.upsert({
      where: { userId: user.id },
      update: { pathId: path.id, hoursPerWeek: p.weeklyHours },
      create: {
        userId: user.id,
        pathId: path.id,
        hoursPerWeek: p.weeklyHours,
        targetDate: new Date(Date.now() + (path.targetHours / Math.max(1, p.weeklyHours)) * 7 * 86400000),
      },
    });

    await prisma.learningActivity.deleteMany({ where: { userId: user.id } });
    const activeDays = p.progress === "complete" ? 40 : p.progress === "most" ? 26 : p.progress === "half" ? 14 : 5;
    const streakDays = p.progress === "complete" ? 6 : p.progress === "most" ? 4 : p.progress === "half" ? 2 : 0;
    for (let d = 0; d < activeDays; d++) {
      // Recent consecutive days give a visible streak; older days are sparse.
      const offset = d < streakDays ? d : d * 2 + 3;
      const day = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
      await prisma.learningActivity.upsert({
        where: { userId_day: { userId: user.id, day } },
        update: {},
        create: { userId: user.id, day, minutes: 20 + ((index + d) % 40), lessonsCompleted: (d % 3) + 1 },
      });
    }
  }

  // --- certificates --------------------------------------------------------
  let certSeq = 1;
  for (const p of PEOPLE) {
    const user = await prisma.user.findUniqueOrThrow({ where: { employeeCode: p.code } });
    await prisma.certificate.deleteMany({ where: { userId: user.id } });

    const completed = await prisma.enrollment.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: { course: true, path: true },
    });

    for (const e of completed.slice(0, 4)) {
      if (!e.course.certificateAvailable) continue;
      await prisma.certificate.create({
        data: {
          code: `TCAI-2026-${String(certSeq++).padStart(6, "0")}`,
          userId: user.id,
          type: "COURSE",
          title: e.course.title,
          courseId: e.courseId,
          learningHours: e.course.estimatedHours,
          issuedAt: e.completedAt ?? new Date(),
          status: "VALID",
        },
      });
    }

    if (p.progress === "complete" && p.final !== undefined) {
      const attempt = await prisma.assessmentAttempt.findFirst({
        where: { userId: user.id, definition: { type: "FINAL" } },
        include: { level: true },
      });
      await prisma.certificate.create({
        data: {
          code: `TCAI-2026-${String(certSeq++).padStart(6, "0")}`,
          userId: user.id,
          type: "PROGRAM",
          title: "T&C AI Academy — AI Capability Programme",
          levelId: attempt?.levelId ?? null,
          attemptId: attempt?.id ?? null,
          learningHours: completed.reduce((s, e) => s + e.course.estimatedHours, 0),
          finalScore: p.final,
          issuedAt: new Date(),
          status: "VALID",
        },
      });
    }
  }

  // --- badges --------------------------------------------------------------
  const badges = await prisma.badge.findMany();
  for (const p of PEOPLE) {
    const user = await prisma.user.findUniqueOrThrow({ where: { employeeCode: p.code } });
    await prisma.userBadge.deleteMany({ where: { userId: user.id } });
    const earned = ["AI_EXPLORER"];
    if ((p.progress ?? "none") !== "none") earned.push("FIRST_COURSE");
    if (p.baseline >= 45) earned.push("AI_PRACTITIONER");
    if ((p.final ?? p.baseline) >= 65) earned.push("AI_POWER_USER");
    if (p.progress === "complete") earned.push("PATH_COMPLETE", "RESPONSIBLE_AI");
    for (const key of earned) {
      const badge = badges.find((b) => b.key === key);
      if (badge) {
        await prisma.userBadge.create({ data: { userId: user.id, badgeId: badge.id } });
      }
    }
  }

  // --- capstones and the opportunity pipeline ------------------------------
  const capstoneSubmissions: { code: string; capstoneKey: string; title: string; content: Record<string, string>; status: string; score?: number }[] = [
    {
      code: "TC-1001",
      capstoneKey: "CAP-FINANCE",
      title: "Automating the monthly variance commentary",
      status: "APPROVED",
      score: 88,
      content: {
        businessProblem:
          "Month-end commentary takes a full day across the team and still lands late with the operations director.",
        currentProcess:
          "Variances are calculated in Excel, then three analysts write commentary by cost centre in Word, then I edit for consistency.",
        whereAiHelps:
          "The calculation stays in Excel. AI drafts the commentary from the summarised, indexed table using one agreed prompt, so tone and structure are consistent across all cost centres.",
        promptWorkflow:
          "Standard variance prompt: indexed table in, commentary out, one question per variance above 5%, max 300 words, no figures introduced that were not supplied.",
        expectedOutput: "A consistent 2-page commentary pack, drafted in about 20 minutes instead of a day.",
        risks:
          "Invented drivers if the prompt is not constrained; real costings leaving T&C if figures are not indexed first.",
        validationMethod:
          "Every figure in the draft is checked against the source table before circulation, and cost centre owners confirm the drivers.",
        estimatedBenefit:
          "Around 6 hours per month across three analysts, measured from the current month-end timesheet.",
      },
    },
    {
      code: "TC-4001",
      capstoneKey: "CAP-PRODUCTION",
      title: "Weekly downtime cause analysis from shift notes",
      status: "APPROVED",
      score: 82,
      content: {
        businessProblem:
          "Handover notes contain the causes of repeat downtime, but nobody reads a full week of them together, so the same causes recur.",
        currentProcess: "Supervisors write notes each shift. They are filed and only read when there is an incident.",
        whereAiHelps:
          "AI converts a week of notes into a downtime table, ranks causes by total minutes, and flags every event where no cause was recorded.",
        promptWorkflow:
          "Weekly: concatenate notes, remove names, run the downtime analysis prompt, take the missing-cause list to Monday's meeting.",
        expectedOutput: "A one-page weekly downtime summary with a ranked cause list and a data-quality list.",
        risks:
          "AI inferring causes that were never recorded — the prompt forbids this explicitly and the output is checked against the notes.",
        validationMethod: "Spot-check five events per week against the original handover notes.",
        estimatedBenefit:
          "About 3 hours per week of supervisor time, and the first reliable view of repeat causes we have had.",
      },
    },
    {
      code: "TC-6001",
      capstoneKey: "CAP-SUPPLY",
      title: "Structured RFQ comparison with gap analysis",
      status: "APPROVED",
      score: 85,
      content: {
        businessProblem:
          "Comparing quotations with different structures takes an afternoon, and missing terms are only discovered after the order is placed.",
        currentProcess: "Manual comparison in Excel, criteria vary by buyer, gaps are noticed inconsistently.",
        whereAiHelps:
          "A fixed criteria set applied consistently, plus an explicit list of what each quotation does not state, and a drafted clarification question per gap.",
        promptWorkflow:
          "Anonymise quotations to A/B/C, run the approved RFQ prompt, send the generated clarification questions, decide trade-offs manually.",
        expectedOutput: "A comparison table, a per-supplier risk note, and a ready-to-send clarification email.",
        risks:
          "Supplier pricing leaving T&C — mitigated by anonymising and removing pricing before analysis.",
        validationMethod: "Every extracted term is checked against the original quotation before decision.",
        estimatedBenefit:
          "About 2 hours per RFQ, roughly 8 hours a month, plus fewer post-award surprises.",
      },
    },
    {
      code: "TC-2001",
      capstoneKey: "CAP-HR",
      title: "Consistent interview evaluation frameworks",
      status: "UNDER_REVIEW",
      content: {
        businessProblem:
          "Interviewers assess candidates against different unwritten criteria, so decisions are inconsistent and hard to justify.",
        currentProcess: "Each hiring manager prepares their own questions. Notes are unstructured.",
        whereAiHelps:
          "AI drafts a structured framework with rating anchors for each vacancy. Humans apply it. AI never sees a candidate.",
        promptWorkflow: "Role description in, six criteria with weak/adequate/strong anchors out, hiring manager reviews.",
        expectedOutput: "One agreed evaluation framework per vacancy, used by every interviewer.",
        risks:
          "Bias if criteria are not job-related; this is why the prompt forbids any reference to age, gender, nationality or marital status, and why AI never scores candidates.",
        validationMethod: "Hiring manager and HR review every framework before interviews begin.",
        estimatedBenefit: "About 3 hours per vacancy and materially more defensible hiring decisions.",
      },
    },
  ];

  for (const s of capstoneSubmissions) {
    const user = await prisma.user.findUnique({ where: { employeeCode: s.code } });
    const assignment = await prisma.assignment.findUnique({ where: { key: s.capstoneKey } });
    if (!user || !assignment) continue;
    const reviewer = await prisma.user.findUnique({ where: { employeeCode: "TC-0002" } });

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId: assignment.id, userId: user.id } },
      update: {},
      create: {
        assignmentId: assignment.id,
        userId: user.id,
        content: JSON.stringify({ ...s.content, title: s.title }),
        status: s.status,
        score: s.score ?? null,
        feedback:
          s.status === "APPROVED"
            ? "Strong, grounded submission. The benefit estimate is tied to a real measurement, which is exactly what we asked for."
            : null,
        reviewedById: s.status === "APPROVED" ? reviewer?.id ?? null : null,
        submittedAt: new Date(Date.now() - 10 * 86400000),
        reviewedAt: s.status === "APPROVED" ? new Date(Date.now() - 6 * 86400000) : null,
      },
    });

    if (s.status === "APPROVED") {
      const dept = await prisma.user.findUnique({ where: { id: user.id }, select: { departmentId: true } });
      await prisma.aiOpportunity.upsert({
        where: { submissionId: submission.id },
        update: {},
        create: {
          submissionId: submission.id,
          departmentId: dept?.departmentId ?? null,
          title: s.title,
          problem: s.content.businessProblem,
          opportunity: s.content.whereAiHelps,
          impact: "MEDIUM",
          complexity: "LOW",
          status: "APPROVED",
          ownerId: user.id,
          hoursSavedMonthly: s.code === "TC-1001" ? 6 : s.code === "TC-4001" ? 12 : 8,
          annualHoursSaved: s.code === "TC-1001" ? 72 : s.code === "TC-4001" ? 144 : 96,
        },
      });
    }
  }

  // --- recommendations ------------------------------------------------------
  // Runs the real engine for every demo employee so the seeded data exercises
  // the same code path the application uses.
  const { generateRecommendations } = await import("../../src/lib/recommendation/service");
  for (const p of PEOPLE) {
    const user = await prisma.user.findUniqueOrThrow({ where: { employeeCode: p.code } });
    await generateRecommendations(user.id);
  }

  // --- notifications -------------------------------------------------------
  for (const p of PEOPLE.slice(0, 12)) {
    const user = await prisma.user.findUniqueOrThrow({ where: { employeeCode: p.code } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.notification.create({
      data: {
        userId: user.id,
        category: "LEARNING",
        title: "Your learning path is ready",
        body: "We built a path around your assessment results and your role. Start whenever suits you.",
        link: "/learning",
        isRead: (p.progress ?? "none") !== "none",
      },
    });
    if ((p.progress ?? "none") === "none") {
      await prisma.notification.create({
        data: {
          userId: user.id,
          category: "ASSESSMENT",
          title: "Your AI assessment results are in",
          body: "See your level, your strengths and what we recommend next.",
          link: "/assessments",
        },
      });
    }
  }

  return { users: PEOPLE.length, password: DEMO_PASSWORD };
}

async function createGradedAttempt(
  prisma: Db,
  input: {
    userId: string;
    definitionId: string;
    percentage: number;
    scores: Record<string, number>;
    competencies: { id: string; key: string }[];
    levelId?: string | null;
    isBaseline: boolean;
    at: Date;
    passingScore: number;
  },
) {
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      definitionId: input.definitionId,
      userId: input.userId,
      status: "GRADED",
      isBaseline: input.isBaseline,
      startedAt: input.at,
      submittedAt: new Date(input.at.getTime() + 21 * 60000),
      gradedAt: new Date(input.at.getTime() + 21 * 60000),
      totalScore: Math.round(input.percentage),
      maxScore: 100,
      percentage: input.percentage,
      passed: input.percentage >= input.passingScore,
      levelId: input.levelId ?? null,
      timeSpentSeconds: 1260,
      attemptNumber: 1,
      meta: JSON.stringify({ source: "demo-seed" }),
    },
  });

  for (const [key, value] of Object.entries(input.scores)) {
    const competency = input.competencies.find((c) => c.key === key);
    if (!competency) continue;
    await prisma.assessmentScore.create({
      data: {
        attemptId: attempt.id,
        competencyId: competency.id,
        rawScore: value,
        maxScore: 100,
        percentage: value,
      },
    });
  }

  return attempt;
}

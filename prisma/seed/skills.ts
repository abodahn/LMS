import type { Db } from "./client";

/**
 * T&C's operational skills, and what each job expects of them.
 *
 * These are not AI competencies. A competency is a band measured by exam and it
 * feeds the recommendation engine; a skill here is something a supervisor can
 * watch someone do and rate. The two are seeded separately and stay separate.
 *
 * The levels are the same everywhere in the system:
 *
 *   0  none          has not done it
 *   1  aware         knows what it is, cannot do it
 *   2  assisted      can do it with someone checking
 *   3  independent   does it alone, to standard
 *   4  proficient    handles the difficult cases
 *   5  can teach it  sets the standard, trains others
 */

type SkillSeed = {
  key: string;
  name: string;
  nameAr: string;
  nameTr: string;
  category: "PRODUCTION" | "QUALITY" | "TECHNICAL" | "DIGITAL" | "LEADERSHIP" | "COMPLIANCE" | "LANGUAGE";
  jobFamilies: string;
  description: string;
};

const SKILLS: SkillSeed[] = [
  // --- Production ----------------------------------------------------------
  {
    key: "LINE_BALANCING",
    name: "Line balancing",
    nameAr: "موازنة خط الإنتاج",
    nameTr: "Hat dengeleme",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION,SUPPLY_CHAIN",
    description: "Distributing operations across a line so no station starves and none becomes the bottleneck.",
  },
  {
    key: "SMV",
    name: "SMV calculation",
    nameAr: "حساب الدقيقة المعيارية",
    nameTr: "SMV hesaplama",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION,SUPPLY_CHAIN",
    description: "Establishing the standard minute value of an operation and using it to cost and plan work.",
  },
  {
    key: "CAPACITY_PLANNING",
    name: "Capacity analysis",
    nameAr: "تحليل الطاقة الإنتاجية",
    nameTr: "Kapasite analizi",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION,SUPPLY_CHAIN,MANAGEMENT",
    description: "Working out what a line, a floor or a factory can actually deliver in a given period.",
  },
  {
    key: "TIME_MOTION",
    name: "Time and motion study",
    nameAr: "دراسة الوقت والحركة",
    nameTr: "Zaman ve hareket etüdü",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION",
    description: "Observing and timing an operation to find the waste in it.",
  },
  {
    key: "PRODUCTION_SCHEDULING",
    name: "Production scheduling",
    nameAr: "جدولة الإنتاج",
    nameTr: "Üretim planlama",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION,SUPPLY_CHAIN",
    description: "Sequencing orders across lines against delivery dates, materials and capacity.",
  },
  {
    key: "LEAN_5S",
    name: "Lean and 5S",
    nameAr: "الإنتاج الرشيق و 5S",
    nameTr: "Yalın üretim ve 5S",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION,QUALITY,SUPPLY_CHAIN",
    description: "Keeping a workplace ordered and removing waste from how work moves through it.",
  },
  {
    key: "CUTTING_ROOM",
    name: "Cutting room operations",
    nameAr: "عمليات غرفة القص",
    nameTr: "Kesimhane operasyonları",
    category: "PRODUCTION",
    jobFamilies: "PRODUCTION",
    description: "Marker making, spreading, cutting and bundle control, and the fabric loss each decision costs.",
  },

  // --- Quality -------------------------------------------------------------
  {
    key: "AQL_INSPECTION",
    name: "AQL inspection",
    nameAr: "الفحص بنظام AQL",
    nameTr: "AQL denetimi",
    category: "QUALITY",
    jobFamilies: "QUALITY,PRODUCTION",
    description: "Drawing a sample to the agreed AQL and judging a lot against it.",
  },
  {
    key: "INLINE_QC",
    name: "In-line quality control",
    nameAr: "ضبط الجودة أثناء الإنتاج",
    nameTr: "Hat içi kalite kontrol",
    category: "QUALITY",
    jobFamilies: "QUALITY,PRODUCTION",
    description: "Catching a defect at the station that made it rather than at final inspection.",
  },
  {
    key: "DEFECT_RCA",
    name: "Defect analysis and root cause",
    nameAr: "تحليل العيوب والسبب الجذري",
    nameTr: "Hata analizi ve kök neden",
    category: "QUALITY",
    jobFamilies: "QUALITY,PRODUCTION",
    description: "Tracing a recurring defect to the operation, machine or material that causes it.",
  },
  {
    key: "SPEC_READING",
    name: "Measurement and spec reading",
    nameAr: "القياس وقراءة المواصفات",
    nameTr: "Ölçü ve teknik föy okuma",
    category: "QUALITY",
    jobFamilies: "QUALITY,PRODUCTION,SALES_MARKETING",
    description: "Reading a tech pack and measuring a garment against its tolerance table.",
  },
  {
    key: "FABRIC_INSPECTION",
    name: "Fabric inspection",
    nameAr: "فحص الأقمشة",
    nameTr: "Kumaş kontrolü",
    category: "QUALITY",
    jobFamilies: "QUALITY,SUPPLY_CHAIN",
    description: "Four-point grading of incoming fabric, and knowing what to reject.",
  },

  // --- Technical -----------------------------------------------------------
  {
    key: "MACHINE_SETUP",
    name: "Machine setup and changeover",
    nameAr: "ضبط الماكينة وتغيير الموديل",
    nameTr: "Makine ayarı ve model değişimi",
    category: "TECHNICAL",
    jobFamilies: "PRODUCTION",
    description: "Setting a machine for a new operation and getting it right the first time.",
  },
  {
    key: "PREVENTIVE_MAINTENANCE",
    name: "Preventive maintenance",
    nameAr: "الصيانة الوقائية",
    nameTr: "Önleyici bakım",
    category: "TECHNICAL",
    jobFamilies: "PRODUCTION",
    description: "Servicing to a schedule so a machine does not stop a line mid-run.",
  },
  {
    key: "MECHANICAL_FAULTS",
    name: "Mechanical fault finding",
    nameAr: "تشخيص الأعطال الميكانيكية",
    nameTr: "Mekanik arıza tespiti",
    category: "TECHNICAL",
    jobFamilies: "PRODUCTION",
    description: "Diagnosing a mechanical fault from the symptom rather than by replacing parts.",
  },
  {
    key: "ELECTRICAL_FAULTS",
    name: "Electrical fault finding",
    nameAr: "تشخيص الأعطال الكهربائية",
    nameTr: "Elektriksel arıza tespiti",
    category: "TECHNICAL",
    jobFamilies: "PRODUCTION",
    description: "Safe diagnosis of electrical faults on production equipment.",
  },

  // --- Digital -------------------------------------------------------------
  {
    key: "EXCEL",
    name: "Excel",
    nameAr: "إكسل",
    nameTr: "Excel",
    category: "DIGITAL",
    jobFamilies: "FINANCE,HR,PRODUCTION,QUALITY,SUPPLY_CHAIN,SALES_MARKETING,IT,MANAGEMENT",
    description: "Lookups, pivot tables and a model someone else can follow.",
  },
  {
    key: "POWER_BI",
    name: "Power BI",
    nameAr: "Power BI",
    nameTr: "Power BI",
    category: "DIGITAL",
    jobFamilies: "FINANCE,PRODUCTION,SUPPLY_CHAIN,IT,MANAGEMENT",
    description: "Building a report others rely on, from a data source that refreshes.",
  },
  {
    key: "ERP_OPERATION",
    name: "ERP operation",
    nameAr: "تشغيل نظام ERP",
    nameTr: "ERP kullanımı",
    category: "DIGITAL",
    jobFamilies: "FINANCE,SUPPLY_CHAIN,PRODUCTION,SALES_MARKETING",
    description: "Working the company system correctly, including what a wrong entry costs downstream.",
  },
  {
    key: "DATA_ANALYSIS",
    name: "Data analysis",
    nameAr: "تحليل البيانات",
    nameTr: "Veri analizi",
    category: "DIGITAL",
    jobFamilies: "FINANCE,IT,PRODUCTION,SUPPLY_CHAIN,QUALITY,MANAGEMENT",
    description: "Turning a table of numbers into a decision someone can act on.",
  },
  {
    key: "REPORTING",
    name: "Reporting and presentation",
    nameAr: "إعداد التقارير والعرض",
    nameTr: "Raporlama ve sunum",
    category: "DIGITAL",
    jobFamilies: "FINANCE,HR,SALES_MARKETING,MANAGEMENT,SUPPLY_CHAIN,QUALITY",
    description: "Putting a result in front of people so the point survives the meeting.",
  },

  // --- Leadership ----------------------------------------------------------
  {
    key: "TEAM_LEADERSHIP",
    name: "Team leadership",
    nameAr: "قيادة الفريق",
    nameTr: "Ekip liderliği",
    category: "LEADERSHIP",
    jobFamilies: "PRODUCTION,QUALITY,SUPPLY_CHAIN,MANAGEMENT,HR,FINANCE,IT,SALES_MARKETING",
    description: "Running a shift or a team so the work gets done and people stay.",
  },
  {
    key: "ON_JOB_TRAINING",
    name: "Coaching and on-job training",
    nameAr: "التدريب والتوجيه في موقع العمل",
    nameTr: "İş başı eğitim ve koçluk",
    category: "LEADERSHIP",
    jobFamilies: "PRODUCTION,QUALITY,HR,SUPPLY_CHAIN",
    description: "Teaching an operation to someone at the machine, and checking they have it.",
  },
  {
    key: "PERFORMANCE_CONVERSATIONS",
    name: "Performance conversations",
    nameAr: "محادثات الأداء",
    nameTr: "Performans görüşmeleri",
    category: "LEADERSHIP",
    jobFamilies: "MANAGEMENT,HR,PRODUCTION,QUALITY,SUPPLY_CHAIN,FINANCE,IT,SALES_MARKETING",
    description: "Saying the difficult thing clearly, early, and to the person concerned.",
  },
  {
    key: "PROBLEM_SOLVING",
    name: "Structured problem solving",
    nameAr: "حل المشكلات بشكل منهجي",
    nameTr: "Yapılandırılmış problem çözme",
    category: "LEADERSHIP",
    jobFamilies: "PRODUCTION,QUALITY,SUPPLY_CHAIN,IT,FINANCE,MANAGEMENT",
    description: "Defining the problem before proposing the fix, and checking the fix held.",
  },

  // --- Compliance ----------------------------------------------------------
  {
    key: "WORKPLACE_SAFETY",
    name: "Workplace safety",
    nameAr: "السلامة المهنية",
    nameTr: "İş güvenliği",
    category: "COMPLIANCE",
    jobFamilies: "PRODUCTION,QUALITY,SUPPLY_CHAIN,MANAGEMENT,HR,IT,FINANCE,SALES_MARKETING",
    description: "The hazards of this site, the controls for them, and what to stop.",
  },
  {
    key: "SOCIAL_COMPLIANCE",
    name: "Social compliance",
    nameAr: "الامتثال الاجتماعي",
    nameTr: "Sosyal uygunluk",
    category: "COMPLIANCE",
    jobFamilies: "HR,PRODUCTION,MANAGEMENT,QUALITY",
    description: "What buyer audits require of working hours, records and conditions, and why.",
  },
  {
    key: "CHEMICAL_AWARENESS",
    name: "Chemical and REACH awareness",
    nameAr: "الوعي بالمواد الكيميائية و REACH",
    nameTr: "Kimyasal ve REACH farkındalığı",
    category: "COMPLIANCE",
    jobFamilies: "QUALITY,PRODUCTION,SUPPLY_CHAIN",
    description: "Restricted substances, safety data sheets, and handling in a wet process.",
  },

  // --- Language ------------------------------------------------------------
  {
    key: "BUSINESS_ENGLISH",
    name: "Business English",
    nameAr: "الإنجليزية للأعمال",
    nameTr: "İş İngilizcesi",
    category: "LANGUAGE",
    jobFamilies: "SALES_MARKETING,SUPPLY_CHAIN,MANAGEMENT,QUALITY,FINANCE,IT,HR",
    description: "Correspondence and meetings with buyers, in writing that carries.",
  },
  {
    key: "OPERATIONAL_TURKISH",
    name: "Operational Turkish",
    nameAr: "التركية للعمل",
    nameTr: "Operasyonel Türkçe",
    category: "LANGUAGE",
    jobFamilies: "SUPPLY_CHAIN,PRODUCTION,MANAGEMENT,SALES_MARKETING",
    description: "Enough Turkish to work with the Istanbul office without an interpreter.",
  },
];

/**
 * The baseline every job in a family carries, before its own requirements.
 * Kept small on purpose: a requirement nobody means is a gap nobody acts on.
 */
const FAMILY_BASE: Record<string, Record<string, number>> = {
  PRODUCTION: { WORKPLACE_SAFETY: 3, LEAN_5S: 3, PROBLEM_SOLVING: 3 },
  QUALITY: { WORKPLACE_SAFETY: 3, SPEC_READING: 3, DEFECT_RCA: 3 },
  SUPPLY_CHAIN: { WORKPLACE_SAFETY: 2, EXCEL: 3, ERP_OPERATION: 3 },
  FINANCE: { EXCEL: 4, ERP_OPERATION: 3, REPORTING: 3 },
  HR: { WORKPLACE_SAFETY: 2, SOCIAL_COMPLIANCE: 3, REPORTING: 3 },
  IT: { DATA_ANALYSIS: 3, PROBLEM_SOLVING: 4 },
  SALES_MARKETING: { BUSINESS_ENGLISH: 4, SPEC_READING: 3, REPORTING: 3 },
  MANAGEMENT: { REPORTING: 4, DATA_ANALYSIS: 3, PERFORMANCE_CONVERSATIONS: 4 },
};

/** Added to every job title marked managerial, on top of its family baseline. */
const MANAGERIAL: Record<string, number> = {
  TEAM_LEADERSHIP: 4,
  PERFORMANCE_CONVERSATIONS: 4,
  CAPACITY_PLANNING: 3,
};

/** What the job itself needs. Overrides the baseline where they overlap. */
const BY_TITLE: Record<string, Record<string, number>> = {
  // The first rungs of the production ladder: what an operator is expected to
  // do alone, and what a senior operator adds — teaching it to the next one.
  "Sewing Machine Operator": { MACHINE_SETUP: 2, INLINE_QC: 2, LEAN_5S: 2, WORKPLACE_SAFETY: 3 },
  "Senior Operator": { MACHINE_SETUP: 3, INLINE_QC: 3, LEAN_5S: 3, WORKPLACE_SAFETY: 3, ON_JOB_TRAINING: 2 },
  "Industrial Engineer": { LINE_BALANCING: 5, SMV: 5, TIME_MOTION: 5, CAPACITY_PLANNING: 4, EXCEL: 4, POWER_BI: 3 },
  "Line Leader": { LINE_BALANCING: 3, INLINE_QC: 3, ON_JOB_TRAINING: 3, TEAM_LEADERSHIP: 3, MACHINE_SETUP: 2 },
  "Production Supervisor": {
    LINE_BALANCING: 4,
    CAPACITY_PLANNING: 3,
    INLINE_QC: 3,
    TEAM_LEADERSHIP: 4,
    ON_JOB_TRAINING: 4,
    EXCEL: 3,
  },
  "Production Manager": { LINE_BALANCING: 4, SMV: 4, CAPACITY_PLANNING: 5, PRODUCTION_SCHEDULING: 4, POWER_BI: 3 },
  "Maintenance Technician": {
    MACHINE_SETUP: 4,
    PREVENTIVE_MAINTENANCE: 4,
    MECHANICAL_FAULTS: 4,
    ELECTRICAL_FAULTS: 3,
  },
  "Maintenance Supervisor": {
    MACHINE_SETUP: 5,
    PREVENTIVE_MAINTENANCE: 5,
    MECHANICAL_FAULTS: 4,
    ELECTRICAL_FAULTS: 4,
    ON_JOB_TRAINING: 3,
  },
  "Quality Inspector": { AQL_INSPECTION: 4, INLINE_QC: 4, SPEC_READING: 4, FABRIC_INSPECTION: 3 },
  "Quality Engineer": { AQL_INSPECTION: 4, DEFECT_RCA: 5, SPEC_READING: 4, DATA_ANALYSIS: 3, CHEMICAL_AWARENESS: 3 },
  "Quality Manager": { AQL_INSPECTION: 4, DEFECT_RCA: 5, SOCIAL_COMPLIANCE: 4, CHEMICAL_AWARENESS: 3, POWER_BI: 3 },
  "Production Planner": { PRODUCTION_SCHEDULING: 5, CAPACITY_PLANNING: 4, SMV: 3, EXCEL: 4 },
  "Planning Manager": { PRODUCTION_SCHEDULING: 5, CAPACITY_PLANNING: 5, POWER_BI: 4, BUSINESS_ENGLISH: 3 },
  "Logistics Coordinator": { ERP_OPERATION: 4, BUSINESS_ENGLISH: 3, OPERATIONAL_TURKISH: 2 },
  "Procurement Officer": { ERP_OPERATION: 4, BUSINESS_ENGLISH: 3, FABRIC_INSPECTION: 2, OPERATIONAL_TURKISH: 2 },
  "Store Keeper": { ERP_OPERATION: 3, FABRIC_INSPECTION: 2, WORKPLACE_SAFETY: 3 },
  "Warehouse Supervisor": { ERP_OPERATION: 4, WORKPLACE_SAFETY: 4, TEAM_LEADERSHIP: 3 },
  "Supply Chain Manager": { PRODUCTION_SCHEDULING: 4, CAPACITY_PLANNING: 4, BUSINESS_ENGLISH: 4, POWER_BI: 3 },
  Merchandiser: { SPEC_READING: 4, BUSINESS_ENGLISH: 4, ERP_OPERATION: 3, PRODUCTION_SCHEDULING: 3 },
  "Sales Executive": { BUSINESS_ENGLISH: 4, REPORTING: 3, SPEC_READING: 3 },
  "Commercial Manager": { BUSINESS_ENGLISH: 5, SPEC_READING: 3, DATA_ANALYSIS: 3 },
  Accountant: { EXCEL: 4, ERP_OPERATION: 4 },
  "Senior Accountant": { EXCEL: 5, ERP_OPERATION: 4, REPORTING: 4 },
  "Cost Analyst": { EXCEL: 5, SMV: 3, DATA_ANALYSIS: 4, POWER_BI: 3 },
  "Treasury Officer": { EXCEL: 4, ERP_OPERATION: 3, REPORTING: 3 },
  "Finance Manager": { EXCEL: 5, DATA_ANALYSIS: 4, POWER_BI: 4, REPORTING: 5 },
  "HR Business Partner": { SOCIAL_COMPLIANCE: 4, PERFORMANCE_CONVERSATIONS: 4, REPORTING: 3 },
  "Payroll Officer": { EXCEL: 4, ERP_OPERATION: 4, SOCIAL_COMPLIANCE: 3 },
  "Recruitment Specialist": { REPORTING: 3, PERFORMANCE_CONVERSATIONS: 3 },
  "Learning & Development Specialist": { ON_JOB_TRAINING: 5, PERFORMANCE_CONVERSATIONS: 4, REPORTING: 4 },
  "HR Manager": { SOCIAL_COMPLIANCE: 5, PERFORMANCE_CONVERSATIONS: 5, REPORTING: 4 },
  "Data Analyst": { DATA_ANALYSIS: 5, POWER_BI: 5, EXCEL: 5, REPORTING: 4 },
  "Software Developer": { PROBLEM_SOLVING: 4, DATA_ANALYSIS: 3 },
  "IT Support Specialist": { PROBLEM_SOLVING: 4, ERP_OPERATION: 3 },
  "System Administrator": { PROBLEM_SOLVING: 4, WORKPLACE_SAFETY: 2 },
  "IT Manager": { PROBLEM_SOLVING: 4, DATA_ANALYSIS: 4, REPORTING: 4 },
  "Chief Executive Officer": { CAPACITY_PLANNING: 4, BUSINESS_ENGLISH: 5, DATA_ANALYSIS: 4 },
  "Chief Operating Officer": { CAPACITY_PLANNING: 5, PRODUCTION_SCHEDULING: 4, BUSINESS_ENGLISH: 4, POWER_BI: 3 },
};

/**
 * A requirement of 4 or more is critical: at that point the job is not being
 * done without it, rather than being done less well. Derived rather than listed
 * so the two can never disagree.
 */
const CRITICAL_AT = 4;

export async function seedSkills(prisma: Db) {
  for (const [i, s] of SKILLS.entries()) {
    const data = { ...s, order: i };
    await prisma.skill.upsert({ where: { key: s.key }, update: data, create: data });
  }

  const skills = await prisma.skill.findMany({ select: { id: true, key: true } });
  const byKey = new Map(skills.map((s) => [s.key, s.id]));
  const jobTitles = await prisma.jobTitle.findMany({
    select: { id: true, name: true, jobFamily: true, isManagerial: true },
  });

  let requirements = 0;
  for (const job of jobTitles) {
    const writes = requirementWrites(prisma, job, byKey);
    await prisma.$transaction(writes);
    requirements += writes.length - 1;
  }

  return { skills: SKILLS.length, requirements };
}

type TitleShape = { id: string; name: string; jobFamily: string; isManagerial: boolean };

/**
 * One title's requirements, rewritten in a single transaction — what saving a
 * title in /admin/org needs, without re-running the whole catalogue.
 */
export async function syncTitleRequirements(prisma: Db, jobTitleId: string) {
  const [job, skills] = await Promise.all([
    prisma.jobTitle.findUnique({
      where: { id: jobTitleId },
      select: { id: true, name: true, jobFamily: true, isManagerial: true },
    }),
    prisma.skill.findMany({ select: { id: true, key: true } }),
  ]);
  if (!job) return;
  await prisma.$transaction(requirementWrites(prisma, job, new Map(skills.map((s) => [s.key, s.id]))));
}

function requirementWrites(prisma: Db, job: TitleShape, byKey: Map<string, string>) {
  {
    const wanted: Record<string, number> = {
      ...(FAMILY_BASE[job.jobFamily] ?? {}),
      ...(job.isManagerial ? MANAGERIAL : {}),
      ...(BY_TITLE[job.name] ?? {}),
    };

    // Requirements are derived from the title's family and flags, which an
    // administrator can change in /admin/org. Anything the current derivation
    // no longer produces is removed, or a title moved from Production to Quality
    // would carry line balancing as a requirement for good. Safe because no
    // screen edits requirements directly — if one is ever added, this has to
    // learn to leave its rows alone.
    const wantedIds = Object.keys(wanted)
      .map((key) => byKey.get(key))
      .filter((id): id is string => !!id);
    return [
      prisma.jobTitleSkill.deleteMany({ where: { jobTitleId: job.id, skillId: { notIn: wantedIds } } }),
      // A key that no longer exists is not a reason to fail the seed.
      ...Object.entries(wanted).flatMap(([key, requiredLevel]) => {
        const skillId = byKey.get(key);
        if (!skillId) return [];
        const data = { requiredLevel, isCritical: requiredLevel >= CRITICAL_AT };
        return [
          prisma.jobTitleSkill.upsert({
            where: { jobTitleId_skillId: { jobTitleId: job.id, skillId } },
            update: data,
            create: { jobTitleId: job.id, skillId, ...data },
          }),
        ];
      }),
    ];
  }
}

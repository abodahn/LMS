import type { Db } from "./client";

/**
 * Career ladders, and which roles are critical.
 *
 * Ladders follow how people actually move at a garment manufacturer: an
 * operator becomes a senior operator before they lead a line, and a line leader
 * supervises before they manage production. They are a starting point for HR to
 * correct, not a statement of policy — every rung is an ordinary job title, and
 * the requirements that measure readiness are the same ones the skills matrix
 * already uses.
 *
 * Critical roles are those whose vacancy would stop work. The defaults below
 * are the obvious ones — the people a line, a shift or a function cannot run
 * without — and an administrator can change any of them in /admin/org.
 */

/** Titles a ladder needs that the organisation seed does not have. */
const EXTRA_TITLES = [
  { name: "Sewing Machine Operator", jobFamily: "PRODUCTION", departmentCode: "PRD" },
  { name: "Senior Operator", jobFamily: "PRODUCTION", departmentCode: "PRD" },
];

type Ladder = {
  key: string;
  name: string;
  nameAr: string;
  nameTr: string;
  jobFamily: string;
  steps: string[];
};

const LADDERS: Ladder[] = [
  {
    key: "PRODUCTION",
    name: "Production",
    nameAr: "الإنتاج",
    nameTr: "Üretim",
    jobFamily: "PRODUCTION",
    steps: ["Sewing Machine Operator", "Senior Operator", "Line Leader", "Production Supervisor", "Production Manager"],
  },
  {
    key: "QUALITY",
    name: "Quality",
    nameAr: "الجودة",
    nameTr: "Kalite",
    jobFamily: "QUALITY",
    steps: ["Quality Inspector", "Quality Engineer", "Quality Manager"],
  },
  {
    key: "MAINTENANCE",
    name: "Maintenance",
    nameAr: "الصيانة",
    nameTr: "Bakım",
    jobFamily: "PRODUCTION",
    steps: ["Maintenance Technician", "Maintenance Supervisor"],
  },
  {
    key: "INDUSTRIAL_ENGINEERING",
    name: "Industrial engineering",
    nameAr: "الهندسة الصناعية",
    nameTr: "Endüstri mühendisliği",
    jobFamily: "PRODUCTION",
    steps: ["Industrial Engineer", "Production Manager"],
  },
  {
    key: "PLANNING",
    name: "Planning",
    nameAr: "التخطيط",
    nameTr: "Planlama",
    jobFamily: "SUPPLY_CHAIN",
    steps: ["Production Planner", "Planning Manager"],
  },
  {
    key: "WAREHOUSE",
    name: "Warehouse and supply chain",
    nameAr: "المخازن وسلسلة الإمداد",
    nameTr: "Depo ve tedarik zinciri",
    jobFamily: "SUPPLY_CHAIN",
    steps: ["Store Keeper", "Warehouse Supervisor", "Supply Chain Manager"],
  },
  {
    key: "PROCUREMENT",
    name: "Procurement and logistics",
    nameAr: "المشتريات والخدمات اللوجستية",
    nameTr: "Satın alma ve lojistik",
    jobFamily: "SUPPLY_CHAIN",
    steps: ["Procurement Officer", "Supply Chain Manager"],
  },
  {
    key: "FINANCE",
    name: "Finance",
    nameAr: "المالية",
    nameTr: "Finans",
    jobFamily: "FINANCE",
    steps: ["Accountant", "Senior Accountant", "Finance Manager"],
  },
  {
    key: "HR",
    name: "Human resources",
    nameAr: "الموارد البشرية",
    nameTr: "İnsan kaynakları",
    jobFamily: "HR",
    steps: ["Recruitment Specialist", "HR Business Partner", "HR Manager"],
  },
  {
    key: "IT",
    name: "Information technology",
    nameAr: "تقنية المعلومات",
    nameTr: "Bilgi teknolojileri",
    jobFamily: "IT",
    steps: ["IT Support Specialist", "System Administrator", "IT Manager"],
  },
  {
    key: "COMMERCIAL",
    name: "Commercial",
    nameAr: "التجاري",
    nameTr: "Ticari",
    jobFamily: "SALES_MARKETING",
    steps: ["Merchandiser", "Commercial Manager"],
  },
];

/** Roles whose vacancy would stop work — a default, editable per title. */
const CRITICAL = [
  "Line Leader",
  "Production Supervisor",
  "Production Manager",
  "Maintenance Supervisor",
  "Quality Manager",
  "Planning Manager",
  "Supply Chain Manager",
  "Finance Manager",
  "HR Manager",
  "IT Manager",
];

const CRITICAL_APPLIED = "careers.criticalDefaultsApplied";

/**
 * Each ladder is written once, the first time its key is missing, and never
 * touched again. Titles are matched by name only at that moment: after it the
 * steps point at title ids, so an administrator renaming "Senior Operator" in
 * /admin/org renames it on the ladder too, and a later boot does not recreate
 * the old name and move the ladder onto an empty copy.
 */
export async function seedCareers(prisma: Db) {
  const existing = new Set((await prisma.careerPath.findMany({ select: { key: true } })).map((p) => p.key));
  const missing = LADDERS.filter((l) => !existing.has(l.key));

  // Extra titles only for a ladder being written now, for the same reason.
  const needed = new Set(missing.flatMap((l) => l.steps));
  for (const t of EXTRA_TITLES.filter((t) => needed.has(t.name))) {
    const dept = await prisma.department.findUnique({ where: { code: t.departmentCode } });
    await prisma.jobTitle.upsert({
      where: { name: t.name },
      update: {},
      create: { name: t.name, jobFamily: t.jobFamily, departmentId: dept?.id ?? null },
    });
  }

  const titles = await prisma.jobTitle.findMany({ select: { id: true, name: true } });
  const byName = new Map(titles.map((t) => [t.name, t.id]));

  let written = 0;
  let steps = 0;
  for (const ladder of missing) {
    const ids = ladder.steps.map((n) => byName.get(n));
    // A ladder missing a rung is skipped whole rather than seeded with a gap
    // that would make "next role" skip a step people actually take.
    const absent = ladder.steps.filter((_, i) => !ids[i]);
    if (absent.length) {
      console.warn(`career ladder ${ladder.key} skipped: no job title named ${absent.join(", ")}`);
      continue;
    }
    const { steps: _steps, ...fields } = ladder;
    void _steps;
    await prisma.careerPath.create({
      data: {
        ...fields,
        order: LADDERS.indexOf(ladder),
        steps: { create: ids.map((jobTitleId, order) => ({ jobTitleId: jobTitleId!, order })) },
      },
    });
    written++;
    steps += ids.length;
  }

  // The critical defaults are applied once per database, and the fact that
  // they were is recorded. After that the flags are an administrator's: running
  // this again must not put back a flag somebody removed on purpose.
  const applied = await prisma.systemSetting.findUnique({ where: { key: CRITICAL_APPLIED } });
  if (!applied) {
    await prisma.jobTitle.updateMany({ where: { name: { in: CRITICAL } }, data: { isCritical: true } });
    await prisma.systemSetting.create({
      data: {
        key: CRITICAL_APPLIED,
        value: JSON.stringify(new Date().toISOString()),
        type: "STRING",
        group: "CAREERS",
        label: "Critical role defaults applied",
        description: "When the default critical roles were first set. Removing it would apply them again on the next boot.",
      },
    });
  }

  return { ladders: written, existing: existing.size, steps };
}

import type { Db } from "./client";

export const DEPARTMENTS = [
  { code: "FIN", name: "Finance", nameAr: "المالية", nameTr: "Finans", jobFamily: "FINANCE", order: 1 },
  { code: "HR", name: "Human Resources", nameAr: "الموارد البشرية", nameTr: "İnsan Kaynakları", jobFamily: "HR", order: 2 },
  { code: "IT", name: "Information Technology", nameAr: "تقنية المعلومات", nameTr: "Bilgi Teknolojileri", jobFamily: "IT", order: 3 },
  { code: "PRD", name: "Production", nameAr: "الإنتاج", nameTr: "Üretim", jobFamily: "PRODUCTION", order: 4 },
  { code: "QLT", name: "Quality", nameAr: "الجودة", nameTr: "Kalite", jobFamily: "QUALITY", order: 5 },
  { code: "SCM", name: "Supply Chain", nameAr: "سلسلة الإمداد", nameTr: "Tedarik Zinciri", jobFamily: "SUPPLY_CHAIN", order: 6 },
  { code: "WHS", name: "Warehouse", nameAr: "المستودعات", nameTr: "Depo", jobFamily: "SUPPLY_CHAIN", order: 7 },
  { code: "MNT", name: "Maintenance", nameAr: "الصيانة", nameTr: "Bakım", jobFamily: "PRODUCTION", order: 8 },
  { code: "PLN", name: "Planning", nameAr: "التخطيط", nameTr: "Planlama", jobFamily: "SUPPLY_CHAIN", order: 9 },
  { code: "COM", name: "Commercial", nameAr: "التجاري", nameTr: "Ticari", jobFamily: "SALES_MARKETING", order: 10 },
  { code: "MGT", name: "Management", nameAr: "الإدارة العليا", nameTr: "Üst Yönetim", jobFamily: "MANAGEMENT", order: 11 },
];

const SECTIONS: Record<string, string[]> = {
  FIN: ["Accounting", "Costing", "Treasury"],
  HR: ["Recruitment", "Payroll", "Learning & Development"],
  IT: ["Applications", "Infrastructure", "Data"],
  PRD: ["Cutting", "Sewing", "Finishing"],
  QLT: ["Inline Inspection", "Final Audit", "Lab"],
  SCM: ["Procurement", "Logistics", "Imports"],
  WHS: ["Raw Material Store", "Finished Goods"],
  MNT: ["Mechanical", "Electrical"],
  PLN: ["Production Planning", "Material Planning"],
  COM: ["Merchandising", "Sales"],
  MGT: ["Executive Office"],
};

const JOB_TITLES: { name: string; jobFamily: string; departmentCode: string; isTechnical?: boolean; isManagerial?: boolean }[] = [
  { name: "Chief Executive Officer", jobFamily: "MANAGEMENT", departmentCode: "MGT", isManagerial: true },
  { name: "Chief Operating Officer", jobFamily: "MANAGEMENT", departmentCode: "MGT", isManagerial: true },
  { name: "Finance Manager", jobFamily: "FINANCE", departmentCode: "FIN", isManagerial: true },
  { name: "Senior Accountant", jobFamily: "FINANCE", departmentCode: "FIN" },
  { name: "Accountant", jobFamily: "FINANCE", departmentCode: "FIN" },
  { name: "Cost Analyst", jobFamily: "FINANCE", departmentCode: "FIN" },
  { name: "Treasury Officer", jobFamily: "FINANCE", departmentCode: "FIN" },
  { name: "HR Manager", jobFamily: "HR", departmentCode: "HR", isManagerial: true },
  { name: "HR Business Partner", jobFamily: "HR", departmentCode: "HR" },
  { name: "Recruitment Specialist", jobFamily: "HR", departmentCode: "HR" },
  { name: "Payroll Officer", jobFamily: "HR", departmentCode: "HR" },
  { name: "Learning & Development Specialist", jobFamily: "HR", departmentCode: "HR" },
  { name: "IT Manager", jobFamily: "IT", departmentCode: "IT", isTechnical: true, isManagerial: true },
  { name: "Software Developer", jobFamily: "IT", departmentCode: "IT", isTechnical: true },
  { name: "Data Analyst", jobFamily: "IT", departmentCode: "IT", isTechnical: true },
  { name: "System Administrator", jobFamily: "IT", departmentCode: "IT", isTechnical: true },
  { name: "IT Support Specialist", jobFamily: "IT", departmentCode: "IT", isTechnical: true },
  { name: "Production Manager", jobFamily: "PRODUCTION", departmentCode: "PRD", isManagerial: true },
  { name: "Production Supervisor", jobFamily: "PRODUCTION", departmentCode: "PRD" },
  { name: "Line Leader", jobFamily: "PRODUCTION", departmentCode: "PRD" },
  { name: "Industrial Engineer", jobFamily: "PRODUCTION", departmentCode: "PRD" },
  { name: "Quality Manager", jobFamily: "QUALITY", departmentCode: "QLT", isManagerial: true },
  { name: "Quality Engineer", jobFamily: "QUALITY", departmentCode: "QLT" },
  { name: "Quality Inspector", jobFamily: "QUALITY", departmentCode: "QLT" },
  { name: "Supply Chain Manager", jobFamily: "SUPPLY_CHAIN", departmentCode: "SCM", isManagerial: true },
  { name: "Procurement Officer", jobFamily: "SUPPLY_CHAIN", departmentCode: "SCM" },
  { name: "Logistics Coordinator", jobFamily: "SUPPLY_CHAIN", departmentCode: "SCM" },
  { name: "Warehouse Supervisor", jobFamily: "SUPPLY_CHAIN", departmentCode: "WHS", isManagerial: true },
  { name: "Store Keeper", jobFamily: "SUPPLY_CHAIN", departmentCode: "WHS" },
  { name: "Maintenance Supervisor", jobFamily: "PRODUCTION", departmentCode: "MNT", isManagerial: true },
  { name: "Maintenance Technician", jobFamily: "PRODUCTION", departmentCode: "MNT" },
  { name: "Planning Manager", jobFamily: "SUPPLY_CHAIN", departmentCode: "PLN", isManagerial: true },
  { name: "Production Planner", jobFamily: "SUPPLY_CHAIN", departmentCode: "PLN" },
  { name: "Commercial Manager", jobFamily: "SALES_MARKETING", departmentCode: "COM", isManagerial: true },
  { name: "Merchandiser", jobFamily: "SALES_MARKETING", departmentCode: "COM" },
  { name: "Sales Executive", jobFamily: "SALES_MARKETING", departmentCode: "COM" },
];

const LOCATIONS = [
  { name: "Head Office", country: "Egypt" },
  { name: "Factory 1", country: "Egypt" },
  { name: "Factory 2", country: "Egypt" },
  { name: "Istanbul Office", country: "Türkiye" },
];

export async function seedOrg(prisma: Db) {
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({ where: { code: d.code }, update: d, create: d });
    for (const name of SECTIONS[d.code] ?? []) {
      await prisma.section.upsert({
        where: { departmentId_name: { departmentId: dept.id, name } },
        update: {},
        create: { name, departmentId: dept.id },
      });
    }
  }

  for (const l of LOCATIONS) {
    await prisma.location.upsert({ where: { name: l.name }, update: l, create: l });
  }

  for (const j of JOB_TITLES) {
    const dept = await prisma.department.findUnique({ where: { code: j.departmentCode } });
    const data = {
      name: j.name,
      jobFamily: j.jobFamily,
      isTechnical: j.isTechnical ?? false,
      isManagerial: j.isManagerial ?? false,
      departmentId: dept?.id ?? null,
    };
    await prisma.jobTitle.upsert({ where: { name: j.name }, update: data, create: data });
  }
}

import "server-only";
import { prisma } from "./db";
import { getCourseEffectiveness, getExecutiveStats } from "./analytics";
import { EMPLOYEE_IMPORT_COLUMNS } from "./import/employees";
import { COURSE_IMPORT_COLUMNS } from "./import/courses";
import type { SheetColumn } from "./spreadsheet";

export type ReportKey =
  | "employees"
  | "employee-learning"
  | "department-learning"
  | "course-completion"
  | "assessment"
  | "skills-gap"
  | "ai-readiness"
  | "certificates"
  | "overdue"
  | "training-hours"
  | "improvement"
  | "course-effectiveness"
  | "audit"
  | "employee-template"
  | "course-template";

export type ReportDefinition = {
  key: ReportKey;
  labelKey: string;
  permission: "reports.export" | "users.view" | "audit.view";
  description: string;
};

export const REPORTS: ReportDefinition[] = [
  { key: "employee-learning", labelKey: "reports.employeeLearning", permission: "reports.export", description: "One row per employee: level, hours, progress, certificates." },
  { key: "department-learning", labelKey: "reports.departmentLearning", permission: "reports.export", description: "Participation, completion and competency averages by department." },
  { key: "course-completion", labelKey: "reports.courseCompletion", permission: "reports.export", description: "Enrolment and completion for every course in the catalog." },
  { key: "assessment", labelKey: "reports.assessment", permission: "reports.export", description: "Every graded attempt with its competency breakdown." },
  { key: "skills-gap", labelKey: "reports.skillsGap", permission: "reports.export", description: "Company and department averages per competency, weakest first." },
  { key: "ai-readiness", labelKey: "reports.aiReadiness", permission: "reports.export", description: "The readiness index with every component and weight." },
  { key: "certificates", labelKey: "reports.certificate", permission: "reports.export", description: "Issued certificates with verification codes." },
  { key: "overdue", labelKey: "reports.overdue", permission: "reports.export", description: "Learning past its due date, by employee and manager." },
  { key: "training-hours", labelKey: "reports.trainingHours", permission: "reports.export", description: "Learning hours by employee, including imported history." },
  { key: "improvement", labelKey: "reports.improvement", permission: "reports.export", description: "Baseline versus latest assessment, per competency." },
  { key: "course-effectiveness", labelKey: "reports.courseEffectiveness", permission: "reports.export", description: "Completion, dropout, ratings and review status per course." },
];

export type ReportData = { filename: string; sheets: { name: string; columns: SheetColumn[]; rows: Record<string, unknown>[] }[] };

const stamp = () => new Date().toISOString().slice(0, 10);

export async function buildReport(key: ReportKey): Promise<ReportData> {
  switch (key) {
    case "course-template":
      return {
        filename: `course-import-template-${stamp()}`,
        sheets: [
          {
            name: "Courses",
            columns: COURSE_IMPORT_COLUMNS.map((c) => ({ header: c, key: c })),
            rows: [
              {
                Code: "EXT-EXAMPLE-01",
                Title: "Example: Practical AI for Operations",
                URL: "https://www.example.com/courses/practical-ai",
                Provider: "Coursera",
                Platform: "Coursera",
                Description: "What the course teaches, in one or two sentences.",
                Language: "en",
                Subtitles: "ar, tr",
                Level: "L1",
                Difficulty: "Beginner",
                Hours: "6",
                Free: "Yes",
                Price: "",
                Certificate: "Yes",
                Category: "FOUNDATIONS",
                Competencies: "WORKPLACE, PROMPTING",
                Departments: "PRD, QLT",
                "Job Families": "PRODUCTION, QUALITY",
                Goals: "REPORTS, DATA_ANALYSIS",
                Prerequisites: "",
                Technical: "No",
                Rating: "4.7",
                "Title AR": "مثال: الذكاء الاصطناعي العملي للعمليات",
                "Title TR": "Örnek: Operasyonlar için Pratik Yapay Zekâ",
                "Description AR": "ما تعلّمه الدورة، في جملة أو جملتين.",
                "Description TR": "Kursun ne öğrettiği, bir iki cümleyle.",
              },
            ],
          },
        ],
      };

    case "employee-template":
      return {
        filename: `employee-import-template-${stamp()}`,
        sheets: [
          {
            name: "Employees",
            columns: EMPLOYEE_IMPORT_COLUMNS.map((c) => ({ header: c, key: c })),
            rows: [
              {
                "Employee ID": "TC-9001",
                "Full Name": "Example Employee",
                Email: "example.employee@tcgarments.com",
                Department: "Finance",
                Section: "Accounting",
                "Job Title": "Accountant",
                "Manager Employee ID": "TC-1001",
                Location: "Head Office",
                Language: "en",
                "Years Experience": "3",
                "AI Experience": "NONE",
                Technical: "No",
                "Weekly Hours": "2",
              },
            ],
          },
        ],
      };

    case "employees":
    case "employee-learning": {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          jobTitle: true,
          manager: { select: { fullName: true } },
          profile: true,
          enrollments: { include: { course: true } },
          certificates: { where: { status: "VALID" } },
          attempts: {
            where: { status: "GRADED", definition: { type: { in: ["PLACEMENT", "FINAL"] } } },
            orderBy: { submittedAt: "desc" },
            include: { level: true },
          },
        },
        orderBy: { employeeCode: "asc" },
      });

      return {
        filename: `employee-learning-${stamp()}`,
        sheets: [
          {
            name: "Employee learning",
            columns: [
              { header: "Employee ID", key: "code" },
              { header: "Name", key: "name", width: 26 },
              { header: "Email", key: "email", width: 30 },
              { header: "Department", key: "department" },
              { header: "Job title", key: "jobTitle", width: 26 },
              { header: "Manager", key: "manager", width: 24 },
              { header: "Status", key: "status", width: 12 },
              { header: "AI level", key: "level", width: 10 },
              { header: "Latest score %", key: "score", width: 14 },
              { header: "Courses enrolled", key: "enrolled", width: 16 },
              { header: "Courses completed", key: "completed", width: 18 },
              { header: "Progress %", key: "progress", width: 12 },
              { header: "Learning hours", key: "hours", width: 14 },
              { header: "Certificates", key: "certificates", width: 12 },
              { header: "Weekly hours", key: "weekly", width: 12 },
            ],
            rows: users.map((u) => {
              const totalHours = u.enrollments.reduce((s, e) => s + e.course.estimatedHours, 0);
              const doneHours = u.enrollments.reduce(
                (s, e) => s + (e.course.estimatedHours * e.progressPercent) / 100,
                0,
              );
              return {
                code: u.employeeCode,
                name: u.fullName,
                email: u.email,
                department: u.department?.name ?? "",
                jobTitle: u.jobTitle?.name ?? "",
                manager: u.manager?.fullName ?? "",
                status: u.status,
                level: u.attempts[0]?.level?.code ?? "",
                score: u.attempts[0] ? Math.round(u.attempts[0].percentage) : "",
                enrolled: u.enrollments.length,
                completed: u.enrollments.filter((e) => e.status === "COMPLETED").length,
                progress: totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100),
                hours: Math.round((u.enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60) * 10) / 10,
                certificates: u.certificates.length,
                weekly: u.profile?.weeklyLearningHours ?? "",
              };
            }),
          },
        ],
      };
    }

    case "department-learning": {
      const stats = await getExecutiveStats();
      const competencyKeys = Object.keys(stats.heatmap[0]?.scores ?? {});
      return {
        filename: `department-learning-${stamp()}`,
        sheets: [
          {
            name: "Departments",
            columns: [
              { header: "Department", key: "name", width: 26 },
              { header: "Headcount", key: "headcount" },
              { header: "Assessed", key: "assessed" },
              { header: "Participation %", key: "participation", width: 16 },
              { header: "Completion %", key: "completion", width: 14 },
              { header: "Learning hours", key: "hours", width: 14 },
              { header: "Average score", key: "overall", width: 14 },
              ...competencyKeys.map((k) => ({ header: k, key: k, width: 16 })),
            ],
            rows: stats.heatmap.map((d) => ({
              name: d.name,
              headcount: d.headcount,
              assessed: d.assessed,
              participation: d.headcount === 0 ? 0 : Math.round((d.assessed / d.headcount) * 100),
              completion: d.completion,
              hours: d.hours,
              overall: d.overall,
              ...d.scores,
            })),
          },
        ],
      };
    }

    case "course-completion":
    case "course-effectiveness": {
      const rows = await getCourseEffectiveness();
      return {
        filename: `course-effectiveness-${stamp()}`,
        sheets: [
          {
            name: "Courses",
            columns: [
              { header: "Code", key: "code" },
              { header: "Title", key: "title", width: 40 },
              { header: "Provider", key: "provider", width: 24 },
              { header: "Status", key: "status", width: 12 },
              { header: "Enrolled", key: "enrolled" },
              { header: "Started", key: "started" },
              { header: "Completed", key: "completed" },
              { header: "Completion %", key: "completionRate", width: 14 },
              { header: "Dropout %", key: "dropoutRate", width: 12 },
              { header: "Avg minutes", key: "averageMinutes", width: 13 },
              { header: "Usefulness /5", key: "usefulness", width: 14 },
              { header: "Relevance /5", key: "relevance", width: 13 },
              { header: "Would recommend %", key: "recommendRate", width: 18 },
              { header: "Departments reached", key: "departments", width: 18 },
              { header: "Last verified", key: "lastVerified", width: 14 },
              { header: "Needs review", key: "needsReview", width: 13 },
            ],
            rows: rows.map((r) => ({
              ...r,
              lastVerified: r.lastVerifiedAt ? r.lastVerifiedAt.toISOString().slice(0, 10) : "",
              needsReview: r.needsReview ? "Yes" : "No",
            })),
          },
        ],
      };
    }

    case "assessment": {
      const attempts = await prisma.assessmentAttempt.findMany({
        where: { status: "GRADED" },
        include: {
          user: { include: { department: true } },
          definition: true,
          level: true,
          scores: { include: { competency: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
      const competencies = await prisma.competency.findMany({ orderBy: { order: "asc" } });

      return {
        filename: `assessments-${stamp()}`,
        sheets: [
          {
            name: "Attempts",
            columns: [
              { header: "Employee ID", key: "code" },
              { header: "Name", key: "name", width: 26 },
              { header: "Department", key: "department" },
              { header: "Assessment", key: "assessment", width: 30 },
              { header: "Submitted", key: "submitted", width: 14 },
              { header: "Score %", key: "score" },
              { header: "Passed", key: "passed" },
              { header: "Level", key: "level" },
              { header: "Baseline", key: "baseline" },
              ...competencies.map((c) => ({ header: c.name, key: c.key, width: 18 })),
            ],
            rows: attempts.map((a) => ({
              code: a.user.employeeCode,
              name: a.user.fullName,
              department: a.user.department?.name ?? "",
              assessment: a.definition.title,
              submitted: a.submittedAt?.toISOString().slice(0, 10) ?? "",
              score: Math.round(a.percentage),
              passed: a.passed ? "Yes" : "No",
              level: a.level?.code ?? "",
              baseline: a.isBaseline ? "Yes" : "No",
              ...Object.fromEntries(a.scores.map((s) => [s.competency.key, Math.round(s.percentage)])),
            })),
          },
        ],
      };
    }

    case "skills-gap": {
      const stats = await getExecutiveStats();
      return {
        filename: `skills-gap-${stamp()}`,
        sheets: [
          {
            name: "Company",
            columns: [
              { header: "Competency", key: "name", width: 32 },
              { header: "Company average %", key: "average", width: 20 },
            ],
            rows: [...stats.competencies].sort((a, b) => a.average - b.average),
          },
          {
            name: "By department",
            columns: [
              { header: "Department", key: "department", width: 26 },
              { header: "Competency", key: "competency", width: 32 },
              { header: "Average %", key: "average" },
            ],
            rows: stats.heatmap.flatMap((d) =>
              Object.entries(d.scores).map(([competency, average]) => ({
                department: d.name,
                competency,
                average: average ?? "",
              })),
            ),
          },
        ],
      };
    }

    case "ai-readiness": {
      const stats = await getExecutiveStats();
      return {
        filename: `ai-readiness-${stamp()}`,
        sheets: [
          {
            name: "Index",
            columns: [
              { header: "Component", key: "label", width: 28 },
              { header: "Weight %", key: "weight" },
              { header: "Value %", key: "value" },
              { header: "Points", key: "contribution" },
            ],
            rows: [
              ...stats.readiness.components,
              { label: "AI Readiness Index", weight: "", value: "", contribution: stats.readiness.score },
            ],
          },
          {
            name: "Totals",
            columns: [
              { header: "Metric", key: "metric", width: 30 },
              { header: "Value", key: "value" },
            ],
            rows: Object.entries(stats.totals).map(([metric, value]) => ({ metric, value })),
          },
        ],
      };
    }

    case "certificates": {
      const certificates = await prisma.certificate.findMany({
        include: { user: { include: { department: true } }, level: true, course: true },
        orderBy: { issuedAt: "desc" },
      });
      return {
        filename: `certificates-${stamp()}`,
        sheets: [
          {
            name: "Certificates",
            columns: [
              { header: "Certificate ID", key: "code", width: 20 },
              { header: "Employee ID", key: "employeeCode" },
              { header: "Name", key: "name", width: 26 },
              { header: "Department", key: "department" },
              { header: "Type", key: "type" },
              { header: "Title", key: "title", width: 40 },
              { header: "Level", key: "level" },
              { header: "Hours", key: "hours" },
              { header: "Issued", key: "issued", width: 14 },
              { header: "Status", key: "status" },
            ],
            rows: certificates.map((c) => ({
              code: c.code,
              employeeCode: c.user.employeeCode,
              name: c.user.fullName,
              department: c.user.department?.name ?? "",
              type: c.type,
              title: c.title,
              level: c.level?.code ?? "",
              hours: c.learningHours,
              issued: c.issuedAt.toISOString().slice(0, 10),
              status: c.status,
            })),
          },
        ],
      };
    }

    case "overdue": {
      const overdue = await prisma.enrollment.findMany({
        where: { dueAt: { lt: new Date() }, status: { in: ["NOT_STARTED", "IN_PROGRESS", "PENDING_VERIFICATION"] } },
        include: {
          course: true,
          user: { include: { department: true, manager: { select: { fullName: true } } } },
        },
        orderBy: { dueAt: "asc" },
      });
      return {
        filename: `overdue-learning-${stamp()}`,
        sheets: [
          {
            name: "Overdue",
            columns: [
              { header: "Employee ID", key: "code" },
              { header: "Name", key: "name", width: 26 },
              { header: "Department", key: "department" },
              { header: "Manager", key: "manager", width: 24 },
              { header: "Course", key: "course", width: 40 },
              { header: "Due", key: "due", width: 14 },
              { header: "Days overdue", key: "days", width: 14 },
              { header: "Progress %", key: "progress" },
            ],
            rows: overdue.map((e) => ({
              code: e.user.employeeCode,
              name: e.user.fullName,
              department: e.user.department?.name ?? "",
              manager: e.user.manager?.fullName ?? "",
              course: e.course.title,
              due: e.dueAt?.toISOString().slice(0, 10) ?? "",
              days: e.dueAt ? Math.floor((Date.now() - e.dueAt.getTime()) / 86400000) : "",
              progress: Math.round(e.progressPercent),
            })),
          },
        ],
      };
    }

    case "training-hours": {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          enrollments: { include: { course: true } },
          historicalTraining: true,
          activities: true,
        },
        orderBy: { employeeCode: "asc" },
      });
      return {
        filename: `training-hours-${stamp()}`,
        sheets: [
          {
            name: "Training hours",
            columns: [
              { header: "Employee ID", key: "code" },
              { header: "Name", key: "name", width: 26 },
              { header: "Department", key: "department" },
              { header: "Academy hours", key: "academy", width: 15 },
              { header: "Historical hours", key: "historical", width: 16 },
              { header: "Total hours", key: "total", width: 13 },
              { header: "Active days", key: "days", width: 12 },
            ],
            rows: users.map((u) => {
              const academy = u.enrollments.reduce((s, e) => s + e.timeSpentMinutes, 0) / 60;
              const historical = u.historicalTraining.reduce((s, h) => s + h.hours, 0);
              return {
                code: u.employeeCode,
                name: u.fullName,
                department: u.department?.name ?? "",
                academy: Math.round(academy * 10) / 10,
                historical: Math.round(historical * 10) / 10,
                total: Math.round((academy + historical) * 10) / 10,
                days: u.activities.length,
              };
            }),
          },
        ],
      };
    }

    case "improvement": {
      const attempts = await prisma.assessmentAttempt.findMany({
        where: { status: "GRADED", definition: { type: { in: ["PLACEMENT", "FINAL"] } } },
        include: {
          user: { include: { department: true } },
          scores: { include: { competency: true } },
        },
        orderBy: { submittedAt: "asc" },
      });
      const competencies = await prisma.competency.findMany({ where: { isCore: true }, orderBy: { order: "asc" } });

      const byUser = new Map<string, { first: (typeof attempts)[number]; last: (typeof attempts)[number] }>();
      for (const a of attempts) {
        const entry = byUser.get(a.userId);
        if (!entry) byUser.set(a.userId, { first: a, last: a });
        else entry.last = a;
      }

      return {
        filename: `before-after-${stamp()}`,
        sheets: [
          {
            name: "Improvement",
            columns: [
              { header: "Employee ID", key: "code" },
              { header: "Name", key: "name", width: 26 },
              { header: "Department", key: "department" },
              { header: "Before %", key: "before" },
              { header: "After %", key: "after" },
              { header: "Change", key: "change" },
              ...competencies.flatMap((c) => [
                { header: `${c.name} before`, key: `${c.key}_before`, width: 20 },
                { header: `${c.name} after`, key: `${c.key}_after`, width: 20 },
              ]),
            ],
            rows: [...byUser.values()]
              .filter((v) => v.first.id !== v.last.id)
              .map((v) => ({
                code: v.first.user.employeeCode,
                name: v.first.user.fullName,
                department: v.first.user.department?.name ?? "",
                before: Math.round(v.first.percentage),
                after: Math.round(v.last.percentage),
                change: Math.round(v.last.percentage - v.first.percentage),
                ...Object.fromEntries(
                  competencies.flatMap((c) => [
                    [`${c.key}_before`, Math.round(v.first.scores.find((s) => s.competencyId === c.id)?.percentage ?? 0)],
                    [`${c.key}_after`, Math.round(v.last.scores.find((s) => s.competencyId === c.id)?.percentage ?? 0)],
                  ]),
                ),
              })),
          },
        ],
      };
    }

    case "audit": {
      const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
      return {
        filename: `audit-log-${stamp()}`,
        sheets: [
          {
            name: "Audit",
            columns: [
              { header: "When", key: "when", width: 20 },
              { header: "Actor", key: "actor", width: 26 },
              { header: "Action", key: "action", width: 28 },
              { header: "Entity", key: "entity", width: 22 },
              { header: "Entity ID", key: "entityId", width: 26 },
              { header: "Summary", key: "summary", width: 40 },
              { header: "IP", key: "ip", width: 16 },
            ],
            rows: logs.map((l) => ({
              when: l.createdAt.toISOString().replace("T", " ").slice(0, 19),
              actor: l.actorName ?? l.actorId ?? "system",
              action: l.action,
              entity: l.entity,
              entityId: l.entityId ?? "",
              summary: l.summary ?? "",
              ip: l.ip ?? "",
            })),
          },
        ],
      };
    }
  }
}

import type { RoleKey } from "./constants";

/**
 * Permission catalog. Every server-side mutation and every admin page checks a
 * key from this list — never a role name directly — so a Super Admin can
 * re-map role permissions without code changes.
 */
export const PERMISSIONS = {
  // learning (everyone)
  "learning.self": "Access own learning, assessments and certificates",
  // team
  "team.view": "View own team's learning progress",
  "team.nominate": "Nominate or recommend learning for team members",
  "team.review": "Review team capstone submissions",
  "team.assess": "Rate a team member's skills and agree a development plan",
  "succession.view": "View succession readiness for critical roles",
  "engagement.manage": "Create and run team and department challenges",
  // people admin
  "users.view": "View all employees",
  "users.manage": "Create, edit, deactivate employees",
  "users.import": "Bulk import employees",
  "org.manage": "Manage departments, sections, job titles, locations",
  // catalog
  "catalog.view": "View full course catalog administration",
  "catalog.manage": "Create and edit courses, modules, lessons",
  "catalog.verify": "Run the course review / verification workflow",
  "paths.manage": "Create and edit learning paths",
  // assessments
  "assessments.manage": "Create assessments, questions and question banks",
  "assessments.grade": "Grade written answers and override scores",
  // learning administration
  "enrollments.manage": "Assign learning and manage enrolments",
  "sessions.manage": "Schedule instructor-led sessions and record attendance",
  "proofs.verify": "Verify external completion proofs",
  "certificates.manage": "Issue and revoke certificates",
  "history.import": "Import historical training records",
  // analytics
  "analytics.team": "Team analytics",
  "analytics.department": "Department analytics",
  "analytics.executive": "Executive / company-wide analytics",
  "reports.export": "Export reports",
  // content
  "content.manage": "Manage prompt library, use cases and opportunities",
  "opportunities.manage": "Manage the AI opportunity pipeline",
  // system
  "settings.manage": "Manage system settings and branding",
  "recommendation.manage": "Manage recommendation weights and mappings",
  "integrations.manage": "Manage AI provider, SMTP and integrations",
  "audit.view": "View audit logs",
  "roles.manage": "Manage roles and permissions",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  EMPLOYEE: ["learning.self"],
  MANAGER: ["learning.self", "team.view", "team.nominate", "team.review", "team.assess", "analytics.team"],
  ADMIN: [
    "learning.self",
    "team.view",
    "team.nominate",
    "team.review",
    "team.assess",
    "users.view",
    "succession.view",
    "engagement.manage",
    "users.manage",
    "users.import",
    "org.manage",
    "catalog.view",
    "catalog.manage",
    "catalog.verify",
    "paths.manage",
    "assessments.manage",
    "assessments.grade",
    "enrollments.manage",
    "sessions.manage",
    "proofs.verify",
    "certificates.manage",
    "history.import",
    "analytics.team",
    "analytics.department",
    "analytics.executive",
    "reports.export",
    "content.manage",
    "opportunities.manage",
    "recommendation.manage",
  ],
  SUPER_ADMIN: Object.keys(PERMISSIONS) as PermissionKey[],
};

export const ROLE_META: Record<RoleKey, { name: string; rank: number; description: string }> = {
  EMPLOYEE: { name: "Employee", rank: 10, description: "Learner access only" },
  MANAGER: { name: "Manager", rank: 20, description: "Learner access plus team development view" },
  ADMIN: { name: "Learning / HR Admin", rank: 30, description: "Runs the academy day to day" },
  SUPER_ADMIN: { name: "Super Admin", rank: 40, description: "Full system control" },
};

export function permissionsForRoles(roles: string[]): Set<PermissionKey> {
  const out = new Set<PermissionKey>();
  for (const r of roles) {
    for (const p of ROLE_PERMISSIONS[r as RoleKey] ?? []) out.add(p);
  }
  return out;
}

export function hasPermission(perms: Iterable<string>, key: PermissionKey): boolean {
  for (const p of perms) if (p === key) return true;
  return false;
}

/** Highest-ranked role decides which dashboard someone lands on. */
export function primaryRole(roles: string[]): RoleKey {
  let best: RoleKey = "EMPLOYEE";
  for (const r of roles) {
    const meta = ROLE_META[r as RoleKey];
    if (meta && meta.rank > ROLE_META[best].rank) best = r as RoleKey;
  }
  return best;
}

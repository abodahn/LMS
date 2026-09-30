import type { PermissionKey } from "./rbac";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
  permission?: PermissionKey;
  exact?: boolean;
};

/**
 * Employee navigation is deliberately five items. Everything else lives under
 * a visually secondary "Explore" group or inside the dashboard's next-step
 * card — non-technical users should never have to hunt through a menu.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: "home", exact: true },
  { href: "/learning", labelKey: "nav.myLearning", icon: "graduation-cap" },
  { href: "/assessments", labelKey: "nav.assessments", icon: "clipboard-check" },
  { href: "/certificates", labelKey: "nav.certificates", icon: "award" },
  { href: "/profile", labelKey: "nav.profile", icon: "user" },
];

export const EXPLORE_NAV: NavItem[] = [
  { href: "/catalog", labelKey: "nav.catalog", icon: "library" },
  // Classroom training sits here rather than in the primary five: those five
  // are the constraint that keeps this from reading like an HR portal, and
  // sessions are something a learner seeks out rather than checks daily.
  { href: "/sessions", labelKey: "nav.sessions", icon: "calendar-days" },
  { href: "/use-cases", labelKey: "nav.useCases", icon: "lightbulb" },
  { href: "/prompts", labelKey: "nav.prompts", icon: "message-square-quote" },
  { href: "/toolbox", labelKey: "nav.toolbox", icon: "briefcase" },
  // Skills sits here rather than in the primary five for the same reason as
  // sessions: the five are the constraint that keeps this from reading like an
  // HR portal, and a skills matrix is something you open when a manager asks
  // you to, not daily.
  { href: "/skills", labelKey: "nav.skills", icon: "target" },
  { href: "/calendar", labelKey: "nav.calendar", icon: "calendar" },
  { href: "/passport", labelKey: "nav.passport", icon: "id-card" },
];

export const ROLE_NAV: NavItem[] = [
  { href: "/team", labelKey: "nav.team", icon: "users", permission: "team.view" },
  { href: "/admin", labelKey: "nav.admin", icon: "settings", permission: "users.view" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", labelKey: "admin.dashboard", icon: "layout-dashboard", exact: true },
  { href: "/admin/people", labelKey: "admin.people", icon: "users", permission: "users.view" },
  { href: "/admin/org", labelKey: "admin.departments", icon: "building-2", permission: "org.manage" },
  { href: "/admin/courses", labelKey: "admin.catalog", icon: "library", permission: "catalog.view" },
  { href: "/admin/paths", labelKey: "admin.paths", icon: "route", permission: "paths.manage" },
  { href: "/admin/assessments", labelKey: "admin.assessments", icon: "clipboard-list", permission: "assessments.manage" },
  { href: "/admin/questions", labelKey: "admin.questions", icon: "list-checks", permission: "assessments.manage" },
  { href: "/admin/recommendation", labelKey: "admin.recommendation", icon: "sparkles", permission: "recommendation.manage" },
  { href: "/admin/enrollments", labelKey: "admin.enrollments", icon: "user-check", permission: "enrollments.manage" },
  { href: "/admin/sessions", labelKey: "admin.sessions", icon: "calendar-days", permission: "sessions.manage" },
  { href: "/admin/certificates", labelKey: "admin.certificates", icon: "award", permission: "certificates.manage" },
  { href: "/admin/analytics", labelKey: "executive.title", icon: "bar-chart-3", permission: "analytics.executive" },
  { href: "/admin/reports", labelKey: "admin.reports", icon: "file-spreadsheet", permission: "reports.export" },
  { href: "/admin/content", labelKey: "admin.content", icon: "lightbulb", permission: "content.manage" },
  { href: "/admin/opportunities", labelKey: "admin.opportunities", icon: "target", permission: "opportunities.manage" },
  { href: "/admin/settings", labelKey: "admin.settings", icon: "settings", permission: "settings.manage" },
  { href: "/admin/audit", labelKey: "admin.audit", icon: "scroll-text", permission: "audit.view" },
];

export function visibleNav(items: NavItem[], permissions: string[]) {
  return items.filter((i) => !i.permission || permissions.includes(i.permission));
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LevelChip } from "@/components/level-chip";
import { UserForm } from "../user-form";
import { loadUserFormOptions } from "../user-data";

export const metadata: Metadata = { title: "Employee" };

export default async function EditUserPage({ params }: PageProps<"/admin/people/[userId]">) {
  const admin = await requirePermission("users.view");
  const { userId } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [user, options] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        enrollments: { include: { course: true }, orderBy: { order: "asc" } },
        certificates: { where: { status: "VALID" } },
        attempts: {
          where: { status: "GRADED" },
          orderBy: { submittedAt: "desc" },
          include: { level: true, definition: true },
        },
        loginAudits: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    loadUserFormOptions(locale),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/people"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.people")}
      </Link>

      <SectionHeading
        title={user.fullName}
        subtitle={`${user.employeeCode} · ${user.email}`}
        action={<StatusPill status={user.status} />}
      />

      <UserForm
        user={{
          id: user.id,
          employeeCode: user.employeeCode,
          fullName: user.fullName,
          email: user.email,
          departmentId: user.departmentId,
          sectionId: user.sectionId,
          jobTitleId: user.jobTitleId,
          locationId: user.locationId,
          managerId: user.managerId,
          preferredLanguage: user.preferredLanguage,
          status: user.status,
          roles: user.roles.map((r) => r.role.key),
        }}
        {...options}
        canManage={admin.permissions.includes("users.manage")}
        canGrantPrivileged={admin.permissions.includes("roles.manage")}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("passport.assessmentHistory")}</h2>
          <ul className="mt-3 space-y-2">
            {user.attempts.length === 0 ? (
              <li className="text-sm text-[var(--brand-muted)]">{t("common.noResults")}</li>
            ) : (
              user.attempts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--brand-ink)]">{a.definition.title}</span>
                    <span className="text-[var(--brand-muted)]">{formatDate(a.submittedAt, locale)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {a.level ? <LevelChip code={a.level.code} size="sm" /> : null}
                    <span className="tabular-nums">{Math.round(a.percentage)}%</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("nav.myLearning")}</h2>
          <ul className="mt-3 space-y-2">
            {user.enrollments.length === 0 ? (
              <li className="text-sm text-[var(--brand-muted)]">{t("common.noResults")}</li>
            ) : (
              user.enrollments.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-[var(--brand-ink)]">{e.course.title}</span>
                    <span className="text-[var(--brand-muted)]">{formatHours(e.course.estimatedHours)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-[var(--brand-muted)]">{Math.round(e.progressPercent)}%</span>
                    <StatusPill status={e.status} />
                  </span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-[13px] text-[var(--brand-muted)]">
            {t("certificates.title")}: {user.certificates.length}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.loginHistory")}</h2>
        <ul className="mt-3 space-y-1.5">
          {user.loginAudits.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="text-[var(--brand-muted)]">{formatDate(l.createdAt, locale)}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[var(--brand-muted)]">{l.ip ?? "—"}</span>
                <StatusPill status={l.success ? "COMPLETED" : "REJECTED"} label={l.success ? "OK" : l.reason ?? "Failed"} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

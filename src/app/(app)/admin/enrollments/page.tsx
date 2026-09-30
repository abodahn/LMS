import type { Metadata } from "next";
import { FileCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { Card, EmptyState, SectionHeading, StatCard, StatusPill, TableShell } from "@/components/ui/primitives";
import { JOB_FAMILIES } from "@/lib/constants";
import { AssignForm, RecurringForm } from "./assign-form";
import { RecurringList } from "./recurring-list";
import { ProofReview } from "./proof-review";
import { HistoryForm } from "./history-form";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Enrolments" };

export default async function EnrollmentsPage() {
  const admin = await requirePermission("enrollments.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [departments, proofs, overdue, counts, jobTitles, locations, shifts, recurring] =
    await Promise.all([
    prisma.department
      .findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } })
      .then((rows) => localizeNames(rows, locale)),
    prisma.externalCompletionProof.findMany({
      where: { status: "PENDING" },
      include: {
        enrollment: { include: { course: true, user: { select: { fullName: true, employeeCode: true } } } },
      },
      orderBy: { uploadedAt: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { dueAt: { lt: new Date() }, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
      include: { course: true, user: { select: { fullName: true, employeeCode: true } } },
      orderBy: { dueAt: "asc" },
      take: 25,
    }),
    prisma.enrollment.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.jobTitle.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Shifts are free text on the employee record rather than a table, so the
    // list is whatever is actually in use — which is also the only list that
    // can assign to anybody.
    prisma.user
      .findMany({
        where: { shift: { not: null }, deletedAt: null },
        distinct: ["shift"],
        select: { shift: true },
        orderBy: { shift: "asc" },
      })
      .then((rows) => rows.map((r) => r.shift).filter((s): s is string => !!s)),
    prisma.recurringAssignment.findMany({
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const countOf = (status: string) => counts.find((c) => c.status === status)?._count.status ?? 0;

  const audienceOptions = {
    departments,
    jobFamilies: JOB_FAMILIES.map((f) => ({ value: f, label: t(`jobFamily.${f}`) })),
    jobTitles,
    locations,
    shifts,
  };

  /** A rule stores an id; the list has to show the thing it points at. */
  const audienceLabel = (audience: string, value: string | null) => {
    if (!value) return null;
    if (audience === "DEPARTMENT") return departments.find((d) => d.id === value)?.name ?? value;
    if (audience === "JOB_TITLE") return jobTitles.find((j) => j.id === value)?.name ?? value;
    if (audience === "LOCATION") return locations.find((l) => l.id === value)?.name ?? value;
    if (audience === "JOB_FAMILY") return t(`jobFamily.${value}`);
    return value;
  };

  return (
    <div className="space-y-6">
      <SectionHeading title={t("admin.enrollments")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("common.notStarted")} value={countOf("NOT_STARTED")} />
        <StatCard label={t("common.inProgress")} value={countOf("IN_PROGRESS")} />
        <StatCard label={t("common.completed")} value={countOf("COMPLETED")} />
        <StatCard
          label={t("learning.proofPending")}
          value={proofs.length}
          tone={proofs.length > 0 ? "warning" : "neutral"}
        />
      </div>

      <AssignForm options={audienceOptions} />

      <RecurringForm options={audienceOptions} />

      {recurring.length > 0 ? (
        <RecurringList
          rules={recurring.map((r) => ({
            id: r.id,
            course: r.course.title,
            audience: r.audience,
            audienceValue: audienceLabel(r.audience, r.audienceValue),
            everyMonths: r.everyMonths,
            isActive: r.isActive,
            lastRunAt: r.lastRunAt ? formatDate(r.lastRunAt, locale) : null,
          }))}
        />
      ) : null}

      <section>
        <h2 className="section-title mb-3">{t("learning.uploadProof")}</h2>
        {proofs.length === 0 ? (
          <EmptyState title={t("common.noResults")} body={t("action.allDoneBody")} icon={<FileCheck size={20} />} />
        ) : (
          <ul className="space-y-3">
            {proofs.map((p) => (
              <li key={p.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-[var(--brand-ink)]">
                        {p.enrollment.user.fullName}
                      </h3>
                      <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                        {p.enrollment.user.employeeCode} · {p.enrollment.course.title} ·{" "}
                        {formatDate(p.uploadedAt, locale)}
                      </p>
                      {p.note ? (
                        <p className="mt-1.5 text-[13px] text-[var(--brand-charcoal)]">{p.note}</p>
                      ) : null}
                    </div>
                    <a
                      href={`/api/files/${p.filePath}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-canvas)]"
                    >
                      {p.fileName}
                    </a>
                  </div>
                  <div className="mt-4 border-t border-[var(--brand-line)] pt-4">
                    <ProofReview proofId={p.id} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {admin.permissions.includes("history.import") ? <HistoryForm /> : null}

      <section>
        <h2 className="section-title mb-3">{t("manager.overdue")}</h2>
        {overdue.length === 0 ? (
          <EmptyState title={t("common.noResults")} />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>{t("common.employee")}</th>
                <th>{t("common.course")}</th>
                <th>{t("learning.expectedCompletion")}</th>
                <th>{t("common.progress")}</th>
                <th>{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">{e.user.fullName}</span>
                    <span className="block text-[12px] text-[var(--brand-muted)]">{e.user.employeeCode}</span>
                  </td>
                  <td className="text-[13px]">{e.course.title}</td>
                  <td className="text-[13px] text-[var(--brand-red)]">{formatDate(e.dueAt, locale)}</td>
                  <td className="tabular-nums">{Math.round(e.progressPercent)}%</td>
                  <td>
                    <StatusPill status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>
    </div>
  );
}

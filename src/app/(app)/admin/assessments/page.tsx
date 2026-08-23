import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { humanizeKey } from "@/lib/utils";
import { Badge, EmptyState, SectionHeading, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Assessments" };

export default async function AdminAssessmentsPage() {
  await requirePermission("assessments.manage");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const definitions = await prisma.assessmentDefinition.findMany({
    include: {
      pools: { include: { competency: true } },
      course: { select: { title: true } },
      _count: { select: { attempts: true, questions: true } },
    },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.assessments")}
        subtitle={`${definitions.length} definitions`}
        action={
          <>
            <LinkButton href="/admin/questions" variant="secondary" size="sm">
              {t("admin.questions")}
            </LinkButton>
            <LinkButton href="/admin/assessments/new" size="sm">
              <Plus size={15} />
              {t("common.create")}
            </LinkButton>
          </>
        }
      />

      {definitions.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>{t("common.details")}</th>
              <th>{t("form.type")}</th>
              <th>{t("form.questions")}</th>
              <th>{t("form.pass")}</th>
              <th>{t("form.attempts")}</th>
              <th>{t("common.status")}</th>
              <th className="text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="block font-medium text-[var(--brand-ink)]">{d.title}</span>
                  <span className="block font-mono text-[11px] text-[var(--brand-muted)]">
                    {d.key}
                    {d.course ? ` · ${d.course.title}` : ""}
                  </span>
                </td>
                <td>
                  <Badge tone="muted">{humanizeKey(d.type)}</Badge>
                  {d.isAdaptive ? (
                    <Badge tone="info" className="ms-1">{t("form.adaptive")}</Badge>
                  ) : null}
                </td>
                <td className="tabular-nums">
                  {d.questionCount}
                  <span className="ms-1 text-[11px] text-[var(--brand-muted)]">
                    ({d.pools.length ? `${d.pools.length} pools` : `${d._count.questions} fixed`})
                  </span>
                </td>
                <td className="tabular-nums">{d.passingScore}%</td>
                <td className="tabular-nums">{d._count.attempts}</td>
                <td>
                  <StatusPill status={d.status} />
                </td>
                <td className="text-end">
                  <Link
                    href={`/admin/assessments/${d.id}`}
                    className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                  >
                    {t("common.edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

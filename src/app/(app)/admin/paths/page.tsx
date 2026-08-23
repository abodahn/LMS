import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatHours, humanizeKey, parseJson } from "@/lib/utils";
import { Badge, EmptyState, SectionHeading, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Learning paths" };

export default async function PathsPage() {
  await requirePermission("paths.manage");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const paths = await prisma.learningPath.findMany({
    include: {
      targetLevel: true,
      phases: true,
      courses: { include: { course: { select: { estimatedHours: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.paths")}
        subtitle={`${paths.length} paths`}
        action={
          <LinkButton href="/admin/paths/new" size="sm">
            <Plus size={15} />
            {t("common.create")}
          </LinkButton>
        }
      />

      {paths.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>{t("admin.paths")}</th>
              <th>{t("form.audience")}</th>
              <th>{t("form.phases")}</th>
              <th>{t("common.courses")}</th>
              <th>{t("common.hours")}</th>
              <th>{t("common.status")}</th>
              <th className="text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((p) => {
              const hours = p.courses.reduce((s, c) => s + c.course.estimatedHours, 0);
              const families = parseJson<string[]>(p.jobFamilies, []);
              return (
                <tr key={p.id}>
                  <td>
                    <span className="block font-medium text-[var(--brand-ink)]">
                      {p.title}
                      {p.isDefault ? (
                        <Badge tone="brand" className="ms-2">
                          Default
                        </Badge>
                      ) : null}
                      {p.isTechnical ? (
                        <Badge tone="info" className="ms-1">{t("form.technical")}</Badge>
                      ) : null}
                    </span>
                    <span className="block font-mono text-[11px] text-[var(--brand-muted)]">{p.code}</span>
                  </td>
                  <td className="text-[13px]">
                    {p.audienceLevel ?? "—"}
                    {families.length > 0 ? (
                      <span className="block text-[11px] text-[var(--brand-muted)]">
                        {families.map(humanizeKey).join(", ")}
                      </span>
                    ) : null}
                  </td>
                  <td className="tabular-nums">{p.phases.length}</td>
                  <td className="tabular-nums">{p.courses.length}</td>
                  <td className="tabular-nums">
                    {formatHours(hours)}
                    <span className="ms-1 text-[11px] text-[var(--brand-muted)]">
                      / {formatHours(p.targetHours)}
                    </span>
                  </td>
                  <td>
                    <StatusPill status={p.status} />
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/paths/${p.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

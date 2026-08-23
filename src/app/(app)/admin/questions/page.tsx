import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { humanizeKey } from "@/lib/utils";
import { Badge, EmptyState, SectionHeading, StatCard, StatusPill, TableShell } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { localizeNames, localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "Question bank" };

const PAGE_SIZE = 25;

export default async function QuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  await requirePermission("assessments.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const competency = typeof params.competency === "string" ? params.competency : "";
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";
  const type = typeof params.type === "string" ? params.type : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = {
    ...(competency ? { competencyId: competency } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(type ? { type } : {}),
    ...(q ? { OR: [{ text: { contains: q } }, { explanation: { contains: q } }] } : {}),
  };

  const [competencies, total, questions, byDifficulty] = await Promise.all([
    prisma.competency.findMany({ orderBy: { order: "asc" } }).then((rows) => localizeNames(rows, locale)),
    prisma.assessmentQuestion.count({ where }),
    prisma.assessmentQuestion.findMany({
      where,
      include: { competency: true, bank: true, _count: { select: { options: true } } },
      orderBy: [{ competencyId: "asc" }, { difficulty: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.assessmentQuestion.groupBy({ by: ["difficulty"], _count: { difficulty: true } }),
  ]);

  const countOf = (d: string) => byDifficulty.find((b) => b.difficulty === d)?._count.difficulty ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.questions")}
        subtitle={`${total} questions`}
        action={
          <LinkButton href="/admin/questions/new" size="sm">
            <Plus size={15} />
            {t("common.create")}
          </LinkButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("form.easy")} value={countOf("EASY")} />
        <StatCard label={t("form.medium")} value={countOf("MEDIUM")} />
        <StatCard label={t("form.advanced")} value={countOf("ADVANCED")} />
      </div>

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "competency",
            label: "Competency",
            value: competency,
            options: competencies.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: "difficulty",
            label: "Difficulty",
            value: difficulty,
            options: ["EASY", "MEDIUM", "ADVANCED"].map((d) => ({ value: d, label: humanizeKey(d) })),
          },
          {
            name: "type",
            label: "Type",
            value: type,
            options: ["SINGLE", "MULTI", "TRUE_FALSE", "SCENARIO", "SHORT_ANSWER", "PROMPT_TASK"].map((x) => ({
              value: x,
              label: humanizeKey(x),
            })),
          },
        ]}
      />

      {questions.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>{t("form.question")}</th>
                <th>{t("form.competency")}</th>
                <th>{t("form.type")}</th>
                <th>{t("form.difficulty")}</th>
                <th>{t("form.options")}</th>
                <th>{t("common.status")}</th>
                <th className="text-end">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((qq) => (
                <tr key={qq.id}>
                  <td className="max-w-96">
                    <span className="line-clamp-2 text-[13px] text-[var(--brand-ink)]">{qq.text}</span>
                    {qq.bank ? (
                      <span className="mt-0.5 block text-[11px] text-[var(--brand-muted)]">{qq.bank.name}</span>
                    ) : null}
                  </td>
                  <td className="text-[13px]">{localized(qq.competency, "name", locale)}</td>
                  <td>
                    <Badge tone="muted">{humanizeKey(qq.type)}</Badge>
                  </td>
                  <td className="text-[13px]">{humanizeKey(qq.difficulty)}</td>
                  <td className="tabular-nums">{qq._count.options}</td>
                  <td>
                    <StatusPill status={qq.status} />
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/questions/${qq.id}`}
                      className="text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
        </>
      )}
    </div>
  );
}

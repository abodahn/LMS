import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { humanizeKey } from "@/lib/utils";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { CopyButton } from "@/components/copy-button";
import { FilterBar } from "@/components/filter-bar";
import { SavePromptButton } from "./save-button";

export const metadata: Metadata = { title: "Prompt Library" };

export default async function PromptsPage({ searchParams }: PageProps<"/prompts">) {
  await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const department = typeof params.department === "string" ? params.department : "";
  const task = typeof params.task === "string" ? params.task : "";
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";

  const [departments, prompts, saved] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.promptTemplate.findMany({
      where: {
        isApproved: true,
        ...(department ? { departmentId: department } : {}),
        ...(task ? { taskCategory: task } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }, { description: { contains: q } }] } : {}),
      },
      include: { department: true },
      orderBy: { title: "asc" },
    }),
    prisma.savedPrompt.findMany({ where: { userId: (await requireUser()).id }, select: { promptId: true } }),
  ]);

  const categories = [...new Set((await prisma.promptTemplate.findMany({ select: { taskCategory: true } })).map((p) => p.taskCategory))];
  const savedIds = new Set(saved.map((s) => s.promptId));

  return (
    <div className="space-y-6">
      <SectionHeading title={t("prompts.title")} subtitle={t("prompts.subtitle")} />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "department",
            label: t("prompts.byDepartment"),
            value: department,
            options: departments.map((d) => ({ value: d.id, label: localized(d, "name", locale) })),
          },
          {
            name: "task",
            label: t("prompts.byTask"),
            value: task,
            options: categories.map((c) => ({ value: c, label: humanizeKey(c) })),
          },
          {
            name: "difficulty",
            label: t("prompts.byDifficulty"),
            value: difficulty,
            options: ["EASY", "MEDIUM", "ADVANCED"].map((d) => ({ value: d, label: humanizeKey(d) })),
          },
        ]}
      />

      {prompts.length === 0 ? (
        <EmptyState title={t("common.noResults")} body={t("useCases.empty")} />
      ) : (
        <ul className="grid gap-4">
          {prompts.map((p) => (
            <li key={p.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">
                      {localized(p, "title", locale)}
                    </h2>
                    {p.description ? (
                      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{p.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.department ? <Badge tone="neutral">{localized(p.department, "name", locale)}</Badge> : null}
                    <Badge tone="muted">{humanizeKey(p.taskCategory)}</Badge>
                  </div>
                </div>

                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--brand-charcoal)]">
                  {localized(p, "body", locale)}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton text={localized(p, "body", locale)} label={t("prompts.copyPrompt")} />
                  <SavePromptButton
                    promptId={p.id}
                    saved={savedIds.has(p.id)}
                    label={t("prompts.saveToToolbox")}
                    savedLabel={t("prompts.saved")}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { Clock, Lightbulb, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { humanizeKey, parseJson } from "@/lib/utils";
import { Alert, Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { CopyButton } from "@/components/copy-button";
import { FilterBar } from "@/components/filter-bar";
import { BookmarkButton } from "./bookmark-button";

export const metadata: Metadata = { title: "AI Use Cases" };

export default async function UseCasesPage({ searchParams }: PageProps<"/use-cases">) {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const params = await searchParams;

  const department = typeof params.department === "string" ? params.department : "";
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [departments, useCases, bookmarks] = await Promise.all([
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.aiUseCase.findMany({
      where: {
        status: "PUBLISHED",
        ...(department ? { departmentId: department } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { problem: { contains: q } }, { howAiHelps: { contains: q } }] } : {}),
      },
      include: { department: true },
      orderBy: { title: "asc" },
    }),
    prisma.useCaseBookmark.findMany({ where: { userId: user.id }, select: { useCaseId: true } }),
  ]);

  const saved = new Set(bookmarks.map((b) => b.useCaseId));

  return (
    <div className="space-y-6">
      <SectionHeading title={t("useCases.title")} subtitle={t("useCases.subtitle")} />

      <FilterBar
        searchPlaceholder={t("common.search")}
        filters={[
          {
            name: "department",
            label: t("common.department"),
            value: department,
            options: departments.map((d) => ({ value: d.id, label: localized(d, "name", locale) })),
          },
          {
            name: "difficulty",
            label: t("prompts.byDifficulty"),
            value: difficulty,
            options: ["EASY", "MEDIUM", "ADVANCED"].map((d) => ({ value: d, label: humanizeKey(d) })),
          },
        ]}
      />

      {useCases.length === 0 ? (
        <EmptyState title={t("useCases.empty")} icon={<Lightbulb size={20} />} />
      ) : (
        <ul className="grid gap-4">
          {useCases.map((u) => {
            const workflow = parseJson<string[]>(u.workflow, []);
            return (
              <li key={u.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-[var(--brand-ink)]">
                        {localized(u, "title", locale)}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {u.department ? (
                          <Badge tone="neutral">{localized(u.department, "name", locale)}</Badge>
                        ) : null}
                        <Badge tone="muted">{humanizeKey(u.difficulty)}</Badge>
                        {u.estimatedTimeSaved ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--brand-muted)]">
                            <Clock size={12} aria-hidden />
                            {u.estimatedTimeSaved}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <BookmarkButton
                      useCaseId={u.id}
                      bookmarked={saved.has(u.id)}
                      label={t("useCases.bookmark")}
                      savedLabel={t("useCases.bookmarked")}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Section title={t("useCases.problem")}>{u.problem}</Section>
                    <Section title={t("useCases.howAiHelps")}>{u.howAiHelps}</Section>
                  </div>

                  {workflow.length > 0 ? (
                    <div className="mt-4">
                      <p className="section-title">{t("useCases.workflow")}</p>
                      <ol className="mt-2 list-decimal space-y-1 ps-5 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                        {workflow.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <p className="section-title">{t("useCases.examplePrompt")}</p>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--brand-charcoal)]">
                      {u.examplePrompt}
                    </pre>
                    <div className="mt-2">
                      <CopyButton text={u.examplePrompt} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Alert tone="warning" title={t("useCases.dataWarning")} icon={<ShieldAlert size={16} />}>
                      {u.dataSensitivityWarning}
                    </Alert>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="section-title">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">{children}</p>
    </div>
  );
}

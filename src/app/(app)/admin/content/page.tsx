import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { parseJson } from "@/lib/utils";
import { SectionHeading, StatCard } from "@/components/ui/primitives";
import { PromptManager } from "./prompt-manager";
import { UseCaseManager } from "./use-case-manager";
import { localizeNames, localized, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Content" };

export default async function ContentPage() {
  await requirePermission("content.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [departments, prompts, useCases, savedCount, bookmarkCount] = await Promise.all([
    prisma.department
      .findMany({ orderBy: { order: "asc" }, select: { id: true, ...NAME_I18N_SELECT } })
      .then((rows) => localizeNames(rows, locale)),
    prisma.promptTemplate.findMany({ orderBy: { title: "asc" }, include: { department: true } }),
    prisma.aiUseCase.findMany({ orderBy: { title: "asc" }, include: { department: true } }),
    prisma.savedPrompt.count(),
    prisma.useCaseBookmark.count(),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading title={t("admin.content")} subtitle={`${t("prompts.title")} · ${t("useCases.title")}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("prompts.title")} value={prompts.length} />
        <StatCard label={t("useCases.title")} value={useCases.length} />
        <StatCard label={t("toolbox.myPrompts")} value={savedCount} hint={t("form.savedByEmployees")} />
        <StatCard label={t("useCases.bookmarked")} value={bookmarkCount} hint={t("form.bookmarkedByEmployees")} />
      </div>

      <PromptManager
        departments={departments}
        prompts={prompts.map((p) => ({
          id: p.id,
          title: p.title,
          titleAr: p.titleAr ?? "",
          titleTr: p.titleTr ?? "",
          body: p.body,
          description: p.description ?? "",
          departmentId: p.departmentId ?? "",
          departmentName: p.department ? localized(p.department, "name", locale) : null,
          taskCategory: p.taskCategory,
          difficulty: p.difficulty,
          tool: p.tool,
          isApproved: p.isApproved,
        }))}
      />

      <UseCaseManager
        departments={departments}
        useCases={useCases.map((u) => ({
          id: u.id,
          title: u.title,
          titleAr: u.titleAr ?? "",
          departmentId: u.departmentId ?? "",
          departmentName: u.department ? localized(u.department, "name", locale) : null,
          problem: u.problem,
          howAiHelps: u.howAiHelps,
          workflow: parseJson<string[]>(u.workflow, []).join("\n"),
          examplePrompt: u.examplePrompt,
          dataSensitivityWarning: u.dataSensitivityWarning,
          estimatedTimeSaved: u.estimatedTimeSaved ?? "",
          difficulty: u.difficulty,
          status: u.status,
        }))}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Target } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, parseJson } from "@/lib/utils";
import { Card, EmptyState, SectionHeading, StatCard, StatusPill } from "@/components/ui/primitives";
import { OpportunityForm } from "./opportunity-form";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "AI opportunities" };

export default async function OpportunitiesPage() {
  await requirePermission("opportunities.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const opportunities = await prisma.aiOpportunity.findMany({
    include: {
      department: true,
      owner: { select: { fullName: true, employeeCode: true } },
      submission: { select: { content: true, score: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const totalAnnual = opportunities.reduce((s, o) => s + (o.annualHoursSaved ?? 0), 0);
  const totalFinancial = opportunities.reduce((s, o) => s + (o.financialBenefit ?? 0), 0);
  const approved = opportunities.filter((o) => ["APPROVED", "IN_PROGRESS", "DELIVERED"].includes(o.status)).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.opportunities")}
        subtitle={t("form.pipelineNote")}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("common.total")} value={opportunities.length} />
        <StatCard label={t("common.approved")} value={approved} />
        <StatCard label={t("form.hoursSavedYear")} value={Math.round(totalAnnual)} hint={t("form.employeeEstimates")} />
        <StatCard
          label={t("form.financialBenefit")}
          value={totalFinancial > 0 ? Math.round(totalFinancial).toLocaleString() : "—"}
          hint={t("form.enteredByReviewers")}
        />
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          title={t("common.noResults")}
          body="Opportunities appear here when a manager approves a workplace capstone."
          icon={<Target size={20} />}
        />
      ) : (
        <ul className="space-y-4">
          {opportunities.map((o) => {
            const content = parseJson<Record<string, string>>(o.submission?.content ?? "{}", {});
            return (
              <li key={o.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">{o.title}</h2>
                      <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                        {o.department ? localized(o.department, "name", locale) : "—"}
                        {o.owner ? ` · ${o.owner.fullName} (${o.owner.employeeCode})` : ""} ·{" "}
                        {formatDate(o.createdAt, locale)}
                      </p>
                    </div>
                    <StatusPill status={o.status} />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="section-title">{t("useCases.problem")}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">{o.problem}</p>
                    </div>
                    <div>
                      <p className="section-title">{t("capstone.whereAiHelps")}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">{o.opportunity}</p>
                    </div>
                  </div>

                  {content.estimatedBenefit ? (
                    <p className="mt-3 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-3 text-[13px] text-[var(--brand-charcoal)]">
                      <span className="font-semibold">{t("capstone.estimatedBenefit")}: </span>
                      {content.estimatedBenefit}
                    </p>
                  ) : null}

                  <div className="mt-4 border-t border-[var(--brand-line)] pt-4">
                    <OpportunityForm
                      opportunity={{
                        id: o.id,
                        status: o.status,
                        impact: o.impact,
                        complexity: o.complexity,
                        hoursBefore: o.hoursBefore,
                        hoursAfter: o.hoursAfter,
                        hoursSavedMonthly: o.hoursSavedMonthly,
                        financialBenefit: o.financialBenefit,
                        qualityImprovement: o.qualityImprovement ?? "",
                      }}
                    />
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

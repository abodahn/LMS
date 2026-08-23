import type { Metadata } from "next";
import { CircleCheck, CircleX, Sparkles } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { previewRecommendation } from "@/lib/recommendation/service";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { formatHours } from "@/lib/utils";
import { Badge, Card, SectionHeading, StatCard, TableShell } from "@/components/ui/primitives";
import { WeightsForm } from "./weights-form";
import { EmployeePicker } from "./employee-picker";
import { ApplyPathButton } from "./apply-button";

export const metadata: Metadata = { title: "Recommendation engine" };

export default async function RecommendationConsolePage({ searchParams }: PageProps<"/admin/recommendation">) {
  await requirePermission("recommendation.manage");
  const { dict } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);
  const params = await searchParams;
  const userId = typeof params.userId === "string" ? params.userId : "";

  const [weights, employees, settings] = await Promise.all([
    prisma.recommendationWeight.findMany({ orderBy: { weight: "desc" } }),
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, fullName: true, employeeCode: true, department: { select: { name: true } } },
      orderBy: { fullName: "asc" },
    }),
    getSettings(),
  ]);

  const preview = userId ? await previewRecommendation(userId).catch(() => null) : null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("admin.recommendation")}
        subtitle="Deterministic and explainable — every score below is reproducible from these weights."
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.weights")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("admin.weightsHelp")}</p>
        <div className="mt-4">
          <WeightsForm
            weights={weights.map((w) => ({
              key: w.key,
              label: w.label,
              weight: w.weight,
              description: w.description,
            }))}
            targets={{
              target: Number(settings[SETTING_KEYS.TARGET_LEARNING_HOURS]),
              min: Number(settings[SETTING_KEYS.MIN_LEARNING_HOURS]),
              max: Number(settings[SETTING_KEYS.MAX_LEARNING_HOURS]),
            }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.runRecommendation")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("admin.previewOnly")}</p>
        <div className="mt-4">
          <EmployeePicker
            employees={employees.map((e) => ({
              id: e.id,
              label: `${e.fullName} — ${e.employeeCode}${e.department ? ` · ${e.department.name}` : ""}`,
            }))}
            selected={userId}
            label={t("admin.selectEmployee")}
          />
        </div>
      </Card>

      {preview ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={t("common.level")} value={preview.learner.levelCode} />
            <StatCard label={t("admin.totalHours")} value={formatHours(preview.result.totalHours)} />
            <StatCard label={t("admin.recommendedCourses")} value={preview.result.selected.length} />
            <StatCard label={t("assessment.expectedOutcome")} value={preview.result.expectedLevelCode} />
          </div>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.engineInput")}</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
              <Row label={t("common.department")} value={preview.learner.departmentName ?? "—"} />
              <Row label={t("form.jobFamily")} value={preview.learner.jobFamily} />
              <Row label={t("form.technical")} value={preview.learner.isTechnical ? t("common.yes") : t("common.no")} />
              <Row label={t("profile.weeklyAvailability")} value={`${preview.learner.weeklyHours} h`} />
              <Row label={t("common.language")} value={preview.learner.preferredLanguage.toUpperCase()} />
              <Row label={t("profile.learningGoals")} value={preview.learner.goals.join(", ") || "—"} />
              <Row
                label={t("assessment.detailedScores")}
                value={
                  Object.entries(preview.learner.competencyScores)
                    .map(([k, v]) => `${k} ${Math.round(v as number)}`)
                    .join(" · ") || "—"
                }
              />
              <Row label={t("form.programme")} value={preview.result.programTitle ?? "—"} />
              <Row label={t("form.engineVersion")} value={preview.result.engineVersion} />
            </dl>
          </Card>

          <section>
            <h2 className="section-title mb-3">{t("admin.recommendedCourses")}</h2>
            <ol className="space-y-3">
              {preview.result.selected.map((item) => (
                <li key={item.course.id}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="section-title">{item.phase}</p>
                        <h3 className="mt-1 text-[15px] font-semibold text-[var(--brand-ink)]">
                          {item.course.title}
                        </h3>
                        <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                          {item.course.providerName} · {formatHours(item.course.estimatedHours)} ·{" "}
                          {item.course.levelCode ?? "—"}
                        </p>
                      </div>
                      <Badge tone="brand" icon={<Sparkles size={12} />}>
                        {Math.round(item.score)}%
                      </Badge>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-[var(--brand-muted)]">
                            <th className="pb-1 text-start font-medium">{t("form.component")}</th>
                            <th className="pb-1 text-end font-medium">{t("form.raw")}</th>
                            <th className="pb-1 text-end font-medium">{t("form.points")}</th>
                            <th className="pb-1 ps-4 text-start font-medium">{t("form.reason")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.breakdown.map((b) => (
                            <tr key={b.key}>
                              <td className="py-1 text-[var(--brand-ink)]">{b.label}</td>
                              <td className="py-1 text-end tabular-nums text-[var(--brand-muted)]">
                                {b.raw.toFixed(2)}
                              </td>
                              <td className="py-1 text-end tabular-nums font-medium text-[var(--brand-ink)]">
                                {b.contribution.toFixed(1)}
                              </td>
                              <td className="py-1 ps-4 text-[var(--brand-muted)]">{b.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.map((r) => (
                        <li
                          key={r.code}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-canvas)] px-2.5 py-1 text-[12px] text-[var(--brand-charcoal)]"
                        >
                          <CircleCheck size={12} className="text-[var(--brand-success)]" aria-hidden />
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </li>
              ))}
            </ol>

            <div className="mt-4">
              <ApplyPathButton userId={userId} label={t("admin.savePreviewAsPath")} />
            </div>
          </section>

          <section>
            <h2 className="section-title mb-3">{t("admin.rejectedCourses")}</h2>
            <TableShell>
              <thead>
                <tr>
                  <th>{t("common.course")}</th>
                  <th>{t("admin.rejectionReason")}</th>
                </tr>
              </thead>
              <tbody>
                {preview.result.rejected.map((r) => (
                  <tr key={r.courseId}>
                    <td>
                      <span className="block font-medium text-[var(--brand-ink)]">{r.title}</span>
                      <span className="block font-mono text-[11px] text-[var(--brand-muted)]">{r.code}</span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-muted)]">
                        <CircleX size={13} className="text-[var(--brand-red)]" aria-hidden />
                        {r.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--brand-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--brand-ink)]">{value}</dd>
    </div>
  );
}

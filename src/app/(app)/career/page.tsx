import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatHours } from "@/lib/utils";
import { careerView } from "@/lib/careers";
import { coursesForSkill } from "@/lib/skills";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { SkillRow } from "@/components/skill-matrix";
import { RequestGoals } from "./request-goals";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "career.title") };
}

/**
 * Where you are, where your ladder goes, and what stands between you and the
 * next rung. Only ever the viewer's own: nothing here shows anyone else's
 * readiness.
 */
export default async function CareerPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const view = await careerView(user.id);

  if (!view.current) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <SectionHeading title={t("career.title")} />
        <EmptyState title={t("career.noJobTitle")} icon={<Route size={20} />} />
      </div>
    );
  }

  // The courses that close each gap, for the most reachable next role only:
  // a plan for every possible role at once is a plan for none of them.
  const focus = view.next[0];
  const courses = focus
    ? await Promise.all(
        focus.profile.gaps.slice(0, 6).map(async (g) => ({
          skillId: g.skillId,
          courses: await coursesForSkill(g.skillId, g.required, locale),
        })),
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading title={t("career.title")} subtitle={t("career.intro")} />

      {view.ladders.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-[var(--brand-muted)]">{t("career.noLadder", { role: view.current.name })}</p>
        </Card>
      ) : (
        view.ladders.map((ladder) => (
          <Card key={ladder.id} className="p-5">
            <h2 className="text-[12px] font-medium uppercase tracking-wide text-[var(--brand-muted)]">
              {localized(ladder, "name", locale)}
            </h2>
            <ol className="mt-3 flex flex-wrap items-center gap-2" aria-label={localized(ladder, "name", locale)}>
              {ladder.steps.map((s, i) => (
                <li key={s.jobTitleId} className="flex items-center gap-2">
                  <span
                    aria-current={s.isCurrent ? "step" : undefined}
                    className="rounded-[var(--radius-pill)] border px-3 py-1 text-[12px]"
                    style={{
                      borderColor: s.isCurrent ? "var(--brand-ink)" : "var(--brand-line)",
                      background: s.isCurrent ? "var(--brand-ink)" : "transparent",
                      color: s.isCurrent ? "white" : "var(--brand-charcoal)",
                    }}
                  >
                    {s.name}
                  </span>
                  {i < ladder.steps.length - 1 ? (
                    <ArrowRight size={13} className="text-[var(--brand-muted)] rtl:rotate-180" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </Card>
        ))
      )}

      {view.next.length === 0 && view.ladders.length > 0 ? (
        <Card className="p-5">
          <p className="text-sm text-[var(--brand-muted)]">{t("career.topOfLadder")}</p>
        </Card>
      ) : null}

      {view.next.map((n) => (
        <Card key={n.jobTitle.id} className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-[var(--brand-ink)]">
              {t("career.nextRole", { role: n.jobTitle.name })}
            </h2>
            <p className="text-[13px] text-[var(--brand-muted)]">
              {n.profile.readiness === null
                ? t("career.noRequirements")
                : t("career.readiness", { percent: Math.round(n.profile.readiness * 100) })}
            </p>
          </div>

          {n.profile.readiness === null ? null : n.profile.gaps.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--brand-success)]">{t("career.ready")}</p>
          ) : (
            <>
              <h3 className="mt-4 text-[12px] font-medium uppercase tracking-wide text-[var(--brand-muted)]">
                {t("skills.gapsFound")} ({n.profile.gaps.length})
              </h3>
              <ul className="mt-1">
                {n.profile.gaps.map((g) => {
                  const suggested = n === focus ? courses.find((c) => c.skillId === g.skillId)?.courses ?? [] : [];
                  return (
                    <SkillRow
                      key={g.skillId}
                      gap={g}
                      dict={dict}
                      locale={locale}
                      action={
                        suggested.length ? (
                          <span className="flex max-w-[260px] flex-col gap-0.5 text-[11px]">
                            {suggested.slice(0, 2).map((c) => (
                              <Link
                                key={c.id}
                                href={`/catalog?q=${encodeURIComponent(c.title)}`}
                                className="truncate text-[var(--brand-info)] underline underline-offset-2"
                              >
                                {localized(c, "title", locale)} · {formatHours(c.estimatedHours)}
                              </Link>
                            ))}
                          </span>
                        ) : undefined
                      }
                    />
                  );
                })}
              </ul>
              <div className="mt-4 border-t border-[var(--brand-line)] pt-4">
                <p className="mb-2 text-[12px] text-[var(--brand-muted)]">{t("career.askManagerHint")}</p>
                <RequestGoals jobTitleId={n.jobTitle.id} />
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

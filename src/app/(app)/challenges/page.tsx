import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { challengeResult, liveChallenges, LEVELS, MIN_GROUP, myProgress, POINTS } from "@/lib/engagement";
import { Card, EmptyState, Progress, SectionHeading } from "@/components/ui/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "challenges.title") };
}

/**
 * Your points and level, and the challenges running now. Standings are by
 * department; the only individual figure on this page is the viewer's own.
 */
export default async function ChallengesPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);
  const num = (n: number) => Math.round(n).toLocaleString(locale);

  const [me, live] = await Promise.all([myProgress(user.id), liveChallenges(user.departmentId)]);
  const results = await Promise.all(live.map((c) => challengeResult(c, user.id)));
  const nextText =
    me.next === null ? t("challenges.topLevel") : t("challenges.toNext", { points: num(me.next - me.points) });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading title={t("challenges.title")} subtitle={t("challenges.intro")} />

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">
            {t("challenges.level", { level: me.level })} · {t(`challenges.levelName.${me.level}`)}
          </h2>
          <p className="tabular text-[13px] text-[var(--brand-muted)]">
            {t("challenges.points", { points: num(me.points) })}
          </p>
        </div>
        <Progress className="mt-3" value={me.progress * 100} label={nextText} />
        <p className="mt-2 text-[12px] text-[var(--brand-muted)]">{nextText}</p>
        <details className="mt-3 text-[12px] text-[var(--brand-muted)]">
          <summary className="cursor-pointer">{t("challenges.howPoints")}</summary>
          <ul className="mt-2 space-y-0.5">
            {(Object.keys(POINTS) as (keyof typeof POINTS)[]).map((k) => (
              <li key={k}>{t(`challenges.earn.${k}`, { points: POINTS[k] })}</li>
            ))}
          </ul>
          <p className="mt-2">
            {t("challenges.levelsAt", {
              list: LEVELS.slice(1).map(num).join(" · "),
            })}
          </p>
        </details>
      </Card>

      {live.length === 0 ? (
        <EmptyState title={t("challenges.none")} icon={<Trophy size={20} />} />
      ) : (
        live.map((c, i) => {
          const r = results[i];
          const unit = t(`challenges.metric.${c.metric}`);
          const mine = r.standings.findIndex((s) => s.departmentId === user.departmentId);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-[var(--brand-ink)]">{localized(c, "title", locale)}</h2>
                <p className="text-[12px] text-[var(--brand-muted)]">
                  {c.department ? `${localized(c.department, "name", locale)} · ` : ""}
                  {t("challenges.ends", { date: formatDate(c.endsAt, locale, "UTC") })}
                </p>
              </div>
              {c.description ? <p className="mt-1 text-sm text-[var(--brand-charcoal)]">{c.description}</p> : null}

              <p className="mt-3 text-[13px] text-[var(--brand-ink)]">
                {t("challenges.yours", { value: num(r.mine), unit })}
              </p>

              {c.target && r.total !== null ? (
                <div className="mt-3">
                  <p className="text-[12px] text-[var(--brand-muted)]">
                    {t("challenges.target", {
                      total: num(r.total),
                      target: num(c.target),
                      unit,
                    })}
                  </p>
                  <Progress
                    className="mt-1"
                    value={(r.total / c.target) * 100}
                    tone={r.total >= c.target ? "success" : "brand"}
                    label={`${localized(c, "title", locale)}: ${t("challenges.target", { total: num(r.total), target: num(c.target), unit })}`}
                  />
                </div>
              ) : null}

              {c.departmentId === null ? (
                r.standings.length === 0 ? (
                  <p className="mt-3 text-[12px] text-[var(--brand-muted)]">
                    {t("challenges.noStandings", { min: MIN_GROUP })}
                  </p>
                ) : (
                  <>
                    <h3 className="mt-4 text-[12px] font-medium uppercase tracking-wide text-[var(--brand-muted)]">
                      {t("challenges.standings", { unit })}
                    </h3>
                    <ol className="mt-1">
                      {r.standings.map((s, n) => (
                        <li
                          key={s.departmentId}
                          aria-current={n === mine ? "true" : undefined}
                          className="flex items-baseline justify-between gap-3 border-t border-[var(--brand-line)] py-1.5 text-[13px] first:border-t-0"
                          style={n === mine ? { fontWeight: 600, color: "var(--brand-ink)" } : undefined}
                        >
                          <span>
                            <span className="tabular me-2 text-[var(--brand-muted)]">{n + 1}</span>
                            {localized(s, "name", locale)}
                          </span>
                          <span className="tabular text-[var(--brand-muted)]">
                            {t("challenges.perPerson", {
                              value: s.perPerson.toLocaleString(locale, {
                                maximumFractionDigits: 1,
                              }),
                            })}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-[11px] text-[var(--brand-muted)]">
                      {t("challenges.fairness", { min: MIN_GROUP })}
                    </p>
                  </>
                )
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}

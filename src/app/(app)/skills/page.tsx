import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { skillProfile, coursesForSkill } from "@/lib/skills";
import { SkillMatrix } from "@/components/skill-matrix";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { SelfRate } from "./self-rate";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "skills.title") };
}

export default async function SkillsPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const profile = await skillProfile(user.id);

  // Only what has been agreed, and what is still open. A dropped goal is not
  // something to keep showing someone.
  const goalRows = await prisma.developmentGoal.findMany({
    where: { userId: user.id, status: { in: ["PROPOSED", "APPROVED"] } },
    include: { skill: true, approvedBy: { select: { fullName: true } } },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }],
  });

  const goals = await Promise.all(
    goalRows.map(async (g) => ({
      id: g.id,
      name: localized(g.skill, "name", locale),
      fromLevel: g.fromLevel,
      targetLevel: g.targetLevel,
      targetDate: g.targetDate,
      status: g.status,
      approvedBy: g.approvedBy?.fullName ?? null,
      courses: await coursesForSkill(g.skillId, g.targetLevel, locale),
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading title={t("skills.title")} />

      <SkillMatrix
        profile={profile}
        dict={dict}
        locale={locale}
        renderAction={(gap) => (
          <SelfRate skillId={gap.skillId} skillName={localized(gap, "name", locale)} level={gap.held} />
        )}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("skills.plan")}</h2>
        {goals.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("skills.noPlan")}</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {goals.map((g) => (
              <li key={g.id} className="border-b border-[var(--brand-line)] pb-4 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-[var(--brand-ink)]">{g.name}</span>
                  <span className="text-[12px] text-[var(--brand-muted)]">
                    <span
                      aria-label={translate(dict, "skills.levelRange", { from: g.fromLevel, to: g.targetLevel })}
                      className="inline-flex items-center gap-1 tabular-nums"
                    >
                      <span aria-hidden>{g.fromLevel}</span>
                      <ArrowRight size={12} className="rtl:rotate-180" aria-hidden />
                      <span aria-hidden>{g.targetLevel}</span>
                    </span>
                    {" · "}
                    {t(`skills.${g.status.toLowerCase()}`)}
                    {g.targetDate ? ` · ${t("skills.targetDate")} ${formatDate(g.targetDate, locale)}` : ""}
                  </span>
                </div>
                {g.approvedBy ? (
                  <p className="mt-0.5 text-[12px] text-[var(--brand-muted)]">
                    {t("skills.approved")} · {g.approvedBy}
                  </p>
                ) : null}

                {g.courses.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {g.courses.map((c) => (
                      <li key={c.id} className="text-[12px]">
                        <Link
                          href={`/catalog?q=${encodeURIComponent(localized(c, "title", locale))}`}
                          className="text-[var(--brand-ink)] underline underline-offset-2 hover:text-[var(--brand-red)]"
                        >
                          {localized(c, "title", locale)}
                        </Link>
                        <span className="text-[var(--brand-muted)]">
                          {" · "}
                          {formatHours(c.estimatedHours)}
                          {" · "}
                          {translate(dict, "skills.toLevel", { level: c.targetLevel })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[12px] text-[var(--brand-muted)]">{t("skills.noCourseYet")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

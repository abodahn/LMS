import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { audit } from "@/lib/audit";
import { successionPlan } from "@/lib/careers";
import { Alert, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "succession.title") };
}

/** Candidates shown per role; the rest are counted, not hidden silently. */
const SHOW = 10;

/**
 * Who is developing towards each critical role.
 *
 * This is the most sensitive screen in the system: readiness figures for named
 * people against roles they do not hold. So it is permission-gated, every view
 * is written to the audit log, and it says on its face what it is for. It ranks
 * development, never people — it does not recommend, shortlist or decide, and a
 * readiness figure is a measure of skills observed so far, not of anyone's
 * worth or prospects.
 */
export default async function SuccessionPage() {
  const viewer = await requirePermission("succession.view");
  const { dict } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const roles = await successionPlan();
  await audit({
    actorId: viewer.id,
    actorName: viewer.fullName,
    action: "SUCCESSION_VIEWED",
    entity: "Succession",
    entityId: "critical-roles",
    summary: `${roles.length} critical role(s)`,
  });
  const canOpen = viewer.permissions.includes("users.view");

  return (
    <div className="space-y-6">
      <SectionHeading title={t("succession.title")} subtitle={t("succession.intro")} />
      <Alert tone="warning" icon={<ShieldAlert size={16} aria-hidden />} title={t("succession.useTitle")}>
        {t("succession.useBody")}
      </Alert>

      {roles.length === 0 ? (
        <EmptyState title={t("succession.noCritical")} icon={<Users size={20} />} />
      ) : (
        roles.map((role) => (
          <Card key={role.jobTitle.id} className="p-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
              <h2 className="text-base font-semibold text-[var(--brand-ink)]">{role.jobTitle.name}</h2>
              <p className="text-[12px] text-[var(--brand-muted)]">
                {t("succession.holders", { count: role.holders })}
                {role.feeders.length ? ` · ${t("succession.from", { roles: role.feeders.join(", ") })}` : ""}
              </p>
            </div>

            {role.feeders.length === 0 ? (
              <p className="px-5 pb-4 pt-2 text-sm text-[var(--brand-muted)]">
                {t(role.onLadder ? "succession.firstRung" : "succession.noLadder")}
              </p>
            ) : role.candidates.length === 0 ? (
              <p className="px-5 pb-4 pt-2 text-sm text-[var(--brand-muted)]">{t("succession.noCandidates")}</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[var(--brand-muted)]">
                    <th className="px-5 py-2 text-start font-medium">{t("succession.person")}</th>
                    <th className="px-3 py-2 text-end font-medium">{t("succession.readiness")}</th>
                    <th className="px-3 py-2 text-end font-medium">{t("succession.criticalGaps")}</th>
                    <th className="px-3 py-2 text-end font-medium">{t("succession.unrated")}</th>
                    <th className="px-5 py-2 text-end font-medium">{t("succession.openGoals")}</th>
                  </tr>
                </thead>
                <tbody>
                  {role.candidates.slice(0, SHOW).map((c) => (
                    <tr key={c.userId} className="border-t border-[var(--brand-line)]">
                      <td className="px-5 py-2">
                        {canOpen ? (
                          <Link href={`/team/${c.userId}`} className="text-[var(--brand-ink)] underline-offset-2 hover:underline">
                            {c.fullName}
                          </Link>
                        ) : (
                          <span className="text-[var(--brand-ink)]">{c.fullName}</span>
                        )}
                        <span className="block text-[11px] text-[var(--brand-muted)]">{c.currentTitle}</span>
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {c.readiness === null ? "—" : `${Math.round(c.readiness * 100)}%`}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">{c.criticalGaps}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{c.unrated}</td>
                      <td className="px-5 py-2 text-end tabular-nums">{c.openGoals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
            {role.candidates.length > SHOW ? (
              <p className="px-5 pb-3 text-[12px] text-[var(--brand-muted)]">
                {t("succession.more", { count: role.candidates.length - SHOW })}
              </p>
            ) : (
              <div className="pb-2" />
            )}
          </Card>
        ))
      )}
    </div>
  );
}

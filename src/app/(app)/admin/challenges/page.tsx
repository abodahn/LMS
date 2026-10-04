import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate, todayKey } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { ChallengeForm, ToggleChallenge, type ChallengeRow } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "challenges.adminTitle") };
}

export default async function AdminChallengesPage({ searchParams }: PageProps<"/admin/challenges">) {
  await requirePermission("engagement.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);
  const editId = (await searchParams).edit;

  const [challenges, departments] = await Promise.all([
    prisma.challenge.findMany({
      orderBy: [{ isActive: "desc" }, { endsAt: "desc" }],
      take: 100,
      include: { department: true },
    }),
    prisma.department.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameAr: true, nameTr: true },
    }),
  ]);
  const deptOptions = departments.map((d) => ({
    id: d.id,
    name: localized(d, "name", locale),
  }));
  const rows: ChallengeRow[] = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    titleAr: c.titleAr,
    titleTr: c.titleTr,
    description: c.description,
    metric: c.metric,
    target: c.target,
    departmentId: c.departmentId,
    startsOn: todayKey(c.startsAt),
    endsOn: todayKey(c.endsAt),
    isActive: c.isActive,
  }));
  const editing = rows.find((r) => r.id === editId);
  const now = new Date();

  return (
    <div className="space-y-6">
      <SectionHeading title={t("challenges.adminTitle")} subtitle={t("challenges.adminIntro")} />

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-[var(--brand-ink)]">
          {editing ? t("challenges.editing", { title: editing.title }) : t("challenges.new")}
        </h2>
        <ChallengeForm key={editing?.id ?? "new"} departments={deptOptions} current={editing} />
      </Card>

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-[var(--brand-muted)]">{t("challenges.noneYet")}</p>
        ) : (
          <ul>
            {challenges.map((c, i) => {
              const status = !c.isActive ? "paused" : c.endsAt < now ? "ended" : c.startsAt > now ? "upcoming" : "live";
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--brand-line)] px-5 py-3 first:border-t-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--brand-ink)]">
                      {localized(c, "title", locale)}{" "}
                      <Badge tone={status === "live" ? "success" : "neutral"} className="ms-1">
                        {t(`challenges.status.${status}`)}
                      </Badge>
                    </p>
                    <p className="text-[12px] text-[var(--brand-muted)]">
                      {t(`challenges.metric.${c.metric}`)} ·{" "}
                      {c.department ? localized(c.department, "name", locale) : t("challenges.allDepartments")} ·{" "}
                      {formatDate(c.startsAt, locale, "UTC")} – {formatDate(c.endsAt, locale, "UTC")}
                      {c.target ? ` · ${t("challenges.targetShort", { target: c.target.toLocaleString(locale) })}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/challenges?edit=${rows[i].id}`}
                      className="text-[13px] text-[var(--brand-info)] underline underline-offset-2"
                      aria-label={`${t("common.edit")}: ${localized(c, "title", locale)}`}
                    >
                      {t("common.edit")}
                    </Link>
                    <ToggleChallenge id={c.id} isActive={c.isActive} title={localized(c, "title", locale)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

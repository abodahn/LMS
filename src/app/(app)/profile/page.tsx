import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { Card, DefinitionRow, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { ProfileForm } from "./profile-form";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [record, profile, goals, logins] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { department: true, section: true, jobTitle: true, location: true, manager: true },
    }),
    prisma.employeeProfile.findUnique({ where: { userId: user.id } }),
    prisma.userLearningGoal.findMany({ where: { userId: user.id } }),
    prisma.loginAudit.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading title={t("profile.title")} />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.work")}</h2>
        <dl className="mt-3">
          <DefinitionRow term={t("profile.employeeId")}>{record.employeeCode}</DefinitionRow>
          <DefinitionRow term={t("profile.fullName")}>{record.fullName}</DefinitionRow>
          <DefinitionRow term={t("profile.email")}>{record.email}</DefinitionRow>
          <DefinitionRow term={t("common.department")}>{record.department ? localized(record.department, "name", locale) : "—"}</DefinitionRow>
          <DefinitionRow term={t("profile.section")}>{record.section?.name ?? "—"}</DefinitionRow>
          <DefinitionRow term={t("common.jobTitle")}>{record.jobTitle?.name ?? "—"}</DefinitionRow>
          <DefinitionRow term={t("common.manager")}>{record.manager?.fullName ?? "—"}</DefinitionRow>
          <DefinitionRow term={t("profile.location")}>{record.location?.name ?? "—"}</DefinitionRow>
        </dl>
        <p className="mt-3 text-[12px] text-[var(--brand-muted)]">
          {t("errors.forbiddenBody")}
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.learningPreferences")}</h2>
        <div className="mt-4">
          <ProfileForm
            defaults={{
              preferredLanguage: record.preferredLanguage,
              weeklyLearningHours: profile?.weeklyLearningHours ?? 2,
              aiExperience: profile?.aiExperience ?? "NONE",
              isTechnical: (profile?.isTechnical ?? false) ? "yes" : "no",
              mainTasks: profile?.mainTasks ?? "",
              goals: goals.map((g) => g.goalKey),
            }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.security")}</h2>
        <Link
          href="/change-password"
          className="mt-2 inline-flex text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
        >
          {t("profile.changePassword")}
        </Link>

        <h3 className="section-title mt-5">{t("profile.loginHistory")}</h3>
        <ul className="mt-2 space-y-1.5">
          {logins.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="text-[var(--brand-muted)]">{formatDateTime(l.createdAt, locale)}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[var(--brand-muted)]">{l.ip ?? "—"}</span>
                <StatusPill status={l.success ? "COMPLETED" : "REJECTED"} label={l.success ? "OK" : "Failed"} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { ProfileStepForm } from "./profile-form";
import { OnboardingSteps } from "./steps";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const { dict } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const profile = await prisma.employeeProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
          {t("onboarding.welcomeTitle")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--brand-muted)]">
          {t("onboarding.welcomeSubtitle")}
        </p>
      </header>

      <OnboardingSteps current={1} />

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("onboarding.profileTitle")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("onboarding.profileSubtitle")}</p>

        <dl className="mt-4 grid gap-3 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-[var(--brand-muted)]">{t("common.department")}</dt>
            <dd className="font-medium text-[var(--brand-ink)]">{user.departmentName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--brand-muted)]">{t("common.jobTitle")}</dt>
            <dd className="font-medium text-[var(--brand-ink)]">{user.jobTitle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--brand-muted)]">{t("profile.employeeId")}</dt>
            <dd className="font-medium text-[var(--brand-ink)]">{user.employeeCode}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <ProfileStepForm
            defaults={{
              yearsExperience: profile?.yearsExperience ?? 3,
              aiExperience: profile?.aiExperience ?? "NONE",
              isTechnical: (profile?.isTechnical ?? user.isTechnical) ? "yes" : "no",
              weeklyLearningHours: profile?.weeklyLearningHours ?? 2,
              mainTasks: profile?.mainTasks ?? "",
            }}
          />
        </div>
      </section>
    </div>
  );
}

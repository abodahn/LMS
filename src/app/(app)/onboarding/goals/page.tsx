import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { OnboardingSteps } from "../steps";
import { GoalsForm } from "./goals-form";

export const metadata: Metadata = { title: "Your AI goals" };

export default async function GoalsPage() {
  const user = await requireUser();
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const existing = await prisma.userLearningGoal.findMany({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-3xl">
          {t("onboarding.goalsTitle")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--brand-muted)]">
          {t("onboarding.goalsSubtitle")}
        </p>
      </header>

      <OnboardingSteps current={3} />

      <section className="card mt-6 p-5 sm:p-6">
        <GoalsForm selected={existing.map((g) => g.goalKey)} />
      </section>
    </div>
  );
}

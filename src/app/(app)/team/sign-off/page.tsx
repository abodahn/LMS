import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { awaitingSignOff } from "@/lib/sign-off";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { SignOffForm } from "./sign-off-form";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "signOff.title") };
}

/**
 * Everything this supervisor has waiting to be observed.
 *
 * These learners have finished the content and cannot finish the course: the
 * enrolment stays open until somebody watched them do it. That is the point, so
 * the queue is somewhere they can find rather than a state buried in a record.
 */
export default async function SignOffPage() {
  const supervisor = await requirePermission("team.assess");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const waiting = await awaitingSignOff(supervisor.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden />
        {t("nav.team")}
      </Link>

      <SectionHeading title={t("signOff.title")} subtitle={t("signOff.intro")} />

      {waiting.length === 0 ? (
        <EmptyState title={t("signOff.noneWaiting")} icon={<ClipboardCheck size={20} />} />
      ) : (
        <ul className="space-y-4">
          {waiting.map((e) => (
            <li key={e.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-[var(--brand-ink)]">{e.user.fullName}</h2>
                  <span className="text-[13px] text-[var(--brand-muted)]">
                    {localized(e.course, "title", locale)}
                  </span>
                </div>

                <SignOffForm
                  enrollmentId={e.id}
                  skills={e.course.skills.map((cs) => ({
                    id: cs.skill.id,
                    name: localized(cs.skill, "name", locale),
                  }))}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, parseJson } from "@/lib/utils";
import { Card, EmptyState, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { CapstoneReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Review queue" };

const FIELDS: { key: string; labelKey: string }[] = [
  { key: "businessProblem", labelKey: "capstone.businessProblem" },
  { key: "currentProcess", labelKey: "capstone.currentProcess" },
  { key: "whereAiHelps", labelKey: "capstone.whereAiHelps" },
  { key: "promptWorkflow", labelKey: "capstone.promptWorkflow" },
  { key: "expectedOutput", labelKey: "capstone.expectedOutput" },
  { key: "risks", labelKey: "capstone.risks" },
  { key: "validationMethod", labelKey: "capstone.validationMethod" },
  { key: "estimatedBenefit", labelKey: "capstone.estimatedBenefit" },
];

export default async function ReviewQueuePage() {
  const user = await requirePermission("team.review");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const isAdmin = user.permissions.includes("enrollments.manage");
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      assignment: { type: "CAPSTONE" },
      ...(isAdmin ? {} : { user: { managerId: user.id } }),
    },
    include: { assignment: true, user: { select: { fullName: true, employeeCode: true } } },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/team"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("manager.title")}
      </Link>

      <SectionHeading title={t("manager.reviewQueue")} subtitle={t("learning.capstoneIntro")} />

      {submissions.length === 0 ? (
        <EmptyState title={t("common.noResults")} body={t("action.allDoneBody")} icon={<ClipboardCheck size={20} />} />
      ) : (
        <ul className="space-y-5">
          {submissions.map((s) => {
            const content = parseJson<Record<string, string>>(s.content, {});
            return (
              <li key={s.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-[var(--brand-ink)]">
                        {content.title || s.assignment.title}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
                        {s.user.fullName} · {s.user.employeeCode} · {formatDate(s.submittedAt, locale)}
                      </p>
                    </div>
                    <StatusPill status={s.status} />
                  </div>

                  <dl className="mt-4 space-y-3">
                    {FIELDS.filter((f) => content[f.key]).map((f) => (
                      <div key={f.key}>
                        <dt className="section-title">{t(f.labelKey)}</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                          {content[f.key]}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 border-t border-[var(--brand-line)] pt-4">
                    <CapstoneReviewForm submissionId={s.id} maxScore={s.assignment.maxScore} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

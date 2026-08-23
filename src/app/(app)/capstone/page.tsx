import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { parseJson } from "@/lib/utils";
import { Alert, Card, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { Prose } from "@/components/prose";
import { CapstoneForm } from "./capstone-form";

export const metadata: Metadata = { title: "Workplace challenge" };

export default async function CapstonePage() {
  const user = await requireUser();
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const assignment =
    (await prisma.assignment.findFirst({ where: { type: "CAPSTONE", jobFamily: user.jobFamily } })) ??
    (await prisma.assignment.findFirst({ where: { key: "CAP-GENERAL" } }));

  if (!assignment) {
    return (
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={t("learning.capstoneTitle")} />
        <Alert tone="warning">{t("common.noResults")}</Alert>
      </div>
    );
  }

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_userId: { assignmentId: assignment.id, userId: user.id } },
  });

  const content = parseJson<Record<string, string>>(submission?.content ?? "{}", {});
  const readOnly =
    submission?.status === "SUBMITTED" || submission?.status === "UNDER_REVIEW" || submission?.status === "APPROVED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        title={assignment.title}
        subtitle={t("learning.capstoneIntro")}
        action={submission ? <StatusPill status={submission.status} /> : undefined}
      />

      <Card className="px-5 py-5 sm:px-6">
        <Prose>{assignment.instructions}</Prose>
      </Card>

      {submission?.feedback ? (
        <Alert tone={submission.status === "APPROVED" ? "success" : "warning"} title={t("capstone.reviewerFeedback")}>
          {submission.feedback}
          {submission.score != null ? (
            <p className="mt-1 font-semibold">
              {t("common.score")}: {Math.round(submission.score)} / {assignment.maxScore}
            </p>
          ) : null}
        </Alert>
      ) : null}

      <Card className="p-5 sm:p-6">
        <CapstoneForm defaults={content} readOnly={readOnly} />
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Award, CircleCheck, Download, QrCode, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { programEligibility } from "@/lib/certificates";
import { formatDate, formatHours } from "@/lib/utils";
import { Card, EmptyState, Progress, SectionHeading, StatusPill } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { DownloadLink } from "@/components/download-link";
import { localized } from "@/lib/i18n";
import { ConfirmName } from "./confirm-name";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const [certificates, eligibility, me] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      include: { course: true, level: true },
    }),
    programEligibility(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { fullName: true, certificateName: true, certificateNameConfirmedAt: true },
    }),
  ]);
  const confirmed = !!me.certificateNameConfirmedAt;

  return (
    <div className="space-y-6">
      <SectionHeading title={t("certificates.title")} />

      {/* The name is confirmed once, before the first download, and then locked. */}
      {!confirmed ? (
        <Card className="border-[var(--brand-red)] p-5" id="confirm-name">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("certificates.nameTitle")}</h2>
          <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("certificates.nameIntro")}</p>
          <ConfirmName suggested={me.certificateName ?? me.fullName} />
        </Card>
      ) : (
        <p className="text-[13px] text-[var(--brand-muted)]">
          {t("certificates.nameOnCertificates", { name: me.certificateName ?? me.fullName })}
        </p>
      )}

      {/* Progress towards the programme certificate — always explained. */}
      {!certificates.some((c) => c.type === "PROGRAM") ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">
            {t("passport.nextTarget")}
          </h2>
          <div className="mt-4 space-y-3">
            <Requirement
              label={`${t("learning.pathProgress")} — ${eligibility.completionPercent}% / ${eligibility.requiredCompletion}%`}
              met={eligibility.completionPercent >= eligibility.requiredCompletion}
            >
              <Progress value={eligibility.completionPercent} className="mt-2 max-w-sm" />
            </Requirement>
            <Requirement
              label={`${t("action.takeFinal")} — ${eligibility.policy.finalPassScore}%${
                eligibility.finalScore != null ? ` (${Math.round(eligibility.finalScore)}%)` : ""
              }`}
              met={eligibility.finalPassed}
            />
            {eligibility.policy.responsibleAiMandatory ? (
              <Requirement label={t("competency.RESPONSIBLE_AI")} met={eligibility.responsibleAiPassed} />
            ) : null}
            {eligibility.policy.capstoneRequired ? (
              <Requirement label={t("learning.capstoneTitle")} met={eligibility.capstoneApproved} />
            ) : null}
          </div>
          {!eligibility.eligible ? (
            <p className="mt-4 text-[13px] text-[var(--brand-muted)]">{t("dashboard.keepGoing")}</p>
          ) : (
            <p className="mt-4 text-[13px] font-medium text-[var(--brand-success)]">{t("assessment.passed")}</p>
          )}
        </Card>
      ) : null}

      {certificates.length === 0 ? (
        <EmptyState
          title={t("certificates.empty")}
          body={t("certificates.emptyBody")}
          icon={<Award size={20} />}
          action={<LinkButton href="/learning">{t("dashboard.continueLearning")}</LinkButton>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <li key={c.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Award size={22} className="shrink-0 text-[var(--brand-red)]" aria-hidden />
                  <StatusPill status={c.status} />
                </div>
                <h2 className="mt-3 text-[15px] font-semibold leading-snug text-[var(--brand-ink)]">{c.title}</h2>
                <dl className="mt-3 space-y-1 text-[13px] text-[var(--brand-muted)]">
                  <div className="flex justify-between gap-3">
                    <dt>{t("certificates.issued")}</dt>
                    <dd className="text-[var(--brand-ink)]">{formatDate(c.issuedAt, locale)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("certificates.learningHours")}</dt>
                    <dd className="text-[var(--brand-ink)]">{formatHours(c.learningHours)}</dd>
                  </div>
                  {c.level ? (
                    <div className="flex justify-between gap-3">
                      <dt>{t("common.level")}</dt>
                      <dd className="text-[var(--brand-ink)]">
                        {c.level.code} — {localized(c.level, "name", locale)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <dt>{t("certificates.certificateId")}</dt>
                    <dd className="font-mono text-[12px] text-[var(--brand-ink)]">{c.code}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {confirmed ? (
                    <DownloadLink href={`/api/certificates/${c.id}/pdf`} variant="primary">
                      <Download size={14} aria-hidden />
                      {t("certificates.downloadPdf")}
                    </DownloadLink>
                  ) : (
                    <a
                      href="#confirm-name"
                      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] px-3 text-[13px] font-semibold text-[var(--brand-muted)]"
                    >
                      <Download size={14} aria-hidden />
                      {t("certificates.confirmFirst")}
                    </a>
                  )}
                  <Link
                    href={`/verify/${c.code}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-canvas)]"
                  >
                    <QrCode size={14} aria-hidden />
                    {t("certificates.verify")}
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Requirement({
  label,
  met,
  children,
}: {
  label: string;
  met: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {met ? (
        <CircleCheck size={17} className="mt-0.5 shrink-0 text-[var(--brand-success)]" aria-hidden />
      ) : (
        <TriangleAlert size={17} className="mt-0.5 shrink-0 text-[var(--brand-warning)]" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--brand-ink)]">{label}</p>
        {children}
      </div>
    </div>
  );
}

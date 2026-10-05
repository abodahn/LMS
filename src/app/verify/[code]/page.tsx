import type { Metadata } from "next";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { branding } from "@/lib/branding";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDate, formatHours } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = { title: "Certificate verification" };

/**
 * Public verification page. It deliberately shows only what is needed to
 * confirm a certificate is genuine — never department, score breakdown,
 * email or any other employee information. Lookups are limited per address,
 * because certificate numbers run in sequence and every completed course now
 * has one: unlimited, the page would let anyone list the whole company's
 * training record by counting.
 */
export default async function VerifyPage({ params }: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  if (!rateLimit(`verify:${ip}`, 20, 60_000)) {
    return (
      <div className="min-h-dvh bg-[var(--brand-canvas)]">
        <main className="mx-auto max-w-lg px-5 py-12">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--brand-ink)]">{t("certificates.verifyTitle")}</h1>
          <p className="mt-5 text-sm text-[var(--brand-muted)]">{t("certificates.tooManyLookups")}</p>
        </main>
      </div>
    );
  }

  const certificate = await prisma.certificate.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      code: true,
      title: true,
      issuedAt: true,
      expiresAt: true,
      status: true,
      learningHours: true,
      user: { select: { fullName: true, certificateName: true } },
      level: { select: { code: true, name: true } },
    },
  });

  const expired = certificate?.expiresAt ? certificate.expiresAt < new Date() : false;
  const state = !certificate ? "NOT_FOUND" : certificate.status === "REVOKED" ? "REVOKED" : expired ? "EXPIRED" : "VALID";

  const tone =
    state === "VALID"
      ? { bg: "bg-[#EAF6F0]", border: "border-[#BFE3D2]", text: "text-[var(--brand-success)]", Icon: CircleCheck }
      : state === "EXPIRED"
        ? { bg: "bg-[#FDF3E3]", border: "border-[#F2DDB8]", text: "text-[var(--brand-warning)]", Icon: Clock }
        : { bg: "bg-[var(--brand-red-soft)]", border: "border-[color-mix(in_srgb,var(--brand-red)_30%,transparent)]", text: "text-[var(--brand-red-dark)]", Icon: CircleX };

  const message =
    state === "VALID"
      ? t("certificates.valid")
      : state === "REVOKED"
        ? t("certificates.revoked")
        : state === "EXPIRED"
          ? t("certificates.expired")
          : t("certificates.notFound");

  return (
    <div className="min-h-dvh bg-[var(--brand-canvas)]">
      <header className="flex items-center justify-between border-b border-[var(--brand-line)] bg-white px-5 py-4">
        <Logo href={null} />
        <LocaleSwitcher compact />
      </header>

      <main className="mx-auto max-w-lg px-5 py-12">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--brand-ink)]">
          {t("certificates.verifyTitle")}
        </h1>

        <div className={`mt-5 flex items-center gap-3 rounded-[var(--radius-card)] border ${tone.bg} ${tone.border} px-4 py-3.5`}>
          <tone.Icon size={20} className={`shrink-0 ${tone.text}`} aria-hidden />
          <p className={`text-sm font-semibold ${tone.text}`}>{message}</p>
        </div>

        {certificate ? (
          <dl className="card mt-5 divide-y divide-[var(--brand-line)] px-5">
            {/* A revoked certificate is reported as revoked, without naming its holder. */}
            {state !== "REVOKED" ? (
              <Row label={t("certificates.issuedTo")} value={certificate.user.certificateName ?? certificate.user.fullName} />
            ) : null}
            <Row label={t("certificates.program")} value={certificate.title} />
            {certificate.level ? (
              <Row label={t("common.level")} value={`${certificate.level.code} — ${localized(certificate.level, "name", locale)}`} />
            ) : null}
            <Row label={t("certificates.completionDate")} value={formatDate(certificate.issuedAt, locale)} />
            <Row label={t("certificates.learningHours")} value={formatHours(certificate.learningHours)} />
            <Row label={t("certificates.certificateId")} value={certificate.code} mono />
          </dl>
        ) : (
          <p className="mt-4 font-mono text-[13px] text-[var(--brand-muted)]">{code}</p>
        )}

        <p className="mt-6 text-center text-[12px] text-[var(--brand-muted)]">
          {t("certificates.verifiedBy", { org: branding.organizationName })}
        </p>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-44 shrink-0 text-[13px] text-[var(--brand-muted)]">{label}</dt>
      <dd className={`text-sm text-[var(--brand-ink)] ${mono ? "font-mono text-[13px]" : ""}`}>{value}</dd>
    </div>
  );
}

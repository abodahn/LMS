import type { Metadata } from "next";
import Image from "next/image";
import { Palette } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { jobStatus } from "@/lib/jobs";
import { READINESS_DEFAULT_WEIGHTS, SETTING_KEYS } from "@/lib/constants";
import { branding } from "@/lib/branding";
import { parseJson } from "@/lib/utils";
import { Card, DefinitionRow, SectionHeading } from "@/components/ui/primitives";
import { SettingsForm } from "./settings-form";
import { IntegrationsForm } from "./integrations-form";
import { RemindersPanel } from "./reminders-panel";
import { JobsPanel } from "./jobs-panel";
import { CertificateForm } from "./certificate-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requirePermission("settings.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const jobs = await jobStatus();
  // Mirrors the default in instrumentation.ts.
  const schedulerOn = (process.env.SCHEDULER ?? (process.env.NODE_ENV === "production" ? "on" : "off")) === "on";

  const [settings, aiIntegration, smtpIntegration, reminders] = await Promise.all([
    getSettings(),
    prisma.integration.findUnique({ where: { key: "ai" } }),
    prisma.integration.findUnique({ where: { key: "smtp" } }),
    prisma.reminderRule.findMany({ orderBy: { key: "asc" } }),
  ]);

  const aiConfig = parseJson<{ provider?: string; model?: string; baseUrl?: string; maxTokens?: number }>(
    aiIntegration?.config ?? null,
    {},
  );
  const smtpConfig = parseJson<{ host?: string; port?: number; user?: string; from?: string }>(
    smtpIntegration?.config ?? null,
    {},
  );
  const readiness = {
    ...READINESS_DEFAULT_WEIGHTS,
    ...((settings[SETTING_KEYS.READINESS_WEIGHTS] as typeof READINESS_DEFAULT_WEIGHTS) ?? {}),
  };

  return (
    <div className="space-y-6">
      <SectionHeading title={t("admin.settings")} />

      <SettingsForm
        values={{
          completionThreshold: Number(settings[SETTING_KEYS.COMPLETION_THRESHOLD]),
          finalPassScore: Number(settings[SETTING_KEYS.FINAL_PASS_SCORE]),
          responsibleAiMandatory: Boolean(settings[SETTING_KEYS.RESPONSIBLE_AI_MANDATORY]),
          capstoneRequired: Boolean(settings[SETTING_KEYS.CAPSTONE_REQUIRED]),
          reviewIntervalDays: Number(settings[SETTING_KEYS.COURSE_REVIEW_DAYS]),
          sessionHours: Number(settings[SETTING_KEYS.SESSION_HOURS]),
          maxFailedLogins: Number(settings[SETTING_KEYS.MAX_FAILED_LOGINS]),
          lockoutMinutes: Number(settings[SETTING_KEYS.LOCKOUT_MINUTES]),
          defaultLocale: String(settings[SETTING_KEYS.DEFAULT_LOCALE]),
          readiness,
        }}
      />

      <CertificateForm
        values={{
          issuerTc: String(settings[SETTING_KEYS.CERT_ISSUER_TC] ?? ""),
          issuerTcap: String(settings[SETTING_KEYS.CERT_ISSUER_TCAP] ?? ""),
          sign1Name: String(settings[SETTING_KEYS.CERT_SIGN1_NAME] ?? ""),
          sign1Title: String(settings[SETTING_KEYS.CERT_SIGN1_TITLE] ?? ""),
          sign2Name: String(settings[SETTING_KEYS.CERT_SIGN2_NAME] ?? ""),
          sign2Title: String(settings[SETTING_KEYS.CERT_SIGN2_TITLE] ?? ""),
          tcapSign1Name: String(settings[SETTING_KEYS.CERT_TCAP_SIGN1_NAME] ?? ""),
          tcapSign1Title: String(settings[SETTING_KEYS.CERT_TCAP_SIGN1_TITLE] ?? ""),
          tcapSign2Name: String(settings[SETTING_KEYS.CERT_TCAP_SIGN2_NAME] ?? ""),
          tcapSign2Title: String(settings[SETTING_KEYS.CERT_TCAP_SIGN2_TITLE] ?? ""),
        }}
      />

      {admin.permissions.includes("integrations.manage") ? (
        <IntegrationsForm
          ai={{
            enabled: aiIntegration?.enabled ?? false,
            provider: aiConfig.provider ?? "anthropic",
            model: aiConfig.model ?? "claude-sonnet-5",
            baseUrl: aiConfig.baseUrl ?? "",
            maxTokens: aiConfig.maxTokens ?? 1024,
          }}
          smtp={{
            enabled: smtpIntegration?.enabled ?? false,
            host: smtpConfig.host ?? "",
            port: smtpConfig.port ?? 587,
            user: smtpConfig.user ?? "",
            from: smtpConfig.from ?? "",
          }}
        />
      ) : null}

      <RemindersPanel
        rules={reminders.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          channel: r.channel,
          triggerType: r.triggerType,
          thresholdDays: r.thresholdDays,
          enabled: r.enabled,
        }))}
      />

      <JobsPanel
        jobs={jobs.map((j) => ({ ...j, lastRun: j.lastRun ? j.lastRun.toISOString() : null }))}
        locale={locale}
        schedulerOn={schedulerOn}
      />

      <Card className="p-5">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
          <Palette size={17} className="text-[var(--brand-red)]" aria-hidden />
          {t("admin.branding")}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          Branding is configuration, not code. Change these values in{" "}
          <code className="rounded bg-[var(--brand-canvas)] px-1 py-0.5 font-mono text-[12px]">
            src/lib/branding.ts
          </code>{" "}
          or override any of them with the matching{" "}
          <code className="rounded bg-[var(--brand-canvas)] px-1 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_*</code>{" "}
          environment variable, then restart. No component reads a colour or name directly.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4">
          <Image src={branding.logoUrl} alt="" width={160} height={40} className="h-10 w-auto" />
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(branding.colors).map(([name, value]) => (
              <span
                key={name}
                title={`${name}: ${value}`}
                className="h-8 w-8 rounded-md border border-[var(--brand-line)]"
                style={{ background: value }}
              />
            ))}
          </div>
        </div>

        <dl className="mt-4">
          <DefinitionRow term="Organisation">{branding.organizationName}</DefinitionRow>
          <DefinitionRow term="Platform">{branding.platformName}</DefinitionRow>
          <DefinitionRow term="Tagline">{branding.tagline}</DefinitionRow>
          <DefinitionRow term="Logo">{branding.logoUrl}</DefinitionRow>
          <DefinitionRow term="Favicon">{branding.faviconUrl}</DefinitionRow>
          <DefinitionRow term="Support email">{branding.supportEmail}</DefinitionRow>
        </dl>
      </Card>
    </div>
  );
}

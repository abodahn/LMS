import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { oidcConfig } from "@/lib/oidc";
import { scormOrigin } from "@/lib/scorm/origin";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { CreateKeyForm, CreateWebhookForm, RevokeKey, WebhookControls } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "api.title") };
}

/**
 * Everything that connects the academy to other systems, on one page: what is
 * switched on through the environment (SSO, HR sync, SCORM hostname), and the
 * keys and webhooks an administrator manages here. Secrets are never shown
 * after the moment they are created.
 */
export default async function ApiAdminPage() {
  await requirePermission("integrations.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);

  const [keys, hooks] = await Promise.all([
    prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
      include: { deliveries: { orderBy: { createdAt: "desc" }, take: 5 } },
    }),
  ]);
  const env = [
    { key: "sso", on: !!oidcConfig() },
    { key: "scim", on: !!process.env.SCIM_TOKEN?.trim() },
    { key: "scorm", on: !!scormOrigin() },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading title={t("api.title")} subtitle={t("api.intro")} />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("api.connections")}</h2>
        <ul className="mt-3 space-y-2">
          {env.map((e) => (
            <li key={e.key} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
              <span>
                <span className="font-medium text-[var(--brand-ink)]">{t(`api.env.${e.key}.name`)}</span>
                <span className="block text-[12px] text-[var(--brand-muted)]">{t(`api.env.${e.key}.how`)}</span>
              </span>
              <Badge tone={e.on ? "success" : "neutral"}>{e.on ? t("api.on") : t("api.off")}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("api.keysTitle")}</h2>
        <p className="mb-4 mt-1 text-[13px] text-[var(--brand-muted)]">{t("api.keysIntro")}</p>
        <CreateKeyForm />
        {keys.length ? (
          <ul className="mt-4">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--brand-line)] py-2 text-[13px]"
              >
                <span>
                  <span className="font-medium text-[var(--brand-ink)]">{k.name}</span>{" "}
                  <code className="font-mono text-[12px] text-[var(--brand-muted)]" dir="ltr">
                    {k.prefix}…
                  </code>
                  <span className="block text-[12px] text-[var(--brand-muted)]">
                    {k.revokedAt
                      ? t("api.revokedOn", { date: formatDateTime(k.revokedAt, locale) })
                      : k.lastUsedAt
                        ? t("api.lastUsed", { date: formatDateTime(k.lastUsedAt, locale) })
                        : t("api.neverUsed")}
                  </span>
                </span>
                {k.revokedAt ? <Badge tone="neutral">{t("api.revoked")}</Badge> : <RevokeKey id={k.id} name={k.name} />}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("api.webhooksTitle")}</h2>
        <p className="mb-4 mt-1 text-[13px] text-[var(--brand-muted)]">{t("api.webhooksIntro")}</p>
        <CreateWebhookForm />
        {hooks.map((h) => {
          const host = new URL(h.url).host;
          return (
            <div key={h.id} className="mt-4 border-t border-[var(--brand-line)] pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px]">
                  <code className="font-mono text-[12px] text-[var(--brand-ink)]" dir="ltr">
                    {h.url}
                  </code>{" "}
                  <Badge tone={h.isActive ? "success" : "neutral"} className="ms-1">
                    {h.isActive ? t("api.on") : t("api.off")}
                  </Badge>
                  <span className="block text-[12px] text-[var(--brand-muted)]">
                    {h.events
                      .split(",")
                      .map((e) => t(`api.event.${e.replace(".", "_")}`))
                      .join(" · ")}
                  </span>
                </p>
                <WebhookControls id={h.id} isActive={h.isActive} host={host} />
              </div>
              {h.deliveries.length ? (
                <ul className="mt-2 space-y-1 text-[12px] text-[var(--brand-muted)]">
                  {h.deliveries.map((d) => (
                    <li key={d.id} className="flex flex-wrap gap-2">
                      <Badge tone={d.status === "DELIVERED" ? "success" : d.status === "FAILED" ? "brand" : "warning"}>
                        {t(`api.delivery.${d.status}`)}
                      </Badge>
                      <span>{t(`api.event.${d.event.replace(".", "_")}`)}</span>
                      <span>{formatDateTime(d.createdAt, locale)}</span>
                      {d.lastError ? <span dir="ltr">{d.lastError}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

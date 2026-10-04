import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { oidcConfig } from "@/lib/oidc";
import { buttonClass } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { dict } = await getI18n();
  const t = (k: string, p?: Record<string, string | number>) => translate(dict, k, p);
  const sso = oidcConfig();
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">{t("auth.welcomeBack")}</h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">{t("auth.signInSubtitle")}</p>
      {error === "sso" || error === "sso_unknown" ? (
        <div className="mt-5">
          <FormError>{t(error === "sso" ? "auth.ssoFailed" : "auth.ssoUnknown")}</FormError>
        </div>
      ) : null}
      {sso ? (
        <div className="mt-7">
          {/* A plain link, not next/link: this leaves the app for the provider. */}
          <a href="/api/auth/oidc/start" className={buttonClass("primary", "md", "w-full")}>
            {t("auth.ssoButton", { provider: sso.label ?? t("auth.ssoDefault") })}
          </a>
          <p className="mt-5 text-center text-[12px] text-[var(--brand-muted)]">{t("auth.ssoOr")}</p>
        </div>
      ) : null}
      <div className={sso ? "mt-3" : "mt-7"}>
        <LoginForm />
      </div>
    </>
  );
}

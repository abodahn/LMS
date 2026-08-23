import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const { dict } = await getI18n();
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {translate(dict, "auth.welcomeBack")}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">{translate(dict, "auth.signInSubtitle")}</p>
      <div className="mt-7">
        <LoginForm />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "Create your account" };

/**
 * Activation, not open sign-up.
 *
 * An employee can only claim an account HR has already put on the roster and
 * that nobody has used yet. The subtitle says so plainly, because the common
 * case for a refusal is somebody who simply has not been imported — and
 * "ask HR" is a far more useful thing to read than "invalid details".
 */
export default async function RegisterPage() {
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {t("auth.createAccount")}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">{t("auth.registerSubtitle")}</p>

      <RegisterForm />

      <p className="mt-6 text-center text-[13px] text-[var(--brand-muted)]">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--brand-red)] underline-offset-4 hover:underline"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </>
  );
}

import type { Metadata } from "next";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const { dict } = await getI18n();
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {translate(dict, "auth.forgotTitle")}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">{translate(dict, "auth.forgotSubtitle")}</p>
      <div className="mt-7">
        <ForgotForm />
      </div>
    </>
  );
}

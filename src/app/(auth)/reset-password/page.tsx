import type { Metadata } from "next";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { dict } = await getI18n();
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {translate(dict, "auth.newPassword")}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--brand-muted)]">
        {translate(dict, "auth.passwordTooWeak")}
      </p>
      <div className="mt-7">
        <ResetForm token={token} />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { Logo } from "@/components/brand";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="px-5 py-5">
        <Logo href={null} />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
            {t("auth.changePasswordTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--brand-muted)]">{t("auth.changePasswordSubtitle")}</p>
          <div className="mt-7">
            <ChangePasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}

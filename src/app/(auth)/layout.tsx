import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { branding } from "@/lib/branding";
import { Logo } from "@/components/brand";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { translate } from "@/lib/i18n";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const { dict } = await getI18n();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — hidden on small screens so the form gets the whole viewport. */}
      <aside className="relative hidden flex-col justify-between bg-[var(--brand-ink)] p-10 text-white lg:flex">
        <Logo href={null} className="h-9 w-auto brightness-0 invert" />
        <div className="max-w-md">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-red)]">
            {branding.organizationName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {branding.platformName}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">{branding.tagline}</p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              translate(dict, "onboarding.step1Title"),
              translate(dict, "onboarding.step2Title"),
              translate(dict, "onboarding.step3Title"),
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[11px] font-semibold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-white/40">
          © {new Date().getFullYear()} {branding.organizationName}
        </p>
      </aside>

      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <Logo href={null} className="h-8 w-auto lg:hidden" />
          <LocaleSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}

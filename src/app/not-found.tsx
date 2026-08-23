import Link from "next/link";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { Logo } from "@/components/brand";

export default async function NotFound() {
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[var(--brand-canvas)] px-6 text-center">
      <Logo href={null} />
      <div>
        <h1 className="text-xl font-semibold text-[var(--brand-ink)]">{t("errors.notFound")}</h1>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--brand-muted)]">{t("errors.notFoundBody")}</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-[var(--brand-red)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-red-dark)]"
      >
        {t("errors.goHome")}
      </Link>
    </div>
  );
}

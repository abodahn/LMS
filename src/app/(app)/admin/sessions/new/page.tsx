import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { SessionForm } from "../session-form";
import { loadSessionFormOptions, emptySessionValues } from "../session-data";

export const metadata: Metadata = { title: "New session" };

export default async function NewSessionPage() {
  await requirePermission("sessions.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const options = await loadSessionFormOptions(locale);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sessions"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("sessions.title")}
      </Link>
      <SectionHeading title={t("sessions.newSession")} />
      <SessionForm values={emptySessionValues()} {...options} />
    </div>
  );
}

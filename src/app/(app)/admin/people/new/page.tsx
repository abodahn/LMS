import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { UserForm } from "../user-form";
import { loadUserFormOptions } from "../user-data";

export const metadata: Metadata = { title: "New employee" };

export default async function NewUserPage() {
  await requirePermission("users.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const options = await loadUserFormOptions(locale);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/people"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.people")}
      </Link>
      <SectionHeading title={t("common.create")} subtitle={t("admin.people")} />
      <UserForm {...options} canManage />
    </div>
  );
}

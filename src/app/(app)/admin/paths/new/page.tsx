import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { PathForm } from "../path-form";
import { localizeNames, NAME_I18N_SELECT } from "@/lib/i18n";

export const metadata: Metadata = { title: "New learning path" };

export default async function NewPathPage() {
  await requirePermission("paths.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const levels = await prisma.skillLevel
    .findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, ...NAME_I18N_SELECT } })
    .then((rows) => localizeNames(rows, locale));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/paths"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.paths")}
      </Link>
      <SectionHeading title={t("common.create")} subtitle={t("admin.paths")} />
      <PathForm
        levels={levels}
        values={{
          code: "",
          title: "",
          titleAr: "",
          titleTr: "",
          description: "",
          targetHours: 35,
          targetLevelId: "",
          audienceLevel: "",
          status: "DRAFT",
          isDefault: false,
          isTechnical: false,
          jobFamilies: [],
        }}
      />
    </div>
  );
}

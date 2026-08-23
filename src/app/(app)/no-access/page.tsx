import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "No access" };

export default async function NoAccessPage() {
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);
  return (
    <div className="mx-auto max-w-lg py-10">
      <EmptyState
        title={t("errors.forbidden")}
        body={t("errors.forbiddenBody")}
        icon={<ShieldOff size={20} />}
        action={<LinkButton href="/">{t("errors.goHome")}</LinkButton>}
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

/**
 * Human-readable failure page. The underlying error is logged on the server;
 * nothing technical is shown to the employee.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    console.error("[ui]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-[var(--brand-ink)]">{t("common.somethingWentWrong")}</h1>
      <p className="text-sm text-[var(--brand-muted)]">{t("errors.generic")}</p>
      <Button onClick={reset}>
        <RotateCcw size={16} />
        {t("common.tryAgain")}
      </Button>
      {error.digest ? (
        <p className="font-mono text-[11px] text-[var(--brand-muted)]">Ref: {error.digest}</p>
      ) : null}
    </div>
  );
}

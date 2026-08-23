"use client";

import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { enrollFromRecommendationAction } from "@/app/(app)/learning/actions";

export function EnrollPathButton({ runId, label }: { runId: string; label: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button size="lg" disabled={pending} onClick={() => start(() => enrollFromRecommendationAction(runId))}>
      {pending ? t("common.saving") : label}
      <ArrowRight size={18} className="rtl:rotate-180" />
    </Button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { applyRecommendationAction, type EngineState } from "./actions";

export function ApplyPathButton({ userId, label }: { userId: string; label: string }) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [state, setState] = useState<EngineState>({});
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      <Button
        disabled={pending || !userId}
        onClick={() =>
          start(async () => {
            setState(await applyRecommendationAction(userId));
            router.refresh();
          })
        }
      >
        {pending ? t("common.saving") : label}
      </Button>
    </div>
  );
}

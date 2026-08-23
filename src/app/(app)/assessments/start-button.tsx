"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { startAssessmentAction } from "./actions";

export function StartAssessmentButton({
  definitionId,
  label,
  size = "md",
  variant = "primary",
  disabled,
}: {
  definitionId: string;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled || pending}
      onClick={() => start(() => startAssessmentAction(definitionId))}
    >
      {pending ? t("common.loading") : label}
    </Button>
  );
}

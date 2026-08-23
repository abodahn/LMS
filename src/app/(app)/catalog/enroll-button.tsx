"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import { enrollCourseAction } from "@/app/(app)/learning/actions";

export function EnrollButton({ courseId, label }: { courseId: string; label: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" disabled={pending} onClick={() => start(() => enrollCourseAction(courseId))}>
      {pending ? t("common.saving") : label}
    </Button>
  );
}

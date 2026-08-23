"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markAllReadAction } from "./actions";

export function MarkAllReadButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllReadAction();
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}

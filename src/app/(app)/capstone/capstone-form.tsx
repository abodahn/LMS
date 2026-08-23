"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveCapstoneAction, type CapstoneState } from "./actions";

const SECTIONS: { name: string; labelKey: string; rows: number }[] = [
  { name: "businessProblem", labelKey: "capstone.businessProblem", rows: 3 },
  { name: "currentProcess", labelKey: "capstone.currentProcess", rows: 3 },
  { name: "whereAiHelps", labelKey: "capstone.whereAiHelps", rows: 3 },
  { name: "promptWorkflow", labelKey: "capstone.promptWorkflow", rows: 6 },
  { name: "expectedOutput", labelKey: "capstone.expectedOutput", rows: 3 },
  { name: "risks", labelKey: "capstone.risks", rows: 3 },
  { name: "validationMethod", labelKey: "capstone.validationMethod", rows: 3 },
  { name: "estimatedBenefit", labelKey: "capstone.estimatedBenefit", rows: 2 },
];

function Actions({ readOnly }: { readOnly: boolean }) {
  const t = useT();
  const { pending } = useFormStatus();
  if (readOnly) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
        {pending ? t("common.saving") : t("capstone.saveDraft")}
      </Button>
      <Button type="submit" name="intent" value="submit" disabled={pending}>
        {t("capstone.submitForReview")}
      </Button>
    </div>
  );
}

export function CapstoneForm({
  defaults,
  readOnly,
}: {
  defaults: Record<string, string>;
  readOnly: boolean;
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<CapstoneState, FormData>(saveCapstoneAction, {});

  return (
    <form action={action} className="space-y-5">
      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>

      <Field label={t("toolbox.promptTitle")} required>
        {(p) => (
          <TextInput
            {...p}
            name="title"
            defaultValue={defaults.title ?? ""}
            required
            maxLength={160}
            readOnly={readOnly}
          />
        )}
      </Field>

      {SECTIONS.map((s) => (
        <Field key={s.name} label={t(s.labelKey)} required>
          {(p) => (
            <TextArea
              {...p}
              name={s.name}
              rows={s.rows}
              defaultValue={defaults[s.name] ?? ""}
              readOnly={readOnly}
            />
          )}
        </Field>
      ))}

      <Actions readOnly={readOnly} />
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { addLocationAction, type OrgState } from "./actions";

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : t("common.add")}
    </Button>
  );
}

export function LocationManager({
  locations,
}: {
  locations: { id: string; name: string; country: string | null; employees: number }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OrgState, FormData>(addLocationAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.location")}</h2>

      <TableShell className="mt-4">
        <thead>
          <tr>
            <th>{t("profile.location")}</th>
            <th>{t("form.country")}</th>
            <th>{t("common.employees")}</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l) => (
            <tr key={l.id}>
              <td className="font-medium text-[var(--brand-ink)]">{l.name}</td>
              <td className="text-[13px]">{l.country ?? "—"}</td>
              <td className="tabular-nums">{l.employees}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--brand-line)] pt-4">
        <Field label={t("profile.location")} className="min-w-44">
          {(p) => <TextInput {...p} name="name" required maxLength={120} />}
        </Field>
        <Field label={t("form.country")} className="min-w-40">
          {(p) => <TextInput {...p} name="country" maxLength={80} />}
        </Field>
        <Submit />
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
      </form>
    </Card>
  );
}

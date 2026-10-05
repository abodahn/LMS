"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { addLocationAction, setLocationCompanyAction, type OrgState } from "./actions";

const COMPANIES = [
  ["TC", "T&C Garments"],
  ["TCAP", "T-CAP"],
] as const;

/** Changes a location's company as soon as it is picked. */
function CompanySelect({ id, name, company }: { id: string; name: string; company: string }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OrgState, FormData>(setLocationCompanyAction, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Select
        name="company"
        defaultValue={company}
        aria-label={`${t("form.company")}: ${name}`}
        className="h-8 w-[150px] text-[12px]"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {COMPANIES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      {state.error ? (
        <span role="status" className="text-[11px] text-[var(--brand-red)]">
          {msg(state.error)}
        </span>
      ) : null}
    </form>
  );
}

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
  locations: { id: string; name: string; country: string | null; company: string; employees: number }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OrgState, FormData>(addLocationAction, {});

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("profile.location")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("form.companyHint")}</p>

      <TableShell className="mt-4">
        <thead>
          <tr>
            <th>{t("profile.location")}</th>
            <th>{t("form.country")}</th>
            <th>{t("form.company")}</th>
            <th>{t("common.employees")}</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l) => (
            <tr key={l.id}>
              <td className="font-medium text-[var(--brand-ink)]">{l.name}</td>
              <td className="text-[13px]">{l.country ?? "—"}</td>
              <td>
                <CompanySelect id={l.id} name={l.name} company={l.company} />
              </td>
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
        <Field label={t("form.company")} className="min-w-40">
          {(p) => (
            <Select {...p} name="company" defaultValue="TC">
              {COMPANIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Submit />
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
      </form>
    </Card>
  );
}

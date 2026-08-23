"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { JOB_FAMILIES } from "@/lib/constants";
import { humanizeKey } from "@/lib/utils";
import { addSectionAction, saveDepartmentAction, type OrgState } from "./actions";

type Department = {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  nameTr: string;
  jobFamily: string;
  order: number;
  employees: number;
  sections: { id: string; name: string }[];
};

function Submit({ label }: { label: string }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : label}
    </Button>
  );
}

export function DepartmentManager({ departments }: { departments: Department[] }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OrgState, FormData>(saveDepartmentAction, {});
  const [sectionState, addSection] = useActionState<OrgState, FormData>(addSectionAction, {});
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);

  const current = editing;
  const open = creating || !!editing;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("admin.departments")}</h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus size={15} />
          {t("common.create")}
        </Button>
      </div>

      {open ? (
        <form
          action={action}
          key={current?.id ?? "new"}
          className="mt-4 space-y-4 rounded-[var(--radius-card)] border border-[var(--brand-line)] p-4"
        >
          {current ? <input type="hidden" name="departmentId" value={current.id} /> : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[var(--brand-ink)]">
              {current ? t("common.edit") : t("common.create")}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
              aria-label={t("common.close")}
              className="rounded-[var(--radius-control)] p-1 text-[var(--brand-muted)] hover:bg-[var(--brand-canvas)]"
            >
              <X size={16} />
            </button>
          </div>

          <FormError>{msg(state.error)}</FormError>
          <FormSuccess>{msg(state.success)}</FormSuccess>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("form.code")} required>
              {(p) => <TextInput {...p} name="code" required maxLength={10} defaultValue={current?.code ?? ""} />}
            </Field>
            <Field label={t("form.nameEn")} required>
              {(p) => <TextInput {...p} name="name" required maxLength={120} defaultValue={current?.name ?? ""} />}
            </Field>
            <Field label={t("form.jobFamily")} required>
              {(p) => (
                <Select {...p} name="jobFamily" defaultValue={current?.jobFamily ?? "GENERAL"}>
                  {JOB_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {humanizeKey(f)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("form.nameAr")}>
              {(p) => <TextInput {...p} name="nameAr" dir="rtl" maxLength={120} defaultValue={current?.nameAr ?? ""} />}
            </Field>
            <Field label={t("form.nameTr")}>
              {(p) => <TextInput {...p} name="nameTr" maxLength={120} defaultValue={current?.nameTr ?? ""} />}
            </Field>
            <Field label={t("form.sortOrder")} required>
              {(p) => (
                <TextInput {...p} name="order" type="number" min={0} max={999} required defaultValue={current?.order ?? 0} />
              )}
            </Field>
          </div>

          <Submit label={t("common.save")} />
        </form>
      ) : null}

      <TableShell className="mt-4">
        <thead>
          <tr>
            <th>{t("form.code")}</th>
            <th>{t("common.department")}</th>
            <th>{t("form.jobFamily")}</th>
            <th>{t("form.sections")}</th>
            <th>{t("common.employees")}</th>
            <th className="text-end">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id}>
              <td className="font-mono text-[12px]">{d.code}</td>
              <td className="font-medium text-[var(--brand-ink)]">{d.name}</td>
              <td className="text-[13px]">{humanizeKey(d.jobFamily)}</td>
              <td className="text-[12px] text-[var(--brand-muted)]">
                {d.sections.map((s) => s.name).join(", ") || "—"}
              </td>
              <td className="tabular-nums">{d.employees}</td>
              <td className="text-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(d);
                  }}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                >
                  <Pencil size={13} />
                  {t("common.edit")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <form action={addSection} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--brand-line)] pt-4">
        <Field label={t("form.addSection")} className="min-w-44">
          {(p) => (
            <Select {...p} name="departmentId" required defaultValue="">
              <option value="" disabled>
                {t("common.department")}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("form.sectionName")} className="min-w-44">
          {(p) => <TextInput {...p} name="name" required maxLength={120} />}
        </Field>
        <Submit label={t("common.add")} />
        <FormError>{msg(sectionState.error)}</FormError>
        <FormSuccess>{msg(sectionState.success)}</FormSuccess>
      </form>
    </Card>
  );
}

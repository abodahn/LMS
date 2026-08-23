"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, TableShell } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { JOB_FAMILIES } from "@/lib/constants";
import { humanizeKey } from "@/lib/utils";
import { saveJobTitleAction, type OrgState } from "./actions";

type JobTitle = {
  id: string;
  name: string;
  jobFamily: string;
  departmentId: string;
  departmentName: string | null;
  isTechnical: boolean;
  isManagerial: boolean;
  employees: number;
};

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function JobTitleManager({
  jobTitles,
  departments,
}: {
  jobTitles: JobTitle[];
  departments: { id: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<OrgState, FormData>(saveJobTitleAction, {});
  const [editing, setEditing] = useState<JobTitle | null>(null);
  const [creating, setCreating] = useState(false);

  const current = editing;
  const open = creating || !!editing;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("common.jobTitle")}</h2>
          <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">
            {t("form.technicalFlagHint")}
          </p>
        </div>
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
          {current ? <input type="hidden" name="jobTitleId" value={current.id} /> : null}
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
            <Field label={t("common.jobTitle")} required>
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
            <Field label={t("common.department")}>
              {(p) => (
                <Select {...p} name="departmentId" defaultValue={current?.departmentId ?? ""}>
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox name="isTechnical" defaultChecked={current?.isTechnical ?? false} label={t("form.technicalRole")} />
            <Checkbox name="isManagerial" defaultChecked={current?.isManagerial ?? false} label={t("form.managerialRole")} />
          </div>

          <Submit />
        </form>
      ) : null}

      <TableShell className="mt-4">
        <thead>
          <tr>
            <th>{t("common.jobTitle")}</th>
            <th>{t("form.jobFamily")}</th>
            <th>{t("common.department")}</th>
            <th>{t("form.flags")}</th>
            <th>{t("common.employees")}</th>
            <th className="text-end">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {jobTitles.map((j) => (
            <tr key={j.id}>
              <td className="font-medium text-[var(--brand-ink)]">{j.name}</td>
              <td className="text-[13px]">{humanizeKey(j.jobFamily)}</td>
              <td className="text-[13px]">{j.departmentName ?? "—"}</td>
              <td>
                {j.isTechnical ? <Badge tone="info">{t("form.technical")}</Badge> : null}
                {j.isManagerial ? (
                  <Badge tone="neutral" className="ms-1">
                    Manager
                  </Badge>
                ) : null}
              </td>
              <td className="tabular-nums">{j.employees}</td>
              <td className="text-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(j);
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
    </Card>
  );
}

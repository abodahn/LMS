"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatusPill, TableShell } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { deleteUseCaseAction, saveUseCaseAction, type ContentState } from "./actions";

export type UseCaseRow = {
  id: string;
  title: string;
  titleAr: string;
  departmentId: string;
  departmentName: string | null;
  problem: string;
  howAiHelps: string;
  workflow: string;
  examplePrompt: string;
  dataSensitivityWarning: string;
  estimatedTimeSaved: string;
  difficulty: string;
  status: string;
};

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function UseCaseManager({
  useCases,
  departments,
}: {
  useCases: UseCaseRow[];
  departments: { id: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [state, action] = useActionState<ContentState, FormData>(saveUseCaseAction, {});
  const [editing, setEditing] = useState<UseCaseRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  const current = editing;
  const open = creating || !!editing;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("useCases.title")}</h2>
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
          {current ? <input type="hidden" name="useCaseId" value={current.id} /> : null}
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
            <Field label={t("form.titleEn")} required className="lg:col-span-2">
              {(p) => <TextInput {...p} name="title" required maxLength={200} defaultValue={current?.title ?? ""} />}
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
            <Field label={t("form.titleAr")}>
              {(p) => <TextInput {...p} name="titleAr" dir="rtl" maxLength={200} defaultValue={current?.titleAr ?? ""} />}
            </Field>
            <Field label={t("useCases.timeSaved")}>
              {(p) => (
                <TextInput {...p} name="estimatedTimeSaved" maxLength={120} defaultValue={current?.estimatedTimeSaved ?? ""} />
              )}
            </Field>
            <Field label={t("prompts.byDifficulty")} required>
              {(p) => (
                <Select {...p} name="difficulty" defaultValue={current?.difficulty ?? "EASY"}>
                  <option value="EASY">{t("form.easy")}</option>
                  <option value="MEDIUM">{t("form.medium")}</option>
                  <option value="ADVANCED">{t("form.advanced")}</option>
                </Select>
              )}
            </Field>
            <Field label={t("useCases.problem")} required className="lg:col-span-3">
              {(p) => <TextArea {...p} name="problem" rows={2} required defaultValue={current?.problem ?? ""} />}
            </Field>
            <Field label={t("useCases.howAiHelps")} required className="lg:col-span-3">
              {(p) => <TextArea {...p} name="howAiHelps" rows={2} required defaultValue={current?.howAiHelps ?? ""} />}
            </Field>
            <Field label={t("useCases.workflow")} hint={t("form.oneStepPerLine")} className="lg:col-span-3">
              {(p) => <TextArea {...p} name="workflow" rows={4} defaultValue={current?.workflow ?? ""} />}
            </Field>
            <Field label={t("useCases.examplePrompt")} required className="lg:col-span-3">
              {(p) => (
                <TextArea
                  {...p}
                  name="examplePrompt"
                  rows={5}
                  required
                  className="font-mono text-[12.5px]"
                  defaultValue={current?.examplePrompt ?? ""}
                />
              )}
            </Field>
            <Field label={t("useCases.dataWarning")} required className="lg:col-span-3">
              {(p) => (
                <TextArea {...p} name="dataSensitivityWarning" rows={2} required defaultValue={current?.dataSensitivityWarning ?? ""} />
              )}
            </Field>
            <Field label={t("common.status")} required>
              {(p) => (
                <Select {...p} name="status" defaultValue={current?.status ?? "PUBLISHED"}>
                  <option value="DRAFT">{t("common.draft")}</option>
                  <option value="PUBLISHED">{t("common.published")}</option>
                  <option value="ARCHIVED">{t("common.archived")}</option>
                </Select>
              )}
            </Field>
          </div>

          <Submit />
        </form>
      ) : null}

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <th>{t("useCases.title")}</th>
              <th>{t("common.department")}</th>
              <th>{t("useCases.timeSaved")}</th>
              <th>{t("common.status")}</th>
              <th className="text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {useCases.map((u) => (
              <tr key={u.id}>
                <td className="max-w-80">
                  <span className="block font-medium text-[var(--brand-ink)]">{u.title}</span>
                  <span className="line-clamp-1 text-[12px] text-[var(--brand-muted)]">{u.problem}</span>
                </td>
                <td className="text-[13px]">{u.departmentName ?? "—"}</td>
                <td className="text-[13px]">{u.estimatedTimeSaved || "—"}</td>
                <td>
                  <StatusPill status={u.status} />
                </td>
                <td className="text-end">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setEditing(u);
                      }}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--brand-red)] underline-offset-4 hover:underline"
                    >
                      <Pencil size={13} />
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await deleteUseCaseAction(u.id);
                          router.refresh();
                        })
                      }
                      aria-label={t("common.delete")}
                      className="rounded-[var(--radius-control)] p-1 text-[var(--brand-muted)] hover:text-[var(--brand-red)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </Card>
  );
}

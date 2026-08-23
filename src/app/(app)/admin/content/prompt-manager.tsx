"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, StatusPill, TableShell } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { deletePromptAction, savePromptAction, type ContentState } from "./actions";

export type PromptRow = {
  id: string;
  title: string;
  titleAr: string;
  titleTr: string;
  body: string;
  description: string;
  departmentId: string;
  departmentName: string | null;
  taskCategory: string;
  difficulty: string;
  tool: string;
  isApproved: boolean;
};

const CATEGORIES = ["WRITING", "ANALYSIS", "REPORTING", "RESEARCH", "COMMUNICATION", "AUTOMATION", "HR", "FINANCE"];

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function PromptManager({
  prompts,
  departments,
}: {
  prompts: PromptRow[];
  departments: { id: string; name: string }[];
}) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [state, action] = useActionState<ContentState, FormData>(savePromptAction, {});
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  const current = editing;
  const open = creating || !!editing;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("prompts.title")}</h2>
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
          {current ? <input type="hidden" name="promptId" value={current.id} /> : null}
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
            <Field label={t("form.titleTr")}>
              {(p) => <TextInput {...p} name="titleTr" maxLength={200} defaultValue={current?.titleTr ?? ""} />}
            </Field>
            <Field label={t("prompts.byTask")} required>
              {(p) => (
                <Select {...p} name="taskCategory" defaultValue={current?.taskCategory ?? "WRITING"}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
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
            <Field label={t("prompts.byTool")}>
              {(p) => <TextInput {...p} name="tool" maxLength={40} defaultValue={current?.tool ?? "ANY"} />}
            </Field>
            <Field label={t("common.details")} className="lg:col-span-3">
              {(p) => <TextInput {...p} name="description" maxLength={500} defaultValue={current?.description ?? ""} />}
            </Field>
            <Field label={t("toolbox.promptBody")} required className="lg:col-span-3">
              {(p) => (
                <TextArea {...p} name="body" rows={8} required className="font-mono text-[12.5px]" defaultValue={current?.body ?? ""} />
              )}
            </Field>
          </div>

          <Checkbox name="isApproved" defaultChecked={current?.isApproved ?? true} label={t("form.approvedForLibrary")} />

          <Submit />
        </form>
      ) : null}

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <th>{t("toolbox.promptTitle")}</th>
              <th>{t("common.department")}</th>
              <th>{t("prompts.byTask")}</th>
              <th>{t("common.status")}</th>
              <th className="text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((p) => (
              <tr key={p.id}>
                <td className="max-w-80">
                  <span className="block font-medium text-[var(--brand-ink)]">{p.title}</span>
                  <span className="line-clamp-1 text-[12px] text-[var(--brand-muted)]">{p.description}</span>
                </td>
                <td className="text-[13px]">{p.departmentName ?? "—"}</td>
                <td className="text-[13px]">{p.taskCategory}</td>
                <td>
                  <StatusPill status={p.isApproved ? "APPROVED" : "DRAFT"} />
                </td>
                <td className="text-end">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setEditing(p);
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
                          await deletePromptAction(p.id);
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

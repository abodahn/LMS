"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { LOCALES, ROLE_KEYS } from "@/lib/constants";
import { LOCALE_LABELS } from "@/lib/i18n";
import {
  rebuildPathAction,
  resetUserPasswordAction,
  saveUserAction,
  setUserStatusAction,
  type PeopleState,
} from "./actions";

type Option = { id: string; name: string };

function Submit() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("common.saving") : t("common.save")}
    </Button>
  );
}

export function UserForm({
  user,
  departments,
  sections,
  jobTitles,
  locations,
  managers,
  canManage,
  canGrantPrivileged = false,
}: {
  user?: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    departmentId: string | null;
    sectionId: string | null;
    jobTitleId: string | null;
    locationId: string | null;
    managerId: string | null;
    preferredLanguage: string;
    status: string;
    roles: string[];
    certificateName?: string | null;
  };
  departments: Option[];
  sections: (Option & { departmentId: string })[];
  jobTitles: Option[];
  locations: Option[];
  managers: Option[];
  canManage: boolean;
  /** Super Admin only: the Admin and Super Admin roles can be granted or removed. */
  canGrantPrivileged?: boolean;
}) {
  const t = useT();
  const msg = useMessage();
  const router = useRouter();
  const [state, action] = useActionState<PeopleState, FormData>(saveUserAction, {});
  const [departmentId, setDepartmentId] = useState(user?.departmentId ?? "");
  const [adminState, setAdminState] = useState<PeopleState>({});
  const [pending, start] = useTransition();

  const visibleSections = sections.filter((s) => !departmentId || s.departmentId === departmentId);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <form action={action} className="space-y-5">
          {user ? <input type="hidden" name="userId" value={user.id} /> : null}
          <FormError>{msg(state.error)}</FormError>
          <FormSuccess>{msg(state.success)}</FormSuccess>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("profile.employeeId")} required>
              {(p) => (
                <TextInput {...p} name="employeeCode" required maxLength={40} defaultValue={user?.employeeCode ?? ""} />
              )}
            </Field>
            <Field label={t("profile.fullName")} required>
              {(p) => <TextInput {...p} name="fullName" required maxLength={120} defaultValue={user?.fullName ?? ""} />}
            </Field>
            <Field label={t("profile.email")} required>
              {(p) => <TextInput {...p} name="email" type="email" required defaultValue={user?.email ?? ""} />}
            </Field>
            {user ? (
              <Field label={t("certificates.nameAdminLabel")} hint={t("certificates.nameAdminHint")}>
                {(p) => (
                  <>
                    <TextInput {...p} name="certificateName" maxLength={80} dir="auto" defaultValue={user.certificateName ?? ""} />
                    <input type="hidden" name="certificateNameWas" value={user.certificateName ?? ""} />
                  </>
                )}
              </Field>
            ) : null}
            <Field label={t("profile.preferredLanguage")} required>
              {(p) => (
                <Select {...p} name="preferredLanguage" defaultValue={user?.preferredLanguage ?? "en"}>
                  {LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t("common.department")}>
              {(p) => (
                <Select
                  {...p}
                  name="departmentId"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("profile.section")}>
              {(p) => (
                <Select {...p} name="sectionId" defaultValue={user?.sectionId ?? ""}>
                  <option value="">—</option>
                  {visibleSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("common.jobTitle")}>
              {(p) => (
                <Select {...p} name="jobTitleId" defaultValue={user?.jobTitleId ?? ""}>
                  <option value="">—</option>
                  {jobTitles.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("profile.location")}>
              {(p) => (
                <Select {...p} name="locationId" defaultValue={user?.locationId ?? ""}>
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("common.manager")}>
              {(p) => (
                <Select {...p} name="managerId" defaultValue={user?.managerId ?? ""}>
                  <option value="">—</option>
                  {managers
                    .filter((m) => m.id !== user?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
            <Field label={t("common.status")} required>
              {(p) => (
                <Select {...p} name="status" defaultValue={user?.status ?? "ACTIVE"}>
                  <option value="ACTIVE">{t("common.active")}</option>
                  <option value="INACTIVE">{t("common.inactive")}</option>
                  <option value="INVITED">{t("form.invited")}</option>
                </Select>
              )}
            </Field>
          </div>

          <fieldset>
            <legend className="label">{t("admin.roles")}</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_KEYS.map((r) => (
                <Checkbox
                  key={r}
                  name="roles"
                  value={r}
                  defaultChecked={user ? user.roles.includes(r) : r === "EMPLOYEE"}
                  disabled={!canGrantPrivileged && (r === "ADMIN" || r === "SUPER_ADMIN")}
                  label={r.replace(/_/g, " ")}
                />
              ))}
            </div>
          </fieldset>

          <Submit />
        </form>
      </Card>

      {user && canManage ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("common.actions")}</h2>
          <FormSuccess>{msg(adminState.success, adminState.params)}</FormSuccess>
          <FormError>{msg(adminState.error)}</FormError>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => start(async () => setAdminState(await resetUserPasswordAction(user.id)))}
            >
              <KeyRound size={15} />
              {t("auth.changePassword")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => start(async () => setAdminState(await rebuildPathAction(user.id)))}
            >
              <RefreshCw size={15} />
              {t("admin.runRecommendation")}
            </Button>
            <Button
              variant={user.status === "ACTIVE" ? "danger" : "secondary"}
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await setUserStatusAction(user.id, user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                  router.refresh();
                })
              }
            >
              {user.status === "ACTIVE" ? t("common.inactive") : t("common.active")}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

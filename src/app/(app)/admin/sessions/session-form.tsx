"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useT } from "@/components/i18n-provider";
import { saveSessionAction, type AdminSessionState } from "./actions";

export type SessionFormValues = {
  id?: string;
  title: string;
  titleAr: string;
  titleTr: string;
  description: string;
  courseId: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  locationId: string;
  room: string;
  meetingUrl: string;
  instructorId: string;
  instructorName: string;
  capacity: number;
  waitlistEnabled: boolean;
  creditHours: string;
  notes: string;
};

type Option = { id: string; name: string };

export function SessionForm({
  values,
  courses,
  locations,
  instructors,
}: {
  values: SessionFormValues;
  courses: Option[];
  locations: Option[];
  instructors: Option[];
}) {
  const t = useT();
  const [state, action, pending] = useActionState<AdminSessionState, FormData>(saveSessionAction, {});

  return (
    <form action={action} className="space-y-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Card className="space-y-4 p-5">
        <Field label={t("form.title")} required>
          {(p) => <TextInput {...p} name="title" required maxLength={200} defaultValue={values.title} />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t("form.title")} (AR)`}>
            {(p) => <TextInput {...p} name="titleAr" maxLength={200} defaultValue={values.titleAr} dir="rtl" />}
          </Field>
          <Field label={`${t("form.title")} (TR)`}>
            {(p) => <TextInput {...p} name="titleTr" maxLength={200} defaultValue={values.titleTr} />}
          </Field>
        </div>

        <Field label={t("form.description")}>
          {(p) => (
            <textarea {...p} name="description" rows={3} maxLength={2000} defaultValue={values.description} className="field" />
          )}
        </Field>

        <Field label={t("sessions.linkedCourse")} hint={t("sessions.attendanceHint")}>
          {(p) => (
            <select {...p} name="courseId" defaultValue={values.courseId} className="field">
              <option value="">{t("sessions.noCourse")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("sessions.startsAt")} required>
            {(p) => (
              <TextInput {...p} type="datetime-local" name="startsAt" required defaultValue={values.startsAt} />
            )}
          </Field>
          <Field label={t("sessions.endsAt")} required>
            {(p) => <TextInput {...p} type="datetime-local" name="endsAt" required defaultValue={values.endsAt} />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("form.type")}>
            {(p) => (
              <select {...p} name="mode" defaultValue={values.mode} className="field">
                <option value="IN_PERSON">{t("sessions.modeInPerson")}</option>
                <option value="ONLINE">{t("sessions.modeOnline")}</option>
                <option value="HYBRID">{t("sessions.modeHybrid")}</option>
              </select>
            )}
          </Field>
          <Field label={t("form.location")}>
            {(p) => (
              <select {...p} name="locationId" defaultValue={values.locationId} className="field">
                <option value="">—</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("sessions.room")}>
            {(p) => <TextInput {...p} name="room" maxLength={120} defaultValue={values.room} />}
          </Field>
        </div>

        <Field label={t("sessions.meetingUrl")}>
          {(p) => (
            <TextInput {...p} type="url" name="meetingUrl" maxLength={2000} defaultValue={values.meetingUrl} />
          )}
        </Field>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("sessions.instructor")}>
            {(p) => (
              <select {...p} name="instructorId" defaultValue={values.instructorId} className="field">
                <option value="">—</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("sessions.externalInstructor")}>
            {(p) => <TextInput {...p} name="instructorName" maxLength={120} defaultValue={values.instructorName} />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("sessions.capacity")} required>
            {(p) => (
              <TextInput {...p} type="number" name="capacity" min={1} max={1000} required defaultValue={values.capacity} />
            )}
          </Field>
          <Field label={t("sessions.creditHours")}>
            {(p) => (
              <TextInput {...p} type="number" step="0.5" min={0} max={200} name="creditHours" defaultValue={values.creditHours} />
            )}
          </Field>
        </div>

        <label className="inline-flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            name="waitlistEnabled"
            defaultChecked={values.waitlistEnabled}
            className="h-4 w-4 accent-[var(--brand-red)]"
          />
          {t("sessions.waitlistEnabled")}
        </label>
      </Card>

      <FormError>{state.error ? t(state.error) : null}</FormError>
      <FormSuccess>{state.success ? t(state.success) : null}</FormSuccess>

      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

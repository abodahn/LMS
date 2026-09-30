"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/primitives";
import { Checkbox, Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { DIFFICULTIES, JOB_FAMILIES, LEARNING_GOALS, LOCALES } from "@/lib/constants";
import { humanizeKey } from "@/lib/utils";
import { saveCourseAction, type CourseState } from "./actions";

type Option = { id: string; name: string };

export type CourseFormValues = {
  id?: string;
  code: string;
  title: string;
  titleAr: string;
  titleTr: string;
  description: string;
  descriptionAr: string;
  descriptionTr: string;
  outcomes: string;
  providerId: string;
  platform: string;
  url: string;
  language: string;
  difficulty: string;
  estimatedHours: number;
  isFree: boolean;
  price: number | null;
  certificateAvailable: boolean;
  certificateCost: number | null;
  aiLevelId: string;
  categoryId: string;
  status: string;
  isInternal: boolean;
  isTechnical: boolean;
  isMandatory: boolean;
  requiresSignOff: boolean;
  isRecommended: boolean;
  youtubePlaylistId: string;
  rating: number | null;
  qualityScore: number;
  reviewIntervalDays: number;
  competencies: { id: string; weight: number }[];
  departments: string[];
  jobFamilies: string[];
  goals: string[];
  prerequisites: string[];
  subtitles: string[];
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

export function CourseForm({
  values,
  providers,
  categories,
  levels,
  competencies,
  departments,
  courses,
}: {
  values: CourseFormValues;
  providers: Option[];
  categories: Option[];
  levels: (Option & { code: string })[];
  competencies: Option[];
  departments: Option[];
  courses: Option[];
}) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<CourseState, FormData>(saveCourseAction, {});
  const [isFree, setIsFree] = useState(values.isFree);
  const [hasCertificate, setHasCertificate] = useState(values.certificateAvailable);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    values.competencies.map((c) => c.id),
  );

  return (
    <form action={action} className="space-y-5">
      {values.id ? <input type="hidden" name="courseId" value={values.id} /> : null}
      {state.warning ? <input type="hidden" name="acknowledgeDuplicate" value="yes" /> : null}

      <FormError>{msg(state.error)}</FormError>
      <FormSuccess>{msg(state.success)}</FormSuccess>
      {state.warning ? <Alert tone="warning" title={t("form.possibleDuplicate")}>{state.warning}</Alert> : null}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.generalInformation")}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label={t("form.code")} required>
            {(p) => <TextInput {...p} name="code" required maxLength={40} defaultValue={values.code} />}
          </Field>
          <Field label={t("common.status")} required>
            {(p) => (
              <Select {...p} name="status" defaultValue={values.status}>
                <option value="DRAFT">{t("common.draft")}</option>
                <option value="PUBLISHED">{t("common.published")}</option>
                <option value="ARCHIVED">{t("common.archived")}</option>
              </Select>
            )}
          </Field>

          <Field label={t("form.titleEn")} required className="sm:col-span-2">
            {(p) => <TextInput {...p} name="title" required maxLength={200} defaultValue={values.title} />}
          </Field>
          <Field label={t("form.titleAr")}>
            {(p) => <TextInput {...p} name="titleAr" maxLength={200} defaultValue={values.titleAr} dir="rtl" />}
          </Field>
          <Field label={t("form.titleTr")}>
            {(p) => <TextInput {...p} name="titleTr" maxLength={200} defaultValue={values.titleTr} />}
          </Field>

          <Field label={t("form.descriptionEn")} required className="sm:col-span-2">
            {(p) => <TextArea {...p} name="description" rows={3} required defaultValue={values.description} />}
          </Field>
          <Field label={t("form.descriptionAr")}>
            {(p) => <TextArea {...p} name="descriptionAr" rows={3} defaultValue={values.descriptionAr} dir="rtl" />}
          </Field>
          <Field label={t("form.descriptionTr")}>
            {(p) => <TextArea {...p} name="descriptionTr" rows={3} defaultValue={values.descriptionTr} />}
          </Field>

          <Field label={t("form.learningOutcomes")} hint={t("form.onePerLine")} className="sm:col-span-2">
            {(p) => <TextArea {...p} name="outcomes" rows={4} defaultValue={values.outcomes} />}
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.delivery")}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("form.provider")} required>
            {(p) => (
              <Select {...p} name="providerId" required defaultValue={values.providerId}>
                {providers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.platform")} required>
            {(p) => <TextInput {...p} name="platform" required maxLength={80} defaultValue={values.platform} />}
          </Field>
          <Field label="URL">
            {(p) => <TextInput {...p} name="url" type="url" maxLength={500} defaultValue={values.url} />}
          </Field>

          <Field label={t("common.language")} required>
            {(p) => (
              <Select {...p} name="language" defaultValue={values.language}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.subtitles")}>
            {() => (
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((l) => (
                  <label key={l} className="inline-flex items-center gap-1.5 text-[13px]">
                    <input
                      type="checkbox"
                      name="subtitles"
                      value={l}
                      defaultChecked={values.subtitles.includes(l)}
                      className="h-4 w-4 accent-[var(--brand-red)]"
                    />
                    {l.toUpperCase()}
                  </label>
                ))}
              </div>
            )}
          </Field>
          <Field label={t("form.youtubePlaylistId")}>
            {(p) => (
              <TextInput {...p} name="youtubePlaylistId" maxLength={120} defaultValue={values.youtubePlaylistId} />
            )}
          </Field>

          <Field label={t("form.difficulty")} required>
            {(p) => (
              <Select {...p} name="difficulty" defaultValue={values.difficulty}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {humanizeKey(d)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.estimatedHours")} required>
            {(p) => (
              <TextInput
                {...p}
                name="estimatedHours"
                type="number"
                step="0.25"
                min={0.25}
                max={400}
                required
                defaultValue={values.estimatedHours}
              />
            )}
          </Field>
          <Field label={t("form.targetAiLevel")}>
            {(p) => (
              <Select {...p} name="aiLevelId" defaultValue={values.aiLevelId}>
                <option value="">—</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("form.category")}>
            {(p) => (
              <Select {...p} name="categoryId" defaultValue={values.categoryId}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("form.isFree")} required>
            {(p) => (
              <Select
                {...p}
                name="isFree"
                value={isFree ? "yes" : "no"}
                onChange={(e) => setIsFree(e.target.value === "yes")}
              >
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </Select>
            )}
          </Field>
          {!isFree ? (
            <Field label={t("form.priceUsd")}>
              {(p) => (
                <TextInput {...p} name="price" type="number" min={0} step="1" defaultValue={values.price ?? ""} />
              )}
            </Field>
          ) : null}

          <Field label={t("form.certificateAvailable")} required>
            {(p) => (
              <Select
                {...p}
                name="certificateAvailable"
                value={hasCertificate ? "yes" : "no"}
                onChange={(e) => setHasCertificate(e.target.value === "yes")}
              >
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </Select>
            )}
          </Field>
          {hasCertificate ? (
            <Field label={t("form.certificateCost")}>
              {(p) => (
                <TextInput
                  {...p}
                  name="certificateCost"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={values.certificateCost ?? ""}
                />
              )}
            </Field>
          ) : null}

          <Field label={t("form.publicRating")}>
            {(p) => (
              <TextInput {...p} name="rating" type="number" min={0} max={5} step="0.1" defaultValue={values.rating ?? ""} />
            )}
          </Field>
          <Field label={t("form.qualityScore")} hint={t("form.usedByEngine")}>
            {(p) => (
              <TextInput
                {...p}
                name="qualityScore"
                type="number"
                min={0}
                max={1}
                step="0.05"
                required
                defaultValue={values.qualityScore}
              />
            )}
          </Field>
          <Field label={t("form.reviewInterval")} required>
            {(p) => (
              <TextInput
                {...p}
                name="reviewIntervalDays"
                type="number"
                min={30}
                max={1095}
                required
                defaultValue={values.reviewIntervalDays}
              />
            )}
          </Field>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <FlagSelect name="isInternal" label={t("form.internalCourse")} value={values.isInternal} />
          <FlagSelect name="isTechnical" label={t("form.technicalContent")} value={values.isTechnical} />
          <FlagSelect name="isMandatory" label={t("form.mandatory")} value={values.isMandatory} />
          <FlagSelect name="requiresSignOff" label={t("form.requiresSignOff")} value={values.requiresSignOff} />
          <FlagSelect name="isRecommended" label={t("form.featured")} value={values.isRecommended} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.targeting")}</h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {t("form.targetingHint")}
        </p>

        <fieldset className="mt-4">
          <legend className="label">{t("form.competencies")}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {competencies.map((c) => {
              const checked = selectedCompetencies.includes(c.id);
              const weight = values.competencies.find((x) => x.id === c.id)?.weight ?? 2;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--brand-line)] p-2.5"
                >
                  <input
                    type="checkbox"
                    name="competencies"
                    value={c.id}
                    checked={checked}
                    onChange={(e) =>
                      setSelectedCompetencies((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                      )
                    }
                    className="h-4 w-4 shrink-0 accent-[var(--brand-red)]"
                    id={`comp-${c.id}`}
                  />
                  <label htmlFor={`comp-${c.id}`} className="min-w-0 flex-1 truncate text-[13px]">
                    {c.name}
                  </label>
                  {checked ? (
                    <input
                      type="number"
                      name={`competencyWeight.${c.id}`}
                      min={1}
                      max={5}
                      defaultValue={weight}
                      aria-label={`${c.name} weight`}
                      className="field w-14 px-1 py-1 text-center text-[13px]"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="label">{t("common.department")}</legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {departments.map((d) => (
              <Checkbox
                key={d.id}
                name="departments"
                value={d.id}
                defaultChecked={values.departments.includes(d.id)}
                label={d.name}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="label">{t("form.jobFamilies")}</legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {JOB_FAMILIES.map((f) => (
              <Checkbox
                key={f}
                name="jobFamilies"
                value={f}
                defaultChecked={values.jobFamilies.includes(f)}
                label={humanizeKey(f)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="label">{t("profile.learningGoals")}</legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {LEARNING_GOALS.map((g) => (
              <Checkbox
                key={g}
                name="goals"
                value={g}
                defaultChecked={values.goals.includes(g)}
                label={t(`goals.${g}`)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="label">{t("form.prerequisites")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {courses
              .filter((c) => c.id !== values.id)
              .map((c) => (
                <Checkbox
                  key={c.id}
                  name="prerequisites"
                  value={c.id}
                  defaultChecked={values.prerequisites.includes(c.id)}
                  label={c.name}
                />
              ))}
          </div>
        </fieldset>
      </Card>

      <Submit />
    </form>
  );
}

function FlagSelect({ name, label, value }: { name: string; label: string; value: boolean }) {
  const t = useT();
  return (
    <Field label={label}>
      {(p) => (
        <Select {...p} name={name} defaultValue={value ? "yes" : "no"}>
          <option value="no">{t("common.no")}</option>
          <option value="yes">{t("common.yes")}</option>
        </Select>
      )}
    </Field>
  );
}

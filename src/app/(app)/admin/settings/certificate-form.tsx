"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/form";
import { useMessage, useT } from "@/components/i18n-provider";
import { saveCertificateSettingsAction, type SettingsState } from "./actions";

export type CertificateValues = {
  issuerTc: string;
  issuerTcap: string;
  sign1Name: string;
  sign1Title: string;
  sign2Name: string;
  sign2Title: string;
  tcapSign1Name: string;
  tcapSign1Title: string;
  tcapSign2Name: string;
  tcapSign2Title: string;
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

/** Who issues and signs certificates. Applies to every PDF downloaded afterwards. */
export function CertificateForm({ values }: { values: CertificateValues }) {
  const t = useT();
  const msg = useMessage();
  const [state, action] = useActionState<SettingsState, FormData>(saveCertificateSettingsAction, {});
  const text = (name: keyof CertificateValues, label: string, required = false) => (
    <Field label={label} required={required}>
      {(p) => <TextInput {...p} name={name} defaultValue={values[name]} required={required} maxLength={80} dir="auto" />}
    </Field>
  );

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.certificatesTitle")}</h2>
      <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("form.certificatesHint")}</p>
      <form action={action} className="mt-4 space-y-4">
        <FormError>{msg(state.error)}</FormError>
        <FormSuccess>{msg(state.success)}</FormSuccess>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("issuerTc", t("form.issuerTcName"), true)}
          {text("issuerTcap", t("form.issuerTcapName"), true)}
        </div>
        <h3 className="text-[13px] font-semibold text-[var(--brand-ink)]">{t("form.signatoriesTc")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("sign1Name", t("form.signatory1Name"), true)}
          {text("sign1Title", t("form.signatory1Title"))}
          {text("sign2Name", t("form.signatory2Name"))}
          {text("sign2Title", t("form.signatory2Title"))}
        </div>
        <h3 className="text-[13px] font-semibold text-[var(--brand-ink)]">{t("form.signatoriesTcap")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("tcapSign1Name", t("form.signatory1Name"), true)}
          {text("tcapSign1Title", t("form.signatory1Title"))}
          {text("tcapSign2Name", t("form.signatory2Name"))}
          {text("tcapSign2Title", t("form.signatory2Title"))}
        </div>
        <Submit />
      </form>
    </Card>
  );
}

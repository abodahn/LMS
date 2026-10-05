import { prisma } from "./db";
import { READINESS_DEFAULT_WEIGHTS, SETTING_KEYS } from "./constants";

const DEFAULTS: Record<string, unknown> = {
  [SETTING_KEYS.TARGET_LEARNING_HOURS]: 35,
  [SETTING_KEYS.MIN_LEARNING_HOURS]: 30,
  [SETTING_KEYS.MAX_LEARNING_HOURS]: 40,
  [SETTING_KEYS.COMPLETION_THRESHOLD]: 90,
  [SETTING_KEYS.FINAL_PASS_SCORE]: 70,
  [SETTING_KEYS.RESPONSIBLE_AI_MANDATORY]: true,
  [SETTING_KEYS.CAPSTONE_REQUIRED]: true,
  [SETTING_KEYS.COURSE_REVIEW_DAYS]: 180,
  [SETTING_KEYS.READINESS_WEIGHTS]: READINESS_DEFAULT_WEIGHTS,
  [SETTING_KEYS.SESSION_HOURS]: 12,
  [SETTING_KEYS.MAX_FAILED_LOGINS]: 5,
  [SETTING_KEYS.LOCKOUT_MINUTES]: 15,
  [SETTING_KEYS.AI_ENABLED]: false,
  [SETTING_KEYS.AI_PROVIDER]: "anthropic",
  [SETTING_KEYS.AI_MODEL]: "claude-sonnet-5",
  [SETTING_KEYS.DEFAULT_LOCALE]: "en",
  [SETTING_KEYS.CERT_ISSUER_TC]: "T&C Garments",
  [SETTING_KEYS.CERT_ISSUER_TCAP]: "T-CAP",
  [SETTING_KEYS.CERT_SIGN1_NAME]: "Ahmed Tolba",
  [SETTING_KEYS.CERT_SIGN1_TITLE]: "Chief Executive Officer",
  [SETTING_KEYS.CERT_SIGN2_NAME]: "Enis Dancir",
  [SETTING_KEYS.CERT_SIGN2_TITLE]: "",
  [SETTING_KEYS.CERT_TCAP_SIGN1_NAME]: "Ahmed Tolba",
  [SETTING_KEYS.CERT_TCAP_SIGN1_TITLE]: "Chief Executive Officer",
  [SETTING_KEYS.CERT_TCAP_SIGN2_NAME]: "",
  [SETTING_KEYS.CERT_TCAP_SIGN2_TITLE]: "",
};

function parse(row: { value: string; type: string }): unknown {
  switch (row.type) {
    case "NUMBER":
      return Number(row.value);
    case "BOOLEAN":
      return row.value === "true";
    case "JSON":
      try {
        return JSON.parse(row.value);
      } catch {
        return null;
      }
    default:
      return row.value;
  }
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.systemSetting.findMany();
  const out = { ...DEFAULTS };
  for (const r of rows) {
    const v = parse(r);
    if (v !== null && v !== undefined && !(typeof v === "number" && Number.isNaN(v))) out[r.key] = v;
  }
  return out;
}

export async function getSetting<T>(key: string, fallback?: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (row) {
    const v = parse(row);
    if (v !== null && v !== undefined) return v as T;
  }
  return (DEFAULTS[key] as T) ?? (fallback as T);
}

export async function setSetting(key: string, value: unknown) {
  const type =
    typeof value === "number"
      ? "NUMBER"
      : typeof value === "boolean"
        ? "BOOLEAN"
        : typeof value === "object"
          ? "JSON"
          : "STRING";
  const raw = type === "JSON" ? JSON.stringify(value) : String(value);
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: raw, type },
    create: { key, value: raw, type, label: key, group: key.split(".")[0].toUpperCase() },
  });
}

export type CertificationPolicy = {
  completionThreshold: number;
  finalPassScore: number;
  responsibleAiMandatory: boolean;
  capstoneRequired: boolean;
};

export async function getCertificationPolicy(): Promise<CertificationPolicy> {
  const s = await getSettings();
  return {
    completionThreshold: Number(s[SETTING_KEYS.COMPLETION_THRESHOLD]),
    finalPassScore: Number(s[SETTING_KEYS.FINAL_PASS_SCORE]),
    responsibleAiMandatory: Boolean(s[SETTING_KEYS.RESPONSIBLE_AI_MANDATORY]),
    capstoneRequired: Boolean(s[SETTING_KEYS.CAPSTONE_REQUIRED]),
  };
}

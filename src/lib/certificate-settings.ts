import { getSettings } from "./settings";
import { SETTING_KEYS } from "./constants";

/**
 * Who issues and signs certificates — set in Admin → Settings, read at the
 * moment a PDF is drawn, so a corrected title appears on every certificate
 * downloaded afterwards.
 */

export { ISSUERS, issuerKey, nextCertificateCode, type IssuerKey } from "./certificate-code";
import type { IssuerKey } from "./certificate-code";

export async function certificateSettings() {
  const s = await getSettings();
  const str = (k: string) => String(s[k] ?? "").trim();
  return {
    issuers: {
      TC: str(SETTING_KEYS.CERT_ISSUER_TC) || "T&C Garments",
      TCAP: str(SETTING_KEYS.CERT_ISSUER_TCAP) || "T-CAP",
    } as Record<IssuerKey, string>,
    // Each company signs its own certificates: T&C with both executives,
    // T-CAP with its chief executive alone unless Settings say otherwise.
    signatories: {
      TC: [
        { name: str(SETTING_KEYS.CERT_SIGN1_NAME), title: str(SETTING_KEYS.CERT_SIGN1_TITLE) },
        { name: str(SETTING_KEYS.CERT_SIGN2_NAME), title: str(SETTING_KEYS.CERT_SIGN2_TITLE) },
      ].filter((x) => x.name),
      TCAP: [
        { name: str(SETTING_KEYS.CERT_TCAP_SIGN1_NAME), title: str(SETTING_KEYS.CERT_TCAP_SIGN1_TITLE) },
        { name: str(SETTING_KEYS.CERT_TCAP_SIGN2_NAME), title: str(SETTING_KEYS.CERT_TCAP_SIGN2_TITLE) },
      ].filter((x) => x.name),
    } as Record<IssuerKey, { name: string; title: string }[]>,
  };
}


/**
 * A name as it may be printed: Latin or Arabic letters (one script, which the
 * certificate fonts can draw), spaces and the punctuation names use (. ' -),
 * with no invisible characters and no stacks of accents. Spaces are collapsed.
 * Null when unacceptable.
 */
export function cleanCertificateName(raw: string): string | null {
  const name = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > 80) return null;
  if (/\p{Default_Ignorable_Code_Point}/u.test(name)) return null;
  if (/\p{M}{3,}/u.test(name)) return null;
  const latin = /^[\p{Script=Latin}][\p{Script=Latin}\p{M} .'’-]*$/u.test(name);
  const arabic = /^[\p{Script=Arabic}][\p{Script=Arabic}\p{M} .'’-]*$/u.test(name);
  return latin || arabic ? name : null;
}

/** Lower case, no accents, Arabic letter variants folded: for comparing names, not printing them. */
function fold(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[.'’-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Whether a printed name is this person's: every word of the name HR holds, in
 * order, with middle names allowed in between ("Ahmed Elgohary" may print as
 * "Ahmed Mohamed Elgohary"). Arabic is checked against the Arabic name on
 * record. Stops a learner putting a colleague's — or the CEO's — name on a
 * certificate that the public verification page then vouches for.
 */
export function matchesRecordedName(printed: string, record: { fullName: string; fullNameAr?: string | null }) {
  const arabic = /\p{Script=Arabic}/u.test(printed);
  const recorded = arabic ? record.fullNameAr : record.fullName;
  if (!recorded) return false;
  const want = fold(recorded);
  const have = fold(printed);
  let i = 0;
  for (const word of have) if (word === want[i]) i++;
  return want.length > 0 && i === want.length;
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { constantTimeEqual, createSession, recordLoginAttempt } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";
import {
  checkClaims,
  decodeClaims,
  discover,
  emailFrom,
  exchangeCode,
  OIDC_COOKIE,
  oidcConfig,
  publicUrl,
  redirectUri,
} from "@/lib/oidc";

/**
 * The provider's answer. Every failure lands on the login page with one of two
 * generic codes — "sso" (it did not work) or "sso_unknown" (it worked, but this
 * person has no account here) — and the detail goes to the server log only.
 */
export async function GET(request: Request) {
  const fail = (code: "sso" | "sso_unknown") => NextResponse.redirect(publicUrl(`/login?error=${code}`, request));
  const cfg = oidcConfig();
  if (!cfg) return NextResponse.redirect(publicUrl("/login", request));

  const jar = await cookies();
  const raw = jar.get(OIDC_COOKIE)?.value;
  jar.delete({ name: OIDC_COOKIE, path: "/" });

  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state") ?? "";
  let expected: { state: string; nonce: string; verifier: string };
  try {
    expected = JSON.parse(raw ?? "");
  } catch {
    return fail("sso");
  }
  if (!code || !expected?.state || !constantTimeEqual(state, expected.state)) return fail("sso");

  let email: string | null;
  try {
    const doc = await discover(cfg.issuer);
    const claims = decodeClaims(await exchangeCode(doc, cfg, code, expected.verifier, redirectUri(request)));
    const refused = checkClaims(claims, { issuer: doc.issuer.replace(/\/+$/, ""), clientId: cfg.clientId, nonce: expected.nonce });
    if (refused) throw new Error(`id_token refused: ${refused}`);
    email = emailFrom(claims);
  } catch (error) {
    console.error("sso callback failed", error instanceof Error ? error.message : "unknown");
    return fail("sso");
  }
  if (!email) return fail("sso_unknown");

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) {
    await recordLoginAttempt({ identifier: email, success: false, reason: "SSO_UNKNOWN_USER" });
    return fail("sso_unknown");
  }
  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ identifier: email, userId: user.id, success: false, reason: "INACTIVE" });
    return fail("sso_unknown");
  }

  const settings = await getSettings();
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSession(user.id, Number(settings[SETTING_KEYS.SESSION_HOURS] ?? 12));
  await recordLoginAttempt({ identifier: email, userId: user.id, success: true, reason: "SSO" });
  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    summary: "single sign-on",
  });
  return NextResponse.redirect(publicUrl("/", request));
}

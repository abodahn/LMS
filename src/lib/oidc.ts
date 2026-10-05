import { createHash, randomBytes } from "node:crypto";
import { publicOrigin } from "./public-url";

export { publicUrl } from "./public-url";

/**
 * Single sign-on over OpenID Connect — authorisation code flow with PKCE.
 *
 * Generic on purpose: Microsoft Entra ID, Google Workspace, Okta and Keycloak
 * all speak it, and which one T&C uses is configuration, not code. Everything
 * comes from the environment and nothing has a default, so with no
 * configuration the feature does not exist.
 *
 *   OIDC_ISSUER         e.g. https://login.microsoftonline.com/<tenant>/v2.0
 *   OIDC_CLIENT_ID
 *   OIDC_CLIENT_SECRET  server-side only, never sent to the browser
 *   OIDC_LABEL          optional button text, e.g. "Microsoft"
 *
 * The ID token arrives straight from the token endpoint over TLS, which OIDC
 * Core §3.1.3.7 accepts in place of checking its signature; its issuer,
 * audience, expiry and nonce are still checked here. Nobody is created by
 * signing in: the person must already exist (from the HR sync or an import),
 * matched on email.
 */

export type OidcConfig = { issuer: string; clientId: string; clientSecret: string; label: string | null };

export function oidcConfig(): OidcConfig | null {
  const issuer = process.env.OIDC_ISSUER?.trim().replace(/\/+$/, "");
  const clientId = process.env.OIDC_CLIENT_ID?.trim();
  const clientSecret = process.env.OIDC_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) return null;
  return { issuer, clientId, clientSecret, label: process.env.OIDC_LABEL?.trim() || null };
}

type Discovery = { issuer: string; authorization_endpoint: string; token_endpoint: string };
let cache: { issuer: string; at: number; doc: Discovery } | null = null;

export async function discover(issuer: string): Promise<Discovery> {
  if (cache && cache.issuer === issuer && Date.now() - cache.at < 3600_000) return cache.doc;
  const res = await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`discovery ${res.status}`);
  const doc = (await res.json()) as Discovery;
  if (doc.issuer?.replace(/\/+$/, "") !== issuer || !doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error("discovery document does not match the issuer");
  }
  cache = { issuer, at: Date.now(), doc };
  return doc;
}

/** `__Host-` in production for the same reason as the session cookie (lib/auth.ts). */
export const OIDC_COOKIE = process.env.NODE_ENV === "production" ? "__Host-tcai_oidc" : "tcai_oidc";

export function newAuthRequest() {
  const verifier = randomBytes(32).toString("base64url");
  return {
    state: randomBytes(16).toString("base64url"),
    nonce: randomBytes(16).toString("base64url"),
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export function authorizeUrl(
  doc: Discovery,
  cfg: OidcConfig,
  redirectUri: string,
  req: { state: string; nonce: string; challenge: string },
) {
  const url = new URL(doc.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state: req.state,
    nonce: req.nonce,
    code_challenge: req.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export async function exchangeCode(
  doc: Discovery,
  cfg: OidcConfig,
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(doc.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}`);
  const body = (await res.json()) as { id_token?: string };
  if (!body.id_token) throw new Error("no id_token");
  return body.id_token;
}

export type Claims = Record<string, unknown>;

export function decodeClaims(jwt: string): Claims {
  const part = jwt.split(".")[1];
  if (!part) throw new Error("malformed id_token");
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Claims;
}

/** Why the token must be refused, or null when it is good. */
export function checkClaims(
  c: Claims,
  expect: { issuer: string; clientId: string; nonce: string },
  now = Date.now(),
): string | null {
  if (typeof c.iss !== "string" || c.iss.replace(/\/+$/, "") !== expect.issuer) return "issuer";
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(expect.clientId)) return "audience";
  if (aud.length > 1 && c.azp !== expect.clientId) return "audience";
  if (typeof c.exp !== "number" || c.exp * 1000 < now - 60_000) return "expired";
  if (c.nonce !== expect.nonce) return "nonce";
  return null;
}

/** The address to match on. Entra puts it in `preferred_username` when `email` is absent. */
export function emailFrom(c: Claims): string | null {
  if (c.email_verified === false || c.email_verified === "false") return null;
  for (const v of [c.email, c.preferred_username, c.upn]) {
    if (typeof v === "string" && /^[^@\s]+@[^@\s]+$/.test(v)) return v.toLowerCase();
  }
  return null;
}

export function redirectUri(request: Request) {
  return `${publicOrigin(request)}/api/auth/oidc/callback`;
}

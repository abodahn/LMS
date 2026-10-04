import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizeUrl, discover, newAuthRequest, OIDC_COOKIE, oidcConfig, redirectUri } from "@/lib/oidc";

/** Sends the browser to the identity provider, remembering what to expect back. */
export async function GET(request: Request) {
  const cfg = oidcConfig();
  if (!cfg) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const doc = await discover(cfg.issuer);
    const req = newAuthRequest();
    const jar = await cookies();
    jar.set(OIDC_COOKIE, JSON.stringify({ state: req.state, nonce: req.nonce, verifier: req.verifier }), {
      httpOnly: true,
      // Lax, not strict: the provider's redirect back is a cross-site
      // top-level navigation, and the cookie has to come with it.
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // `__Host-` cookies must be Path=/.
      path: "/",
      maxAge: 600,
    });
    return NextResponse.redirect(authorizeUrl(doc, cfg, redirectUri(request.url), req));
  } catch (error) {
    console.error("sso start failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.redirect(new URL("/login?error=sso", request.url));
  }
}

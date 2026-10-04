import { describe, expect, it } from "vitest";
import { checkClaims, decodeClaims, emailFrom } from "@/lib/oidc";

const expect_ = { issuer: "https://login.example.com/t/v2.0", clientId: "app-1", nonce: "n1" };
const good = { iss: "https://login.example.com/t/v2.0", aud: "app-1", exp: Date.now() / 1000 + 600, nonce: "n1" };

describe("id token checks", () => {
  it("accepts a good token and refuses each broken claim", () => {
    expect(checkClaims(good, expect_)).toBeNull();
    expect(checkClaims({ ...good, iss: "https://evil.example.com" }, expect_)).toBe("issuer");
    expect(checkClaims({ ...good, aud: "other" }, expect_)).toBe("audience");
    expect(checkClaims({ ...good, aud: ["app-1", "other"] }, expect_)).toBe("audience");
    expect(checkClaims({ ...good, aud: ["app-1", "other"], azp: "app-1" }, expect_)).toBeNull();
    expect(checkClaims({ ...good, exp: Date.now() / 1000 - 3600 }, expect_)).toBe("expired");
    expect(checkClaims({ ...good, nonce: "replayed" }, expect_)).toBe("nonce");
  });
  it("decodes the payload and finds the address", () => {
    const jwt = ["h", Buffer.from(JSON.stringify({ preferred_username: "Ahmed@TC.com" })).toString("base64url"), "s"].join(".");
    expect(emailFrom(decodeClaims(jwt))).toBe("ahmed@tc.com");
    expect(emailFrom({ preferred_username: "not-an-email" })).toBeNull();
  });
});

describe("public address", () => {
  it("never redirects to the container's internal address", async () => {
    const { publicUrl } = await import("@/lib/oidc");
    const internal = new Request("http://localhost:10000/api/auth/oidc/start", {
      headers: { "x-forwarded-host": "tc-ai-academy.onrender.com", "x-forwarded-proto": "https" },
    });
    const before = process.env.APP_URL;
    delete process.env.APP_URL;
    expect(publicUrl("/login", internal).href).toBe("https://tc-ai-academy.onrender.com/login");
    process.env.APP_URL = "https://academy.example.com/";
    expect(publicUrl("/login?error=sso", internal).href).toBe("https://academy.example.com/login?error=sso");
    if (before === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = before;
  });
});

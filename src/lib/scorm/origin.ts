import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * SCORM on its own hostname.
 *
 * A package is executable HTML and JavaScript. Served from the academy's own
 * origin it runs with the learner's session; served from a second hostname it
 * cannot read the academy's cookies, pages or storage at all. That is the
 * boundary every LMS uses before it accepts packages from outside suppliers.
 *
 *   SCORM_CONTENT_ORIGIN  e.g. https://scorm.tcgarments.com — a second DNS name
 *                         pointing at this same service
 *   SCORM_TOKEN_SECRET    random, server-only; signs the launch links
 *
 * With both set, packages are served only on that hostname, only with a signed
 * launch token (cookies do not cross hostnames), and the API the content looks
 * for lives in a small bridge page there that relays to the player by
 * postMessage. With neither set, the original same-origin player is used.
 */

export function scormOrigin(): string | null {
  const origin = process.env.SCORM_CONTENT_ORIGIN?.trim().replace(/\/+$/, "");
  const secret = process.env.SCORM_TOKEN_SECRET?.trim();
  if (!origin || !secret) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

/** Host of a request as the client addressed it (Render terminates TLS in front). */
export function requestHost(headers: Headers) {
  return (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
}

/**
 * The content hostname as configured — even without the secret, so a
 * half-finished setup still keeps the academy itself off that hostname.
 */
export function isScormHost(headers: Headers) {
  const raw = process.env.SCORM_CONTENT_ORIGIN?.trim();
  if (!raw) return false;
  try {
    return new URL(raw).host.toLowerCase() === requestHost(headers);
  } catch {
    return false;
  }
}

const LAUNCH_HOURS = 8;

function mac(packageId: string, userId: string, exp: number) {
  return createHmac("sha256", process.env.SCORM_TOKEN_SECRET!.trim())
    .update(`${packageId}|${userId}|${exp}`)
    .digest("base64url");
}

/** A path segment that admits one learner to one package for a working day. */
export function signLaunch(packageId: string, userId: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + LAUNCH_HOURS * 3600;
  return `~${exp}.${Buffer.from(userId).toString("base64url")}.${mac(packageId, userId, exp)}`;
}

export function verifyLaunch(segment: string, packageId: string, now = Date.now()): string | null {
  const m = /^~(\d+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(segment);
  if (!m) return null;
  const exp = Number(m[1]);
  if (exp * 1000 < now) return null;
  const userId = Buffer.from(m[2], "base64url").toString("utf8");
  const want = Buffer.from(mac(packageId, userId, exp));
  const got = Buffer.from(m[3]);
  return want.length === got.length && timingSafeEqual(want, got) ? userId : null;
}

/**
 * The page on the content hostname that the package finds as its parent.
 *
 * It answers GetValue from a copy of the learner's CMI data that the player
 * hands it on load — the API is synchronous, postMessage is not — and relays
 * every SetValue, Commit and Finish to the player, which alone talks to the
 * server. It accepts messages only from the academy's origin and from the
 * window that embeds it.
 */
/** A string literal that cannot close the script element it sits in. */
const inline = (v: string) => JSON.stringify(v).replace(/</g, "\\u003c");

export function bridgeHtml(appOrigin: string, entry: string) {
  const js = `
(function () {
  var APP = ${inline(appOrigin)};
  var ENTRY = ${inline(entry)};
  var cmi = {}, ready = false, last = "0";
  function post(m) { parent.postMessage(m, APP); }
  function get(k) { if (!ready) { last = "301"; return ""; } last = "0"; return cmi[k] == null ? "" : String(cmi[k]); }
  function set(k, v) { if (!ready) { last = "301"; return "false"; } cmi[k] = String(v); post({ scorm: "set", key: String(k), value: String(v) }); last = "0"; return "true"; }
  function init() { ready = true; last = "0"; post({ scorm: "initialize" }); return "true"; }
  function finish() { ready = false; last = "0"; post({ scorm: "finish" }); return "true"; }
  function commit() { last = "0"; post({ scorm: "commit" }); return "true"; }
  function text(c) { return ({ "0": "No error", "301": "Not initialized", "403": "Element is read only" })[c] || ""; }
  window.API = { LMSInitialize: init, LMSFinish: finish, LMSGetValue: get, LMSSetValue: set, LMSCommit: commit,
    LMSGetLastError: function () { return last; }, LMSGetErrorString: text, LMSGetDiagnostic: text };
  window.API_1484_11 = { Initialize: init, Terminate: finish, GetValue: get, SetValue: set, Commit: commit,
    GetLastError: function () { return last; }, GetErrorString: text, GetDiagnostic: text };
  window.addEventListener("message", function (e) {
    if (e.origin !== APP || e.source !== parent || !e.data || e.data.scorm !== "init") return;
    cmi = e.data.cmi || {};
    var f = document.getElementById("content");
    if (!f.src) f.src = ENTRY;
  });
  post({ scorm: "ready" });
})();`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>SCORM</title>
<style>html,body,iframe{margin:0;height:100%;width:100%;border:0;background:#000}</style></head>
<body><iframe id="content" title="Course content" sandbox="allow-scripts allow-same-origin allow-forms" allow="autoplay; fullscreen"></iframe>
<script>${js}</script></body></html>`;
}

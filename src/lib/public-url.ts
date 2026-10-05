/**
 * The academy's public address. Never the request's own URL: behind Render's
 * proxy that is the container's internal http://localhost:10000, and a
 * redirect built from it sends the browser nowhere.
 */
export function publicOrigin(request: Request) {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return new URL(configured).origin;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}` : new URL(request.url).origin;
}

export function publicUrl(path: string, request: Request) {
  return new URL(path, publicOrigin(request));
}

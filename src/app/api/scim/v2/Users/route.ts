import {
  baseUrl,
  createScimUser,
  fromScim,
  listResponse,
  listScimUsers,
  ScimConflict,
  ScimInvalid,
  scimError,
  scimGate,
  scimJson,
  toScim,
} from "@/lib/scim";

export async function GET(request: Request) {
  const denied = scimGate(request);
  if (denied) return denied;
  const q = new URL(request.url).searchParams;
  const startIndex = Math.max(1, Number(q.get("startIndex")) || 1);
  const count = Math.min(200, Math.max(0, Number(q.get("count") ?? 100) || 0));
  try {
    const { total, rows } = await listScimUsers(q.get("filter"), startIndex, count);
    return scimJson(listResponse(rows, total, startIndex, baseUrl(request)));
  } catch {
    return scimError(400, "Only userName, externalId and emails.value with eq are supported", "invalidFilter");
  }
}

export async function POST(request: Request) {
  const denied = scimGate(request);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return scimError(400, "Body is not JSON", "invalidSyntax");
  }
  try {
    const user = await createScimUser(fromScim(body as Record<string, unknown>));
    return scimJson(toScim(user!, baseUrl(request)), 201);
  } catch (error) {
    if (error instanceof ScimConflict) return scimError(409, error.message, "uniqueness");
    if (error instanceof ScimInvalid) return scimError(400, error.message, "invalidValue");
    console.error("scim create failed", error instanceof Error ? error.message : "unknown");
    return scimError(400, "Invalid user", "invalidValue");
  }
}

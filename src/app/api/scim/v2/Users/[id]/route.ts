import { NextResponse } from "next/server";
import {
  applyPatch,
  baseUrl,
  findScimUser,
  fromScim,
  removeScimUser,
  ScimConflict,
  scimError,
  scimGate,
  scimJson,
  toScim,
  updateScimUser,
  type Parsed,
} from "@/lib/scim";

type Ctx = RouteContext<"/api/scim/v2/Users/[id]">;

export async function GET(request: Request, { params }: Ctx) {
  const denied = scimGate(request);
  if (denied) return denied;
  const user = await findScimUser((await params).id);
  return user ? scimJson(toScim(user, baseUrl(request))) : scimError(404, "User not found");
}

async function update(request: Request, id: string, parsed: Parsed) {
  try {
    const user = await updateScimUser(id, parsed);
    return user ? scimJson(toScim(user, baseUrl(request))) : scimError(404, "User not found");
  } catch (error) {
    if (error instanceof ScimConflict) return scimError(409, error.message, "uniqueness");
    // Our own messages only; anything else is logged, not returned.
    console.error("scim update failed", error instanceof Error ? error.message : "unknown");
    return scimError(400, "Invalid user", "invalidValue");
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  const denied = scimGate(request);
  if (denied) return denied;
  try {
    return update(request, (await params).id, fromScim(await request.json()));
  } catch {
    return scimError(400, "Body is not JSON", "invalidSyntax");
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = scimGate(request);
  if (denied) return denied;
  const { id } = await params;
  const user = await findScimUser(id);
  if (!user) return scimError(404, "User not found");
  let patched;
  try {
    patched = applyPatch(toScim(user, baseUrl(request)), await request.json());
  } catch (error) {
    return scimError(400, error instanceof Error ? error.message : "Invalid patch", "invalidSyntax");
  }
  return update(request, id, fromScim(patched));
}

export async function DELETE(request: Request, { params }: Ctx) {
  const denied = scimGate(request);
  if (denied) return denied;
  return (await removeScimUser((await params).id))
    ? new NextResponse(null, { status: 204 })
    : scimError(404, "User not found");
}

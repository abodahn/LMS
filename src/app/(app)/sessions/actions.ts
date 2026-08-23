"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { registerForSession, cancelRegistration } from "@/lib/sessions";

export type SessionActionState = { error?: string; success?: string; params?: Record<string, string> };

export async function registerAction(sessionId: string): Promise<SessionActionState> {
  const user = await requireUser();
  const result = await registerForSession(sessionId, user.id);

  if (!result.ok) {
    // Every refusal is a real condition the learner can act on, so each gets its
    // own message rather than a generic failure.
    if (result.reason === "CLASH") {
      return { error: "sessions.clash", params: { title: result.clashTitle ?? "" } };
    }
    if (result.reason === "FULL") return { error: "sessions.sessionFull" };
    if (result.reason === "PAST") return { error: "sessions.sessionPast" };
    return { error: "sessions.sessionCancelled" };
  }

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: result.status === "WAITLISTED" ? "SESSION_WAITLISTED" : "SESSION_REGISTERED",
    entity: "TrainingSession",
    entityId: sessionId,
  });

  revalidatePath("/sessions");
  return { success: result.status === "WAITLISTED" ? "sessions.waitlistedOk" : "sessions.registeredOk" };
}

export async function cancelSeatAction(sessionId: string): Promise<SessionActionState> {
  const user = await requireUser();
  await cancelRegistration(sessionId, user.id);

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "SESSION_SEAT_RELEASED",
    entity: "TrainingSession",
    entityId: sessionId,
  });

  revalidatePath("/sessions");
  return { success: "sessions.seatReleased" };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { markAttendance, cancelSession, SESSION_MODES } from "@/lib/sessions";

export type AdminSessionState = { error?: string; success?: string; id?: string };

const schema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3).max(200),
    titleAr: z.string().trim().max(200).optional(),
    titleTr: z.string().trim().max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    courseId: z.string().optional(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    mode: z.enum(SESSION_MODES),
    locationId: z.string().optional(),
    room: z.string().trim().max(120).optional(),
    meetingUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
    instructorId: z.string().optional(),
    instructorName: z.string().trim().max(120).optional(),
    capacity: z.coerce.number().int().min(1).max(1000),
    waitlistEnabled: z.coerce.boolean().optional(),
    creditHours: z.coerce.number().min(0).max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "endsAt",
    path: ["endsAt"],
  });

export async function saveSessionAction(
  _previous: AdminSessionState,
  formData: FormData,
): Promise<AdminSessionState> {
  const admin = await requirePermission("sessions.manage");

  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse({ ...raw, waitlistEnabled: formData.get("waitlistEnabled") === "on" });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.path.includes("endsAt") ? "sessions.endsBeforeStart" : "errors.required" };
  }

  const d = parsed.data;
  const data = {
    title: d.title,
    titleAr: d.titleAr || null,
    titleTr: d.titleTr || null,
    description: d.description || null,
    courseId: d.courseId || null,
    startsAt: new Date(d.startsAt),
    endsAt: new Date(d.endsAt),
    mode: d.mode,
    locationId: d.locationId || null,
    room: d.room || null,
    meetingUrl: d.meetingUrl || null,
    instructorId: d.instructorId || null,
    instructorName: d.instructorName || null,
    capacity: d.capacity,
    waitlistEnabled: d.waitlistEnabled ?? true,
    creditHours: d.creditHours ?? null,
    notes: d.notes || null,
  };

  const session = d.id
    ? await prisma.trainingSession.update({ where: { id: d.id }, data })
    : await prisma.trainingSession.create({ data: { ...data, createdById: admin.id } });

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: d.id ? "SESSION_UPDATED" : "SESSION_CREATED",
    entity: "TrainingSession",
    entityId: session.id,
    summary: `${session.title} — ${session.startsAt.toISOString()}`.slice(0, 500),
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  return { success: "common.saved", id: session.id };
}

export async function markAttendanceAction(
  sessionId: string,
  marks: { userId: string; attended: boolean }[],
): Promise<AdminSessionState> {
  const admin = await requirePermission("sessions.manage");

  const result = await markAttendance(sessionId, marks, admin.id);

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "SESSION_ATTENDANCE_RECORDED",
    entity: "TrainingSession",
    entityId: sessionId,
    summary: `${result.marked} marked, ${result.completed} course completions credited`,
  });

  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/sessions");
  return { success: "sessions.attendanceSaved" };
}

export async function cancelSessionAction(sessionId: string, reason: string): Promise<AdminSessionState> {
  const admin = await requirePermission("sessions.manage");

  const result = await cancelSession(sessionId, reason.slice(0, 500));

  await audit({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "SESSION_CANCELLED",
    entity: "TrainingSession",
    entityId: sessionId,
    summary: `${result.notified} people notified: ${reason}`.slice(0, 500),
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  return { success: "common.saved" };
}

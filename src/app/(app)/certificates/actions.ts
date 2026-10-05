"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { cleanCertificateName, matchesRecordedName } from "@/lib/certificate-settings";

export type NameState = { error?: string; success?: string };

/**
 * The learner confirms how their name is printed, once. After that it is
 * locked: a certificate's name should not change at will, and HR corrects it
 * on the person's record if it is wrong.
 */
export async function confirmCertificateNameAction(_prev: NameState, form: FormData): Promise<NameState> {
  const user = await requireUser();
  const name = cleanCertificateName(String(form.get("certificateName") ?? ""));
  if (!name) return { error: "certificates.nameInvalid" };
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { fullName: true, fullNameAr: true } });
  if (!matchesRecordedName(name, record)) return { error: "certificates.nameMismatch" };

  const updated = await prisma.user.updateMany({
    where: { id: user.id, certificateNameConfirmedAt: null },
    data: { certificateName: name, certificateNameConfirmedAt: new Date() },
  });
  if (updated.count === 0) return { error: "certificates.nameLocked" };

  await audit({
    actorId: user.id,
    actorName: user.fullName,
    action: "CERTIFICATE_NAME_CONFIRMED",
    entity: "User",
    entityId: user.id,
    summary: name,
  });
  revalidatePath("/certificates");
  return { success: "certificates.nameConfirmed" };
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { revokeCertificate } from "@/lib/certificates";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/db";

export async function revokeCertificateAction(certificateId: string, reason: string) {
  const admin = await requirePermission("certificates.manage");
  const certificate = await revokeCertificate(certificateId, admin.id, reason.slice(0, 500) || "Revoked by administrator");
  const holder = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { userId: true } });
  if (holder) {
    await notify(holder.userId, {
      category: "CERTIFICATE",
      title: "A certificate has been revoked",
      body: certificate.revokeReason ?? "Please contact your L&D team.",
      link: "/certificates",
    });
  }
  revalidatePath("/admin/certificates");
}

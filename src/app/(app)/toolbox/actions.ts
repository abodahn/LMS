"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type ToolboxState = { error?: string; success?: string };

const promptSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(6000),
  notes: z.string().trim().max(1000).optional(),
});

export async function addSavedPromptAction(_prev: ToolboxState, formData: FormData): Promise<ToolboxState> {
  const user = await requireUser();
  const parsed = promptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  await prisma.savedPrompt.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/toolbox");
  return { success: "common.saved" };
}

export async function deleteToolboxItemAction(id: string, kind: "prompt" | "bookmark" | "note") {
  const user = await requireUser();
  if (kind === "prompt") await prisma.savedPrompt.deleteMany({ where: { id, userId: user.id } });
  if (kind === "bookmark") await prisma.useCaseBookmark.deleteMany({ where: { id, userId: user.id } });
  if (kind === "note") await prisma.userNote.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/toolbox");
}

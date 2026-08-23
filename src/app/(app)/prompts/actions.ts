"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function savePromptToToolboxAction(promptId: string) {
  const user = await requireUser();
  const prompt = await prisma.promptTemplate.findUniqueOrThrow({ where: { id: promptId } });

  const existing = await prisma.savedPrompt.findFirst({ where: { userId: user.id, promptId } });
  if (existing) return { saved: true };

  await prisma.savedPrompt.create({
    data: { userId: user.id, promptId, title: prompt.title, body: prompt.body },
  });
  revalidatePath("/toolbox");
  return { saved: true };
}

export async function toggleUseCaseBookmarkAction(useCaseId: string) {
  const user = await requireUser();
  const existing = await prisma.useCaseBookmark.findUnique({
    where: { userId_useCaseId: { userId: user.id, useCaseId } },
  });
  if (existing) {
    await prisma.useCaseBookmark.delete({ where: { id: existing.id } });
    revalidatePath("/use-cases");
    return { bookmarked: false };
  }
  await prisma.useCaseBookmark.create({ data: { userId: user.id, useCaseId } });
  revalidatePath("/use-cases");
  return { bookmarked: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { rateSkill } from "@/lib/skills";

export type SkillState = { error?: string; success?: string };

const schema = z.object({
  skillId: z.string().min(1),
  level: z.coerce.number().int().min(0).max(5),
});

/**
 * An employee rating their own skill.
 *
 * Only ever their own — the user id comes from the session and is never read
 * from the form, so there is nothing here to point at somebody else. A rating a
 * manager or an assessment already made is kept rather than overwritten, and
 * the caller is told that is what happened rather than being shown a save that
 * silently did nothing.
 */
export async function selfRateAction(_prev: SkillState, formData: FormData): Promise<SkillState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "errors.validation" };

  const result = await rateSkill({
    userId: user.id,
    skillId: parsed.data.skillId,
    level: parsed.data.level,
    source: "SELF",
    ratedById: user.id,
  });

  revalidatePath("/skills");
  return result.updated ? { success: "common.saved" } : { error: "skills.selfKept" };
}

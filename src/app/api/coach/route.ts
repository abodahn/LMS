import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { askCoach, COACH_MODES } from "@/lib/ai/coach";
import { AiDisabledError } from "@/lib/ai/provider";
import { AiBudgetExceededError } from "@/lib/ai/budget";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(20),
  lessonId: z.string().nullish(),
  mode: z.enum(COACH_MODES).optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  if (!rateLimit(`coach:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  try {
    const reply = await askCoach(user, parsed.data.messages, parsed.data.lessonId, parsed.data.mode);
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: "AI_DISABLED" }, { status: 503 });
    }
    // Said plainly, so the learner knows it is a limit and not a fault.
    if (err instanceof AiBudgetExceededError) {
      return NextResponse.json({ error: "AI_BUDGET" }, { status: 429 });
    }
    console.error("[coach] failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 502 });
  }
}

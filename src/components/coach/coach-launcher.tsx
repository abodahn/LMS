"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Deliberately a small floating affordance — it must never compete with the
 * lesson content for attention.
 */
export function AiCoachLauncher({ enabled, lessonId }: { enabled: boolean; lessonId?: string | null }) {
  const t = useT();
  const pathname = usePathname();
  // Closes itself on navigation without an effect — see AppShell.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const open = openedFor === pathname;
  const setOpen = (next: boolean) => setOpenedFor(next ? pathname : null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, lessonId }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        setError(data.error === "AI_DISABLED" ? t("coach.disabled") : t("coach.error"));
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError(t("coach.error"));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("coach.open")}
        aria-expanded={open}
        className={cn(
          "no-print fixed bottom-5 end-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[var(--shadow-pop)] transition-transform hover:scale-105",
          open ? "bg-[var(--brand-charcoal)]" : "bg-[var(--brand-ink)]",
        )}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open ? (
        <section
          aria-label={t("coach.title")}
          className="no-print fixed bottom-20 end-4 z-40 flex max-h-[70dvh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--brand-line)] bg-white shadow-[var(--shadow-pop)]"
        >
          <header className="flex items-center gap-2 border-b border-[var(--brand-line)] px-4 py-3">
            <Sparkles size={16} className="text-[var(--brand-red)]" aria-hidden />
            <h2 className="text-sm font-semibold text-[var(--brand-ink)]">{t("coach.title")}</h2>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-2">
                {["coach.suggestion1", "coach.suggestion2", "coach.suggestion3", "coach.suggestion4"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => send(t(k))}
                    className="w-full rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 py-2 text-start text-[13px] text-[var(--brand-charcoal)] transition-colors hover:border-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]"
                  >
                    {t(k)}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-control)] px-3 py-2 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "ms-auto bg-[var(--brand-ink)] text-white"
                    : "bg-[var(--brand-canvas)] text-[var(--brand-ink)]",
                )}
              >
                {m.content}
              </div>
            ))}

            {busy ? <p className="text-[13px] text-[var(--brand-muted)]">{t("coach.thinking")}</p> : null}
            {error ? <p className="text-[13px] font-medium text-[var(--brand-red)]">{error}</p> : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-[var(--brand-line)] p-3"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("coach.placeholder")}
                aria-label={t("coach.placeholder")}
                className="field h-10 flex-1"
              />
              <Button type="submit" size="md" disabled={busy || !input.trim()} aria-label={t("coach.send")}>
                <Send size={16} />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--brand-muted)]">{t("coach.disclaimer")}</p>
          </form>
        </section>
      ) : null}
    </>
  );
}

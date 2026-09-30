/**
 * A stand-in provider for development and tests. Never available in production:
 * its key resolves only when NODE_ENV is not "production", so selecting it on a
 * live system simply leaves AI switched off.
 *
 * It exists so every AI flow — metering, budgets, drafts, approval — can be
 * exercised end to end without a key or a bill. Replies are deterministic and
 * obviously synthetic, so nothing it produces could pass for real content.
 */

export type ProviderReply = { text: string; inputTokens: number; outputTokens: number; truncated: boolean };

const tokens = (s: string) => Math.max(1, Math.ceil(s.length / 4));

export function mockReply(feature: string, system: string, prompt: string): ProviderReply {
  let text: string;
  switch (feature) {
    case "COURSE_BUILDER":
      text = JSON.stringify({
        title: "[Mock] Draft course",
        description: "A synthetic outline produced by the mock AI provider.",
        outcomes: ["Recognise the topic", "Apply it once with help"],
        modules: [
          {
            title: "[Mock] Module 1",
            lessons: [
              { title: "[Mock] Why it matters", minutes: 10, content: "Synthetic lesson text for testing." },
              { title: "[Mock] First steps", minutes: 15, content: "More synthetic lesson text." },
            ],
          },
          {
            title: "[Mock] Module 2",
            lessons: [{ title: "[Mock] Practice", minutes: 20, content: "A synthetic practice task." }],
          },
        ],
      });
      break;
    case "QUIZ":
      text = JSON.stringify({
        questions: [1, 2, 3].map((n) => ({
          text: `[Mock] Question ${n}?`,
          difficulty: "EASY",
          explanation: "Synthetic explanation.",
          options: [
            { text: "[Mock] Correct", correct: true },
            { text: "[Mock] Wrong A", correct: false },
            { text: "[Mock] Wrong B", correct: false },
            { text: "[Mock] Wrong C", correct: false },
          ],
        })),
      });
      break;
    case "TRANSLATE":
      text = JSON.stringify({ title: "[Mock] ترجمة", description: "[Mock] نص مترجم", outcomes: ["[Mock] نتيجة"] });
      break;
    case "SUMMARY":
      text = "[Mock] A two-sentence synthetic summary. It exists only to test the flow.";
      break;
    default:
      text = "[Mock] This is a synthetic reply from the development AI provider.";
  }
  return { text, inputTokens: tokens(system) + tokens(prompt), outputTokens: tokens(text), truncated: false };
}

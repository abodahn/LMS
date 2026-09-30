/**
 * The parts of the AI layer with no I/O: names, roles and arithmetic.
 *
 * Split from provider.ts, which is server-only, so that reporting code and the
 * tests can use them without dragging a network client along.
 */

export const AI_FEATURES = ["COACH", "EXPLAIN", "COURSE_BUILDER", "QUIZ", "SUMMARY", "TRANSLATE"] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

/**
 * Which kind of model a call wants. An administrator maps each role to a model,
 * so a translation can go to a cheap model and a course outline to a strong one
 * without either feature knowing the other exists. An unmapped role uses the
 * default model.
 */
export const MODEL_ROLES = ["FAST", "REASONING", "LOW_COST", "TRANSLATION", "FALLBACK"] as const;
export type ModelRole = (typeof MODEL_ROLES)[number];

/** Price per million tokens, in whatever currency the administrator keeps. */
export type ModelPrice = { input: number; output: number };

/** The model a role resolves to: its own mapping, or the default. */
export function modelFor(cfg: { model: string; models: Partial<Record<ModelRole, string>> }, role: ModelRole): string {
  return cfg.models[role]?.trim() || cfg.model;
}

/** Cost of a call in the administrator's currency, or null if no price is set. */
export function costOf(prices: Record<string, ModelPrice>, model: string, inputTokens: number, outputTokens: number) {
  const p = prices[model];
  if (!p) return null;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

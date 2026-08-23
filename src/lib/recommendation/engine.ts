import { LEVEL_ORDER, type CompetencyKey, type LevelCode, type RecommendationWeightKey } from "../constants";
import type {
  CandidateCourse,
  EngineOptions,
  LearnerContext,
  PlannedCourse,
  RecommendationResult,
  RejectedCourse,
  ScoreBreakdown,
  ScoredCourse,
} from "./types";

export const ENGINE_VERSION = "1.0.0";

/**
 * Deterministic, explainable course recommendation.
 *
 * Two stages, deliberately kept apart:
 *   1. CONSTRAINTS — hard rules that remove a course and record why.
 *   2. SCORING     — seven weighted components, each producing a reason.
 *
 * No LLM is involved. The AI layer may *describe* a result (see lib/ai), never
 * produce or alter one. Same inputs always yield the same output.
 */

// ---------------------------------------------------------------------------
// Phase model
// ---------------------------------------------------------------------------

export const PHASES = [
  { key: "UNDERSTAND_AI", label: "Understand AI", competency: "FUNDAMENTALS" as CompetencyKey },
  { key: "PRACTICAL_AI", label: "Master practical AI", competency: "PROMPTING" as CompetencyKey },
  { key: "AI_FOR_WORK", label: "AI for your job", competency: "WORKPLACE" as CompetencyKey },
  { key: "DATA_AUTOMATION", label: "Data & automation", competency: "DATA_AUTOMATION" as CompetencyKey },
  { key: "TECHNICAL", label: "Technical AI", competency: "TECHNICAL" as CompetencyKey },
  { key: "RESPONSIBLE_AI", label: "Responsible AI & capstone", competency: "RESPONSIBLE_AI" as CompetencyKey },
] as const;

const PHASE_ORDER: string[] = PHASES.map((p) => p.label);

function dominantCompetency(course: CandidateCourse): CompetencyKey | null {
  if (course.competencies.length === 0) return null;
  return [...course.competencies].sort((a, b) => b.weight - a.weight)[0].key;
}

export function phaseFor(course: CandidateCourse): string {
  const dom = dominantCompetency(course);
  const match = PHASES.find((p) => p.competency === dom);
  return match?.label ?? "AI for your job";
}

// ---------------------------------------------------------------------------
// Stage 1 — constraints
// ---------------------------------------------------------------------------

const REJECTION = {
  NOT_PUBLISHED: "Not published in the catalog",
  UNAVAILABLE: "Marked unavailable or the link is broken",
  COMPLETED: "Already completed by this employee",
  ENROLLED: "Already on this employee's plan",
  PREREQUISITE: "Prerequisite course has not been completed",
  BELOW_LEVEL: "Below the employee's demonstrated AI level",
  TOO_ADVANCED: "Three or more levels above the employee's current level",
  TECHNICAL: "Technical content and the employee is non-technical and did not ask for it",
  LANGUAGE: "Not taught in a language this employee can follow",
  DUPLICATE_TOPIC: "Another stronger course already covers this topic",
  NO_ROOM: "Would push the path beyond the target learning hours",
} as const;

export function applyConstraints(
  courses: CandidateCourse[],
  learner: LearnerContext,
): { eligible: CandidateCourse[]; rejected: RejectedCourse[] } {
  const eligible: CandidateCourse[] = [];
  const rejected: RejectedCourse[] = [];
  const learnerLevel = LEVEL_ORDER[learner.levelCode];
  const completed = new Set(learner.completedCourseIds);
  const active = new Set(learner.activeCourseIds);
  const mandatory = new Set(learner.mandatoryCourseIds);

  const reject = (c: CandidateCourse, code: keyof typeof REJECTION) =>
    rejected.push({ courseId: c.id, title: c.title, code: c.code, reason: REJECTION[code], reasonCode: code });

  for (const c of courses) {
    // Mandatory learning bypasses the soft rules but never the availability ones.
    const isMandatory = c.isMandatory || mandatory.has(c.id);

    if (c.status !== "PUBLISHED") {
      reject(c, "NOT_PUBLISHED");
      continue;
    }
    if (!c.stillAvailable || !c.linkWorking) {
      reject(c, "UNAVAILABLE");
      continue;
    }
    if (completed.has(c.id)) {
      reject(c, "COMPLETED");
      continue;
    }
    if (active.has(c.id)) {
      reject(c, "ENROLLED");
      continue;
    }

    const prereqsMet = c.prerequisiteIds.every((p) => completed.has(p));
    // A prerequisite that is itself a candidate is fine — ordering handles it.
    const prereqInPlan = c.prerequisiteIds.every(
      (p) => completed.has(p) || courses.some((x) => x.id === p && x.status === "PUBLISHED"),
    );
    if (!prereqsMet && !prereqInPlan) {
      reject(c, "PREREQUISITE");
      continue;
    }

    if (!isMandatory && c.levelCode) {
      const delta = LEVEL_ORDER[c.levelCode] - learnerLevel;
      if (delta <= -2) {
        reject(c, "BELOW_LEVEL");
        continue;
      }
      // A 35-hour path is designed to move someone up a level, so content one
      // or two levels ahead belongs in its later phases — an L0 employee must
      // still be able to reach their own role module, which sits at L2.
      // Scoring keeps it out of the early phases; only a three-level jump is
      // genuinely out of reach.
      if (delta >= 3) {
        reject(c, "TOO_ADVANCED");
        continue;
      }
    }

    if (!isMandatory && c.isTechnical && !learner.isTechnical && !learner.goals.includes("PROGRAMMING")) {
      reject(c, "TECHNICAL");
      continue;
    }

    // A course nobody can follow has no value, whatever else it scores on.
    // English is T&C's working language and stays acceptable to everyone;
    // anything else must be in the learner's own language or carry subtitles
    // in it. Without this, adding Arabic and Turkish content to the catalog
    // would start offering Turkish video to Arabic speakers.
    if (
      !isMandatory &&
      c.language !== "en" &&
      c.language !== learner.preferredLanguage &&
      !c.subtitleLanguages.includes(learner.preferredLanguage)
    ) {
      reject(c, "LANGUAGE");
      continue;
    }

    eligible.push(c);
  }

  return { eligible, rejected };
}

// ---------------------------------------------------------------------------
// Stage 2 — weighted scoring
// ---------------------------------------------------------------------------

const COMPONENT_LABELS: Record<RecommendationWeightKey, string> = {
  AI_LEVEL_MATCH: "AI level match",
  ROLE_MATCH: "Role match",
  COMPETENCY_GAP: "Competency gap",
  LEARNING_GOAL: "Learning goal",
  COURSE_QUALITY: "Course quality",
  TIME_FIT: "Time fit",
  LANGUAGE_FIT: "Language fit",
};

function levelMatch(course: CandidateCourse, learner: LearnerContext) {
  if (!course.levelCode) return { raw: 0.6, reason: "General-audience content" };
  const delta = LEVEL_ORDER[course.levelCode] - LEVEL_ORDER[learner.levelCode];
  if (delta === 0) return { raw: 1, reason: `Written for your level (${learner.levelCode})` };
  if (delta === 1) return { raw: 0.85, reason: "The natural next step up from your level" };
  if (delta === -1) return { raw: 0.55, reason: "Consolidates the ground your level is built on" };
  if (delta === 2) return { raw: 0.35, reason: "Where this path is taking you" };
  return { raw: 0.15, reason: "Some distance from your current level" };
}

function roleMatch(course: CandidateCourse, learner: LearnerContext) {
  const byDept = learner.departmentId && course.departmentIds.includes(learner.departmentId);
  const family = course.jobFamilies.find((f) => f.jobFamily === learner.jobFamily);
  const generic = course.departmentIds.length === 0 && course.jobFamilies.length === 0;

  if (byDept && family) {
    return { raw: 1, reason: `Built for ${learner.departmentName ?? "your department"} and your job family` };
  }
  if (byDept) return { raw: 0.9, reason: `Strong match for ${learner.departmentName ?? "your department"}` };
  if (family) return { raw: 0.85, reason: `Targets ${titleCase(learner.jobFamily)} roles` };
  if (generic) return { raw: 0.55, reason: "Relevant to every role" };
  const familyGeneral = course.jobFamilies.some((f) => f.jobFamily === "GENERAL");
  if (familyGeneral) return { raw: 0.5, reason: "General workplace content" };
  return { raw: 0.15, reason: "Aimed at other departments" };
}

function competencyGap(course: CandidateCourse, learner: LearnerContext) {
  if (course.competencies.length === 0) return { raw: 0.4, reason: "No specific competency mapped" };
  if (!learner.hasAssessment) return { raw: 0.5, reason: "No assessment yet — using role defaults" };

  let weighted = 0;
  let total = 0;
  const targeted: string[] = [];
  for (const c of course.competencies) {
    const score = learner.competencyScores[c.key];
    const gap = score === undefined ? 0.5 : Math.max(0, (100 - score) / 100);
    if (score !== undefined && score < 70) targeted.push(prettyCompetency(c.key));
    weighted += gap * c.weight;
    total += c.weight;
  }
  const raw = total === 0 ? 0.4 : weighted / total;
  const reason = targeted.length
    ? `Improves your weakest areas: ${targeted.join(", ")}`
    : "Builds on competencies you already score well in";
  return { raw, reason };
}

function goalMatch(course: CandidateCourse, learner: LearnerContext) {
  if (learner.goals.length === 0) return { raw: 0.5, reason: "No learning goals selected yet" };
  if (course.goals.length === 0) return { raw: 0.4, reason: "Not mapped to a specific goal" };

  const matches = course.goals.filter((g) => learner.goals.includes(g.goalKey));
  if (matches.length === 0) return { raw: 0.1, reason: "Does not cover the goals you selected" };

  const matchedWeight = matches.reduce((s, g) => s + g.weight, 0);
  const courseWeight = course.goals.reduce((s, g) => s + g.weight, 0) || 1;
  const coverage = Math.min(1, matchedWeight / courseWeight + matches.length / learner.goals.length) / 1;
  return {
    raw: Math.min(1, coverage),
    reason: `Covers your goal${matches.length > 1 ? "s" : ""}: ${matches.map((m) => prettyGoal(m.goalKey)).join(", ")}`,
  };
}

function qualitySignal(course: CandidateCourse) {
  const parts: number[] = [course.providerTrust, course.qualityScore];
  if (course.rating != null) parts.push(clamp01(course.rating / 5));
  if (course.feedbackScore != null) parts.push(clamp01(course.feedbackScore / 5));
  if (course.certificateAvailable) parts.push(0.9);
  const raw = parts.reduce((s, v) => s + v, 0) / parts.length;
  return { raw, reason: `Trusted provider (${course.providerName})` };
}

function timeFit(course: CandidateCourse, learner: LearnerContext) {
  const weekly = learner.weeklyHours > 0 ? learner.weeklyHours : 2;
  const weeks = course.estimatedHours / weekly;
  if (weeks <= 4) return { raw: 1, reason: "Fits comfortably in your weekly learning time" };
  if (weeks <= 8) return { raw: 0.75, reason: "About two months at your current pace" };
  if (weeks <= 14) return { raw: 0.45, reason: "A longer commitment at your current pace" };
  return { raw: 0.15, reason: "Very long at your current weekly pace" };
}

function languageFit(course: CandidateCourse, learner: LearnerContext) {
  const pref = learner.preferredLanguage;
  if (course.language === pref) return { raw: 1, reason: `Available in your language (${pref.toUpperCase()})` };
  if (course.subtitleLanguages.includes(pref)) return { raw: 0.8, reason: `Also available in ${pref.toUpperCase()}` };
  if (course.language === "en") return { raw: 0.55, reason: "Delivered in English" };
  return { raw: 0.25, reason: "Not available in your preferred language" };
}

export function scoreCourse(
  course: CandidateCourse,
  learner: LearnerContext,
  weights: Record<RecommendationWeightKey, number>,
): ScoredCourse {
  const components: Record<RecommendationWeightKey, { raw: number; reason: string }> = {
    AI_LEVEL_MATCH: levelMatch(course, learner),
    ROLE_MATCH: roleMatch(course, learner),
    COMPETENCY_GAP: competencyGap(course, learner),
    LEARNING_GOAL: goalMatch(course, learner),
    COURSE_QUALITY: qualitySignal(course),
    TIME_FIT: timeFit(course, learner),
    LANGUAGE_FIT: languageFit(course, learner),
  };

  // Weights are normalised, so an admin can enter any numbers they like.
  const totalWeight = Object.values(weights).reduce((s, w) => s + Math.max(0, w), 0) || 1;

  const breakdown: ScoreBreakdown[] = (Object.keys(components) as RecommendationWeightKey[]).map((key) => {
    const w = Math.max(0, weights[key] ?? 0);
    const { raw, reason } = components[key];
    return {
      key,
      label: COMPONENT_LABELS[key],
      raw: round3(raw),
      contribution: round2((raw * w * 100) / totalWeight),
      reason,
    };
  });

  const score = round2(breakdown.reduce((s, b) => s + b.contribution, 0));

  // Reasons shown to the learner: the components that actually carried the
  // decision, strongest first. Never a bare number.
  const reasons: ScoredCourse["reasons"] = breakdown
    .filter((b) => b.raw >= 0.6 && b.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4)
    .map((b) => ({ code: b.key, label: b.reason ?? b.label, contribution: b.contribution, detail: b.label }));

  const forced =
    course.isMandatory || learner.mandatoryCourseIds.includes(course.id)
      ? ("MANDATORY" as const)
      : learner.nominatedCourseIds?.includes(course.id)
        ? ("NOMINATED" as const)
        : undefined;

  if (forced === "MANDATORY") {
    reasons.unshift({
      code: "MANDATORY",
      label: "Required corporate learning at T&C",
      contribution: 0,
      detail: "Mandatory",
    });
  }
  if (forced === "NOMINATED") {
    reasons.unshift({
      code: "NOMINATED",
      label: "Recommended for you by your manager",
      contribution: 0,
      detail: "Manager nomination",
    });
  }

  const roleRelevant = (components.ROLE_MATCH.raw ?? 0) >= 0.5;

  // Subtitles are enough to make a course *available* — they are not enough to
  // put it on someone's plan for them. Auto-selection is limited to content
  // taught in the learner's own language, or in English, which is T&C's working
  // language. Anything else stays in the catalog to enrol in by choice.
  const languageComfortable =
    course.language === learner.preferredLanguage || course.language === "en";

  return { course, score, breakdown, reasons, forced, roleRelevant, languageComfortable };
}

// ---------------------------------------------------------------------------
// Stage 3 — path assembly
// ---------------------------------------------------------------------------

function phaseIndex(label: string) {
  const i = PHASE_ORDER.indexOf(label);
  return i === -1 ? PHASE_ORDER.length : i;
}

/**
 * Phase-balanced assembly.
 *
 * A 35-hour path is not "the 5 highest-scoring courses" — that produces four
 * role modules and no foundations. Instead:
 *   1. mandatory learning goes in first,
 *   2. one course per phase, in the canonical Understand → Practise → Apply →
 *      Responsible order, never two courses covering the same competency,
 *   3. a top-up pass only while the path is below the minimum, and only with
 *      courses that are actually relevant to the person's role.
 *
 * If the catalog cannot honestly reach the target for this learner, the path
 * comes back short rather than padded — quality over hitting 35.00 exactly.
 */
export function assemblePath(
  scored: ScoredCourse[],
  options: EngineOptions,
): { selected: PlannedCourse[]; rejected: RejectedCourse[]; totalHours: number } {
  const rejected: RejectedCourse[] = [];
  const chosen: ScoredCourse[] = [];
  const usedTopics = new Set<string>();
  let hours = 0;

  /**
   * Two courses "cover the same ground" when they share a dominant competency
   * AND the same audience. Generic workplace content and the employee's own
   * role module are deliberately different topics — mandatory general learning
   * must never crowd out the role-specific module, which is the whole point of
   * a personalised path.
   */
  const topicOf = (s: ScoredCourse) => {
    const competency = dominantCompetency(s.course) ?? s.course.code;
    const roleTargeted =
      s.course.departmentIds.length > 0 || s.course.jobFamilies.some((f) => f.jobFamily !== "GENERAL");
    return `${competency}:${roleTargeted ? "ROLE" : "GENERAL"}`;
  };
  const take = (s: ScoredCourse) => {
    chosen.push(s);
    usedTopics.add(topicOf(s));
    hours += s.course.estimatedHours;
  };

  // 1 — mandatory and manager-nominated learning, regardless of hours.
  for (const s of scored.filter((x) => x.forced).sort((a, b) => b.score - a.score)) take(s);

  const pool = scored.filter((s) => !s.forced).sort((a, b) => b.score - a.score);

  // 2 — one course per phase, in phase order, reserving budget for the phases
  //     still to come so a single 30-hour course cannot swallow the path.
  const RESERVE_PER_PHASE = 4;
  // No single course may dominate a blended path — a 30-hour programme is a
  // path in its own right, not one phase of one.
  const DOMINANCE_CAP = options.targetHours * 0.6;

  // Content aimed at another department, or taught in a language the learner
  // does not work in, is never auto-selected — whatever else it scores well on.
  const available = (phase: string) =>
    pool.filter(
      (s) =>
        !chosen.includes(s) &&
        s.roleRelevant &&
        s.languageComfortable &&
        phaseFor(s.course) === phase &&
        !usedTopics.has(topicOf(s)),
    );

  for (const [i, phase] of PHASE_ORDER.entries()) {
    if (hours >= options.targetHours) break;
    const laterPhasesWithContent = PHASE_ORDER.slice(i + 1).filter((p) => available(p).length > 0).length;
    const reserve = laterPhasesWithContent * RESERVE_PER_PHASE;
    const budget = Math.min(options.maxHours - hours - reserve, DOMINANCE_CAP);

    const candidate = available(phase).find((s) => s.course.estimatedHours <= budget);
    if (candidate) take(candidate);
  }

  // 3 — top up only while short, and only with role-relevant content that does
  //     not repeat a competency already covered. A short honest path beats a
  //     padded one, so this may still finish below the target.
  for (const s of pool) {
    if (hours >= options.minHours) break;
    if (chosen.includes(s)) continue;
    if (!s.roleRelevant) continue;
    if (!s.languageComfortable) continue;
    if (usedTopics.has(topicOf(s))) continue;
    if (hours + s.course.estimatedHours > options.maxHours) continue;
    take(s);
  }

  for (const s of pool) {
    if (chosen.includes(s)) continue;
    const duplicate = usedTopics.has(topicOf(s));
    rejected.push({
      courseId: s.course.id,
      title: s.course.title,
      code: s.course.code,
      reason: duplicate ? REJECTION.DUPLICATE_TOPIC : REJECTION.NO_ROOM,
      reasonCode: duplicate ? "DUPLICATE_TOPIC" : "NO_ROOM",
    });
  }

  // Order by phase, then prerequisites, then score.
  const byId = new Map(chosen.map((c) => [c.course.id, c]));
  const ordered = [...chosen].sort((a, b) => {
    const pa = phaseIndex(phaseFor(a.course));
    const pb = phaseIndex(phaseFor(b.course));
    if (pa !== pb) return pa - pb;
    if (a.course.prerequisiteIds.includes(b.course.id)) return 1;
    if (b.course.prerequisiteIds.includes(a.course.id)) return -1;
    return b.score - a.score;
  });

  // Safety net: a prerequisite that landed later moves ahead of its dependant.
  for (let i = 0; i < ordered.length; i++) {
    for (const prereqId of ordered[i].course.prerequisiteIds) {
      if (!byId.has(prereqId)) continue;
      const at = ordered.findIndex((o) => o.course.id === prereqId);
      if (at > i) {
        const [moved] = ordered.splice(at, 1);
        ordered.splice(i, 0, moved);
        i = -1;
        break;
      }
    }
  }

  const selected: PlannedCourse[] = ordered.map((s, index) => ({
    ...s,
    phase: phaseFor(s.course),
    order: index,
  }));

  return { selected, rejected, totalHours: round2(hours) };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function recommend(
  learner: LearnerContext,
  catalog: CandidateCourse[],
  options: EngineOptions,
): RecommendationResult {
  const { eligible, rejected: hardRejected } = applyConstraints(catalog, learner);
  const considered = eligible.map((c) => scoreCourse(c, learner, options.weights));
  const { selected, rejected: softRejected, totalHours } = assemblePath(considered, options);

  const expectedLevelCode = expectedOutcome(learner.levelCode, totalHours);
  const program = pickProgramTitle(learner, options, selected);

  return {
    engineVersion: ENGINE_VERSION,
    selected,
    rejected: [...hardRejected, ...softRejected],
    considered: considered.sort((a, b) => b.score - a.score),
    totalHours,
    targetHours: options.targetHours,
    expectedLevelCode,
    programTitle: program.title,
    programPathId: program.id,
  };
}

/** One level up is the realistic outcome of a full ~35 hour path. */
export function expectedOutcome(current: LevelCode, hours: number): LevelCode {
  const order = LEVEL_ORDER[current];
  const step = hours >= 20 ? 1 : 0;
  const next = Math.min(4, order + step);
  return (Object.keys(LEVEL_ORDER) as LevelCode[]).find((k) => LEVEL_ORDER[k] === next) ?? current;
}

function pickProgramTitle(learner: LearnerContext, options: EngineOptions, selected: PlannedCourse[]) {
  void selected;
  const templates = options.pathTemplates ?? [];
  if (templates.length === 0) return { title: null, id: null };

  const learnerLevel = LEVEL_ORDER[learner.levelCode];

  const eligible = templates.filter((t) => {
    // A path aimed at specific job families is only offered to those families.
    if (t.jobFamilies.length > 0 && !t.jobFamilies.includes(learner.jobFamily)) return false;
    // A technical programme is never handed to a non-technical employee.
    if (t.isTechnical && !learner.isTechnical) return false;
    return true;
  });
  if (eligible.length === 0) return { title: null, id: null };

  const ranked = eligible
    .map((t) => {
      const audience = t.audienceLevel ? LEVEL_ORDER[t.audienceLevel as LevelCode] : learnerLevel;
      let score = 10 - Math.abs(audience - learnerLevel) * 3;
      if (t.jobFamilies.includes(learner.jobFamily)) score += 5;
      if (t.isTechnical === learner.isTechnical) score += 2;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  return { title: best.t.title, id: best.t.id };
}

// ---------------------------------------------------------------------------

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function titleCase(key: string) {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const COMPETENCY_LABELS: Record<string, string> = {
  FUNDAMENTALS: "AI fundamentals",
  WORKPLACE: "workplace AI",
  PROMPTING: "prompting",
  RESPONSIBLE_AI: "responsible AI",
  DATA_AUTOMATION: "data & automation",
  TECHNICAL: "technical AI",
};

export function prettyCompetency(key: string) {
  return COMPETENCY_LABELS[key] ?? titleCase(key);
}

export function prettyGoal(key: string) {
  return titleCase(key).toLowerCase();
}

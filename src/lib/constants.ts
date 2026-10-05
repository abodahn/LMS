/**
 * Domain vocabularies. Kept in code (not the DB) because they are referenced by
 * the recommendation engine, RBAC and the UI; the *data* that uses them
 * (courses, departments, questions) is all editable in the admin.
 */

export const LOCALES = ["en", "ar", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const RTL_LOCALES: Locale[] = ["ar"];

export const ROLE_KEYS = ["EMPLOYEE", "MANAGER", "ADMIN", "SUPER_ADMIN"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const JOB_FAMILIES = [
  "FINANCE",
  "HR",
  "PRODUCTION",
  "QUALITY",
  "SUPPLY_CHAIN",
  "SALES_MARKETING",
  "MANAGEMENT",
  "IT",
  "GENERAL",
] as const;
export type JobFamily = (typeof JOB_FAMILIES)[number];

export const LEARNING_GOALS = [
  "WRITING",
  "EMAIL",
  "EXCEL",
  "REPORTS",
  "RESEARCH",
  "PRESENTATIONS",
  "DATA_ANALYSIS",
  "AUTOMATION",
  "DECISION_MAKING",
  "PROGRAMMING",
  "DOCUMENT_ANALYSIS",
  "PRODUCTION_IMPROVEMENT",
  "OTHER",
] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number];

export const AI_EXPERIENCE = ["NONE", "TRIED", "OCCASIONAL", "REGULAR", "ADVANCED"] as const;
export type AiExperience = (typeof AI_EXPERIENCE)[number];

export const COMPETENCY_KEYS = [
  "FUNDAMENTALS",
  "WORKPLACE",
  "PROMPTING",
  "RESPONSIBLE_AI",
  "DATA_AUTOMATION",
  "TECHNICAL",
] as const;
export type CompetencyKey = (typeof COMPETENCY_KEYS)[number];

export const LEVEL_CODES = ["L0", "L1", "L2", "L3", "L4"] as const;
export type LevelCode = (typeof LEVEL_CODES)[number];

export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const QUESTION_TYPES = [
  "SINGLE",
  "MULTI",
  "TRUE_FALSE",
  "SCENARIO",
  "MATCHING",
  "SHORT_ANSWER",
  "PROMPT_TASK",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const LESSON_TYPES = [
  "TEXT",
  "VIDEO",
  "YOUTUBE",
  "PDF",
  "IMAGE",
  "EXTERNAL",
  "FILE",
  "QUIZ",
  "ASSIGNMENT",
  "TASK",
  // Content authored elsewhere and uploaded as a package. Unlike the others it
  // carries no url or body of its own — the files and the launch point come
  // from the manifest (see lib/scorm).
  "SCORM",
] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const ENROLLMENT_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "PENDING_VERIFICATION",
  "COMPLETED",
  "DROPPED",
] as const;

export const RECOMMENDATION_WEIGHT_KEYS = [
  "AI_LEVEL_MATCH",
  "ROLE_MATCH",
  "COMPETENCY_GAP",
  "LEARNING_GOAL",
  "COURSE_QUALITY",
  "TIME_FIT",
  "LANGUAGE_FIT",
] as const;
export type RecommendationWeightKey = (typeof RECOMMENDATION_WEIGHT_KEYS)[number];

export const DEFAULT_RECOMMENDATION_WEIGHTS: Record<RecommendationWeightKey, number> = {
  AI_LEVEL_MATCH: 25,
  ROLE_MATCH: 20,
  COMPETENCY_GAP: 20,
  LEARNING_GOAL: 15,
  COURSE_QUALITY: 10,
  TIME_FIT: 5,
  LANGUAGE_FIT: 5,
};

export const SETTING_KEYS = {
  TARGET_LEARNING_HOURS: "learning.targetHours",
  MIN_LEARNING_HOURS: "learning.minHours",
  MAX_LEARNING_HOURS: "learning.maxHours",
  COMPLETION_THRESHOLD: "certification.completionThreshold",
  FINAL_PASS_SCORE: "certification.finalPassScore",
  RESPONSIBLE_AI_MANDATORY: "certification.responsibleAiMandatory",
  CAPSTONE_REQUIRED: "certification.capstoneRequired",
  COURSE_REVIEW_DAYS: "catalog.reviewIntervalDays",
  READINESS_WEIGHTS: "readiness.weights",
  SESSION_HOURS: "security.sessionHours",
  MAX_FAILED_LOGINS: "security.maxFailedLogins",
  LOCKOUT_MINUTES: "security.lockoutMinutes",
  AI_ENABLED: "ai.enabled",
  AI_PROVIDER: "ai.provider",
  AI_MODEL: "ai.model",
  ORG_NAME: "branding.orgName",
  PLATFORM_NAME: "branding.platformName",
  DEFAULT_LOCALE: "general.defaultLocale",
  CERT_ISSUER_TC: "certificates.issuerTcName",
  CERT_ISSUER_TCAP: "certificates.issuerTcapName",
  CERT_SIGN1_NAME: "certificates.signatory1Name",
  CERT_SIGN1_TITLE: "certificates.signatory1Title",
  CERT_SIGN2_NAME: "certificates.signatory2Name",
  CERT_SIGN2_TITLE: "certificates.signatory2Title",
  CERT_TCAP_SIGN1_NAME: "certificates.tcapSignatory1Name",
  CERT_TCAP_SIGN1_TITLE: "certificates.tcapSignatory1Title",
  CERT_TCAP_SIGN2_NAME: "certificates.tcapSignatory2Name",
  CERT_TCAP_SIGN2_TITLE: "certificates.tcapSignatory2Title",
} as const;

export const READINESS_DEFAULT_WEIGHTS = {
  assessment: 30,
  training: 20,
  improvement: 25,
  responsibleAi: 15,
  application: 10,
};

/** Levels ordered low → high; index doubles as the numeric level. */
export const LEVEL_ORDER: Record<LevelCode, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };

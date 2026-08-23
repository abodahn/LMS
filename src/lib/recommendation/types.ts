import type { CompetencyKey, LevelCode, RecommendationWeightKey } from "../constants";

export type LearnerContext = {
  userId: string;
  /** Demonstrated level from the latest graded placement/final assessment. */
  levelCode: LevelCode;
  departmentId: string | null;
  departmentName: string | null;
  jobFamily: string;
  jobTitle: string | null;
  isTechnical: boolean;
  aiExperience: string;
  preferredLanguage: string;
  weeklyHours: number;
  goals: string[];
  /** 0..100 per competency key, from the latest assessment. */
  competencyScores: Partial<Record<CompetencyKey, number>>;
  completedCourseIds: string[];
  activeCourseIds: string[];
  managerGoals?: string | null;
  /** Courses the organisation requires regardless of score. */
  mandatoryCourseIds: string[];
  /** Course ids a manager nominated for this person. */
  nominatedCourseIds?: string[];
  hasAssessment: boolean;
  technicalPassed?: boolean;
};

export type CandidateCourse = {
  id: string;
  code: string;
  title: string;
  slug: string;
  providerName: string;
  providerTrust: number;
  platform: string;
  estimatedHours: number;
  difficulty: string;
  language: string;
  subtitleLanguages: string[];
  levelCode: LevelCode | null;
  status: string;
  linkWorking: boolean;
  stillAvailable: boolean;
  isInternal: boolean;
  isTechnical: boolean;
  isMandatory: boolean;
  certificateAvailable: boolean;
  qualityScore: number;
  rating: number | null;
  /** Average learner usefulness 1..5, null when no feedback yet. */
  feedbackScore: number | null;
  competencies: { key: CompetencyKey; weight: number }[];
  departmentIds: string[];
  jobFamilies: { jobFamily: string; weight: number }[];
  goals: { goalKey: string; weight: number }[];
  prerequisiteIds: string[];
};

export type ScoreBreakdown = {
  key: RecommendationWeightKey;
  label: string;
  /** Raw component score 0..1 before weighting. */
  raw: number;
  /** Points this component contributed to the final 0..100 score. */
  contribution: number;
  reason?: string;
};

export type ScoredCourse = {
  course: CandidateCourse;
  score: number;
  breakdown: ScoreBreakdown[];
  reasons: { code: string; label: string; contribution: number; detail?: string }[];
  forced?: "MANDATORY" | "NOMINATED";
  /** True when the course actually targets this employee's role or is general. */
  roleRelevant?: boolean;
  languageComfortable?: boolean;
};

export type RejectedCourse = {
  courseId: string;
  title: string;
  code: string;
  reason: string;
  reasonCode: string;
};

export type PlannedCourse = ScoredCourse & { phase: string; order: number };

export type RecommendationResult = {
  engineVersion: string;
  selected: PlannedCourse[];
  rejected: RejectedCourse[];
  considered: ScoredCourse[];
  totalHours: number;
  targetHours: number;
  expectedLevelCode: LevelCode;
  programTitle: string | null;
  programPathId: string | null;
};

export type EngineOptions = {
  weights: Record<RecommendationWeightKey, number>;
  targetHours: number;
  minHours: number;
  maxHours: number;
  /** Path templates used only to name the resulting programme. */
  pathTemplates?: { id: string; code: string; title: string; audienceLevel: string | null; isTechnical: boolean; jobFamilies: string[]; targetLevelCode: string | null }[];
};

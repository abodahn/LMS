import { prisma } from "../db";
import { parseJson } from "../utils";
import { recalcEnrollmentProgress } from "../learner";
import {
  isWritable,
  normaliseStatus,
  scoreOf,
  fromCmiTime,
  readOnlyValues,
  FINISHED,
  SUCCESSFUL,
  type CmiMap,
} from "./cmi";
import type { ScormVersion } from "./manifest";

/**
 * Server side of the SCORM runtime.
 *
 * The browser shim holds the CMI map in memory and posts it here on commit, so
 * a lost tab costs at most the writes since the last commit — which is exactly
 * the guarantee SCORM itself makes. Nothing is trusted from the client beyond
 * the CMI values themselves: the enrolment is re-checked, read-only elements
 * are dropped, and the derived columns are recomputed here rather than sent.
 */

export type ScormSnapshot = {
  version: ScormVersion;
  cmi: CmiMap;
  lessonStatus: string;
  totalSeconds: number;
  location: string | null;
  suspendData: string | null;
};

/** Loads (or opens) the learner's state for a package. */
export async function openScormState(packageId: string, enrollmentId: string, userId: string) {
  const existing = await prisma.scormState.findUnique({
    where: { packageId_enrollmentId: { packageId, enrollmentId } },
  });
  if (existing) return existing;

  return prisma.scormState.create({
    data: { packageId, enrollmentId, userId, attempts: 1 },
  });
}

export async function scormSnapshot(
  packageId: string,
  enrollmentId: string,
  learner: { id: string; name: string },
): Promise<ScormSnapshot> {
  const pkg = await prisma.scormPackage.findUniqueOrThrow({ where: { id: packageId } });
  const state = await openScormState(packageId, enrollmentId, learner.id);
  const version = pkg.version as ScormVersion;

  const stored = parseJson<CmiMap>(state.cmi, {});
  return {
    version,
    // Read-only values are regenerated every launch: the learner's name may have
    // changed, and `entry` depends on whether this is a resume.
    cmi: { ...stored, ...readOnlyValues(version, learner, state) },
    lessonStatus: state.lessonStatus,
    totalSeconds: state.totalSeconds,
    location: state.location,
    suspendData: state.suspendData,
  };
}

export type CommitResult = {
  lessonStatus: string;
  finished: boolean;
  lessonCompleted: boolean;
  progressPercent: number;
};

/**
 * Persists a commit from the runtime.
 *
 * `cmi` is the whole map the shim holds, not a delta — SCORM content re-reads
 * what it wrote, so keeping one authoritative copy is simpler and cannot drift.
 * Read-only elements are stripped rather than rejected: content that writes
 * `cmi.core.student_name` is common and harmless, and failing the whole commit
 * over it would lose the learner's real progress.
 */
export async function commitScorm(input: {
  packageId: string;
  enrollmentId: string;
  userId: string;
  cmi: CmiMap;
  sessionSeconds: number;
}): Promise<CommitResult> {
  const pkg = await prisma.scormPackage.findUniqueOrThrow({
    where: { id: input.packageId },
    include: { lesson: true },
  });
  const version = pkg.version as ScormVersion;

  const state = await openScormState(input.packageId, input.enrollmentId, input.userId);
  const previous = parseJson<CmiMap>(state.cmi, {});

  const writable: CmiMap = { ...previous };
  for (const [key, value] of Object.entries(input.cmi)) {
    if (isWritable(version, key)) writable[key] = String(value);
  }

  const lessonStatus = normaliseStatus(version, writable);
  const score = scoreOf(version, writable);

  // Session time is reported by the content; the shim's own clock is the
  // fallback for content that never sets it.
  const reported = fromCmiTime(writable[version === "1.2" ? "cmi.core.session_time" : "cmi.session_time"] ?? "");
  const sessionSeconds = Math.max(0, reported || Math.round(input.sessionSeconds));

  const finished = FINISHED.has(lessonStatus);
  const succeeded = SUCCESSFUL.has(lessonStatus);

  await prisma.scormState.update({
    where: { id: state.id },
    data: {
      cmi: JSON.stringify(writable),
      lessonStatus,
      scoreRaw: score.raw,
      scoreMin: score.min,
      scoreMax: score.max,
      location: writable[version === "1.2" ? "cmi.core.lesson_location" : "cmi.location"] ?? null,
      suspendData: writable["cmi.suspend_data"] ?? null,
      sessionSeconds,
      // Total time accumulates across attempts, which is what `cmi.total_time`
      // is defined to mean.
      totalSeconds: state.totalSeconds + Math.max(0, sessionSeconds - state.sessionSeconds),
      completedAt: finished ? (state.completedAt ?? new Date()) : state.completedAt,
    },
  });

  // A passed or completed SCO ticks its lesson off, which is what drives the
  // enrolment's own progress and everything downstream of it.
  let progressPercent = 0;
  if (succeeded) {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: input.enrollmentId, lessonId: pkg.lessonId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: {
        enrollmentId: input.enrollmentId,
        lessonId: pkg.lessonId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }
  const enrollment = await recalcEnrollmentProgress(input.enrollmentId);
  progressPercent = enrollment?.progressPercent ?? 0;

  return { lessonStatus, finished, lessonCompleted: succeeded, progressPercent };
}

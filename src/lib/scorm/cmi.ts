import type { ScormVersion } from "./manifest";

/**
 * The CMI data model, reduced to what a course actually stores.
 *
 * SCORM content talks to the LMS through a flat key/value API: it calls
 * `LMSSetValue("cmi.core.lesson_status", "completed")` and expects the value to
 * survive until the next attempt. This module owns the two things the runtime
 * cannot guess: which keys exist, and how the two versions' vocabularies map
 * onto one stored shape.
 *
 * Both versions are kept in one store by normalising to the 1.2 vocabulary,
 * because it is the smaller of the two and the mapping in that direction is
 * total. The 2004 split of `completion_status` (did they finish) from
 * `success_status` (did they pass) is the one place this loses information, so
 * both are stored verbatim in the blob alongside the normalised status.
 */

export type CmiMap = Record<string, string>;

/** Keys the content may write. Anything else is refused with error 401. */
const WRITABLE_12 = new Set([
  "cmi.core.lesson_location",
  "cmi.core.lesson_status",
  "cmi.core.score.raw",
  "cmi.core.score.min",
  "cmi.core.score.max",
  "cmi.core.session_time",
  "cmi.core.exit",
  "cmi.suspend_data",
  "cmi.comments",
  "cmi.student_preference.audio",
  "cmi.student_preference.language",
  "cmi.student_preference.speed",
  "cmi.student_preference.text",
]);

const WRITABLE_2004 = new Set([
  "cmi.location",
  "cmi.completion_status",
  "cmi.success_status",
  "cmi.score.raw",
  "cmi.score.min",
  "cmi.score.max",
  "cmi.score.scaled",
  "cmi.session_time",
  "cmi.exit",
  "cmi.suspend_data",
  "cmi.progress_measure",
  "cmi.learner_preference.audio_level",
  "cmi.learner_preference.language",
  "cmi.learner_preference.delivery_speed",
  "cmi.learner_preference.audio_captioning",
]);

/** Read-only keys the LMS supplies. */
export function readOnlyValues(
  version: ScormVersion,
  learner: { id: string; name: string },
  state: { lessonStatus: string; location: string | null; suspendData: string | null; totalSeconds: number },
): CmiMap {
  const total = toCmiTime(state.totalSeconds, version);
  if (version === "1.2") {
    return {
      "cmi.core.student_id": learner.id,
      "cmi.core.student_name": learner.name,
      "cmi.core.credit": "credit",
      "cmi.core.entry": state.lessonStatus === "not attempted" ? "ab-initio" : "resume",
      "cmi.core.lesson_mode": "normal",
      "cmi.core.total_time": total,
      "cmi.core.lesson_status": state.lessonStatus,
      "cmi.core.lesson_location": state.location ?? "",
      "cmi.suspend_data": state.suspendData ?? "",
      "cmi.launch_data": "",
      "cmi.comments_from_lms": "",
    };
  }
  return {
    "cmi.learner_id": learner.id,
    "cmi.learner_name": learner.name,
    "cmi.credit": "credit",
    "cmi.entry": state.lessonStatus === "not attempted" ? "ab-initio" : "resume",
    "cmi.mode": "normal",
    "cmi.total_time": total,
    "cmi.completion_status": state.lessonStatus === "completed" || state.lessonStatus === "passed" ? "completed" : "incomplete",
    "cmi.success_status":
      state.lessonStatus === "passed" ? "passed" : state.lessonStatus === "failed" ? "failed" : "unknown",
    "cmi.location": state.location ?? "",
    "cmi.suspend_data": state.suspendData ?? "",
    "cmi.launch_data": "",
    "cmi._version": "1.0",
  };
}

export const isWritable = (version: ScormVersion, key: string): boolean =>
  (version === "1.2" ? WRITABLE_12 : WRITABLE_2004).has(key) ||
  // Interaction and objective arrays are written by index; the whole subtree is
  // writable and is stored verbatim for reporting.
  /^cmi\.(interactions|objectives)\.\d+\./.test(key);

/** SCORM 1.2 uses HHHH:MM:SS.SS; 2004 uses an ISO 8601 duration. */
export function toCmiTime(seconds: number, version: ScormVersion): string {
  const s = Math.max(0, Math.floor(seconds));
  if (version === "2004") {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec || (!h && !m) ? `${sec}S` : ""}`;
  }
  const h = String(Math.floor(s / 3600)).padStart(4, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}.00`;
}

/** The inverse, tolerant of both forms because content sends whichever it likes. */
export function fromCmiTime(value: string): number {
  if (!value) return 0;

  const iso = value.trim().match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/i);
  if (iso && value.toUpperCase().startsWith("P")) {
    const [, d, h, m, s] = iso;
    return (
      Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Math.floor(Number(s ?? 0))
    );
  }

  const parts = value.split(":");
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map((p) => Number(p));
  if (![h, m, s].every((n) => Number.isFinite(n))) return 0;
  return Math.floor(h * 3600 + m * 60 + s);
}

/**
 * Normalises a written status to the 1.2 vocabulary.
 *
 * 2004 reports completion and success separately, and a course can be complete
 * and failed at the same time. Failure is the more useful of the two to
 * surface, so it wins.
 */
export function normaliseStatus(version: ScormVersion, cmi: CmiMap): string {
  if (version === "1.2") {
    const status = (cmi["cmi.core.lesson_status"] ?? "").toLowerCase();
    return status || "not attempted";
  }

  const success = (cmi["cmi.success_status"] ?? "unknown").toLowerCase();
  const completion = (cmi["cmi.completion_status"] ?? "unknown").toLowerCase();

  if (success === "failed") return "failed";
  if (success === "passed") return "passed";
  if (completion === "completed") return "completed";
  if (completion === "incomplete") return "incomplete";
  return "not attempted";
}

/** Statuses that mean the learner is finished, whether or not they passed. */
export const FINISHED = new Set(["completed", "passed", "failed"]);
/** Statuses that mean the lesson may be ticked off as done. */
export const SUCCESSFUL = new Set(["completed", "passed"]);

export function scoreOf(version: ScormVersion, cmi: CmiMap) {
  const prefix = version === "1.2" ? "cmi.core.score" : "cmi.score";
  const num = (key: string) => {
    const raw = cmi[key];
    if (raw === undefined || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  return { raw: num(`${prefix}.raw`), min: num(`${prefix}.min`), max: num(`${prefix}.max`) };
}

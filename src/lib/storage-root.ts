import path from "node:path";

/**
 * Where uploads live on disk.
 *
 * Split out of storage.ts, which is `server-only` because it reads and writes
 * files on behalf of a request. The location itself is just configuration, and
 * the SCORM unpacker and the maintenance scripts need it without dragging the
 * request-scoped module in behind it.
 */
export const STORAGE_ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage");

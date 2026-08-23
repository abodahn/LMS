import path from "node:path";

/**
 * Path safety for uploaded packages.
 *
 * Kept apart from package.ts, which reaches the filesystem and the database, so
 * that the one rule worth testing in isolation can be tested in isolation.
 */

export class ScormUploadError extends Error {}

/**
 * Resolves a zip entry to a path inside `root`, or throws.
 *
 * Zip entries carry whatever name the writer put in them, including `../..` and
 * absolute paths. Writing one unchecked lets an upload overwrite any file the
 * process can reach, which is the most dangerous thing about accepting an
 * archive from a person.
 */
export function safeEntryPath(root: string, entryName: string): string {
  const normalised = entryName.split("\\").join("/");
  if (normalised.startsWith("/") || /^[a-zA-Z]:/.test(normalised)) {
    throw new ScormUploadError(`absolute path in package: ${entryName}`);
  }

  const target = path.resolve(root, normalised);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new ScormUploadError(`path escapes the package: ${entryName}`);
  }
  return target;
}

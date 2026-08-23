import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { safeEntryPath, ScormUploadError } from "./paths";
import JSZip from "jszip";
import { prisma } from "../db";
import { STORAGE_ROOT } from "../storage-root";
import { parseManifest, ManifestError, type ScormManifest } from "./manifest";

export { safeEntryPath, ScormUploadError } from "./paths";

/**
 * Unpacks an uploaded SCORM package into storage.
 *
 * **A SCORM package is executable content.** It is arbitrary HTML and
 * JavaScript, and the runtime requires it to be served same-origin, because the
 * content finds the LMS by walking `window.parent` looking for an `API` object.
 * A cross-origin frame cannot do that, which is why every LMS either serves
 * packages from a second domain or accepts this. This one accepts it, and
 * compensates the only ways it can:
 *
 *  - Upload needs `catalog.manage`, so the set of people who can introduce
 *    content is the set who can already edit the catalogue.
 *  - Entry paths are normalised and anything escaping the package root is
 *    rejected outright (see `safeEntryPath`).
 *  - Files are written under STORAGE_ROOT, outside the web root, and served
 *    only through a route that checks permissions first.
 *  - Uploads are audited.
 *
 * If T&C ever accepts packages from a source it does not control, serve
 * /api/scorm from its own hostname before doing so. That is the only fix that
 * actually contains hostile content, and it is a deployment change, not a code
 * change.
 */

export const MAX_PACKAGE_BYTES = Number(process.env.MAX_SCORM_BYTES ?? 200 * 1024 * 1024);
export const MAX_PACKAGE_FILES = 5000;
/** Guards against a zip bomb: a package that expands beyond this is refused. */
export const MAX_UNPACKED_BYTES = MAX_PACKAGE_BYTES * 5;

export type ScormUploadResult = {
  manifest: ScormManifest;
  storagePath: string;
  fileCount: number;
  sizeBytes: number;
};

/** The manifest lives at the root, but some tools nest the whole package one level down. */
function findManifest(zip: JSZip): { file: JSZip.JSZipObject; prefix: string } {
  const names = Object.keys(zip.files);
  const exact = names.find((n) => n.toLowerCase() === "imsmanifest.xml");
  if (exact) return { file: zip.files[exact], prefix: "" };

  const nested = names
    .filter((n) => n.toLowerCase().endsWith("/imsmanifest.xml"))
    .sort((a, b) => a.split("/").length - b.split("/").length)[0];
  if (nested) return { file: zip.files[nested], prefix: nested.slice(0, -"imsmanifest.xml".length) };

  throw new ScormUploadError("no imsmanifest.xml — this is not a SCORM package");
}

export async function unpackScormPackage(buffer: Buffer, packageId: string): Promise<ScormUploadResult> {
  if (buffer.byteLength > MAX_PACKAGE_BYTES) {
    throw new ScormUploadError(`package is larger than ${Math.round(MAX_PACKAGE_BYTES / 1024 / 1024)} MB`);
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ScormUploadError("could not read the file as a .zip archive");
  }

  const { file: manifestFile, prefix } = findManifest(zip);

  let manifest: ScormManifest;
  try {
    manifest = parseManifest(await manifestFile.async("string"));
  } catch (e) {
    if (e instanceof ManifestError) throw new ScormUploadError(e.message);
    throw e;
  }

  const root = path.join(STORAGE_ROOT, "scorm", packageId);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });

  let fileCount = 0;
  let sizeBytes = 0;

  try {
    for (const name of Object.keys(zip.files)) {
      const entry = zip.files[name];
      if (entry.dir) continue;
      // Everything below the nested root, with that prefix stripped, so hrefs
      // in the manifest resolve against the directory written here.
      if (prefix && !name.startsWith(prefix)) continue;
      const relative = prefix ? name.slice(prefix.length) : name;
      if (!relative) continue;

      if (++fileCount > MAX_PACKAGE_FILES) {
        throw new ScormUploadError(`package holds more than ${MAX_PACKAGE_FILES} files`);
      }

      const target = safeEntryPath(root, relative);
      const content = await entry.async("nodebuffer");
      sizeBytes += content.byteLength;
      if (sizeBytes > MAX_UNPACKED_BYTES) {
        throw new ScormUploadError("package expands to an implausible size");
      }

      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }

    // The launch file has to exist, or the lesson opens onto nothing.
    const entryTarget = safeEntryPath(root, manifest.entryHref.split(/[?#]/)[0]);
    const { access } = await import("node:fs/promises");
    await access(entryTarget).catch(() => {
      throw new ScormUploadError(`the manifest points at ${manifest.entryHref}, which is not in the package`);
    });
  } catch (e) {
    // Never leave a half-written package behind for the server to hand out.
    await rm(root, { recursive: true, force: true }).catch(() => {});
    throw e;
  }

  return { manifest, storagePath: path.join("scorm", packageId), fileCount, sizeBytes };
}

export async function deleteScormPackage(packageId: string) {
  const pkg = await prisma.scormPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return;
  await rm(path.join(STORAGE_ROOT, pkg.storagePath), { recursive: true, force: true }).catch(() => {});
  await prisma.scormPackage.delete({ where: { id: packageId } });
}

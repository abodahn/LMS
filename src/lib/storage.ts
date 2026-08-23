import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Uploads are stored outside the web root and served only through
 * /api/files/[...path], which checks permissions first. Nothing a user uploads
 * is ever reachable by URL alone.
 */
import { STORAGE_ROOT } from "./storage-root";
export { STORAGE_ROOT };

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024);

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export class UploadError extends Error {
  constructor(
    message: string,
    readonly code: "TOO_LARGE" | "BAD_TYPE" | "EMPTY",
  ) {
    super(message);
  }
}

/** Magic-number check — the browser-supplied MIME type is not trusted alone. */
function sniff(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 4).toString("latin1") === "RIFF" && buffer.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function saveUpload(file: File, folder: string) {
  if (!file || file.size === 0) throw new UploadError("No file selected.", "EMPTY");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("File is too large.", "TOO_LARGE");

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = sniff(buffer);
  if (!detected || !ALLOWED_UPLOAD_TYPES[detected]) {
    throw new UploadError("Unsupported file type.", "BAD_TYPE");
  }

  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "");
  const dir = path.join(STORAGE_ROOT, safeFolder);
  await mkdir(/* turbopackIgnore: true */ dir, { recursive: true });

  const name = `${randomUUID()}.${ALLOWED_UPLOAD_TYPES[detected]}`;
  await writeFile(path.join(/* turbopackIgnore: true */ dir, name), buffer);

  return {
    relativePath: path.posix.join(safeFolder, name),
    mimeType: detected,
    sizeBytes: buffer.length,
    originalName: file.name.slice(0, 200),
  };
}

export async function readStored(relativePath: string) {
  const resolved = path.resolve(STORAGE_ROOT, relativePath);
  // Never let a crafted path escape the storage root.
  if (!resolved.startsWith(STORAGE_ROOT)) throw new Error("Invalid path");
  return readFile(/* turbopackIgnore: true */ resolved);
}

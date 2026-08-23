import { XMLParser } from "fast-xml-parser";

/**
 * Reads the parts of `imsmanifest.xml` this platform needs.
 *
 * A SCORM package describes a tree of items pointing at resources. Almost every
 * package an organisation actually buys is a single SCO — one launchable unit —
 * so what is needed here is the version, a title, and the file to open. The
 * sequencing rules that SCORM 2004 adds on top are deliberately not read: they
 * only matter for multi-SCO packages with branching, and pretending to honour
 * them while ignoring them would be worse than not claiming support.
 *
 * Namespace prefixes vary by authoring tool (`adlcp:`, `imscp:`, none at all),
 * so attributes are matched on the local name.
 */

export type ScormVersion = "1.2" | "2004";

export type ScormManifest = {
  version: ScormVersion;
  title: string;
  /** Launch file relative to the package root, already URL-decoded. */
  entryHref: string;
  masteryScore: number | null;
  /** Every launchable SCO found, in manifest order. The first is the entry. */
  scos: { id: string; title: string; href: string }[];
};

export class ManifestError extends Error {}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Namespace prefixes differ between authoring tools; drop them and match on
  // the local name instead.
  removeNSPrefix: true,
  // Everything stays a string: a module titled "2024" is a title, not a number,
  // and masteryscore is read explicitly where it is needed.
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

/** fast-xml-parser gives a single child as an object and several as an array. */
const many = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const text = (node: unknown): string => {
  if (node == null) return "";
  if (typeof node === "string") return node.trim();
  if (typeof node === "object" && "#text" in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)["#text"] ?? "").trim();
  }
  return "";
};

/**
 * SCORM 1.2 says `1.2`; SCORM 2004 says `CAM 1.3` or `2004 Nth Edition` in
 * `<schemaversion>`, and the edition is not something this runtime varies on.
 */
function readVersion(metadata: Record<string, unknown> | undefined): ScormVersion {
  const raw = `${text(metadata?.schemaversion)} ${text(metadata?.schema)}`.toLowerCase();
  if (raw.includes("1.2")) return "1.2";
  if (raw.includes("2004") || raw.includes("cam 1.3") || raw.includes("1.3")) return "2004";
  // Unmarked packages are overwhelmingly 1.2, and a 2004 package driven by the
  // 1.2 API fails loudly rather than silently losing data.
  return "1.2";
}

export function parseManifest(xml: string): ScormManifest {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch (e) {
    throw new ManifestError(`imsmanifest.xml is not valid XML: ${e instanceof Error ? e.message : e}`);
  }

  const manifest = doc.manifest as Record<string, unknown> | undefined;
  if (!manifest) throw new ManifestError("imsmanifest.xml has no <manifest> element");

  const version = readVersion(manifest.metadata as Record<string, unknown> | undefined);

  // resources: identifier -> href
  const resourceNode = manifest.resources as Record<string, unknown> | undefined;
  const resources = new Map<string, { href: string; isSco: boolean }>();
  for (const r of many(resourceNode?.resource as Record<string, unknown>[])) {
    const id = String(r["@identifier"] ?? "");
    const href = String(r["@href"] ?? "");
    if (!id || !href) continue;
    // `scormtype` is the 1.2 spelling, `scormType` the 2004 one.
    const kind = String(r["@scormtype"] ?? r["@scormType"] ?? "sco").toLowerCase();
    resources.set(id, { href, isSco: kind !== "asset" });
  }

  // organizations: the item tree, which supplies titles and ordering
  const orgNode = manifest.organizations as Record<string, unknown> | undefined;
  const orgs = many(orgNode?.organization as Record<string, unknown>[]);
  const defaultId = String(orgNode?.["@default"] ?? "");
  const org = orgs.find((o) => String(o["@identifier"] ?? "") === defaultId) ?? orgs[0];

  const scos: ScormManifest["scos"] = [];
  let masteryScore: number | null = null;

  const walk = (item: Record<string, unknown>) => {
    const ref = String(item["@identifierref"] ?? "");
    const resource = ref ? resources.get(ref) : undefined;
    if (resource?.isSco) {
      scos.push({
        id: String(item["@identifier"] ?? ref),
        title: text(item.title) || String(item["@identifier"] ?? ref),
        href: resource.href,
      });
      const mastery = Number(text(item.masteryscore) || item["@masteryscore"] || NaN);
      if (Number.isFinite(mastery) && masteryScore === null) masteryScore = mastery;
    }
    for (const child of many(item.item as Record<string, unknown>[])) walk(child);
  };

  for (const item of many(org?.item as Record<string, unknown>[])) walk(item);

  // A package with no organisation still launches if exactly one resource is a
  // SCO — several authoring tools emit that shape.
  if (scos.length === 0) {
    for (const [id, r] of resources) {
      if (r.isSco) scos.push({ id, title: text(org?.title) || "Content", href: r.href });
    }
  }

  if (scos.length === 0) throw new ManifestError("no launchable content found in the manifest");

  const title = text(org?.title) || scos[0].title || "SCORM package";

  return {
    version,
    title,
    // Manifest hrefs are URI-encoded; the paths on disk are not.
    entryHref: decodeURIComponent(scos[0].href),
    masteryScore,
    scos,
  };
}

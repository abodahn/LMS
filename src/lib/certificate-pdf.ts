import path from "node:path";
import { readFileSync } from "node:fs";
import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";

/**
 * The certificate itself: one A4 landscape page.
 *
 * Kept apart from the database so the design can be rendered and checked from
 * plain data. Latin and Turkish text is set in Noto Serif as real, selectable
 * text; the PDF's built-in fonts cannot draw "ş", "ı" or "ğ" at all. Arabic is
 * drawn as outlines shaped by fontkit, because pdf-lib keeps a shaped glyph
 * but drops its position — and Noto Naskh places every dot by position, so
 * Arabic set through pdf-lib comes out with its dots on the wrong letters.
 */

export type Issuer = { key: "TC" | "TCAP"; name: string };
export type Signatory = { name: string; title: string };

export type CertificateDesign = {
  issuer: Issuer;
  recipient: string;
  /** COURSE, PROGRAM, PATH… decides the wording around the title. */
  kind: string;
  title: string;
  /** Who made the course when it was not T&C — shown, never implied away. */
  provider?: string | null;
  issuedAt: Date;
  hours: number;
  level?: string | null;
  finalScore?: number | null;
  code: string;
  verifyUrl: string;
  signatories: Signatory[];
};

const W = 842;
const H = 595;

const C = {
  red: rgb(0.847, 0.106, 0.141), // #D81B24
  redLogo: rgb(0.929, 0.11, 0.141), // #ED1C24
  ink: rgb(0.137, 0.122, 0.125), // #231F20
  charcoal: rgb(0.231, 0.208, 0.216), // #3B3537
  muted: rgb(0.42, 0.4, 0.408), // #6B6668
  line: rgb(0.85, 0.83, 0.835),
  paper: rgb(0.992, 0.984, 0.976),
  tint: rgb(0.996, 0.925, 0.925),
};

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

type FontkitFont = ReturnType<typeof fontkit.create>;
let files: Record<string, Uint8Array> | null = null;
let naskh: { regular: FontkitFont; bold: FontkitFont } | null = null;

function fontFiles() {
  files ??= Object.fromEntries(
    ["NotoSerif-Regular", "NotoSerif-Bold", "NotoSerif-Italic", "NotoNaskhArabic-Regular", "NotoNaskhArabic-Bold"].map(
      (n) => [n, readFileSync(path.join(FONT_DIR, `${n}.ttf`))],
    ),
  );
  return files;
}

let groupArt: { logo: Uint8Array; mark: Uint8Array } | null = null;
/** The T-GROUP logo and its hexagon mark, transparent PNGs in assets/brand. */
function groupLogo() {
  const dir = path.join(process.cwd(), "assets", "brand");
  groupArt ??= {
    logo: readFileSync(path.join(dir, "t-group-logo.png")),
    mark: readFileSync(path.join(dir, "t-group-mark.png")),
  };
  return groupArt;
}

function arabicFonts() {
  const f = fontFiles();
  naskh ??= {
    regular: fontkit.create(f["NotoNaskhArabic-Regular"]),
    bold: fontkit.create(f["NotoNaskhArabic-Bold"]),
  };
  return naskh;
}

// --- mixed-script text --------------------------------------------------------

// Arabic letters and marks — not the Arabic-Indic digits, which read left to
// right like any number and so must never be reversed with the word around them.
const AR_LETTER = /[؀-ٟ٪-ۯۺ-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const AR_DIGIT = /[٠-٩۰-۹]/;
const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" };

type Weight = "regular" | "bold" | "italic";
type Latin = { regular: PDFFont; bold: PDFFont; italic: PDFFont };
/** A run drawn with one method: shaped Arabic, Arabic-Indic digits, or Latin text (punctuation included). */
export type Piece = { text: string; kind: "arabic" | "adigit" | "latin" };
type Item = Piece | { gap: true };

/** Splits one word into runs that are each drawn one way. */
export function pieces(word: string): Piece[] {
  const out: Piece[] = [];
  for (const ch of word) {
    const kind: Piece["kind"] = AR_LETTER.test(ch) ? "arabic" : AR_DIGIT.test(ch) ? "adigit" : "latin";
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += ch;
    else out.push({ text: ch, kind });
  }
  return out;
}

/** Whether a line reads right to left: its first letter is Arabic. */
export function isRtl(text: string) {
  for (const ch of text) {
    if (AR_LETTER.test(ch)) return true;
    if (/\p{L}/u.test(ch)) return false;
  }
  return false;
}

/**
 * The runs of a line in the order they sit on the page, left to right.
 *
 * Left-to-right lines keep word order; an Arabic word inside them is shaped as
 * a unit. Right-to-left lines reverse the words, but a stretch of Latin words
 * or numbers keeps its own order, and inside an Arabic word its punctuation
 * moves to the other side (and brackets turn round), as a reader expects.
 */
export function visualOrder(text: string): Item[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: Item[] = [];
  const push = (ps: Piece[]) => {
    if (out.length) out.push({ gap: true });
    out.push(...ps);
  };
  if (!isRtl(text)) {
    for (const w of words) push(pieces(w));
    return out;
  }
  // Group: each Arabic word alone; consecutive non-Arabic words together.
  const groups: Piece[][][] = [];
  for (const w of words) {
    const ps = pieces(w);
    const arabic = ps.some((p) => p.kind === "arabic");
    const last = groups[groups.length - 1];
    const lastArabic = last?.[0]?.some((p) => p.kind === "arabic");
    if (!arabic && last && !lastArabic) last.push(ps);
    else groups.push([ps]);
  }
  for (const g of groups.reverse()) {
    if (g[0].some((p) => p.kind === "arabic")) {
      push(g[0].reverse().map((p) => (p.kind === "latin" ? { ...p, text: [...p.text].map((c) => MIRROR[c] ?? c).join("") } : p)));
    } else {
      g.forEach((ps, i) => (i === 0 ? push(ps) : (out.push({ gap: true }), out.push(...ps))));
    }
  }
  return out;
}

type Shaped = { glyphs: { path: unknown }[]; positions: { xAdvance: number; xOffset: number; yOffset: number }[]; advanceWidth: number };

class Typesetter {
  constructor(
    private page: PDFPage,
    private latin: Latin,
  ) {}

  private arabicFont(weight: Weight) {
    const f = arabicFonts();
    return weight === "bold" ? f.bold : f.regular;
  }

  private shaped(text: string, weight: Weight) {
    return this.arabicFont(weight).layout(text) as unknown as Shaped;
  }

  private pieceWidth(p: Piece, weight: Weight, size: number) {
    if (p.kind === "latin") return this.latin[weight].widthOfTextAtSize(p.text, size);
    const k = size / this.arabicFont(weight).unitsPerEm;
    // Arabic-Indic digits are measured one by one, as they are drawn.
    const parts = p.kind === "adigit" ? [...p.text] : [p.text];
    return parts.reduce((s, t) => s + this.shaped(t, weight).advanceWidth * k, 0);
  }

  width(text: string, weight: Weight, size: number) {
    const gap = this.latin[weight].widthOfTextAtSize(" ", size);
    return visualOrder(text).reduce((s, it) => s + ("gap" in it ? gap : this.pieceWidth(it, weight, size)), 0);
  }

  /** Outlines of shaped glyphs from `x` on baseline `y`; returns the advance. */
  private outline(text: string, weight: Weight, size: number, x: number, y: number, color: RGB) {
    const k = size / this.arabicFont(weight).unitsPerEm;
    const run = this.shaped(text, weight);
    let advance = 0;
    run.glyphs.forEach((g, j) => {
      const p = run.positions[j];
      // fontkit paths are y-up; drawSvgPath expects y-down and flips back.
      const svg = (g.path as { scale(x: number, y: number): { toSVG(): string } }).scale(1, -1).toSVG();
      if (svg) this.page.drawSvgPath(svg, { x: x + (advance + p.xOffset) * k, y: y + p.yOffset * k, scale: k, color, borderWidth: 0 });
      advance += p.xAdvance;
    });
    return advance * k;
  }

  /** Draws `text` from `x` on baseline `y`. Returns the width drawn. */
  draw(text: string, weight: Weight, size: number, x: number, y: number, color: RGB) {
    const gap = this.latin[weight].widthOfTextAtSize(" ", size);
    let pen = x;
    for (const it of visualOrder(text)) {
      if ("gap" in it) pen += gap;
      else if (it.kind === "latin") {
        this.page.drawText(it.text, { x: pen, y, size, font: this.latin[weight], color });
        pen += this.latin[weight].widthOfTextAtSize(it.text, size);
      } else if (it.kind === "adigit") {
        for (const d of it.text) pen += this.outline(d, weight, size, pen, y, color);
      } else pen += this.outline(it.text, weight, size, pen, y, color);
    }
    return pen - x;
  }

  /** Shortens `text` with an ellipsis until it fits `maxWidth` at `size`. */
  clip(text: string, weight: Weight, size: number, maxWidth: number) {
    if (this.width(text, weight, size) <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && this.width(`${t}…`, weight, size) > maxWidth) t = t.slice(0, -1);
    return `${t.trimEnd()}…`;
  }

  centred(text: string, weight: Weight, size: number, y: number, color: RGB, cx = W / 2) {
    const w = this.width(text, weight, size);
    this.draw(text, weight, size, cx - w / 2, y, color);
    return w;
  }

  /** Largest size up to `size` at which `text` fits in `maxWidth`. */
  fit(text: string, weight: Weight, size: number, maxWidth: number, min = 8) {
    let s = size;
    while (s > min && this.width(text, weight, s) > maxWidth) s -= 0.5;
    return s;
  }
}

/** Greedy word wrap; returns the lines in reading order. */
export function wrap(text: string, width: (t: string) => number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && width(next) > maxWidth) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// --- ornaments -----------------------------------------------------------------

/** Letter-spaced capitals, centred: pdf-lib has no tracking, so glyph by glyph. */
function tracked(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color: RGB, spacing: number) {
  const chars = [...text];
  const total = chars.reduce((s, ch) => s + font.widthOfTextAtSize(ch, size), 0) + spacing * (chars.length - 1);
  let x = W / 2 - total / 2;
  for (const ch of chars) {
    page.drawText(ch, { x, y, size, font, color });
    x += font.widthOfTextAtSize(ch, size) + spacing;
  }
}

/** Text set along the top of a circle, reading left to right. */
function arcText(page: PDFPage, text: string, font: PDFFont, wanted: number, cx: number, cy: number, r: number, color: RGB) {
  const chars = [...text];
  const measure = (z: number) =>
    chars.reduce((a, ch) => a + font.widthOfTextAtSize(ch, z), 0) + z * 0.18 * (chars.length - 1);
  // At most about three quarters of the circle, so a long name never meets itself.
  const size = Math.min(wanted, (wanted * (1.5 * Math.PI * r)) / measure(wanted));
  const widths = chars.map((ch) => font.widthOfTextAtSize(ch, size));
  const spacing = size * 0.18;
  const total = measure(size);
  let angle = Math.PI / 2 + total / r / 2;
  chars.forEach((ch, i) => {
    const mid = angle - widths[i] / 2 / r;
    // The glyph's centre sits on the circle, its baseline tangent to it.
    const x = cx + r * Math.cos(mid) - (widths[i] / 2) * Math.sin(mid);
    const y = cy + r * Math.sin(mid) + (widths[i] / 2) * Math.cos(mid);
    page.drawText(ch, { x, y, size, font, color, rotate: degrees((mid * 180) / Math.PI - 90) });
    angle -= (widths[i] + spacing) / r;
  });
}

/** The T&C mark, as in public/brand/logo-mark.svg, `h` points tall, top-left at (x, y). */
function tcMark(page: PDFPage, x: number, y: number, h: number) {
  const s = h / 654;
  page.drawRectangle({ x, y: y - 143 * s, width: 415 * s, height: 143 * s, color: C.redLogo });
  page.drawSvgPath("M6,654 A409,490 0 0 1 415,164 L415,310 C228,324 78,444 6,654 Z", {
    x,
    y,
    scale: s,
    color: C.redLogo,
    borderWidth: 0,
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// --- the page --------------------------------------------------------------------

export async function drawCertificate(d: CertificateDesign): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${d.title} — ${d.recipient}`);
  pdf.setAuthor(d.issuer.name);
  pdf.setSubject("Certificate of completion");
  pdf.setCreator("T&C AI Academy");

  const f = fontFiles();
  const latin: Latin = {
    regular: await pdf.embedFont(f["NotoSerif-Regular"], { subset: true }),
    bold: await pdf.embedFont(f["NotoSerif-Bold"], { subset: true }),
    italic: await pdf.embedFont(f["NotoSerif-Italic"], { subset: true }),
  };
  const page = pdf.addPage([W, H]);
  const ts = new Typesetter(page, latin);

  // Paper, a double frame and red corners.
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.paper });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: C.charcoal, borderWidth: 0.8 });
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 52, borderColor: C.red, borderWidth: 1.6 });
  page.drawRectangle({ x: 31, y: 31, width: W - 62, height: H - 62, borderColor: C.line, borderWidth: 0.5 });
  for (const [x, y, sx, sy] of [
    [26, 26, 1, 1],
    [W - 26, 26, -1, 1],
    [26, H - 26, 1, -1],
    [W - 26, H - 26, -1, -1],
  ] as const) {
    page.drawRectangle({ x: sx > 0 ? x : x - 34, y: sy > 0 ? y : y - 5, width: 34, height: 5, color: C.red });
    page.drawRectangle({ x: sx > 0 ? x : x - 5, y: sy > 0 ? y : y - 34, width: 5, height: 34, color: C.red });
  }

  // Header: the issuer on the left, the number and QR code on the right.
  const group = d.issuer.key === "TCAP" ? groupLogo() : null;
  const groupMark = group ? await pdf.embedPng(group.mark) : null;
  if (!group) {
    tcMark(page, 56, H - 52, 40);
    const caps = d.issuer.name.toUpperCase();
    ts.draw(ts.clip(caps, "bold", 11, 250), "bold", 11, 90, H - 76, C.ink);
    page.drawText("T&C AI ACADEMY", { x: 90, y: H - 90, size: 7.5, font: latin.regular, color: C.muted });
  } else {
    const logo = await pdf.embedPng(group.logo);
    const h = 34;
    page.drawImage(logo, { x: 56, y: H - 52 - h, width: (logo.width / logo.height) * h, height: h });
    page.drawText("T&C AI ACADEMY", { x: 56, y: H - 100, size: 7.5, font: latin.regular, color: C.muted });
  }
  const label = "CERTIFICATE NO.";
  page.drawText(label, { x: W - 56 - latin.regular.widthOfTextAtSize(label, 7), y: H - 70, size: 7, font: latin.regular, color: C.muted });
  page.drawText(d.code, { x: W - 56 - latin.bold.widthOfTextAtSize(d.code, 10), y: H - 84, size: 10, font: latin.bold, color: C.ink });

  // Title.
  tracked(page, "CERTIFICATE", latin.bold, 38, H - 150, C.ink, 7);
  tracked(page, d.kind === "PROGRAM" ? "OF ACHIEVEMENT" : "OF COMPLETION", latin.regular, 12, H - 173, C.red, 5);
  page.drawLine({ start: { x: W / 2 - 110, y: H - 188 }, end: { x: W / 2 - 10, y: H - 188 }, thickness: 0.8, color: C.red });
  page.drawLine({ start: { x: W / 2 + 10, y: H - 188 }, end: { x: W / 2 + 110, y: H - 188 }, thickness: 0.8, color: C.red });
  page.drawSvgPath("M0,-4 L4,0 L0,4 L-4,0 Z", { x: W / 2, y: H - 188, color: C.red, borderWidth: 0 });

  // Recipient.
  ts.centred("This is to certify that", "italic", 12.5, H - 218, C.muted);
  const nameWeight: Weight = isRtl(d.recipient) ? "bold" : "italic";
  const nameSize = ts.fit(d.recipient, nameWeight, 36, 600, 12);
  ts.centred(ts.clip(d.recipient, nameWeight, nameSize, 600), nameWeight, nameSize, H - 262, C.ink);
  page.drawLine({ start: { x: W / 2 - 190, y: H - 275 }, end: { x: W / 2 + 190, y: H - 275 }, thickness: 0.6, color: C.line });

  // What was completed.
  const lead =
    d.kind === "PROGRAM"
      ? "has met every requirement of the programme"
      : d.kind === "PATH"
        ? "has successfully completed the learning path"
        : "has successfully completed the course";
  ts.centred(lead, "italic", 12, H - 300, C.muted);

  let titleSize = 20;
  let lines = wrap(d.title, (t) => ts.width(t, "bold", titleSize), 620);
  while (lines.length > 2 && titleSize > 13) {
    titleSize -= 1;
    lines = wrap(d.title, (t) => ts.width(t, "bold", titleSize), 620);
  }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
  lines = lines.map((l) => ts.clip(l, "bold", titleSize, 620));
  const gap = titleSize * 1.4;
  const titleTop = H - 332 + (lines.length === 1 ? -4 : 0);
  lines.forEach((l, i) => ts.centred(l, "bold", titleSize, titleTop - i * gap, C.charcoal));

  // Facts, each part set on its own so a provider's Arabic name stays shaped.
  const parts = [
    d.hours > 0 ? `${Number.isInteger(d.hours) ? d.hours : d.hours.toFixed(1)} learning hours` : null,
    d.provider ? `Provided by ${d.provider}` : null,
    d.level ? `Level ${d.level}` : null,
    d.finalScore != null ? `Final assessment ${Math.round(d.finalScore)}%` : null,
  ].filter(Boolean) as string[];
  const factsY = titleTop - lines.length * gap - 2;
  if (parts.length) {
    const sep = "   ·   ";
    const sepW = latin.regular.widthOfTextAtSize(sep, 9.5);
    const total = parts.reduce((s, p) => s + ts.width(p, "regular", 9.5), 0) + sepW * (parts.length - 1);
    let x = W / 2 - total / 2;
    parts.forEach((p, i) => {
      x += ts.draw(p, "regular", 9.5, x, factsY, C.muted);
      if (i < parts.length - 1) {
        page.drawText(sep, { x, y: factsY, size: 9.5, font: latin.regular, color: C.muted });
        x += sepW;
      }
    });
  }
  ts.centred(`Awarded on ${formatDate(d.issuedAt)}`, "regular", 10.5, factsY - 18, C.charcoal);

  // Signatures either side of the seal.
  const sigY = 84;
  const blocks = d.signatories.filter((s) => s.name.trim()).slice(0, 2);
  const centres = blocks.length === 1 ? [W / 2 - 230] : [W / 2 - 230, W / 2 + 230];
  blocks.forEach((s, i) => {
    const cx = centres[i];
    page.drawLine({ start: { x: cx - 95, y: sigY + 26 }, end: { x: cx + 95, y: sigY + 26 }, thickness: 0.8, color: C.charcoal });
    ts.centred(s.name, "bold", ts.fit(s.name, "bold", 11.5, 190), sigY + 10, C.ink, cx);
    if (s.title.trim()) ts.centred(s.title, "regular", ts.fit(s.title, "regular", 9, 200, 7), sigY - 4, C.muted, cx);
  });

  // Seal: two rings, the issuer around the top, its mark in the middle.
  const sx = W / 2;
  const sy = sigY + 22;
  const issuerCaps = d.issuer.name.toUpperCase();
  page.drawCircle({ x: sx, y: sy, size: 46, color: C.paper, borderColor: C.red, borderWidth: 2 });
  page.drawCircle({ x: sx, y: sy, size: 39, borderColor: C.charcoal, borderWidth: 0.6 });
  page.drawCircle({ x: sx, y: sy, size: 27, color: C.tint, borderWidth: 0 });
  // Caps about 0.7 of the size tall: set at r = 40.2 they stay between the rings (39 and 45).
  if (!isRtl(issuerCaps)) arcText(page, `${issuerCaps} · CERTIFIED`, latin.bold, 5.8, sx, sy, 40.2, C.red);
  if (groupMark) {
    const h = 28;
    const w = (groupMark.width / groupMark.height) * h;
    page.drawImage(groupMark, { x: sx - w / 2, y: sy - 13, width: w, height: h });
  } else tcMark(page, sx - 9.5, sy + 15, 30);
  ts.centred(String(d.issuedAt.getUTCFullYear()), "bold", 7, sy - 24, C.charcoal, sx);

  // Verification.
  const qr = await pdf.embedPng(Buffer.from((await QRCode.toDataURL(d.verifyUrl, { margin: 0, width: 220 })).split(",")[1], "base64"));
  page.drawImage(qr, { x: W - 56 - 46, y: H - 146, width: 46, height: 46 });
  const scan = "Scan to verify";
  page.drawText(scan, { x: W - 56 - 23 - latin.regular.widthOfTextAtSize(scan, 6.5) / 2, y: H - 156, size: 6.5, font: latin.regular, color: C.muted });
  ts.centred(`Verify this certificate at ${d.verifyUrl.replace(/^https?:\/\//, "")}`, "regular", 7, 40, C.muted);

  return pdf.save();
}

import path from "node:path";
import { readFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
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
function tracked(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color: RGB, spacing: number, cx = W / 2) {
  const chars = [...text];
  const total = chars.reduce((s, ch) => s + font.widthOfTextAtSize(ch, size), 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
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

type Ink = { title: RGB; text: RGB; soft: RGB; line: RGB };
type Ctx = { pdf: PDFDocument; page: PDFPage; ts: Typesetter; latin: Latin; d: CertificateDesign };

/** A pointy-top hexagon, like the T-GROUP mark, as an SVG path centred on the origin (y down). */
function hexPath(r: number) {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 3;
      return `${i ? "L" : "M"}${(r * Math.cos(a)).toFixed(2)},${(-r * Math.sin(a)).toFixed(2)}`;
    }).join(" ") + " Z"
  );
}

/** A rectangle with its corners cut at 45°, drawn from page coordinates. */
function chamfered(page: PDFPage, x0: number, y0: number, x1: number, y1: number, c: number, color: RGB, width: number) {
  const pts = [
    [x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c],
    [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c],
  ];
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${H - y}`).join(" ") + " Z";
  page.drawSvgPath(path, { x: 0, y: H, borderColor: color, borderWidth: width });
}

/**
 * Name, what was completed, and the facts: the same on every certificate, in
 * the colours of the issuer. `top` is the baseline of "This is to certify that".
 */
function body({ page, ts, latin, d }: Ctx, ink: Ink, top: number, leadFont?: PDFFont) {
  // The fixed English phrases may use a theme's own face; names and titles
  // always use the Unicode fonts, since they can be in any language.
  const lead = (text: string, y: number, size: number) => {
    if (leadFont) {
      const w = leadFont.widthOfTextAtSize(text, size);
      page.drawText(text, { x: W / 2 - w / 2, y, size, font: leadFont, color: ink.soft });
    } else ts.centred(text, "italic", size, y, ink.soft);
  };
  lead("This is to certify that", top, leadFont ? 11 : 12.5);
  const nameWeight: Weight = isRtl(d.recipient) ? "bold" : "italic";
  const nameSize = ts.fit(d.recipient, nameWeight, 36, 600, 12);
  ts.centred(ts.clip(d.recipient, nameWeight, nameSize, 600), nameWeight, nameSize, top - 44, ink.title);
  page.drawLine({ start: { x: W / 2 - 190, y: top - 57 }, end: { x: W / 2 + 190, y: top - 57 }, thickness: 0.6, color: ink.line });

  lead(
    d.kind === "PROGRAM"
      ? "has met every requirement of the programme"
      : d.kind === "PATH"
        ? "has successfully completed the learning path"
        : "has successfully completed the course",
    top - 82,
    leadFont ? 11 : 12,
  );

  let titleSize = 20;
  let lines = wrap(d.title, (t) => ts.width(t, "bold", titleSize), 620);
  while (lines.length > 2 && titleSize > 13) {
    titleSize -= 1;
    lines = wrap(d.title, (t) => ts.width(t, "bold", titleSize), 620);
  }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
  lines = lines.map((l) => ts.clip(l, "bold", titleSize, 620));
  const gap = titleSize * 1.4;
  const titleTop = top - 114 + (lines.length === 1 ? -4 : 0);
  lines.forEach((l, i) => ts.centred(l, "bold", titleSize, titleTop - i * gap, ink.text));

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
      x += ts.draw(p, "regular", 9.5, x, factsY, ink.soft);
      if (i < parts.length - 1) {
        page.drawText(sep, { x, y: factsY, size: 9.5, font: latin.regular, color: ink.soft });
        x += sepW;
      }
    });
  }
  ts.centred(`Awarded on ${formatDate(d.issuedAt)}`, "regular", 10.5, factsY - 18, ink.text);
}

function signatures({ page, ts, d }: Ctx, ink: Ink, centres: number[], sigY: number) {
  d.signatories
    .filter((s) => s.name.trim())
    .slice(0, centres.length)
    .forEach((s, i) => {
      const cx = centres[i];
      page.drawLine({ start: { x: cx - 95, y: sigY + 26 }, end: { x: cx + 95, y: sigY + 26 }, thickness: 0.8, color: ink.text });
      ts.centred(s.name, "bold", ts.fit(s.name, "bold", 11.5, 190), sigY + 10, ink.title, cx);
      if (s.title.trim()) ts.centred(s.title, "regular", ts.fit(s.title, "regular", 9, 200, 7), sigY - 4, ink.soft, cx);
    });
}

async function qrCode({ pdf, page }: Ctx, url: string, x: number, y: number, size: number) {
  const png = Buffer.from((await QRCode.toDataURL(url, { margin: 0, width: 220 })).split(",")[1], "base64");
  page.drawImage(await pdf.embedPng(png), { x, y, width: size, height: size });
}

/** T&C Garments: warm paper, red frame and corners, the T&C mark, a round seal. */
async function drawTc(ctx: Ctx) {
  const { page, ts, latin, d } = ctx;
  const ink: Ink = { title: C.ink, text: C.charcoal, soft: C.muted, line: C.line };

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

  tcMark(page, 56, H - 52, 40);
  ts.draw(ts.clip(d.issuer.name.toUpperCase(), "bold", 11, 250), "bold", 11, 90, H - 76, C.ink);
  page.drawText("T&C AI ACADEMY", { x: 90, y: H - 90, size: 7.5, font: latin.regular, color: C.muted });
  const label = "CERTIFICATE NO.";
  page.drawText(label, { x: W - 56 - latin.regular.widthOfTextAtSize(label, 7), y: H - 70, size: 7, font: latin.regular, color: C.muted });
  page.drawText(d.code, { x: W - 56 - latin.bold.widthOfTextAtSize(d.code, 10), y: H - 84, size: 10, font: latin.bold, color: C.ink });
  await qrCode(ctx, d.verifyUrl, W - 56 - 46, H - 146, 46);
  const scan = "Scan to verify";
  page.drawText(scan, { x: W - 56 - 23 - latin.regular.widthOfTextAtSize(scan, 6.5) / 2, y: H - 156, size: 6.5, font: latin.regular, color: C.muted });

  tracked(page, "CERTIFICATE", latin.bold, 38, H - 150, C.ink, 7);
  tracked(page, d.kind === "PROGRAM" ? "OF ACHIEVEMENT" : "OF COMPLETION", latin.regular, 12, H - 173, C.red, 5);
  page.drawLine({ start: { x: W / 2 - 110, y: H - 188 }, end: { x: W / 2 - 10, y: H - 188 }, thickness: 0.8, color: C.red });
  page.drawLine({ start: { x: W / 2 + 10, y: H - 188 }, end: { x: W / 2 + 110, y: H - 188 }, thickness: 0.8, color: C.red });
  page.drawSvgPath("M0,-4 L4,0 L0,4 L-4,0 Z", { x: W / 2, y: H - 188, color: C.red, borderWidth: 0 });

  body(ctx, ink, H - 218);

  const sigY = 84;
  const count = d.signatories.filter((s) => s.name.trim()).length;
  signatures(ctx, ink, count === 1 ? [W / 2 - 230] : [W / 2 - 230, W / 2 + 230], sigY);

  // Seal: two rings, the issuer around the top, the T&C mark in the middle.
  const sx = W / 2;
  const sy = sigY + 22;
  const caps = d.issuer.name.toUpperCase();
  page.drawCircle({ x: sx, y: sy, size: 46, color: C.paper, borderColor: C.red, borderWidth: 2 });
  page.drawCircle({ x: sx, y: sy, size: 39, borderColor: C.charcoal, borderWidth: 0.6 });
  page.drawCircle({ x: sx, y: sy, size: 27, color: C.tint, borderWidth: 0 });
  // Caps about 0.7 of the size tall: set at r = 40.2 they stay between the rings (39 and 45).
  if (!isRtl(caps)) arcText(page, `${caps} · CERTIFIED`, latin.bold, 5.8, sx, sy, 40.2, C.red);
  tcMark(page, sx - 9.5, sy + 15, 30);
  ts.centred(String(d.issuedAt.getUTCFullYear()), "bold", 7, sy - 24, C.charcoal, sx);

  ts.centred(`Verify this certificate at ${d.verifyUrl.replace(/^https?:\/\//, "")}`, "regular", 7, 40, C.muted);
}

/**
 * T-CAP, after the T-GROUP logo: white paper, charcoal and steel instead of
 * red, cut corners and a honeycomb that echo its hexagon, a geometric sans for
 * the fixed words, and a hexagonal seal carrying the mark.
 */
async function drawTcap(ctx: Ctx) {
  const { pdf, page, d } = ctx;
  const T = {
    ink: rgb(0.149, 0.149, 0.149), // #262626
    logo: rgb(0.239, 0.239, 0.239), // #3D3D3D, the logo's grey
    steel: rgb(0.44, 0.45, 0.47), // #707378
    line: rgb(0.855, 0.859, 0.867), // #DADBDD
    comb: rgb(0.78, 0.785, 0.795),
  };
  const ink: Ink = { title: T.ink, text: T.logo, soft: T.steel, line: T.line };
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const art = groupLogo();
  const logo = await pdf.embedPng(art.logo);
  const mark = await pdf.embedPng(art.mark);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });

  // Honeycomb in two corners, kept clear of the text.
  const r = 15;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;
  for (const [cx, cy] of [
    [34, H - 34],
    [W - 34, 34],
  ] as const) {
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = cx + col * dx + (row % 2 ? dx / 2 : 0);
        const y = cy + row * dy;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist > 118 || x < 40 || x > W - 40 || y < 40 || y > H - 40) continue;
        const fade = 1 - dist / 118;
        page.drawSvgPath(hexPath(r - 1.5), { x, y, borderColor: T.comb, borderWidth: 0.7, borderOpacity: 0.25 + 0.55 * fade });
        if ((row * 7 + col * 3) % 5 === 0) page.drawSvgPath(hexPath(r - 4), { x, y, color: T.logo, opacity: 0.05 + 0.1 * fade, borderWidth: 0 });
      }
    }
  }

  // Frame: two chamfered borders and a small hexagon on each cut.
  chamfered(page, 18, 18, W - 18, H - 18, 26, T.logo, 1.4);
  chamfered(page, 26, 26, W - 26, H - 26, 22, T.line, 0.7);
  for (const [x, y] of [
    [18 + 13, 18 + 13],
    [W - 18 - 13, 18 + 13],
    [18 + 13, H - 18 - 13],
    [W - 18 - 13, H - 18 - 13],
  ] as const) {
    page.drawSvgPath(hexPath(5.5), { x, y, color: T.logo, borderWidth: 0 });
  }

  // The logo, centred.
  const lh = 44;
  const lw = (logo.width / logo.height) * lh;
  page.drawImage(logo, { x: W / 2 - lw / 2, y: H - 46 - lh, width: lw, height: lh });
  tracked(page, "T&C AI ACADEMY", sans, 6.5, H - 104, T.steel, 2.2);

  // Number and QR code at the right.
  const label = "CERTIFICATE NO.";
  page.drawText(label, { x: W - 60 - sans.widthOfTextAtSize(label, 6.5), y: H - 62, size: 6.5, font: sans, color: T.steel });
  page.drawText(d.code, { x: W - 60 - sansBold.widthOfTextAtSize(d.code, 9.5), y: H - 75, size: 9.5, font: sansBold, color: T.ink });
  await qrCode(ctx, d.verifyUrl, W - 60 - 44, H - 128, 44);
  const scan = "SCAN TO VERIFY";
  page.drawText(scan, { x: W - 60 - 22 - sans.widthOfTextAtSize(scan, 5.5) / 2, y: H - 137, size: 5.5, font: sans, color: T.steel });

  // Title in the logo's geometric spirit.
  tracked(page, "CERTIFICATE", sansBold, 32, H - 156, T.logo, 11);
  tracked(page, d.kind === "PROGRAM" ? "OF ACHIEVEMENT" : "OF COMPLETION", sans, 10.5, H - 176, T.steel, 6);
  page.drawLine({ start: { x: W / 2 - 120, y: H - 190 }, end: { x: W / 2 - 12, y: H - 190 }, thickness: 0.7, color: T.steel });
  page.drawLine({ start: { x: W / 2 + 12, y: H - 190 }, end: { x: W / 2 + 120, y: H - 190 }, thickness: 0.7, color: T.steel });
  page.drawSvgPath(hexPath(5.5), { x: W / 2, y: H - 190, borderColor: T.logo, borderWidth: 1 });
  page.drawSvgPath(hexPath(2.4), { x: W / 2, y: H - 190, color: T.logo, borderWidth: 0 });

  body(ctx, ink, H - 220, sans);

  // Signature and seal: one signatory on the left, the seal on the right; two
  // signatories either side of a centred seal.
  const sigY = 80;
  const count = d.signatories.filter((s) => s.name.trim()).length;
  const sealX = count >= 2 ? W / 2 : W / 2 + 190;
  signatures(ctx, ink, count >= 2 ? [W / 2 - 235, W / 2 + 235] : [W / 2 - 190], sigY);

  const sy = sigY + 24;
  page.drawSvgPath(hexPath(52), { x: sealX, y: sy, color: rgb(1, 1, 1), borderColor: T.logo, borderWidth: 2.2 });
  page.drawSvgPath(hexPath(45), { x: sealX, y: sy, borderColor: T.steel, borderWidth: 0.6 });
  const mh = 34;
  const mw = (mark.width / mark.height) * mh;
  page.drawImage(mark, { x: sealX - mw / 2, y: sy - 8, width: mw, height: mh });
  tracked(page, "CERTIFIED", sansBold, 6, sy - 17, T.logo, 2.4, sealX);
  tracked(page, String(d.issuedAt.getUTCFullYear()), sans, 6.5, sy - 27, T.steel, 1.5, sealX);

  const verify = `Verify this certificate at ${d.verifyUrl.replace(/^https?:\/\//, "")}`;
  const vw = sans.widthOfTextAtSize(verify, 6.8);
  page.drawText(verify, { x: W / 2 - vw / 2, y: 38, size: 6.8, font: sans, color: T.steel });
}

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
  const ctx: Ctx = { pdf, page, ts: new Typesetter(page, latin), latin, d };

  if (d.issuer.key === "TCAP") await drawTcap(ctx);
  else await drawTc(ctx);

  return pdf.save();
}

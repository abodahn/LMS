import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { branding } from "./branding";
import { getExecutiveStats } from "./analytics";
import { prisma } from "./db";
import { LEVEL_CODES } from "./constants";

const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  return rgb(
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255,
  );
};

/**
 * The leadership PDF. Every figure comes from the same analytics functions the
 * dashboard uses, so the document and the screen can never disagree.
 */
export async function renderExecutiveReport(): Promise<Uint8Array> {
  const [stats, opportunities] = await Promise.all([
    getExecutiveStats(),
    prisma.aiOpportunity.findMany({
      where: { status: { in: ["APPROVED", "IN_PROGRESS", "DELIVERED"] } },
      include: { department: true },
      orderBy: { annualHoursSaved: "desc" },
      take: 8,
    }),
  ]);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${branding.organizationName} — AI Capability Report`);
  pdf.setAuthor(branding.platformName);

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = hexToRgb(branding.colors.ink);
  const red = hexToRgb(branding.colors.red);
  const muted = hexToRgb(branding.colors.muted);
  const line = hexToRgb(branding.colors.line);

  const MARGIN = 56;
  let page = pdf.addPage([595, 842]); // A4 portrait
  let y = 842 - MARGIN;
  const width = 595;

  const newPage = () => {
    page = pdf.addPage([595, 842]);
    y = 842 - MARGIN;
    return page;
  };
  const room = (needed: number) => {
    if (y - needed < MARGIN + 30) newPage();
  };

  const text = (
    value: string,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; gap?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    room(size + 6);
    page.drawText(value, {
      x: opts.x ?? MARGIN,
      y,
      size,
      font: opts.font ?? regular,
      color: opts.color ?? ink,
    });
    y -= size + (opts.gap ?? 6);
  };

  const heading = (value: string) => {
    room(40);
    y -= 10;
    page.drawText(value, { x: MARGIN, y, size: 13, font: bold, color: ink });
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: width - MARGIN, y },
      color: line,
      thickness: 1,
    });
    y -= 14;
  };

  const bar = (label: string, value: number, max: number, suffix = "") => {
    room(22);
    const barX = MARGIN + 170;
    const barW = width - MARGIN - barX - 46;
    page.drawText(label, { x: MARGIN, y, size: 9.5, font: regular, color: ink });
    page.drawRectangle({ x: barX, y: y - 1, width: barW, height: 8, color: line });
    page.drawRectangle({
      x: barX,
      y: y - 1,
      width: Math.max(1, barW * Math.min(1, max === 0 ? 0 : value / max)),
      height: 8,
      color: red,
    });
    page.drawText(`${Math.round(value)}${suffix}`, {
      x: barX + barW + 8,
      y,
      size: 9.5,
      font: bold,
      color: ink,
    });
    y -= 18;
  };

  const table = (columns: { header: string; width: number }[], rows: string[][]) => {
    room(28);
    let x = MARGIN;
    for (const c of columns) {
      page.drawText(c.header.toUpperCase(), { x, y, size: 7.5, font: bold, color: muted });
      x += c.width;
    }
    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, color: line, thickness: 0.8 });
    y -= 12;

    for (const row of rows) {
      room(16);
      x = MARGIN;
      row.forEach((cell, i) => {
        const max = Math.floor(columns[i].width / 4.8);
        page.drawText(cell.length > max ? `${cell.slice(0, max - 1)}…` : cell, {
          x,
          y,
          size: 9,
          font: regular,
          color: ink,
        });
        x += columns[i].width;
      });
      y -= 15;
    }
    y -= 4;
  };

  // --- cover ---------------------------------------------------------------
  page.drawRectangle({ x: 0, y: 842 - 8, width, height: 8, color: red });
  text(branding.organizationName.toUpperCase(), { size: 9, font: bold, color: red, gap: 10 });
  text("AI Capability Report", { size: 24, font: bold, gap: 4 });
  text(
    `${branding.platformName} · ${new Date().toISOString().slice(0, 10)}`,
    { size: 10, color: muted, gap: 18 },
  );

  // --- executive summary ---------------------------------------------------
  heading("Executive summary");
  text(
    `${stats.totals.assessed} of ${stats.totals.employees} employees (${stats.totals.participation}%) have completed an AI assessment.`,
  );
  text(
    `${stats.totals.enrolled} are enrolled in learning, with ${stats.totals.completion}% of enrolments completed and ${stats.totals.learningHours} learning hours recorded.`,
  );
  text(
    `Average assessed capability has moved from ${stats.totals.averageBaseline} to ${stats.totals.averageCurrent} (${
      stats.totals.averageImprovement >= 0 ? "+" : ""
    }${stats.totals.averageImprovement} points) among employees who have re-assessed.`,
  );
  text(
    `${stats.totals.certificates} certificates issued. ${stats.totals.opportunities} AI opportunities identified from workplace capstones, with an estimated ${stats.totals.hoursSavedAnnually} hours a year of potential saving.`,
    { gap: 12 },
  );

  // --- readiness -----------------------------------------------------------
  heading(`AI Readiness Index — ${stats.readiness.score} / 100`);
  for (const c of stats.readiness.components) {
    bar(`${c.label} (${c.weight}%)`, c.value, 100, "%");
  }
  text(
    "Each component is scored 0–100 and weighted as shown. Skill improvement treats a 40-point gain as a full score.",
    { size: 8.5, color: muted, gap: 12 },
  );

  // --- participation -------------------------------------------------------
  heading("Participation and completion");
  bar("Assessment participation", stats.totals.participation, 100, "%");
  bar("Enrolment completion", stats.totals.completion, 100, "%");
  bar(
    "Employees enrolled",
    stats.totals.employees === 0 ? 0 : (stats.totals.enrolled / stats.totals.employees) * 100,
    100,
    "%",
  );
  y -= 6;

  // --- levels --------------------------------------------------------------
  heading("AI level distribution");
  const maxLevel = Math.max(1, ...Object.values(stats.distribution));
  const levelNames: Record<string, string> = {
    L0: "L0 — AI Explorer",
    L1: "L1 — AI Beginner",
    L2: "L2 — AI Practitioner",
    L3: "L3 — AI Power User",
    L4: "L4 — AI Builder",
  };
  for (const code of LEVEL_CODES) bar(levelNames[code], stats.distribution[code], maxLevel);
  y -= 6;

  // --- departments ---------------------------------------------------------
  heading("Department analysis");
  table(
    [
      { header: "Department", width: 130 },
      { header: "Headcount", width: 66 },
      { header: "Assessed", width: 62 },
      { header: "Completion", width: 72 },
      { header: "Hours", width: 52 },
      { header: "Avg score", width: 60 },
    ],
    stats.heatmap.map((d) => [
      d.name,
      String(d.headcount),
      String(d.assessed),
      `${d.completion}%`,
      String(d.hours),
      String(d.overall),
    ]),
  );

  // --- strengths and gaps --------------------------------------------------
  heading("Capability: strengths and gaps");
  text("Strongest competencies", { size: 10, font: bold, gap: 8 });
  for (const s of stats.strengths) bar(s.name, s.average, 100, "%");
  y -= 4;
  text("Weakest competencies", { size: 10, font: bold, gap: 8 });
  for (const g of stats.gaps) bar(g.name, g.average, 100, "%");
  y -= 6;

  // --- opportunities -------------------------------------------------------
  heading("Top opportunities identified by employees");
  if (opportunities.length === 0) {
    text("No approved AI opportunities yet. These come from approved workplace capstones.", { color: muted });
  } else {
    table(
      [
        { header: "Opportunity", width: 210 },
        { header: "Department", width: 110 },
        { header: "Impact", width: 66 },
        { header: "Hours/year", width: 70 },
      ],
      opportunities.map((o) => [
        o.title,
        o.department?.name ?? "—",
        o.impact,
        o.annualHoursSaved ? String(Math.round(o.annualHoursSaved)) : "—",
      ]),
    );
  }

  // --- risks and recommendations ------------------------------------------
  heading("Risks");
  const risks: string[] = [];
  if (stats.totals.participation < 60) {
    risks.push(
      `Assessment participation is ${stats.totals.participation}% — capability figures cover only part of the workforce.`,
    );
  }
  if (stats.totals.inactiveLearners > 0) {
    risks.push(
      `${stats.totals.inactiveLearners} employees have unfinished learning and no activity in the last 30 days.`,
    );
  }
  const responsible = stats.competencies.find((c) => c.key === "RESPONSIBLE_AI");
  if (responsible && responsible.average < 70) {
    risks.push(
      `Responsible AI averages ${responsible.average}% — the highest-consequence competency is not yet where it needs to be.`,
    );
  }
  const weakest = stats.gaps[0];
  if (weakest) risks.push(`${weakest.name} is the weakest competency company-wide at ${weakest.average}%.`);
  if (risks.length === 0) risks.push("No material risks identified from the current data.");
  for (const r of risks) text(`• ${r}`, { size: 9.5 });

  heading("Recommendations");
  const recommendations = [
    stats.totals.participation < 80
      ? "Close the assessment gap: every unassessed employee is invisible to the recommendation engine."
      : "Maintain assessment coverage as new employees join.",
    stats.totals.inactiveLearners > 0
      ? "Review inactive learners with their managers before extending due dates."
      : "Keep the current reminder cadence — inactivity is under control.",
    weakest
      ? `Prioritise ${weakest.name.toLowerCase()} in the next learning cycle and re-weight the recommendation engine towards it.`
      : "Re-verify the external catalog on the configured review cycle.",
    "Convert the highest-impact approved capstones into funded AI projects with a named owner.",
  ];
  for (const r of recommendations) text(`• ${r}`, { size: 9.5 });

  // --- footers -------------------------------------------------------------
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`${branding.organizationName} · ${branding.platformName}`, {
      x: MARGIN,
      y: 30,
      size: 7.5,
      font: regular,
      color: muted,
    });
    p.drawText(`${i + 1} / ${pages.length}`, {
      x: width - MARGIN - 24,
      y: 30,
      size: 7.5,
      font: regular,
      color: muted,
    });
    p.drawLine({ start: { x: MARGIN, y: 44 }, end: { x: width - MARGIN, y: 44 }, color: line, thickness: 0.6 });
  });

  return pdf.save();
}

export type ExecutiveReportPage = PDFPage;

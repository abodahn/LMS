import "server-only";
import ExcelJS from "exceljs";
import { branding } from "./branding";
import { parseCsv } from "./import/parse";

export type SheetColumn = { header: string; key: string; width?: number };

/** One workbook builder used by every export in the app. */
export async function buildWorkbook(
  sheets: { name: string; columns: SheetColumn[]; rows: Record<string, unknown>[] }[],
  meta?: { title?: string },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = branding.platformName;
  wb.company = branding.organizationName;
  wb.created = new Date();
  if (meta?.title) wb.title = meta.title;

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
    ws.addRows(sheet.rows);

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16181D" } };
    header.alignment = { vertical: "middle" };
    header.height = 22;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function toCsv(columns: SheetColumn[], rows: Record<string, unknown>[]): string {
  const escape = (value: unknown) => {
    const s = value == null ? "" : String(value);
    // Guard against spreadsheet formula injection on export.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [columns.map((c) => escape(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => escape(row[c.key])).join(","));
  return lines.join("\r\n");
}

export type ParsedRow = Record<string, string>;

/** Reads the first sheet of an .xlsx or a .csv into plain string records. */
export async function parseUploadedTable(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(buffer.toString("utf8"));
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };

  const headers: string[] = [];
  ws.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? "").trim();
  });

  const rows: ParsedRow[] = [];
  ws.eachRow((row, index) => {
    if (index === 1) return;
    const record: ParsedRow = {};
    headers.forEach((h, i) => {
      if (!h) return;
      const value = row.getCell(i + 1).value;
      record[h] = stringify(value);
    });
    if (Object.values(record).some((v) => v !== "")) rows.push(record);
  });

  return { headers: headers.filter(Boolean), rows };
}

/** ExcelJS cell values can be rich text, formulas or dates — flatten them all. */
function stringify(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const cell = value as Record<string, unknown>;
    if (typeof cell.text === "string") return cell.text.trim();
    if (Array.isArray(cell.richText)) {
      return cell.richText.map((r) => String((r as { text?: string }).text ?? "")).join("").trim();
    }
    if ("result" in cell) return stringify(cell.result);
    if ("hyperlink" in cell) return String(cell.hyperlink ?? "").trim();
    return "";
  }
  return String(value).trim();
}


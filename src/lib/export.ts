import "server-only";
import ExcelJS from "exceljs";

export type Row = Record<string, string | number>;

function csvCell(value: string | number) {
  let s = String(value ?? "");
  // Neutraliza fórmulas para evitar inyección CSV al abrir en Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: { key: string; header: string }[], rows: Row[]) {
  const lines = [columns.map((c) => csvCell(c.header)).join(";")];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c.key])).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}

export async function toXlsx(sheetName: string, columns: { key: string; header: string; width?: number }[], rows: Row[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Emaús Cristo Rey Cali";
  const ws = wb.addWorksheet(sheetName.slice(0, 31).replace(/[\\/?*[\]:]/g, " ") || "Asistentes");
  ws.columns = columns.map((c) => ({ key: c.key, header: c.header, width: c.width ?? 20 }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRows(rows);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

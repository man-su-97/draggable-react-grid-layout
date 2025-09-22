import ExcelJS from "exceljs";
import { Buffer } from "buffer";

export async function xlsxToStructured(base64File: string) {
  const raw = Buffer.from(base64File, "base64");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(raw.buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return { fields: [], rowCount: 0, preview: [], fullData: [] };

  // Find header row (first row with at least 2+ non-empty cells)
  let headerRowIndex = 1;
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i).values as unknown[];
    const nonEmpty = row.filter(
      (c) => c !== null && c !== undefined && c !== ""
    ).length;
    if (nonEmpty > 2) {
      headerRowIndex = i;
      break;
    }
  }

  // Extract header values
  const headerValues = sheet.getRow(headerRowIndex).values as unknown[];
  const fields = headerValues.slice(1).map((h) => String(h ?? ""));

  // Build preview (first 5 rows after header)
  const preview: Record<string, string | number | null>[] = [];
  for (
    let i = headerRowIndex + 1;
    i <= Math.min(sheet.rowCount, headerRowIndex + 5);
    i++
  ) {
    const rowValues = sheet.getRow(i).values as unknown[];
    const obj: Record<string, string | number | null> = {};
    fields.forEach((f, idx) => {
      const cell = rowValues[idx + 1];
      obj[f] =
        cell !== undefined && cell !== null
          ? typeof cell === "object"
            ? String(cell)
            : (cell as string | number)
          : null;
    });
    preview.push(obj);
  }

  // Build fullData (all rows after header)
  const fullData: Record<string, string | number | null>[] = [];
  for (let i = headerRowIndex + 1; i <= sheet.rowCount; i++) {
    const rowValues = sheet.getRow(i).values as unknown[];
    const obj: Record<string, string | number | null> = {};
    fields.forEach((f, idx) => {
      const cell = rowValues[idx + 1];
      obj[f] =
        cell !== undefined && cell !== null
          ? typeof cell === "object"
            ? String(cell)
            : (cell as string | number)
          : null;
    });
    fullData.push(obj);
  }

  return {
    fields,
    rowCount: sheet.rowCount - headerRowIndex,
    preview,
    fullData,
  };
}

export function csvToStructured(buffer: Buffer) {
  const text = buffer.toString("utf8").trim();
  const lines = text.split(/\r?\n/);
  if (lines.length === 0)
    return { fields: [], rowCount: 0, preview: [], fullData: [] };

  const fields = lines[0].split(",").map((f) => f.trim());

  // Build preview (first 5 rows)
  const preview = lines.slice(1, 6).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string | number | null> = {};
    fields.forEach((f, idx) => {
      obj[f] = values[idx] ?? null;
    });
    return obj;
  });

  // Build fullData (all rows)
  const fullData = lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string | number | null> = {};
    fields.forEach((f, idx) => {
      obj[f] = values[idx] ?? null;
    });
    return obj;
  });

  return {
    fields,
    rowCount: lines.length - 1,
    preview,
    fullData,
  };
}

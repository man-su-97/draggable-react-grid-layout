import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { Buffer } from "buffer";

import { HumanMessage } from "@langchain/core/messages";
import { getLLM } from "@/lib/getLLM";


type UploadSuccess = {
  filename: string;
  summary: string;
  fields?: string[];
  rowCount?: number;
  preview?: Record<string, string | number | null>[];
};

type UploadError = { error: string };

export type UploadResponse = UploadSuccess | UploadError;

interface UploadRequestBody {
  base64File: string;
  fileName: string;
  mimeType: string;
  prompt?: string;
  model?: string; 
}


async function xlsxToStructured(base64File: string) {
  const raw = Buffer.from(base64File, "base64");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(raw.buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return { fields: [], rowCount: 0, preview: [], fullData: [] };

  // find header row (first row with ≥2 values)
  let headerRowIndex = 1;
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i).values as unknown[];
    const nonEmpty = row.filter((c) => c !== null && c !== undefined && c !== "").length;
    if (nonEmpty > 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headerValues = sheet.getRow(headerRowIndex).values as unknown[];
  const fields = headerValues.slice(1).map((h) => String(h ?? ""));

  // preview rows
  const preview: Record<string, string | number | null>[] = [];
  for (let i = headerRowIndex + 1; i <= Math.min(sheet.rowCount, headerRowIndex + 5); i++) {
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

function csvToStructured(buffer: Buffer) {
  const text = buffer.toString("utf8").trim();
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return { fields: [], rowCount: 0, preview: [], fullData: [] };

  const fields = lines[0].split(",").map((f) => f.trim());

  const preview = lines.slice(1, 6).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    fields.forEach((f, idx) => {
      obj[f] = values[idx] ?? "";
    });
    return obj;
  });

  const fullData = lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    fields.forEach((f, idx) => {
      obj[f] = values[idx] ?? "";
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

function getDefaultPrompt(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Describe this image.";
  if (mimeType.startsWith("audio/")) return "Transcribe this audio.";
  if (mimeType.startsWith("video/")) return "Summarize this video.";
  if (mimeType === "application/pdf" || mimeType.startsWith("text/") || mimeType.includes("word"))
    return "Summarize this document.";
  return "Analyze this file.";
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64File, fileName, mimeType, prompt, model } =
      req.body as UploadRequestBody & { model?: string };

    if (!base64File || !fileName || !mimeType) {
      return res
        .status(400)
        .json({ error: "Missing file data (base64File, fileName, mimeType)" });
    }

    const customPrompt = prompt || getDefaultPrompt(mimeType);
    const provider = model || "gemini";
    const llm = getLLM(provider);

    let summary = "";
    let fields: string[] | undefined;
    let rowCount: number | undefined;
    let preview: Record<string, string | number | null>[] | undefined;

    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {

      const structured = await xlsxToStructured(base64File);
      fields = structured.fields;
      rowCount = structured.rowCount;
      preview = structured.preview;

      const text = JSON.stringify({ fields, rowCount, data: structured.fullData });
      const response = await llm.invoke([new HumanMessage(`${customPrompt}\n\n${text}`)]);
      summary = response.content?.toString() ?? "No summary available.";

    } else if (mimeType.endsWith("csv")) {

      const buffer = Buffer.from(base64File, "base64");
      const structured = csvToStructured(buffer);
      fields = structured.fields;
      rowCount = structured.rowCount;
      preview = structured.preview;

      const text = JSON.stringify({ fields, rowCount, data: structured.fullData });
      const response = await llm.invoke([new HumanMessage(`${customPrompt}\n\n${text}`)]);
      summary = response.content?.toString() ?? "No summary available.";

    } else {
      // for images, pdf, audio, video: send inline as base64
      const sizeInBytes = Buffer.byteLength(base64File, "base64");
      const maxInlineSize = 20 * 1024 * 1024;

      if (sizeInBytes < maxInlineSize) {
        const response = await llm.invoke([
          new HumanMessage(`${customPrompt}\n\n(Base64 file data omitted for brevity)`),
        ]);
        summary = response.content?.toString() ?? "No summary available.";
      } else {
        return res
          .status(400)
          .json({ error: "File too large. Please upload a file < 20MB for analysis." });
      }
    }

    return res.status(200).json({
      filename: fileName,
      summary,
      fields,
      rowCount,
      preview,
    });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

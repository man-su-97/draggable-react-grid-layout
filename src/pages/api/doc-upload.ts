import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI, createPartFromUri } from "@google/genai";
import ExcelJS from "exceljs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type UploadSuccess = {
	filename: string;
	summary: string;
	fields?: string[];
	rowCount?: number;
	preview?: Record<string, string | number | null>[];
};
type UploadError = { error: string };
export type UploadResponse = UploadSuccess | UploadError;

const sessionStore: Record<
	string,
	{
		fields: string[];
		rowCount: number;
		preview: Record<string, string | number | null>[];
	}
> = {};

interface UploadRequestBody {
	base64File: string;
	fileName: string;
	mimeType: string;
	prompt?: string;
}

async function xlsxToStructured(base64File: string) {
	const raw = Buffer.from(base64File, "base64");
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(raw.buffer);
	// await workbook.xlsx.load(new Uint8Array(raw))

	const sheet = workbook.worksheets[0];
	if (!sheet) return { fields: [], rowCount: 0, preview: [], fullData: [] };

	//   const rows = sheet.getSheetValues() as unknown[];
	//   const headerRow = Array.isArray(rows[1]) ? (rows[1] as unknown[]).slice(1) : [];
	//   const fields: string[] = headerRow.map((h) =>
	//     h !== null && h !== undefined ? String(h) : ""
	//   );

	let headerRowIndex = 1;
	for (let i = 1; i <= sheet.rowCount; i++) {
		const row = sheet.getRow(i).values as unknown[];
		const nonEmpty = row.filter(
			(c) => c !== null && c !== undefined && c !== ""
		).length;
		if (nonEmpty > 2) {
			// at least 2+ columns filled
			headerRowIndex = i;
			break;
		}
	}

	const headerValues = sheet.getRow(headerRowIndex).values as unknown[];
	const fields = headerValues.slice(1).map((h) => String(h ?? ""));

	//   const preview: Record<string, string | number | null>[] = [];
	//   for (let i = 2; i < Math.min(rows.length, 7); i++) {
	//     const row = Array.isArray(rows[i]) ? (rows[i] as unknown[]) : [];
	//     const obj: Record<string, string | number | null> = {};
	//     fields.forEach((f, idx) => {
	//       const cell = row[idx + 1];
	//       obj[f] =
	//         cell !== undefined && cell !== null
	//           ? typeof cell === "object"
	//             ? String(cell)
	//             : (cell as string | number)
	//           : null;
	//     });
	//     preview.push(obj);
	//   }

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

// function csvToStructured(buffer: Buffer) {
// 	const text = buffer.toString("utf8").trim();
// 	const lines = text.split(/\r?\n/);
// 	if (lines.length === 0) return { fields: [], rowCount: 0, preview: [] };

// 	const fields = lines[0].split(",").map((f) => f.trim());
// 	const preview = lines.slice(1, 6).map((line) => {
// 		const values = line.split(",");
// 		const obj: Record<string, string> = {};
// 		fields.forEach((f, idx) => {
// 			obj[f] = values[idx] ?? "";
// 		});
// 		return obj;
// 	});

// 	return {
// 		fields,
// 		rowCount: lines.length - 1,
// 		preview,
// 	};
// }

function csvToStructured(buffer: Buffer) {
	const text = buffer.toString("utf8").trim();
	const lines = text.split(/\r?\n/);
	if (lines.length === 0)
		return { fields: [], rowCount: 0, preview: [], fullData: [] };

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

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<UploadResponse>
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { base64File, fileName, mimeType, prompt } =
			req.body as UploadRequestBody;

		if (!base64File || !fileName || !mimeType) {
			return res
				.status(400)
				.json({ error: "Missing file data (base64File, fileName, mimeType)" });
		}

		const customPrompt = prompt || getDefaultPrompt(mimeType);

		let summary = "";
		let fields: string[] | undefined;
		let rowCount: number | undefined;
		let preview: Record<string, string | number | null>[] | undefined;

		if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
			const structured = await xlsxToStructured(base64File);
			fields = structured.fields;
			rowCount = structured.rowCount;
			preview = structured.preview;

			//gemini call with data
			const text = JSON.stringify({
				fields,
				rowCount,
				data: structured.fullData,
			});
			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: [{ text: `${customPrompt}\n\n${text}` }],
			});
			summary = response.text ?? "";
		} else if (mimeType.endsWith("csv")) {
			const buffer = Buffer.from(base64File, "base64");
			const structured = csvToStructured(buffer);
			fields = structured.fields;
			rowCount = structured.rowCount;
			preview = structured.preview;

			const text = JSON.stringify({
				fields,
				rowCount,
				data: structured.fullData,
			});
			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: [{ text: `${customPrompt}\n\n${text}` }],
			});
			summary = response.text ?? "";
		} else {
			const contents: Array<
				| { text: string }
				| { inlineData: { mimeType: string; data: string } }
				| ReturnType<typeof createPartFromUri>
			> = [];

			const sizeInBytes = Buffer.byteLength(base64File, "base64");
			const maxInlineSize = 20 * 1024 * 1024;

			if (sizeInBytes < maxInlineSize) {
				contents.push(
					{ inlineData: { mimeType, data: base64File } },
					{ text: customPrompt }
				);
			} else {
				const buffer = Buffer.from(base64File, "base64");
				const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });

				const uploaded = await ai.files.upload({
					file: blob,
					config: { displayName: fileName, mimeType },
				});

				if (!uploaded.name) {
					return res
						.status(500)
						.json({ error: "Upload failed: missing file name" });
				}
				if (!uploaded.uri || !uploaded.mimeType) {
					return res
						.status(500)
						.json({ error: "Upload failed: missing URI or mimeType" });
				}

				let getFile = await ai.files.get({ name: uploaded.name });
				while (getFile.state === "PROCESSING") {
					await new Promise((r) => setTimeout(r, 3000));
					getFile = await ai.files.get({ name: uploaded.name });
				}

				if (getFile.state === "FAILED") {
					return res.status(500).json({ error: "File processing failed" });
				}

				contents.push(createPartFromUri(uploaded.uri, uploaded.mimeType), {
					text: customPrompt,
				});
			}

			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents,
			});
			summary = response.text ?? "";
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

function getDefaultPrompt(mimeType: string): string {
	if (mimeType.startsWith("image/")) return "Describe this image.";
	if (mimeType.startsWith("audio/")) return "Transcribe this audio.";
	if (mimeType.startsWith("video/")) return "Summarize this video.";
	if (
		mimeType === "application/pdf" ||
		mimeType.startsWith("text/") ||
		mimeType.includes("word")
	)
		return "Summarize this document.";
	return "Analyze this file.";
}

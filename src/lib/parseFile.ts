import fs from "fs";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";

export async function parseFile(
	filePath: string
): Promise<Record<string, string | number | boolean | null>[]> {
	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const buffer = fs.readFileSync(filePath);
	const lower = filePath.toLowerCase();

	if (lower.endsWith(".xlsx")) {
		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		return XLSX.utils.sheet_to_json(sheet) as Record<
			string,
			string | number | boolean | null
		>[];
	}

	if (lower.endsWith(".csv")) {
		const content = buffer.toString("utf-8");

		// Candidate delimiters
		const delimiters = [",", ";", "\t"];
		let bestDelimiter = ",";
		let bestColumns = 0;

		// Look at first non-empty line
		const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
		if (lines.length > 0) {
			const headerLine = lines[0];
			for (const d of delimiters) {
				const count = headerLine.split(d).length;
				if (count > bestColumns) {
					bestColumns = count;
					bestDelimiter = d;
				}
			}
		}

		// Parse with detected delimiter
		return parse(content, {
			columns: true,
			skip_empty_lines: true,
			delimiter: bestDelimiter,
		}) as Record<string, string | number | boolean | null>[];
	}

	throw new Error(`Unsupported file type: ${filePath}`);
}

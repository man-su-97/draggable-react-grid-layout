import type { NextApiRequest, NextApiResponse } from "next";
import {
	GoogleGenerativeAI,
	SchemaType,
	GenerativeModel,
	GenerateContentResult,
	FunctionCall,
	FunctionDeclaration,
	FunctionDeclarationSchema,
} from "@google/generative-ai";
import { getPrompt } from "@/lib/userPrompt";
import { xlsxToStructured, csvToStructured } from "@/lib/docParser";
import { Buffer } from "buffer";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// In-memory session store for uploaded documents
const sessionStore: Record<
	string,
	{
		fields: string[];
		rowCount: number;
		preview: Record<string, string | number | null>[];
		fullData: Record<string, string | number | null>[];
	}
> = {};

type ChartArgs = {
	title: string;
	data: Array<{ label: string; value: number }>;
	source?: "document" | "gemini" | "compare";
	filename?: string;
	groupBy?: string;
	metric?: string;
	aggregation?: "count" | "sum" | "avg";
};

type MapArgs = {
	locations: Array<{ name: string; lat: number; lon: number; color?: string }>;
};
type ImageArgs = { prompt: string };
type VideoArgs = { query: string };
type WeatherArgs = { city?: string; lat?: number; lon?: number };
type DocumentArgs = { filename: string; question?: string };

type WidgetResponse =
	| {
			type: "line" | "bar" | "pie";
			title: string;
			data: ChartArgs["data"];
			source: "document" | "gemini";
	  }
	| { type: "map"; data: MapArgs["locations"] }
	| { type: "image"; src: string }
	| { type: "video"; src: string }
	| {
			type: "weather";
			location?: string;
			coordinates: [number, number] | "current";
	  }
	| {
			type: "document";
			filename: string;
			fields: string[];
			rowCount: number;
			preview: Record<string, string | number | null>[];
			summary?: string;
	  }
	| { error: string };

const widgetFunctions: FunctionDeclaration[] = [
	{
		name: "get_weather",
		description: "Prepare a weather widget.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				city: { type: SchemaType.STRING },
				lat: { type: SchemaType.NUMBER },
				lon: { type: SchemaType.NUMBER },
			},
		},
	},
	{
		name: "create_line_chart",
		description: "Create a line chart (supports gemini or document data).",
		parameters: chartParams(),
	},
	{
		name: "create_bar_chart",
		description: "Create a bar chart (supports gemini or document data).",
		parameters: chartParams(),
	},
	{
		name: "create_pie_chart",
		description: "Create a pie chart (supports gemini or document data).",
		parameters: chartParams(),
	},
	{
		name: "create_map",
		description: "Render a map with pins.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				locations: {
					type: SchemaType.ARRAY,
					items: {
						type: SchemaType.OBJECT,
						properties: {
							name: { type: SchemaType.STRING },
							lat: { type: SchemaType.NUMBER },
							lon: { type: SchemaType.NUMBER },
							color: { type: SchemaType.STRING },
						},
					},
				},
			},
		},
	},
	{
		name: "create_image",
		description: "Generate an image from a prompt.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { prompt: { type: SchemaType.STRING } },
		},
	},
	{
		name: "create_video",
		description: "Generate a video from a query.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { query: { type: SchemaType.STRING } },
		},
	},
	{
		name: "analyze_document",
		description: "Analyze an uploaded document.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				filename: { type: SchemaType.STRING },
				question: { type: SchemaType.STRING },
			},
		},
	},
];

function chartParams(): FunctionDeclarationSchema {
	return {
		type: SchemaType.OBJECT,
		properties: {
			title: { type: SchemaType.STRING },
			data: {
				type: SchemaType.ARRAY,
				items: {
					type: SchemaType.OBJECT,
					properties: {
						label: { type: SchemaType.STRING },
						value: { type: SchemaType.NUMBER },
					},
				},
			},
			source: { type: SchemaType.STRING },
			filename: { type: SchemaType.STRING },
			groupBy: { type: SchemaType.STRING },
			metric: { type: SchemaType.STRING },
			aggregation: { type: SchemaType.STRING },
		},
	};
}

function aggregateDocData(
	doc: { fields: string[]; fullData: Record<string, string | number | null>[] },
	groupBy?: string,
	metric?: string,
	aggregation: "count" | "sum" | "avg" = "count"
) {
	const groupField =
		groupBy && doc.fields.includes(groupBy) ? groupBy : doc.fields[0];
	const metricField = metric && doc.fields.includes(metric) ? metric : null;

	const groups: Record<string, number[]> = {};
	doc.fullData.forEach((row) => {
		const key = String(row[groupField] ?? "Unknown");
		const val = metricField ? Number(row[metricField]) : 1;
		if (!groups[key]) groups[key] = [];
		if (!isNaN(val)) groups[key].push(val);
	});

	return Object.entries(groups).map(([label, values]) => {
		if (aggregation === "sum")
			return { label, value: values.reduce((a, b) => a + b, 0) };
		if (aggregation === "avg")
			return {
				label,
				value: values.reduce((a, b) => a + b, 0) / values.length,
			};
		return { label, value: values.length };
	});
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<WidgetResponse | WidgetResponse[]>
) {
	if (req.method !== "POST")
		return res.status(405).json({ error: "Method not allowed" });

	try {
		const { text, base64File, fileName, mimeType } = req.body as {
			text: string;
			base64File?: string;
			fileName?: string;
			mimeType?: string;
		};

		if (base64File && fileName && mimeType) {
			let structured;
			if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
				structured = await xlsxToStructured(base64File);
			} else if (mimeType.endsWith("csv")) {
				structured = csvToStructured(Buffer.from(base64File, "base64"));
			} else {
				structured = { fields: [], rowCount: 0, preview: [], fullData: [] };
			}
			sessionStore[fileName] = structured;
		}

		let userPrompt = getPrompt(text);
		const docs = Object.keys(sessionStore);
		if (docs.length > 0) {
			userPrompt += `\n\nNote: User has uploaded these documents: ${docs.join(
				", "
			)}. Use source='document' with filename if the question relates to them.`;
		}

		const model: GenerativeModel = ai.getGenerativeModel({
			model: "gemini-2.5-flash",
			tools: [{ functionDeclarations: widgetFunctions }],
		});

		const response: GenerateContentResult = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: userPrompt }] }],
		});

		const fnCalls: FunctionCall[] = response.response.functionCalls?.() ?? [];
		const fnCall = fnCalls[0];
		if (!fnCall)
			return res.status(400).json({ error: "No function call from Gemini" });
		console.log("Response from gemini function call -", fnCall);


		// -------------------------------
		// Handle function calls
		// -------------------------------
		if (fnCall.name.startsWith("create_")) {
			const args = fnCall.args as ChartArgs;
			const type: "line" | "bar" | "pie" = fnCall.name.includes("line")
				? "line"
				: fnCall.name.includes("bar")
				? "bar"
				: "pie";

			if (
				args.source === "compare" &&
				args.filename &&
				sessionStore[args.filename]
			) {
				const doc = sessionStore[args.filename];
				const dataFromDoc = aggregateDocData(
					doc,
					args.groupBy,
					args.metric,
					args.aggregation
				);
				return res.status(200).json([
					{
						type,
						title: args.title || `Chart from ${args.filename}`,
						data: dataFromDoc,
						source: "document",
					},
					{
						type,
						title: args.title || "Chart from Gemini",
						data: args.data,
						source: "gemini",
					},
				]);
			}

			if (
				args.source === "document" &&
				args.filename &&
				sessionStore[args.filename]
			) {
				const doc = sessionStore[args.filename];
				const data = aggregateDocData(
					doc,
					args.groupBy,
					args.metric,
					args.aggregation
				);
				return res
					.status(200)
					.json({
						type,
						title: args.title || `Chart of ${args.groupBy || doc.fields[0]}`,
						data,
						source: "document",
					});
			}

			return res
				.status(200)
				.json({ type, title: args.title, data: args.data, source: "gemini" });
		}

		if (fnCall.name === "get_weather") {
			const args = fnCall.args as WeatherArgs;
			if (typeof args.lat === "number" && typeof args.lon === "number") {
				return res
					.status(200)
					.json({ type: "weather", coordinates: [args.lat, args.lon] });
			} else if (args.city) {
				return res
					.status(200)
					.json({ type: "weather", location: args.city, coordinates: [0, 0] });
			} else {
				return res
					.status(200)
					.json({ type: "weather", coordinates: "current" });
			}
		}

		if (fnCall.name === "create_map") {
			const args = fnCall.args as MapArgs;
			return res.status(200).json({ type: "map", data: args.locations });
		}

		if (fnCall.name === "create_image") {
			const args = fnCall.args as ImageArgs;
			return res.status(200).json({
				type: "image",
				src: `https://picsum.photos/seed/${encodeURIComponent(
					args.prompt || "default"
				)}-${Math.floor(Math.random() * 1000)}/800/600`,
			});
		}

		if (fnCall.name === "create_video") {
			const args = fnCall.args as VideoArgs;
			return res.status(200).json({
				type: "video",
				src:
					args.query ||
					"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
			});
		}

		if (fnCall.name === "analyze_document") {
			const args = fnCall.args as DocumentArgs;
			const doc = args.filename ? sessionStore[args.filename] : null;
			if (!doc) return res.status(400).json({ error: "Document not found" });

			let summary = "Document uploaded successfully";
			if (args.question) {
				const qaPrompt = `You are analyzing "${args.filename}". Question: ${
					args.question
				}\nFields: ${JSON.stringify(doc.fields)}\nPreview: ${JSON.stringify(
					doc.preview
				)}`;
				const qaModel = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
				const qaResponse = await qaModel.generateContent({
					contents: [{ role: "user", parts: [{ text: qaPrompt }] }],
				});
				summary =
					qaResponse.response.text?.() ??
					qaResponse.response.candidates?.[0]?.content?.parts?.[0]?.text ??
					"No answer found.";
			}

			return res.status(200).json({
				type: "document",
				filename: args.filename,
				fields: doc.fields,
				rowCount: doc.rowCount,
				preview: doc.preview,
				summary,
			});
		}

		return res.status(400).json({ error: "Unsupported function call" });
	} catch (err) {
		console.error("Gemini error", err);
		return res.status(500).json({ error: (err as Error).message });
	}
}

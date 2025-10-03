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
import { Buffer } from "buffer";

import { getPrompt } from "@/lib/userPrompt";
import { xlsxToStructured, csvToStructured } from "@/lib/docParser";
import {
	WidgetResponse,
	ChartData,
	MapData,
	DocumentPreviewRow,
} from "@/types/types";
import {
	ChatMessage,
	ConversationId,
	getHistory,
	appendHistory,
} from "@/lib/chatHistory";

// ----------------------------- Types ----------------------------------------

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type StructuredDoc = {
	fields: string[];
	rowCount: number;
	preview: DocumentPreviewRow[];
	fullData: DocumentPreviewRow[];
};

const sessionStore: Record<ConversationId, Record<string, StructuredDoc>> = {};

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

type WeatherArgs = {
	city?: string;
	lat?: number;
	lon?: number;
	coordinates?: "current";
	date?: string;
};

type DocumentArgs = { filename: string; question?: string };

// ----------------------------- Utilities ------------------------------------

export function makeId(type: string) {
	return `${type}-${Date.now()}`;
}

function normalizeHistory(history: ChatMessage[]) {
	return history.map((msg) => ({
		role: msg.role === "model" ? "model" : "user",
		parts: msg.parts.map((p) => ({ text: p.text })),
	}));
}

function bundleChat(reply: string | undefined, widget?: WidgetResponse) {
	const chat: WidgetResponse = {
		id: makeId("chat"),
		type: "chat",
		layout: { i: "", x: 0, y: 0, w: 4, h: 3 },
		payload: {
			reply: reply && reply.trim() ? reply : "I didn’t quite get that.",
		},
	};
	return widget ? [chat, widget] : chat;
}

const DISTINCT_COLORS = ["red", "blue", "green", "orange", "purple"] as const;

function ensureHttpsMp4(urlOrQuery: string): { src: string; title: string } {
	const fallback =
		"https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";
	try {
		const u = new URL(urlOrQuery);
		if (u.protocol === "https:" && u.pathname.toLowerCase().endsWith(".mp4")) {
			return {
				src: u.toString(),
				title: u.pathname.split("/").pop() || "Video",
			};
		}
		return { src: fallback, title: "Video" };
	} catch {
		return { src: fallback, title: urlOrQuery || "Video" };
	}
}

function sanitizeChartData(data: ChartData[]): ChartData[] {
	return (data || [])
		.filter((d) => Number.isFinite(d.value))
		.map((d) => ({
			label: String(d.label).slice(0, 80),
			value: Math.max(Math.min(d.value, 1e12), -1e12),
		}));
}

function assignDistinctColors(locs: MapArgs["locations"]): MapData[] {
	return (locs || [])
		.filter(
			(l) =>
				Number.isFinite(l.lat) &&
				Number.isFinite(l.lon) &&
				l.lat >= -90 &&
				l.lat <= 90 &&
				l.lon >= -180 &&
				l.lon <= 180
		)
		.map((l, i) => ({
			name: l.name,
			coordinates: [l.lat, l.lon],
			color: l.color || DISTINCT_COLORS[i % DISTINCT_COLORS.length],
		}));
}

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
					required: ["label", "value"],
				},
			},
			source: { type: SchemaType.STRING },
			filename: { type: SchemaType.STRING },
			groupBy: { type: SchemaType.STRING },
			metric: { type: SchemaType.STRING },
			aggregation: { type: SchemaType.STRING },
		},
		required: ["title"],
	};
}

const widgetFunctions: FunctionDeclaration[] = [
	{
		name: "get_weather",
		description: "Weather widget",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				city: { type: SchemaType.STRING },
				lat: { type: SchemaType.NUMBER },
				lon: { type: SchemaType.NUMBER },
				coordinates: { type: SchemaType.STRING },
				date: { type: SchemaType.STRING },
			},
		},
	},
	{
		name: "create_line_chart",
		description: "Line chart",
		parameters: chartParams(),
	},
	{
		name: "create_bar_chart",
		description: "Bar chart",
		parameters: chartParams(),
	},
	{
		name: "create_pie_chart",
		description: "Pie chart",
		parameters: chartParams(),
	},
	{
		name: "create_map",
		description: "Map widget",
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
						required: ["name", "lat", "lon"],
					},
				},
			},
			required: ["locations"],
		},
	},
	{
		name: "create_image",
		description: "Image",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { prompt: { type: SchemaType.STRING } },
			required: ["prompt"],
		},
	},
	{
		name: "create_video",
		description: "Video",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { query: { type: SchemaType.STRING } },
			required: ["query"],
		},
	},
	{
		name: "analyze_document",
		description: "Document analysis",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				filename: { type: SchemaType.STRING },
				question: { type: SchemaType.STRING },
			},
			required: ["filename"],
		},
	},
	{
		name: "create_camera",
		description: "Camera feed",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				streamUrl: { type: SchemaType.STRING },
				title: { type: SchemaType.STRING },
			},
			required: ["streamUrl"],
		},
	},
];

// ----------------------------- Aggregation -----------------------------------

function aggregateDocData(
	doc: StructuredDoc,
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
		const raw = metricField ? Number(row[metricField]) : 1;
		const val = Number.isFinite(raw) ? raw : 0;
		if (!groups[key]) groups[key] = [];
		groups[key].push(val);
	});

	return Object.entries(groups).map(([label, values]) => {
		if (aggregation === "sum")
			return { label, value: values.reduce((a, b) => a + b, 0) };
		if (aggregation === "avg")
			return {
				label,
				value: values.reduce((a, b) => a + b, 0) / (values.length || 1),
			};
		return { label, value: values.length };
	});
}

// -------------------------------- Handler ------------------------------------

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		WidgetResponse | WidgetResponse[] | { history: ChatMessage[] }
	>
) {
	// --- GET: Return history
	if (req.method === "GET") {
		const conversationId = req.query.conversationId as
			| ConversationId
			| undefined;
		if (!conversationId) {
			return res.status(400).json({
				id: makeId("error"),
				type: "error",
				layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
				payload: { message: "Missing conversationId", code: "MISSING_ID" },
			});
		}
		return res.status(200).json({ history: getHistory(conversationId) });
	}

	if (req.method !== "POST") {
		return res.status(405).json({
			id: makeId("error"),
			type: "error",
			layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
			payload: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
		});
	}

	try {
		const { text, base64File, fileName, mimeType, conversationId } =
			req.body as {
				text: string;
				base64File?: string;
				fileName?: string;
				mimeType?: string;
				conversationId: ConversationId;
			};

		if (!conversationId) {
			return res.status(400).json({
				id: makeId("error"),
				type: "error",
				layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
				payload: { message: "conversationId is required", code: "MISSING_ID" },
			});
		}

		// Ensure conversation storage exists
		if (!sessionStore[conversationId]) {
			sessionStore[conversationId] = {};
		}

		// Handle uploaded docs
		if (base64File && fileName && mimeType) {
			let structured: StructuredDoc;
			if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
				structured = await xlsxToStructured(base64File);
			} else if (mimeType.endsWith("csv")) {
				structured = csvToStructured(Buffer.from(base64File, "base64"));
			} else {
				structured = { fields: [], rowCount: 0, preview: [], fullData: [] };
			}
			// sessionStore[conversationId][fileName] = structured;
			sessionStore[conversationId] = {
				[fileName]: structured,
			};
		}

		// Prompt + doc hint
		let userPrompt = getPrompt(text, !!fileName, fileName);
		const docs = Object.keys(sessionStore[conversationId] || {});
		if (docs.length > 0) {
			userPrompt += `\n\nNote: Uploaded docs: ${docs.join(
				", "
			)}. Use source="document" with filename for questions.`;
		}

		const model: GenerativeModel = ai.getGenerativeModel({
			model: "gemini-2.5-flash",
			tools: [{ functionDeclarations: widgetFunctions }],
		});

		const history = getHistory(conversationId);
		const safeHistory = normalizeHistory(history);
		const response: GenerateContentResult = await model.generateContent({
			contents: [
				...safeHistory,
				{ role: "user", parts: [{ text: userPrompt }] },
			],
		});

		const replyText = response.response.text?.();
		const fnCalls: FunctionCall[] = response.response.functionCalls?.() ?? [];
		const fnCall = fnCalls[0];

		// --- Plain chat (no tool call)
		if (!fnCall) {
			const finalReply = replyText ?? "Here’s my reply based on your request.";
			const payload = bundleChat(finalReply);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{ role: "model", parts: [{ text: finalReply }], timestamp: Date.now() },
			]);
			return res.status(200).json(payload);
		}

		// -------------------- analyze document ----------------------
		if (fnCall.name === "analyze_document") {
			const args = (fnCall.args ?? {}) as DocumentArgs;
			const id = makeId("doc");

			const doc: StructuredDoc | undefined = args.filename
				? sessionStore[conversationId]?.[args.filename]
				: undefined;

			if (!doc) {
				return res.status(400).json({
					id: makeId("error"),
					type: "error",
					layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
					payload: { message: "Document not found", code: "DOC_NOT_FOUND" },
				});
			}

			let summary: string = "Document uploaded successfully.";
			if (args.question && args.question.trim().length > 0) {
				const qaPrompt = `You are analyzing "${args.filename}".
Question: ${args.question}
Fields: ${JSON.stringify(doc.fields)}
Preview (first rows): ${JSON.stringify(doc.preview.slice(0, 10))}`;

				const qaModel: GenerativeModel = ai.getGenerativeModel({
					model: "gemini-2.5-flash",
				});
				const qaResponse: GenerateContentResult = await qaModel.generateContent(
					{
						contents: [{ role: "user", parts: [{ text: qaPrompt }] }],
					}
				);

				summary =
					qaResponse.response.text?.() ??
					qaResponse.response.candidates?.[0]?.content?.parts?.[0]?.text ??
					"No answer found.";
			}

			const widget: WidgetResponse = {
				id,
				type: "document",
				layout: { i: id, x: 0, y: 0, w: 6, h: 8 },
				payload: {
					filename: args.filename!,
					fields: doc.fields,
					rowCount: doc.rowCount,
					preview: doc.preview,
					summary,
				},
			};

			const out = bundleChat(summary, widget);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{ role: "model", parts: [{ text: summary }], timestamp: Date.now() },
			]);
			return res.status(200).json(out);
		}

		// -------------------- map -----------------------------------
		if (fnCall.name === "create_map") {
			const args = (fnCall.args ?? {}) as MapArgs;
			const id = makeId("map");
			const data = assignDistinctColors(args.locations || []);
			if (data.length < 2) {
				return res.status(400).json({
					id: makeId("error"),
					type: "error",
					layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
					payload: {
						message: "Map requires at least 2 valid locations",
						code: "MAP_TOO_FEW_LOCATIONS",
					},
				});
			}
			const widget: WidgetResponse = {
				id,
				type: "map",
				layout: { i: id, x: 0, y: 0, w: 6, h: 7 },
				payload: { title: "Map", data },
			};
			const out = bundleChat(replyText ?? "Here’s the map.", widget);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{
					role: "model",
					parts: [{ text: replyText ?? "" }],
					timestamp: Date.now(),
				},
			]);
			return res.status(200).json(out);
		}

		// -------------------- image ---------------------------------
		if (fnCall.name === "create_image") {
			const args = (fnCall.args ?? {}) as ImageArgs;
			const id = makeId("image");
			const seed = encodeURIComponent(args.prompt || "default");
			const src = `https://picsum.photos/seed/${seed}-${Math.floor(
				Math.random() * 1000
			)}/800/600`;
			const widget: WidgetResponse = {
				id,
				type: "image",
				layout: { i: id, x: 0, y: 0, w: 5, h: 6 },
				payload: { src, title: args.prompt?.slice(0, 80) || "Generated Image" },
			};
			const out = bundleChat(replyText ?? "Here’s your image.", widget);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{
					role: "model",
					parts: [{ text: replyText ?? "" }],
					timestamp: Date.now(),
				},
			]);
			return res.status(200).json(out);
		}

		// -------------------- video ---------------------------------
		if (fnCall.name === "create_video") {
			const args = (fnCall.args ?? {}) as VideoArgs;
			const id = makeId("video");
			const { src, title } = ensureHttpsMp4(args.query || "");
			const widget: WidgetResponse = {
				id,
				type: "video",
				layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
				payload: { src, title },
			};
			const out = bundleChat(replyText ?? "Here’s your video.", widget);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{
					role: "model",
					parts: [{ text: replyText ?? "" }],
					timestamp: Date.now(),
				},
			]);
			return res.status(200).json(out);
		}

		// -------------------- camera --------------------------------
		if (fnCall.name === "create_camera") {
			const args = (fnCall.args ?? {}) as { streamUrl: string; title?: string };
			const id = makeId("camera");
			const widget: WidgetResponse = {
				id,
				type: "camera",
				layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
				payload: {
					streamUrl: args.streamUrl,
					title: args.title || "Camera Feed",
				},
			};

			const out = bundleChat(replyText ?? "Camera feed attached.", widget);
			appendHistory(conversationId, [
				{ role: "user", parts: [{ text }], timestamp: Date.now() },
				{
					role: "model",
					parts: [{ text: replyText ?? "" }],
					timestamp: Date.now(),
				},
			]);
			return res.status(200).json(out);
		}

		return res.status(400).json({
			id: makeId("error"),
			type: "error",
			layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
			payload: { message: "Unsupported function call", code: "UNSUPPORTED_FN" },
		});
	} catch (err) {
		console.error("Gemini error", err);
		return res.status(500).json({
			id: makeId("error"),
			type: "error",
			layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
			payload: { message: (err as Error).message, code: "SERVER_ERROR" },
		});
	}
}




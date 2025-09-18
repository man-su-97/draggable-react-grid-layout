import type { NextApiRequest, NextApiResponse } from "next";
import {
	GoogleGenerativeAI,
	SchemaType,
	GenerativeModel,
	GenerateContentResult,
	FunctionDeclaration,
	FunctionCall,
} from "@google/generative-ai";
import { getPrompt } from "@/lib/userPrompt";
// import { parseFile } from "@/lib/parseFile";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type ChartArgs = {
	title: string;
	data: Array<{ label: string; value: number }>;
};
type MapArgs = {
	locations: Array<{ name: string; lat: number; lon: number; color?: string }>;
};
type ImageArgs = { prompt: string };
type VideoArgs = { query: string };
type WeatherArgs = { city?: string; lat?: number; lon?: number };
// type DocumentArgs = { filename: string; question?: string };

type WidgetResponse =
	| { type: "line" | "bar" | "pie"; title: string; data: ChartArgs["data"] }
	| { type: "map"; data: MapArgs["locations"] }
	| { type: "image"; src: string }
	| { type: "video"; src: string }
	| {
			type: "weather";
			location?: string;
			coordinates: [number, number] | "current";
	  }
	| { type: "document"; filename: string; fields: string[]; rows: number }
	| { error: string };

const widgetFunctions: FunctionDeclaration[] = [
	{
		name: "get_weather",
		description:
			"Prepare a weather widget. If user asks for current location, set coordinates='current'. If city is mentioned, set city. If lat/lon mentioned, set lat/lon.",
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
		description: "Creates a line chart widget.",
		parameters: {
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
			},
		},
	},
	{
		name: "create_bar_chart",
		description: "Creates a bar chart widget.",
		parameters: {
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
			},
		},
	},
	{
		name: "create_pie_chart",
		description: "Creates a pie chart widget.",
		parameters: {
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
			},
		},
	},
	{
		name: "create_map",
		description: "Creates a map widget with locations.",
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
		description: "Creates an image widget using stock URLs.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { prompt: { type: SchemaType.STRING } },
		},
	},
	{
		name: "create_video",
		description: "Creates a video widget.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: { query: { type: SchemaType.STRING } },
		},
	},
	{
		name: "analyze_document",
		description:
			"Analyze a CSV/XLSX file stored in /public/docs. Returns field names and row count. Optionally filter insights if a question is asked.",
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				filename: { type: SchemaType.STRING },
				question: { type: SchemaType.STRING },
			},
		},
	},
];

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<WidgetResponse>
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { text } = req.body as { text: string };
		const userPrompt = getPrompt(text);

		const model: GenerativeModel = ai.getGenerativeModel({
			model: "gemini-2.5-flash",
			tools: [{ functionDeclarations: widgetFunctions }],
		});

		const contents = [{ role: "user", parts: [{ text: userPrompt }] }];

		const response: GenerateContentResult = await model.generateContent({
			contents,
		});
		const fnCalls: FunctionCall[] = response.response.functionCalls?.() ?? [];
		const fnCall = fnCalls[0];

		if (!fnCall) {
			return res.status(400).json({ error: "No function call from Gemini" });
		}

		switch (fnCall.name) {
			// 	case "analyze_document": {
			// 		const args = fnCall.args as DocumentArgs;
			// 		const rows = await parseFile(args.filename);
			// 		const fields = rows.length > 0 ? Object.keys(rows[0]) : [];

			// 		const functionResponse = {
			// 			name: fnCall.name,
			// 			response: { fields, rowCount: rows.length },
			// 		};

			// 		contents.push(response.candidates[0].content);
			// 		contents.push({ role: "user", parts: [{ functionResponse }] });

			// 		response = await model.generateContent({ contents });
			// 		fnCalls = response.response.functionCalls?.() ?? [];
			// 		fnCall = fnCalls[0];

			// 		if (!fnCall) {
			// 			return res.status(200).json({
			// 				type: "document",
			// 				filename: args.filename,
			// 				fields,
			// 				rows: rows.length,
			// 			});
			// 		}
			// 	}

			case "get_weather": {
				const args = fnCall.args as WeatherArgs;
				if (typeof args.lat === "number" && typeof args.lon === "number") {
					return res.status(200).json({
						type: "weather",
						coordinates: [args.lat, args.lon],
					});
				} else if (args.city) {
					return res.status(200).json({
						type: "weather",
						location: args.city,
						coordinates: [0, 0],
					});
				} else {
					return res.status(200).json({
						type: "weather",
						coordinates: "current",
					});
				}
			}

			case "create_line_chart":
			case "create_bar_chart":
			case "create_pie_chart": {
				const args = fnCall.args as ChartArgs;
				return res.status(200).json({
					type: fnCall.name.includes("line")
						? "line"
						: fnCall.name.includes("bar")
						? "bar"
						: "pie",
					title: args.title,
					data: args.data,
				});
			}

			case "create_map": {
				const args = fnCall.args as MapArgs;
				return res.status(200).json({ type: "map", data: args.locations });
			}

			case "create_image": {
				const args = fnCall.args as ImageArgs;
				const randomId = Math.floor(Math.random() * 1000);
				return res.status(200).json({
					type: "image",
					src: `https://picsum.photos/seed/${encodeURIComponent(
						args.prompt || "default"
					)}-${randomId}/800/600`,
				});
			}

			case "create_video": {
				const args = fnCall.args as VideoArgs;
				return res.status(200).json({
					type: "video",
					src:
						args.query ||
						"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
				});
			}

			default:
				return res.status(400).json({ error: "Unsupported function call" });
		}
	} catch (err) {
		console.error("Gemini error", err);
		return res.status(500).json({ error: (err as Error).message });
	}
}

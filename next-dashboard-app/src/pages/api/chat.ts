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
  Widget,
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

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const sessionStore: Record<
  string,
  {
    fields: string[];
    rowCount: number;
    preview: DocumentPreviewRow[];
    fullData: DocumentPreviewRow[];
  }
> = {};

// ----------------------------- Types for tool args ---------------------------

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

type VideoArgs = { query: string }; // may be URL or search-ish text; we sanitize to HTTPS MP4

type WeatherArgs = {
  city?: string;
  lat?: number;
  lon?: number;
  coordinates?: "current";
  date?: string; // ISO YYYY-MM-DD (optional)
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
    layout: {
      i: "",
      x: 0,
      y: 0,
      w: 4,
      h: 3,
    } as any, // layout is filled by client; keep type compatibility
    payload: { reply: reply ?? "" },
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
      return { src: u.toString(), title: u.pathname.split("/").pop() || "Video" };
    }
    return { src: fallback, title: "Video" };
  } catch {
    return { src: fallback, title: urlOrQuery || "Video" };
  }
}

function sanitizeChartData(data: ChartData[]): ChartData[] {
  // Drop NaN/Inf, clip magnitude, trim labels
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
      source: { type: SchemaType.STRING }, // "document" | "gemini" | "compare"
      filename: { type: SchemaType.STRING },
      groupBy: { type: SchemaType.STRING },
      metric: { type: SchemaType.STRING },
      aggregation: { type: SchemaType.STRING }, // "count" | "sum" | "avg"
    },
    required: ["title"],
  };
}

const widgetFunctions: FunctionDeclaration[] = [
  {
    name: "get_weather",
    description:
      "Prepare a weather widget. Use exactly one of: {city} or {lat,lon} or {coordinates:'current'}. If time is specified (e.g., 'tomorrow'), include date: 'YYYY-MM-DD'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        city: { type: SchemaType.STRING },
        lat: { type: SchemaType.NUMBER },
        lon: { type: SchemaType.NUMBER },
        coordinates: { type: SchemaType.STRING }, // "current"
        date: { type: SchemaType.STRING }, // ISO
      },
    },
  },
  {
    name: "create_line_chart",
    description: "Create a line chart (supports gemini, document, or compare).",
    parameters: chartParams(),
  },
  {
    name: "create_bar_chart",
    description: "Create a bar chart (supports gemini, document, or compare).",
    parameters: chartParams(),
  },
  {
    name: "create_pie_chart",
    description: "Create a pie chart (supports gemini, document, or compare).",
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
            required: ["name", "lat", "lon"],
          },
        },
      },
      required: ["locations"],
    },
  },
  {
    name: "create_image",
    description: "Generate an image from a prompt.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { prompt: { type: SchemaType.STRING } },
      required: ["prompt"],
    },
  },
  {
    name: "create_video",
    description: "Generate a video from a query (URL or search).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { query: { type: SchemaType.STRING } },
      required: ["query"],
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
      required: ["filename"],
    },
  },
  {
    name: "create_camera",
    description: "Embed a live camera feed widget (RTSP or MediaMTX path).",
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
  doc: { fields: string[]; fullData: Record<string, string | number | boolean | null>[] },
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
  res: NextApiResponse<WidgetResponse | WidgetResponse[] | { history: ChatMessage[] }>
) {
  if (req.method === "GET") {
    const conversationsId = req.query.conversationId as ConversationId;
    if (!conversationsId) {
      return res.status(400).json({ error: "Missing conversationId" } as any);
    }
    return res.status(200).json({ history: getHistory(conversationsId) });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" } as any);
  }

  try {
    const { text, base64File, fileName, mimeType, conversationId } = req.body as {
      text: string;
      base64File?: string;
      fileName?: string;
      mimeType?: string;
      conversationId: ConversationId;
    };

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" } as any);
    }

    // Handle uploaded docs
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

    // Prompt + doc hint
    let userPrompt = getPrompt(text, !!fileName, fileName);
    const docs = Object.keys(sessionStore);
    if (docs.length > 0) {
      userPrompt += `

Note: User has uploaded these documents: ${docs.join(
        ", "
      )}. Use source="document" with filename for questions that relate to them.`;
    }

    // Build model + call with history
    const model: GenerativeModel = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations: widgetFunctions }],
    });

    const history = getHistory(conversationId);
    const safeHistory = normalizeHistory(history);
    const response: GenerateContentResult = await model.generateContent({
      contents: [...safeHistory, { role: "user", parts: [{ text: userPrompt }] }],
    });

    const replyText = response.response.text?.();
    const fnCalls: FunctionCall[] = response.response.functionCalls?.() ?? [];
    const fnCall = fnCalls[0];

    // No tool call → just chat
    if (!fnCall) {
      const payload = bundleChat(
        replyText ?? "Here’s my reply based on your request."
      );
      // update chat history (user + model)
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(payload);
    }

    // -------------------- charts (line/bar/pie) ------------------------------
    if (fnCall.name.startsWith("create_") && fnCall.name.includes("chart")) {
      const args = fnCall.args as ChartArgs;
      const id = makeId("chart");
      const type: WidgetResponse["type"] =
        fnCall.name.includes("line") ? "line" : fnCall.name.includes("bar") ? "bar" : "pie";

      // compare → single widget with compareData
      if (args.source === "compare" && args.filename && sessionStore[args.filename]) {
        const doc = sessionStore[args.filename];
        const docData = aggregateDocData(
          doc,
          args.groupBy,
          args.metric,
          args.aggregation
        );
        const geminiData = sanitizeChartData(args.data || []);
        const widget: WidgetResponse = {
          id,
          type: type as "line" | "bar" | "pie",
          layout: { i: "", x: 0, y: 0, w: 6, h: 8 } as any,
          payload: {
            title: args.title || `Comparison: ${args.filename}`,
            data: geminiData.length ? geminiData : docData,
            source: geminiData.length ? "gemini" : "document",
            compareData: [
              { source: "document", data: docData },
              { source: "gemini", data: geminiData.length ? geminiData : docData },
            ],
          },
        };
        const out = bundleChat(
          replyText ?? "Here’s a side-by-side comparison from your file and global data.",
          widget
        );
        appendHistory(conversationId, [
          { role: "user", parts: [{ text }], timestamp: Date.now() },
          { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
        ]);
        return res.status(200).json(out);
      }

      // document-only
      if (args.source === "document" && args.filename && sessionStore[args.filename]) {
        const doc = sessionStore[args.filename];
        const dataFromDoc = aggregateDocData(
          doc,
          args.groupBy,
          args.metric,
          args.aggregation
        );
        const widget: WidgetResponse = {
          id,
          type: type as "line" | "bar" | "pie",
          layout: { i: "", x: 0, y: 0, w: 6, h: 8 } as any,
          payload: {
            title: args.title || `Chart of ${args.groupBy || doc.fields[0]}`,
            data: dataFromDoc,
            source: "document",
          },
        };
        const out = bundleChat(
          replyText ?? "Here’s the chart generated from your document.",
          widget
        );
        appendHistory(conversationId, [
          { role: "user", parts: [{ text }], timestamp: Date.now() },
          { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
        ]);
        return res.status(200).json(out);
      }

      // gemini-only
      const safeData = sanitizeChartData(args.data || []);
      const widget: WidgetResponse = {
        id,
        type: type as "line" | "bar" | "pie",
        layout: { i: "", x: 0, y: 0, w: 6, h: 8 } as any,
        payload: {
          title: args.title || "Chart",
          data: safeData,
          source: "gemini",
        },
      };
      const out = bundleChat(replyText ?? "Here’s the chart.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- weather -------------------------------------------
    if (fnCall.name === "get_weather") {
      const args = fnCall.args as WeatherArgs;
      const id = makeId("weather");

      let widget: WidgetResponse;
      if (typeof args.lat === "number" && typeof args.lon === "number") {
        widget = {
          id,
          type: "weather",
          layout: { i: "", x: 0, y: 0, w: 4, h: 5 } as any,
          payload: {
            coordinates: [args.lat, args.lon],
            description: args.date ? `Forecast for ${args.date}` : undefined,
          },
        };
      } else if (args.coordinates === "current") {
        widget = {
          id,
          type: "weather",
          layout: { i: "", x: 0, y: 0, w: 4, h: 5 } as any,
          payload: {
            coordinates: "current",
            description: args.date ? `Forecast for ${args.date}` : undefined,
          },
        };
      } else if (args.city) {
        widget = {
          id,
          type: "weather",
          layout: { i: "", x: 0, y: 0, w: 4, h: 5 } as any,
          payload: {
            location: args.city,
            coordinates: [0, 0], // sentinel until client resolves coords
            description: args.date ? `Forecast for ${args.date}` : undefined,
          },
        };
      } else {
        return res.status(400).json({ error: "Invalid weather arguments" } as any);
      }

      const out = bundleChat(replyText ?? "Here’s the weather.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- map ------------------------------------------------
    if (fnCall.name === "create_map") {
      const args = fnCall.args as MapArgs;
      const id = makeId("map");
      const data = assignDistinctColors(args.locations || []);
      if (data.length < 2) {
        return res.status(400).json({ error: "Map requires at least 2 valid locations" } as any);
      }
      const widget: WidgetResponse = {
        id,
        type: "map",
        layout: { i: "", x: 0, y: 0, w: 6, h: 7 } as any,
        payload: { title: "Map", data },
      };
      const out = bundleChat(replyText ?? "Here’s the map.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- image ---------------------------------------------
    if (fnCall.name === "create_image") {
      const args = fnCall.args as ImageArgs;
      const id = makeId("image");
      const seed = encodeURIComponent(args.prompt || "default");
      const src = `https://picsum.photos/seed/${seed}-${Math.floor(
        Math.random() * 1000
      )}/800/600`;
      const widget: WidgetResponse = {
        id,
        type: "image",
        layout: { i: "", x: 0, y: 0, w: 5, h: 6 } as any,
        payload: { src, title: args.prompt?.slice(0, 80) || "Generated Image" },
      };
      const out = bundleChat(replyText ?? "Here’s your image.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- video ---------------------------------------------
    if (fnCall.name === "create_video") {
      const args = fnCall.args as VideoArgs;
      const id = makeId("video");
      const { src, title } = ensureHttpsMp4(args.query || "");
      const widget: WidgetResponse = {
        id,
        type: "video",
        layout: { i: "", x: 0, y: 0, w: 6, h: 6 } as any,
        payload: { src, title },
      };
      const out = bundleChat(replyText ?? "Here’s your video.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- camera --------------------------------------------
    if (fnCall.name === "create_camera") {
      const args = fnCall.args as { streamUrl: string; title?: string };
      const id = makeId("camera");
      const widget: WidgetResponse = {
        id,
        type: "camera",
        layout: { i: "", x: 0, y: 0, w: 6, h: 6 } as any,
        payload: {
          streamUrl: args.streamUrl, // may be rtsp:// or short id
          title: args.title || "Camera Feed",
        },
      };
      const out = bundleChat(replyText ?? "Camera feed attached.", widget);
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    // -------------------- analyze document ----------------------------------
    if (fnCall.name === "analyze_document") {
      const args = fnCall.args as DocumentArgs;
      const doc = args.filename ? sessionStore[args.filename] : null;
      const id = makeId("doc");
      if (!doc) return res.status(400).json({ error: "Document not found" } as any);

      let summary = "Document uploaded successfully.";
      if (args.question) {
        const qaPrompt = `You are analyzing "${args.filename}".
Question: ${args.question}
Fields: ${JSON.stringify(doc.fields)}
Preview (first rows): ${JSON.stringify(doc.preview.slice(0, 10))}`;
        const qaModel = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const qaResponse = await qaModel.generateContent({
          contents: [{ role: "user", parts: [{ text: qaPrompt }] }],
        });
        summary =
          qaResponse.response.text?.() ??
          qaResponse.response.candidates?.[0]?.content?.parts?.[0]?.text ??
          "No answer found.";
      }

      const widget: WidgetResponse = {
        id,
        type: "document",
        layout: { i: "", x: 0, y: 0, w: 6, h: 8 } as any,
        payload: {
          filename: args.filename,
          fields: doc.fields,
          rowCount: doc.rowCount,
          preview: doc.preview as DocumentPreviewRow[],
          summary,
        },
      };
      const out = bundleChat(
        replyText ?? "Here’s what I found in your document.",
        widget
      );
      appendHistory(conversationId, [
        { role: "user", parts: [{ text }], timestamp: Date.now() },
        { role: "model", parts: [{ text: replyText ?? "" }], timestamp: Date.now() },
      ]);
      return res.status(200).json(out);
    }

    return res.status(400).json({ error: "Unsupported function call" } as any);
  } catch (err) {
    console.error("Gemini error", err);
    return res.status(500).json({ error: (err as Error).message } as any);
  }
}

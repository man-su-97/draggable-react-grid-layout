import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { WidgetResponseSchema, WidgetResponse } from "@/schemas/widgetSchemas";
import {
  makeId,
  sessionStore,
  aggregateDocData,
  assignDistinctColors,
} from "@/lib/utils/widgets";

// ---- Helper type for runManager metadata ----
type ToolRunManagerWithMetadata = {
  metadata?: { conversationId?: string };
};

// ---- CHART TOOL ----
export const createChartTool = new DynamicStructuredTool({
  name: "create_chart",
  description:
    "Create a line/bar/pie chart from Gemini or uploaded documents. Supports compare mode.",
  schema: z.object({
    kind: z.enum(["line", "bar", "pie"]),
    title: z.string().min(1),
    data: z
      .array(z.object({ label: z.string(), value: z.number() }))
      .optional(),
    source: z.enum(["document", "gemini", "compare"]).optional(),
    filename: z.string().optional(),
    groupBy: z.string().optional(),
    metric: z.string().optional(),
    aggregation: z.enum(["count", "sum", "avg"]).optional(),
  }),
  func: async (
    { kind, title, data, source, filename, groupBy, metric, aggregation },
    runManager
  ): Promise<WidgetResponse | WidgetResponse[]> => {
    const conversationId =
      (runManager as unknown as ToolRunManagerWithMetadata)?.metadata?.conversationId;
    const id = makeId("chart");

    // Compare: return both doc + gemini charts
    if (source === "compare" && filename && conversationId) {
      const doc = sessionStore[conversationId]?.[filename];
      if (doc) {
        const docData = aggregateDocData(doc, groupBy, metric, aggregation);
        const docChart: WidgetResponse = {
          id: `${id}-doc`,
          type: kind,
          layout: { i: `${id}-doc`, x: 0, y: 0, w: 6, h: 6 },
          payload: {
            title: `${title} (from ${filename})`,
            data: docData,
            source: "document",
          },
        };

        const geminiChart: WidgetResponse = {
          id,
          type: kind,
          layout: { i: id, x: 6, y: 0, w: 6, h: 6 },
          payload: {
            title: `${title} (from Gemini)`,
            data: data ?? [],
            source: "gemini",
          },
        };

        return [
          WidgetResponseSchema.parse(docChart),
          WidgetResponseSchema.parse(geminiChart),
        ];
      }
    }

    // Document-only chart
    if (source === "document" && filename && conversationId) {
      const doc = sessionStore[conversationId]?.[filename];
      if (doc) {
        const docData = aggregateDocData(doc, groupBy, metric, aggregation);
        const widget: WidgetResponse = {
          id,
          type: kind,
          layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
          payload: {
            title: title || `Chart of ${groupBy || doc.fields[0]}`,
            data: docData,
            source: "document",
          },
        };
        return WidgetResponseSchema.parse(widget);
      }
    }

    // Gemini-only fallback
    const widget: WidgetResponse = {
      id,
      type: kind,
      layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
      payload: {
        title,
        data: data ?? [],
        source: "gemini",
      },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- MAP TOOL ----
export const createMapTool = new DynamicStructuredTool({
  name: "create_map",
  description: "Render a map with pins for given lat/lon locations.",
  schema: z.object({
    locations: z.array(
      z.object({
        name: z.string(),
        lat: z.number(),
        lon: z.number(),
        color: z.string().optional(),
      })
    ),
  }),
  func: async ({ locations }): Promise<WidgetResponse> => {
    const id = makeId("map");
    const data = assignDistinctColors(locations);
    const widget: WidgetResponse = {
      id,
      type: "map",
      layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
      payload: { title: "Map Widget", data },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- IMAGE TOOL ----
export const createImageTool = new DynamicStructuredTool({
  name: "create_image",
  description: "Generate an image widget from a text prompt.",
  schema: z.object({ prompt: z.string() }),
  func: async ({ prompt }): Promise<WidgetResponse> => {
    const id = makeId("image");
    const widget: WidgetResponse = {
      id,
      type: "image",
      layout: { i: id, x: 0, y: 0, w: 5, h: 6 },
      payload: {
        src: `https://picsum.photos/seed/${encodeURIComponent(
          prompt
        )}-${Math.floor(Math.random() * 1000)}/800/600`,
        title: prompt.slice(0, 80) || "Generated Image",
      },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- VIDEO TOOL ----
export const createVideoTool = new DynamicStructuredTool({
  name: "create_video",
  description: "Attach a video from URL or query.",
  schema: z.object({ query: z.string() }),
  func: async ({ query }): Promise<WidgetResponse> => {
    const id = makeId("video");
    const widget: WidgetResponse = {
      id,
      type: "video",
      layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
      payload: {
        src:
          query ||
          "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        title: query || "Video",
      },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- CAMERA TOOL ----
export const createCameraTool = new DynamicStructuredTool({
  name: "create_camera",
  description: "Embed a live camera feed widget (RTSP/MediaMTX).",
  schema: z.object({
    streamUrl: z.string(),
    title: z.string().optional(),
  }),
  func: async ({ streamUrl, title }): Promise<WidgetResponse> => {
    const id = makeId("camera");
    const widget: WidgetResponse = {
      id,
      type: "camera",
      layout: { i: id, x: 0, y: 0, w: 6, h: 6 },
      payload: { streamUrl, title: title || "Camera Feed" },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- ANALYZE DOCUMENT TOOL ----
export const analyzeDocumentTool = new DynamicStructuredTool({
  name: "analyze_document",
  description:
    "Summarize or answer questions about an uploaded document (Excel/CSV).",
  schema: z.object({
    filename: z.string(),
    question: z.string().optional(),
  }),
  func: async ({ filename, question }, runManager): Promise<WidgetResponse> => {
    const conversationId =
      (runManager as unknown as ToolRunManagerWithMetadata)?.metadata?.conversationId;
    const id = makeId("document");
    if (!conversationId) throw new Error("Missing conversationId");

    const doc = sessionStore[conversationId]?.[filename];
    if (!doc) throw new Error("Document not found");

    const summary =
      question && question.trim().length > 0
        ? `Answer for "${question}" from doc ${filename}`
        : `Document "${filename}" uploaded successfully with ${doc.rowCount} rows.`;

    const widget: WidgetResponse = {
      id,
      type: "document",
      layout: { i: id, x: 0, y: 0, w: 6, h: 8 },
      payload: {
        filename,
        fields: doc.fields,
        rowCount: doc.rowCount,
        preview: doc.preview,
        summary,
      },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- CHAT TOOL ----
export const chatReplyTool = new DynamicStructuredTool({
  name: "chat_reply",
  description:
    "Respond to the user in natural language when no widget is needed.",
  schema: z.object({ reply: z.string() }),
  func: async ({ reply }): Promise<WidgetResponse> => {
    const id = makeId("chat");
    const widget: WidgetResponse = {
      id,
      type: "chat",
      layout: { i: id, x: 0, y: 0, w: 4, h: 3 },
      payload: { reply },
    };
    return WidgetResponseSchema.parse(widget);
  },
});

// ---- EXPORT ALL TOOLS ----
export const widgetTools = [
  chatReplyTool,
  createChartTool,
  createMapTool,
  createImageTool,
  createVideoTool,
  createCameraTool,
  analyzeDocumentTool,
];

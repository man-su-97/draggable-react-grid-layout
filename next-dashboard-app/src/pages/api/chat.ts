import type { NextApiRequest, NextApiResponse } from "next";
import { runAgent } from "@/lib/agents/runAgent";
import { getHistory, clearHistory } from "@/lib/chatHistory";
import { WidgetResponse } from "@/types/widgetTypes";
import { ErrorWidgetSchema } from "@/schemas/widgetSchemas";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    WidgetResponse | WidgetResponse[] | { error?: string; ok?: boolean; history?: unknown }
  >
) {
  try {
    switch (req.method) {
      case "POST": {
        const result = await runAgent(req.body);
        return res.status(200).json(result);
      }

      case "GET": {
        const { conversationId } = req.query;
        if (!conversationId || typeof conversationId !== "string") {
          return res.status(400).json({ error: "Missing or invalid conversationId" });
        }
        const history = getHistory(conversationId);
        return res.status(200).json({ history });
      }

      case "DELETE": {
        const { conversationId } = req.query;
        if (!conversationId || typeof conversationId !== "string") {
          return res.status(400).json({ error: "Missing or invalid conversationId" });
        }
        clearHistory(conversationId);
        return res.status(200).json({ ok: true });
      }

      default: {
        res.setHeader("Allow", ["POST", "GET", "DELETE"]);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
      }
    }
  } catch (err) {
    console.error("Chat API error:", err);

    // Build error widget
    const errorWidget = {
      id: "error-500",
      type: "error",
      layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
      payload: {
        message: (err as Error)?.message ?? "Unexpected server error",
        code: "SERVER_ERROR",
      },
    };

    // Validate against schema before returning
    const parsed = ErrorWidgetSchema.parse(errorWidget);
    return res.status(500).json(parsed);
  }
}

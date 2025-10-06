import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";

import { getPrompt } from "@/lib/userPrompt";
import { widgetTools } from "@/lib/tools/widgetTools";
import { getLLM } from "@/lib/getLLM";
import {
  ChatMessage,
  ConversationId,
  getHistory,
  appendHistory,
} from "@/lib/chatHistory";
import { makeId, sessionStore } from "@/lib/utils/widgets";
import { xlsxToStructured, csvToStructured } from "@/lib/docParser";
import { Buffer } from "buffer";
import { StructuredDoc, WidgetResponse } from "@/types/widgetTypes";
import { WidgetResponseSchema } from "@/schemas/widgetSchemas";


export async function runAgent({
  text,
  base64File,
  fileName,
  mimeType,
  conversationId,
  model,
}: {
  text: string;
  base64File?: string;
  fileName?: string;
  mimeType?: string;
  conversationId: ConversationId;
  model?: string;
}): Promise<WidgetResponse | WidgetResponse[]> {
  
  if (!sessionStore[conversationId]) sessionStore[conversationId] = {};

  if (base64File && fileName && mimeType) {
    let structured: StructuredDoc;

    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      structured = await xlsxToStructured(base64File);
    } else if (mimeType.endsWith("csv")) {
      structured = csvToStructured(Buffer.from(base64File, "base64"));
    } else {
      structured = { fields: [], rowCount: 0, preview: [], fullData: [] };
    }
    
    sessionStore[conversationId][fileName] = structured;
  }


  let userPrompt = getPrompt(text, !!fileName, fileName, model);
  const docs = Object.keys(sessionStore[conversationId] || {});
  if (docs.length > 0) {
    userPrompt += `\n\nNote: Uploaded docs: ${docs.join(
      ", "
    )}. Use source="document" with filename for questions.`;
  }

  const provider = model || "gemini";
  const llm = getLLM(provider);

 
  const history = getHistory(conversationId);
  const safeHistory = history.map(
    (msg: ChatMessage) => new HumanMessage(msg.parts.map((p) => p.text).join("\n"))
  );


  let rawOutput: any;

  try {
    if (provider === "openai") {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful assistant that generates dashboard widgets based on user queries."],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);

      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools: widgetTools,
        prompt,
      });

      const executor = new AgentExecutor({
        agent,
        tools: widgetTools,
        verbose: true,
      });

      const result = await executor.invoke({
        input: userPrompt,
        chat_history: safeHistory,
        conversationId,
      });

      rawOutput = result.output;
    } else {
      const result = await llm.invoke(userPrompt);
      rawOutput = result?.content ?? result?.text ?? result;
    }
  } catch (error: any) {
    console.error("Model error:", error.message);
    if (provider === "gemini" && error.message.includes("404")) {
      console.warn("[runAgent] Gemini model not found — retrying with default.");
      const fallback = getLLM("gemini");
      const result = await fallback.invoke(userPrompt);
      rawOutput = result?.content ?? result?.text ?? result;
    } else {
      throw error;
    }
  }

  
  let widgets: any[] = [];

  if (Array.isArray(rawOutput)) {
    widgets = rawOutput;
  } else if (typeof rawOutput === "object" && rawOutput?.type) {
    widgets = [rawOutput];
  } else if (typeof rawOutput === "string") {
    const clean = rawOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(clean);
      widgets = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // fallback to chat message if not valid JSON
      widgets = [
        {
          type: "chat",
          payload: { reply: rawOutput },
        },
      ];
    }
  } else {
    // fallback safety net
    widgets = [
      {
        type: "chat",
        payload: { reply: String(rawOutput ?? "No valid output") },
      },
    ];
  }


  const validated: WidgetResponse[] = widgets.map((w) => {
    // If model returned plain text
    if (typeof w === "string") {
      return {
        id: makeId("chat"),
        type: "chat",
        layout: { i: makeId("layout"), x: 0, y: 0, w: 6, h: 2 },
        payload: { reply: w },
      };
    }

    const parsed = WidgetResponseSchema.safeParse(w);
    if (!parsed.success) {
      console.error("Invalid widget response:", parsed.error);
      return {
        id: makeId("error"),
        type: "error",
        layout: { i: "err", x: 0, y: 0, w: 4, h: 3 },
        payload: {
          message: "Invalid widget response",
          code: "VALIDATION_ERROR",
        },
      } as WidgetResponse;
    }

    return parsed.data;
  });

 
  appendHistory(conversationId, [
    { role: "user", parts: [{ text }], timestamp: Date.now() },
    {
      role: "model",
      parts: [
        {
          text:
            validated[0].type === "chat"
              ? validated[0].payload.reply
              : "Widget generated",
        },
      ],
      timestamp: Date.now(),
    },
  ]);

  
  return validated.length === 1 ? validated[0] : validated;
}

import fs from "fs";
import path from "path";


export type Role = "user" | "model" | "system";

export interface ChatMessage {
  role: Role;
  parts: { text: string }[];
  timestamp: number;
}

export type ConversationId = string;


const chatStore: Record<ConversationId, ChatMessage[]> = {};


const MAX_HISTORY = 20;


const dataDir = path.join(process.cwd(), "data");
const chatFile = path.join(dataDir, "chatHistory.json");


function loadChatHistory(): void {
  try {
    if (fs.existsSync(chatFile)) {
      const raw = fs.readFileSync(chatFile, "utf8");
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        Object.assign(chatStore, parsed);
        console.log("[chatHistory] Loaded persisted chat history");
      }
    }
  } catch (err) {
    console.error("[chatHistory] Failed to load persisted history:", err);
  }
}


function saveChatHistory(): void {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(chatFile, JSON.stringify(chatStore, null, 2));
  } catch (err) {
    console.error("[chatHistory] Failed to save chat history:", err);
  }
}

loadChatHistory();


export function getHistory(conversationId: ConversationId): ChatMessage[] {
  return chatStore[conversationId] ?? [];
}


export function appendHistory(conversationId: ConversationId, messages: ChatMessage[]): void {
  const existing = chatStore[conversationId] ?? [];
  chatStore[conversationId] = [...existing, ...messages].slice(-MAX_HISTORY);
  saveChatHistory();
}


export function listConversations(): string[] {
  return Object.keys(chatStore);
}


export function clearHistory(conversationId?: ConversationId): void {
  if (conversationId) {
    delete chatStore[conversationId];
  } else {
    for (const key of Object.keys(chatStore)) delete chatStore[key];
  }
  saveChatHistory();
}

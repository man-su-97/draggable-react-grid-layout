// src/lib/chatHistory.ts
export type Role = "user" | "model" | "system";

export interface ChatMessage {
  role: Role;
  parts: { text: string }[];
  timestamp: number;
}

export type ConversationId = string;

const chatStore: Record<ConversationId, ChatMessage[]> = {};
const MAX_HISTORY = 20;

/**
 * Get stored chat history for a conversation.
 */
export function getHistory(conversationId: ConversationId): ChatMessage[] {
  return chatStore[conversationId] ?? [];
}

/**
 * Append messages to a conversation (user+model).
 * Keeps only the last MAX_HISTORY messages.
 */
export function appendHistory(
  conversationId: ConversationId,
  messages: ChatMessage[]
) {
  const existing = chatStore[conversationId] ?? [];
  chatStore[conversationId] = [...existing, ...messages].slice(-MAX_HISTORY);
}

/**
 * List all conversationIds currently in memory.
 */
export function listConversations(): string[] {
  return Object.keys(chatStore);
}

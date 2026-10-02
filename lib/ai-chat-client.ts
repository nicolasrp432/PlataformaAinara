export type AiConversationRef = { id: string; contextKey: string } | null

export function aiChatContextKey(lessonId?: string, formationId?: string) {
  return `${lessonId ?? ""}:${formationId ?? ""}`
}

export function conversationIdForContext(
  conversation: AiConversationRef,
  contextKey: string,
) {
  return conversation?.contextKey === contextKey ? conversation.id : undefined
}

export function isUnavailableConversationCode(code?: string) {
  return code === "CONVERSATION_NOT_FOUND" || code === "CONVERSATION_CONTEXT_MISMATCH"
}

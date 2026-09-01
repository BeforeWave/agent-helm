export interface WorkHistoryConversationIntent {
  message: string
  task: string
}

export interface WorkHistoryBoundConversationIntent {
  intent: WorkHistoryConversationIntent
  boundAt: string
}

export interface WorkHistoryWorkspaceReference {
  id: string
  title?: string
  path?: string
}

export interface WorkHistorySession {
  id: string
  originIntent?: WorkHistoryConversationIntent
  boundIntents: WorkHistoryBoundConversationIntent[]
  chatUrls: string[]
  activeWorkspaceId?: string
  workspace?: WorkHistoryWorkspaceReference
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  eventCount: number
  chatCount: number
  delegationCount: number
  agentLabel?: string
  runtimeLabel?: string
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized || undefined
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function conversationIntent(value: unknown): WorkHistoryConversationIntent | undefined {
  const raw = record(value)
  const message = text(raw.message)
  const task = text(raw.task)
  return message && task ? { message, task } : undefined
}

function workspaceReference(value: unknown): WorkHistoryWorkspaceReference | undefined {
  const raw = record(value)
  const id = text(raw.id)
  if (!id) return undefined
  const title = text(raw.title)
  const path = text(raw.path)
  return { id, ...(title ? { title } : {}), ...(path ? { path } : {}) }
}

function addUniqueText(target: string[], value: unknown): void {
  const normalized = text(value)
  if (normalized && !target.includes(normalized)) target.push(normalized)
}

/**
 * Canonicalize a Core Work History summary at the UI boundary. This is the one
 * compatibility path for current originIntent/boundIntents/chatUrls and the
 * older originChat/boundChats shape.
 */
export function normalizeWorkHistorySession(value: unknown): WorkHistorySession | undefined {
  const raw = record(value)
  const id = text(raw.id) ?? text(raw.session_id)
  if (!id) return undefined

  const legacyOrigin = record(raw.originChat)
  const legacyBound = Array.isArray(raw.boundChats) ? raw.boundChats : []
  const canonicalBound = Array.isArray(raw.boundIntents) ? raw.boundIntents : undefined
  const originIntent = conversationIntent(raw.originIntent) ?? conversationIntent(legacyOrigin)
  const boundIntents = (canonicalBound ?? legacyBound).flatMap((value) => {
    const entry = record(value)
    const intent = canonicalBound ? conversationIntent(entry.intent) : conversationIntent(entry)
    const boundAt = text(entry.boundAt)
    return intent && boundAt ? [{ intent, boundAt }] : []
  })

  const chatUrls: string[] = []
  if (Array.isArray(raw.chatUrls)) raw.chatUrls.forEach((url) => addUniqueText(chatUrls, url))
  addUniqueText(chatUrls, legacyOrigin.url)
  legacyBound.forEach((entry) => addUniqueText(chatUrls, record(entry).url))

  const workspace = workspaceReference(raw.workspace)
  const activeWorkspaceId = text(raw.activeWorkspaceId) ?? workspace?.id
  const createdAt = text(raw.createdAt) ?? ''
  const updatedAt = text(raw.updatedAt) ?? createdAt
  const lastActivityAt = text(raw.lastActivityAt) ?? updatedAt
  const agentLabel = text(raw.agentLabel)
  const runtimeLabel = text(raw.runtimeLabel)
  const {
    originChat: _originChat,
    boundChats: _boundChats,
    originIntent: _originIntent,
    boundIntents: _boundIntents,
    chatUrls: _chatUrls,
    workspace: _workspace,
    ...rest
  } = raw

  return {
    ...rest,
    id,
    ...(originIntent ? { originIntent } : {}),
    boundIntents,
    chatUrls,
    ...(activeWorkspaceId ? { activeWorkspaceId } : {}),
    ...(workspace ? { workspace } : {}),
    createdAt,
    updatedAt,
    lastActivityAt,
    eventCount: count(raw.eventCount),
    chatCount: count(raw.chatCount),
    delegationCount: count(raw.delegationCount),
    ...(agentLabel ? { agentLabel } : {}),
    ...(runtimeLabel ? { runtimeLabel } : {}),
  } as WorkHistorySession
}

export function normalizeWorkHistorySessions(value: unknown): WorkHistorySession[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeWorkHistorySession).filter((session): session is WorkHistorySession => Boolean(session))
}

/** One canonical title rule across every Work History surface. */
export function workHistoryTimelinePurpose(value: unknown): string | undefined {
  const raw = record(value)
  const args = record(raw.arguments)
  return text(args.purpose)
}

export function isWorkHistoryConversationBound(chatUrls: readonly string[], conversationUrl: string | null | undefined): boolean {
  return Boolean(conversationUrl && chatUrls.includes(conversationUrl))
}

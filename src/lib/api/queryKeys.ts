/**
 * Query key factory for TanStack Query.
 *
 * Centralizes all cache keys to prevent typos and enable type-safe cache invalidation.
 * Keys use `as const` for type narrowing.
 */
export const queryKeys = {
  /** Version endpoint */
  version: ['version'] as const,

  /** Session-related queries */
  sessions: {
    /** Base key for all session queries - use for broad invalidation */
    all: ['sessions'] as const,

    /** List sessions with pagination params */
    list: (params?: { limit?: number; offset?: number }) =>
      ['sessions', 'list', params ?? {}] as const,

    /** Single session detail */
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
  },

  /** Content-related queries */
  content: {
    /** Base key for all content queries */
    all: (sessionId: string) => ['content', sessionId] as const,

    /** List content for a session with pagination */
    list: (sessionId: string, params?: { limit?: number; offset?: number }) =>
      ['content', sessionId, 'list', params ?? {}] as const,

    /** Single content item detail */
    detail: (sessionId: string, contentId: string) =>
      ['content', sessionId, 'detail', contentId] as const,
  },

  /** Index status queries */
  indexStatus: (workspaceId: string) => ['indexStatus', workspaceId] as const,

  /** Audit log queries */
  auditLogs: (sessionId: string, params?: { limit?: number; offset?: number }) =>
    ['auditLogs', sessionId, params ?? {}] as const,
} as const;

/**
 * Type helpers for query keys.
 */
export type SessionsListKey = ReturnType<typeof queryKeys.sessions.list>;
export type SessionDetailKey = ReturnType<typeof queryKeys.sessions.detail>;
export type ContentListKey = ReturnType<typeof queryKeys.content.list>;
export type ContentDetailKey = ReturnType<typeof queryKeys.content.detail>;
export type IndexStatusKey = ReturnType<typeof queryKeys.indexStatus>;
export type AuditLogsKey = ReturnType<typeof queryKeys.auditLogs>;

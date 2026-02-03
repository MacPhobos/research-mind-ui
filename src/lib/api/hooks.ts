import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import {
  apiClient,
  type VersionResponse,
  type SessionResponse,
  type SessionListResponse,
  type CreateSessionRequest,
  type UpdateSessionRequest,
  type IndexResultResponse,
  type IndexStatusResponse,
  type IndexWorkspaceRequest,
  type AuditLogListResponse,
  type ContentListResponse,
  type ContentItemResponse,
} from './client';
import { ApiError } from './errors';
import { queryKeys } from './queryKeys';

// =============================================================================
// Version Hooks
// =============================================================================

/**
 * Query hook for fetching API version.
 */
export function useVersionQuery() {
  return createQuery<VersionResponse, ApiError>({
    queryKey: queryKeys.version,
    queryFn: () => apiClient.getVersion(),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// =============================================================================
// Session Hooks
// =============================================================================

/**
 * Query hook for listing sessions with pagination.
 * @param limit - Items per page (default: 20)
 * @param offset - Starting position (default: 0)
 */
export function useSessionsQuery(limit = 20, offset = 0) {
  return createQuery<SessionListResponse, ApiError>({
    queryKey: queryKeys.sessions.list({ limit, offset }),
    queryFn: () => apiClient.listSessions(limit, offset),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Query hook for fetching a single session.
 * @param sessionId - Session UUID
 */
export function useSessionQuery(sessionId: string | undefined) {
  return createQuery<SessionResponse, ApiError>({
    queryKey: queryKeys.sessions.detail(sessionId ?? ''),
    queryFn: () => apiClient.getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Mutation hook for creating a session.
 * Invalidates the sessions list on success.
 */
export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return createMutation<SessionResponse, ApiError, CreateSessionRequest>({
    mutationFn: (request) => apiClient.createSession(request),
    onSuccess: () => {
      // Invalidate all session queries to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

/**
 * Mutation hook for updating a session.
 * Invalidates both the session detail and list on success.
 */
export function useUpdateSessionMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    SessionResponse,
    ApiError,
    { sessionId: string; request: UpdateSessionRequest }
  >({
    mutationFn: ({ sessionId, request }) => apiClient.updateSession(sessionId, request),
    onSuccess: (_data, variables) => {
      // Invalidate the specific session and the list
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

/**
 * Mutation hook for deleting a session.
 * Invalidates the sessions list on success.
 */
export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return createMutation<void, ApiError, string>({
    mutationFn: (sessionId) => apiClient.deleteSession(sessionId),
    onSuccess: (_data, sessionId) => {
      // Remove the specific session from cache
      queryClient.removeQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

// =============================================================================
// Content Hooks
// =============================================================================

/**
 * Query hook for listing content items for a session.
 * @param sessionId - Session UUID
 * @param limit - Items per page (default: 50)
 * @param offset - Starting position (default: 0)
 */
export function useContentQuery(sessionId: string | undefined, limit = 50, offset = 0) {
  return createQuery<ContentListResponse, ApiError>({
    queryKey: queryKeys.content.list(sessionId ?? '', { limit, offset }),
    queryFn: () => apiClient.listContent(sessionId!, limit, offset),
    enabled: !!sessionId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Query hook for fetching a single content item.
 * @param sessionId - Session UUID
 * @param contentId - Content UUID
 */
export function useContentItemQuery(
  sessionId: string | undefined,
  contentId: string | undefined
) {
  return createQuery<ContentItemResponse, ApiError>({
    queryKey: queryKeys.content.detail(sessionId ?? '', contentId ?? ''),
    queryFn: () => apiClient.getContent(sessionId!, contentId!),
    enabled: !!sessionId && !!contentId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Mutation hook for adding content to a session.
 * Invalidates content list and session detail on success.
 */
export function useAddContentMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    ContentItemResponse,
    ApiError,
    {
      sessionId: string;
      contentType: string;
      options?: {
        title?: string;
        source?: string;
        metadata?: Record<string, unknown>;
        file?: File;
      };
    }
  >({
    mutationFn: ({ sessionId, contentType, options }) =>
      apiClient.addContent(sessionId, contentType, options),
    onSuccess: (_data, variables) => {
      // Invalidate content list for this session
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.all(variables.sessionId),
      });
      // Invalidate session detail (content_count may have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
    },
  });
}

/**
 * Mutation hook for deleting content from a session.
 * Invalidates content list and session detail on success.
 */
export function useDeleteContentMutation() {
  const queryClient = useQueryClient();

  return createMutation<void, ApiError, { sessionId: string; contentId: string }>({
    mutationFn: ({ sessionId, contentId }) => apiClient.deleteContent(sessionId, contentId),
    onSuccess: (_data, variables) => {
      // Remove the specific content item from cache
      queryClient.removeQueries({
        queryKey: queryKeys.content.detail(variables.sessionId, variables.contentId),
      });
      // Invalidate content list for this session
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.all(variables.sessionId),
      });
      // Invalidate session detail (content_count may have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
    },
  });
}

// =============================================================================
// Indexing Hooks
// =============================================================================

/**
 * Query hook for fetching workspace indexing status.
 * @param workspaceId - Workspace/Session UUID
 */
export function useIndexStatusQuery(workspaceId: string | undefined) {
  return createQuery<IndexStatusResponse, ApiError>({
    queryKey: queryKeys.indexStatus(workspaceId ?? ''),
    queryFn: () => apiClient.getIndexStatus(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 10000, // 10 seconds - status can change frequently
    gcTime: 60000, // 1 minute
  });
}

/**
 * Mutation hook for triggering workspace indexing.
 * Invalidates index status and session detail on success.
 */
export function useIndexWorkspaceMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    IndexResultResponse,
    ApiError,
    { workspaceId: string; request?: IndexWorkspaceRequest }
  >({
    mutationFn: ({ workspaceId, request }) => apiClient.indexWorkspace(workspaceId, request),
    onSuccess: (_data, variables) => {
      // Invalidate index status
      queryClient.invalidateQueries({
        queryKey: queryKeys.indexStatus(variables.workspaceId),
      });
      // Invalidate session detail (is_indexed may have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.workspaceId),
      });
    },
  });
}

// =============================================================================
// Audit Log Hooks
// =============================================================================

/**
 * Query hook for fetching audit logs for a session.
 * @param sessionId - Session UUID
 * @param limit - Items per page (default: 50)
 * @param offset - Starting position (default: 0)
 */
export function useAuditLogsQuery(sessionId: string | undefined, limit = 50, offset = 0) {
  return createQuery<AuditLogListResponse, ApiError>({
    queryKey: queryKeys.auditLogs(sessionId ?? '', { limit, offset }),
    queryFn: () => apiClient.getAuditLogs(sessionId!, limit, offset),
    enabled: !!sessionId,
    staleTime: 15000, // 15 seconds - logs update on every operation
    gcTime: 60000, // 1 minute
  });
}

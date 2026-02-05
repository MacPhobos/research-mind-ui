import { z } from 'zod';
import { ApiError } from './errors';
import type { components } from './generated';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:15010';

// =============================================================================
// Type Aliases from Generated Types
// =============================================================================

export type SessionResponse = components['schemas']['SessionResponse'];
export type SessionListResponse = components['schemas']['SessionListResponse'];
export type CreateSessionRequest = components['schemas']['CreateSessionRequest'];
export type UpdateSessionRequest = components['schemas']['UpdateSessionRequest'];
export type IndexResultResponse = components['schemas']['IndexResultResponse'];
export type IndexStatusResponse = components['schemas']['IndexStatusResponse'];
export type IndexWorkspaceRequest = components['schemas']['IndexWorkspaceRequest'];
export type AuditLogListResponse = components['schemas']['AuditLogListResponse'];
export type AuditLogResponse = components['schemas']['AuditLogResponse'];
export type ContentItemResponse = components['schemas']['ContentItemResponse'];
export type ContentListResponse = components['schemas']['ContentListResponse'];
export type ChatMessageResponse = components['schemas']['ChatMessageResponse'];
export type ChatMessageListResponse = components['schemas']['ChatMessageListResponse'];
export type ChatMessageWithStreamUrlResponse = components['schemas']['ChatMessageWithStreamUrlResponse'];
export type SendChatMessageRequest = components['schemas']['SendChatMessageRequest'];

// Multi-URL feature types
export type ExtractLinksRequest = components['schemas']['ExtractLinksRequest'];
export type ExtractedLinkSchema = components['schemas']['ExtractedLinkSchema'];
export type CategorizedLinksSchema = components['schemas']['CategorizedLinksSchema'];
export type ExtractedLinksResponse = components['schemas']['ExtractedLinksResponse'];
export type BatchUrlItem = components['schemas']['BatchUrlItem'];
export type BatchAddContentRequest = components['schemas']['BatchAddContentRequest'];
export type BatchContentItemResponse = components['schemas']['BatchContentItemResponse'];
export type BatchContentResponse = components['schemas']['BatchContentResponse'];

// =============================================================================
// Zod Schemas for Runtime Validation
// =============================================================================

/** Version response schema */
const VersionResponseSchema = z.object({
  name: z.string().optional(),
  version: z.string(),
  git_sha: z.string().optional(),
  environment: z.string().optional(),
  timestamp: z.string().optional(),
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;

/** Session response schema */
const SessionResponseSchema = z.object({
  session_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  workspace_path: z.string(),
  created_at: z.string(),
  last_accessed: z.string(),
  status: z.string(),
  archived: z.boolean(),
  ttl_seconds: z.number().nullable().optional(),
  is_indexed: z.boolean(),
  content_count: z.number(),
});

/** Session list response schema */
const SessionListResponseSchema = z.object({
  sessions: z.array(SessionResponseSchema),
  count: z.number(),
});

/** Index result response schema */
const IndexResultResponseSchema = z.object({
  workspace_id: z.string(),
  success: z.boolean(),
  status: z.string(),
  elapsed_seconds: z.number(),
  stdout: z.string().nullable().optional(),
  stderr: z.string().nullable().optional(),
});

/** Index status response schema */
const IndexStatusResponseSchema = z.object({
  workspace_id: z.string(),
  is_indexed: z.boolean(),
  status: z.string(),
  message: z.string(),
});

/** Audit log response schema */
const AuditLogResponseSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  session_id: z.string(),
  action: z.string(),
  query: z.string().nullable().optional(),
  result_count: z.number().nullable().optional(),
  duration_ms: z.number().nullable().optional(),
  status: z.string(),
  error: z.string().nullable().optional(),
  metadata_json: z.record(z.unknown()).nullable().optional(),
});

/** Audit log list response schema */
const AuditLogListResponseSchema = z.object({
  logs: z.array(AuditLogResponseSchema),
  count: z.number(),
});

/** Content item response schema */
const ContentItemResponseSchema = z.object({
  content_id: z.string(),
  session_id: z.string(),
  content_type: z.string(),
  title: z.string(),
  source_ref: z.string().nullable().optional(),
  storage_path: z.string().nullable().optional(),
  status: z.string(),
  error_message: z.string().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  metadata_json: z.record(z.unknown()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Content list response schema */
const ContentListResponseSchema = z.object({
  items: z.array(ContentItemResponseSchema),
  count: z.number(),
});

/** Chat message response schema */
const ChatMessageResponseSchema = z.object({
  message_id: z.string(),
  session_id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  status: z.enum(['pending', 'streaming', 'completed', 'error']),
  error_message: z.string().nullable().optional(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
  token_count: z.number().nullable().optional(),
  duration_ms: z.number().nullable().optional(),
  metadata_json: z.record(z.unknown()).nullable().optional(),
});

/** Chat message with stream URL response schema */
const ChatMessageWithStreamUrlResponseSchema = ChatMessageResponseSchema.extend({
  stream_url: z.string().nullable().optional(),
});

/** Chat message list response schema */
const ChatMessageListResponseSchema = z.object({
  messages: z.array(ChatMessageResponseSchema),
  count: z.number(),
});

// =============================================================================
// Multi-URL Feature Schemas
// =============================================================================

/** Single extracted link schema */
const ExtractedLinkSchemaSchema = z.object({
  url: z.string(),
  text: z.string().nullable().optional(),
  is_external: z.boolean(),
  source_element: z.string().nullable().optional(),
});

/** Categorized links schema */
const CategorizedLinksSchemaSchema = z.object({
  main_content: z.array(ExtractedLinkSchemaSchema).optional(),
  navigation: z.array(ExtractedLinkSchemaSchema).optional(),
  sidebar: z.array(ExtractedLinkSchemaSchema).optional(),
  footer: z.array(ExtractedLinkSchemaSchema).optional(),
  other: z.array(ExtractedLinkSchemaSchema).optional(),
});

/** Extracted links response schema */
const ExtractedLinksResponseSchema = z.object({
  source_url: z.string(),
  page_title: z.string().nullable().optional(),
  extracted_at: z.string(),
  link_count: z.number(),
  categories: CategorizedLinksSchemaSchema,
});

/** Batch content item response schema */
const BatchContentItemResponseSchema = z.object({
  content_id: z.string().nullable().optional(),
  url: z.string(),
  status: z.enum(['success', 'error', 'duplicate']),
  title: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

/** Batch content response schema */
const BatchContentResponseSchema = z.object({
  session_id: z.string(),
  total_count: z.number(),
  success_count: z.number(),
  error_count: z.number(),
  duplicate_count: z.number(),
  items: z.array(BatchContentItemResponseSchema),
});

// =============================================================================
// API Client
// =============================================================================

export const apiClient = {
  // ---------------------------------------------------------------------------
  // Version
  // ---------------------------------------------------------------------------

  /**
   * Get API version information.
   */
  async getVersion(): Promise<VersionResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/version`);
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to fetch version', response);
    }
    const data = await response.json();
    return VersionResponseSchema.parse(data);
  },

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  /**
   * List sessions with pagination.
   * @param limit - Number of items per page (default: 20)
   * @param offset - Starting position (default: 0)
   */
  async listSessions(limit = 20, offset = 0): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/?${params}`);
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to list sessions', response);
    }
    const data = await response.json();
    return SessionListResponseSchema.parse(data);
  },

  /**
   * Get a single session by ID.
   * @param sessionId - Session UUID
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/${sessionId}`);
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to get session', response);
    }
    const data = await response.json();
    return SessionResponseSchema.parse(data);
  },

  /**
   * Create a new session.
   * @param request - Session creation request with name and optional description
   */
  async createSession(request: CreateSessionRequest): Promise<SessionResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to create session', response);
    }
    const data = await response.json();
    return SessionResponseSchema.parse(data);
  },

  /**
   * Update a session.
   * @param sessionId - Session UUID
   * @param request - Update request with optional name, description, status
   */
  async updateSession(
    sessionId: string,
    request: UpdateSessionRequest
  ): Promise<SessionResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to update session', response);
    }
    const data = await response.json();
    return SessionResponseSchema.parse(data);
  },

  /**
   * Delete a session and its workspace directory.
   * @param sessionId - Session UUID
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to delete session', response);
    }
    // 204 No Content - no body to parse
  },

  // ---------------------------------------------------------------------------
  // Content Management
  // ---------------------------------------------------------------------------

  /**
   * List content items for a session with pagination.
   * @param sessionId - Session UUID
   * @param limit - Number of items per page (default: 50)
   * @param offset - Starting position (default: 0)
   */
  async listContent(sessionId: string, limit = 50, offset = 0): Promise<ContentListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/content/?${params}`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to list content', response);
    }
    const data = await response.json();
    return ContentListResponseSchema.parse(data);
  },

  /**
   * Get a single content item by ID.
   * @param sessionId - Session UUID
   * @param contentId - Content UUID
   */
  async getContent(sessionId: string, contentId: string): Promise<ContentItemResponse> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/content/${contentId}`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to get content', response);
    }
    const data = await response.json();
    return ContentItemResponseSchema.parse(data);
  },

  /**
   * Add content to a session.
   * Uses FormData to support file uploads.
   * @param sessionId - Session UUID
   * @param contentType - Content type: text, file_upload, url, git_repo, mcp_source
   * @param options - Additional options (title, source, metadata, file)
   */
  async addContent(
    sessionId: string,
    contentType: string,
    options?: {
      title?: string;
      source?: string;
      metadata?: Record<string, unknown>;
      file?: File;
    }
  ): Promise<ContentItemResponse> {
    const formData = new FormData();
    formData.append('content_type', contentType);

    if (options?.title) {
      formData.append('title', options.title);
    }
    if (options?.source) {
      formData.append('source', options.source);
    }
    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }
    if (options?.file) {
      formData.append('file', options.file);
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/${sessionId}/content/`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to add content', response);
    }
    const data = await response.json();
    return ContentItemResponseSchema.parse(data);
  },

  /**
   * Delete a content item and its storage files.
   * @param sessionId - Session UUID
   * @param contentId - Content UUID
   */
  async deleteContent(sessionId: string, contentId: string): Promise<void> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/content/${contentId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to delete content', response);
    }
    // 204 No Content - no body to parse
  },

  // ---------------------------------------------------------------------------
  // Workspace Indexing
  // ---------------------------------------------------------------------------

  /**
   * Trigger indexing for a workspace (session).
   * @param workspaceId - Workspace/Session UUID
   * @param request - Optional indexing options (force, timeout)
   */
  async indexWorkspace(
    workspaceId: string,
    request?: IndexWorkspaceRequest
  ): Promise<IndexResultResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/workspaces/${workspaceId}/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: request ? JSON.stringify(request) : undefined,
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to index workspace', response);
    }
    const data = await response.json();
    return IndexResultResponseSchema.parse(data);
  },

  /**
   * Get the indexing status of a workspace.
   * @param workspaceId - Workspace/Session UUID
   */
  async getIndexStatus(workspaceId: string): Promise<IndexStatusResponse> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/workspaces/${workspaceId}/index/status`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to get index status', response);
    }
    const data = await response.json();
    return IndexStatusResponseSchema.parse(data);
  },

  // ---------------------------------------------------------------------------
  // Audit Logs
  // ---------------------------------------------------------------------------

  /**
   * Get audit logs for a session with pagination.
   * @param sessionId - Session UUID
   * @param limit - Number of items per page (default: 50)
   * @param offset - Starting position (default: 0)
   */
  async getAuditLogs(
    sessionId: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/audit?${params}`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to get audit logs', response);
    }
    const data = await response.json();
    return AuditLogListResponseSchema.parse(data);
  },

  // ---------------------------------------------------------------------------
  // Chat
  // ---------------------------------------------------------------------------

  /**
   * Send a chat message and get stream URL.
   * @param sessionId - Session UUID
   * @param content - Message content
   */
  async sendChatMessage(
    sessionId: string,
    content: string
  ): Promise<ChatMessageWithStreamUrlResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to send chat message', response);
    }
    const data = await response.json();
    return ChatMessageWithStreamUrlResponseSchema.parse(data);
  },

  /**
   * List chat messages for a session.
   * @param sessionId - Session UUID
   * @param limit - Number of items per page (default: 50)
   * @param offset - Starting position (default: 0)
   */
  async listChatMessages(
    sessionId: string,
    limit = 50,
    offset = 0
  ): Promise<ChatMessageListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/chat?${params}`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to list chat messages', response);
    }
    const data = await response.json();
    return ChatMessageListResponseSchema.parse(data);
  },

  /**
   * Get a single chat message by ID.
   * @param sessionId - Session UUID
   * @param messageId - Message UUID
   */
  async getChatMessage(
    sessionId: string,
    messageId: string
  ): Promise<ChatMessageResponse> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/chat/${messageId}`
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to get chat message', response);
    }
    const data = await response.json();
    return ChatMessageResponseSchema.parse(data);
  },

  /**
   * Delete a chat message.
   * @param sessionId - Session UUID
   * @param messageId - Message UUID
   */
  async deleteChatMessage(sessionId: string, messageId: string): Promise<void> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/chat/${messageId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to delete chat message', response);
    }
    // 204 No Content - no body to parse
  },

  /**
   * Clear all chat messages for a session.
   * @param sessionId - Session UUID
   */
  async clearChatHistory(sessionId: string): Promise<void> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/chat`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to clear chat history', response);
    }
    // 204 No Content - no body to parse
  },

  /**
   * Get the full SSE stream URL for a chat message.
   * @param streamUrl - Relative stream URL from sendChatMessage response
   */
  getFullStreamUrl(streamUrl: string): string {
    return `${apiBaseUrl}${streamUrl}`;
  },

  // ---------------------------------------------------------------------------
  // Multi-URL Feature
  // ---------------------------------------------------------------------------

  /**
   * Extract links from a URL for user selection.
   * @param request - Object containing url and optional include_external flag
   */
  async extractLinks(request: {
    url: string;
    include_external?: boolean;
  }): Promise<ExtractedLinksResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/content/extract-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: request.url,
        include_external: request.include_external ?? true,
      }),
    });
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to extract links', response);
    }
    const data = await response.json();
    return ExtractedLinksResponseSchema.parse(data);
  },

  /**
   * Add multiple URLs to a session in batch.
   * @param sessionId - Session UUID
   * @param request - Object containing urls array and optional source_url
   */
  async batchAddContent(
    sessionId: string,
    request: {
      urls: Array<{ url: string; title?: string }>;
      source_url?: string;
    }
  ): Promise<BatchContentResponse> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions/${sessionId}/content/batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: request.urls,
          source_url: request.source_url,
        }),
      }
    );
    if (!response.ok) {
      throw await ApiError.fromResponse('Failed to add content in batch', response);
    }
    const data = await response.json();
    return BatchContentResponseSchema.parse(data);
  },
};

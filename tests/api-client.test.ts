import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../src/lib/api/client';
import { ApiError } from '../src/lib/api/errors';
import { ZodError } from 'zod';

// Mock data factories
const createMockSession = (overrides = {}) => ({
  session_id: 'session-123',
  name: 'Test Session',
  description: 'A test session',
  workspace_path: '/workspaces/session-123',
  created_at: '2026-02-01T10:00:00Z',
  last_accessed: '2026-02-01T12:00:00Z',
  status: 'active',
  archived: false,
  ttl_seconds: null,
  is_indexed: false,
  content_count: 0,
  ...overrides,
});

const createMockContent = (overrides = {}) => ({
  content_id: 'content-456',
  session_id: 'session-123',
  content_type: 'text',
  title: 'Test Content',
  source_ref: 'Sample text content',
  storage_path: 'content.txt',
  status: 'ready',
  error_message: null,
  size_bytes: 100,
  mime_type: 'text/plain',
  metadata_json: null,
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  ...overrides,
});

const createMockAuditLog = (overrides = {}) => ({
  id: 1,
  timestamp: '2026-02-01T10:00:00Z',
  session_id: 'session-123',
  action: 'session_created',
  query: null,
  result_count: null,
  duration_ms: 15,
  status: 'success',
  error: null,
  metadata_json: null,
  ...overrides,
});

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // =========================================================================
  // Version
  // =========================================================================

  describe('getVersion', () => {
    it('should have getVersion method', () => {
      expect(apiClient.getVersion).toBeDefined();
      expect(typeof apiClient.getVersion).toBe('function');
    });

    it('should return version response on success', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: '1.0.0', environment: 'test' }),
        } as Response)
      );

      const result = await apiClient.getVersion();
      expect(result).toHaveProperty('version');
      expect(result.version).toBe('1.0.0');
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.getVersion()).rejects.toThrow(ApiError);
    });

    it('should throw ZodError on invalid response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }),
        } as Response)
      );

      await expect(apiClient.getVersion()).rejects.toThrow(ZodError);
    });
  });

  // =========================================================================
  // Sessions
  // =========================================================================

  describe('listSessions', () => {
    it('should return session list on success', async () => {
      const mockData = {
        sessions: [createMockSession()],
        count: 1,
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      );

      const result = await apiClient.listSessions();
      expect(result.sessions).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should use default limit=20 and offset=0', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions: [], count: 0 }),
        } as Response)
      );

      await apiClient.listSessions();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0')
      );
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Server Error',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.listSessions()).rejects.toThrow(ApiError);
    });

    it('should throw ZodError on invalid response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'structure' }),
        } as Response)
      );

      await expect(apiClient.listSessions()).rejects.toThrow(ZodError);
    });
  });

  describe('getSession', () => {
    it('should return session on success', async () => {
      const mockSession = createMockSession();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response)
      );

      const result = await apiClient.getSession('session-123');
      expect(result.session_id).toBe('session-123');
      expect(result.name).toBe('Test Session');
    });

    it('should throw ApiError with SESSION_NOT_FOUND on 404', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.getSession('nonexistent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('SESSION_NOT_FOUND');
      }
    });

    it('should throw ZodError on malformed response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ session_id: 123 }), // session_id should be string
        } as Response)
      );

      await expect(apiClient.getSession('session-123')).rejects.toThrow(ZodError);
    });
  });

  describe('createSession', () => {
    it('should return created session on success', async () => {
      const mockSession = createMockSession();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response)
      );

      const result = await apiClient.createSession({
        name: 'Test Session',
        description: 'A test session',
      });

      expect(result.session_id).toBe('session-123');
    });

    it('should use POST method with JSON content type', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockSession()),
        } as Response)
      );

      await apiClient.createSession({ name: 'Test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.createSession({ name: '' })).rejects.toThrow(ApiError);
    });
  });

  describe('updateSession', () => {
    it('should return updated session on success', async () => {
      const mockSession = createMockSession({ name: 'Updated Name' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response)
      );

      const result = await apiClient.updateSession('session-123', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should use PATCH method', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockSession()),
        } as Response)
      );

      await apiClient.updateSession('session-123', { name: 'New Name' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('deleteSession', () => {
    it('should complete without error on success', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await expect(apiClient.deleteSession('session-123')).resolves.toBeUndefined();
    });

    it('should use DELETE method', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await apiClient.deleteSession('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw ApiError on 404', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
              },
            }),
        } as Response)
      );

      await expect(apiClient.deleteSession('nonexistent')).rejects.toThrow(ApiError);
    });
  });

  // =========================================================================
  // Content Management
  // =========================================================================

  describe('listContent', () => {
    it('should return content list on success', async () => {
      const mockData = {
        items: [createMockContent()],
        count: 1,
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      );

      const result = await apiClient.listContent('session-123');
      expect(result.items).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should use default limit=50 and offset=0', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], count: 0 }),
        } as Response)
      );

      await apiClient.listContent('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0')
      );
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.listContent('session-123')).rejects.toThrow(ApiError);
    });
  });

  describe('getContent', () => {
    it('should return content item on success', async () => {
      const mockContent = createMockContent();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockContent),
        } as Response)
      );

      const result = await apiClient.getContent('session-123', 'content-456');
      expect(result.content_id).toBe('content-456');
    });

    it('should throw ApiError with CONTENT_NOT_FOUND on 404', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.getContent('session-123', 'nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('CONTENT_NOT_FOUND');
      }
    });
  });

  describe('addContent', () => {
    it('should return created content on success', async () => {
      const mockContent = createMockContent();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockContent),
        } as Response)
      );

      const result = await apiClient.addContent('session-123', 'text', {
        title: 'Test Content',
        source: 'Sample text',
      });

      expect(result.content_id).toBe('content-456');
    });

    it('should use FormData for request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockContent()),
        } as Response)
      );

      await apiClient.addContent('session-123', 'text', {
        title: 'Test',
        source: 'Content',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/content/'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should handle file upload', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockContent({ content_type: 'file_upload' })),
        } as Response)
      );

      const result = await apiClient.addContent('session-123', 'file_upload', {
        title: 'Uploaded File',
        file: mockFile,
      });

      expect(result.content_type).toBe('file_upload');
    });
  });

  describe('deleteContent', () => {
    it('should complete without error on success', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await expect(
        apiClient.deleteContent('session-123', 'content-456')
      ).resolves.toBeUndefined();
    });

    it('should use DELETE method', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await apiClient.deleteContent('session-123', 'content-456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/content/content-456'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  // =========================================================================
  // Workspace Indexing
  // =========================================================================

  describe('indexWorkspace', () => {
    it('should return index result on success', async () => {
      const mockResult = {
        workspace_id: 'workspace-123',
        success: true,
        status: 'completed',
        elapsed_seconds: 12.5,
        stdout: 'Indexed 100 files',
        stderr: null,
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResult),
        } as Response)
      );

      const result = await apiClient.indexWorkspace('workspace-123');
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });

    it('should handle optional request body', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              workspace_id: 'workspace-123',
              success: true,
              status: 'completed',
              elapsed_seconds: 10,
            }),
        } as Response)
      );

      // Without request body
      await apiClient.indexWorkspace('workspace-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: undefined })
      );

      // With request body
      await apiClient.indexWorkspace('workspace-123', { force: true, timeout: 120 });
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.any(String) })
      );
    });

    it('should throw ApiError on timeout', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'INDEXING_TIMEOUT', message: 'Indexing timed out' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.indexWorkspace('workspace-123');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('INDEXING_TIMEOUT');
      }
    });
  });

  describe('getIndexStatus', () => {
    it('should return index status on success', async () => {
      const mockStatus = {
        workspace_id: 'workspace-123',
        is_indexed: true,
        status: 'indexed',
        message: 'Workspace has been indexed',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        } as Response)
      );

      const result = await apiClient.getIndexStatus('workspace-123');
      expect(result.is_indexed).toBe(true);
      expect(result.status).toBe('indexed');
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.getIndexStatus('workspace-123')).rejects.toThrow(ApiError);
    });
  });

  // =========================================================================
  // Audit Logs
  // =========================================================================

  describe('getAuditLogs', () => {
    it('should return audit logs on success', async () => {
      const mockData = {
        logs: [createMockAuditLog()],
        count: 1,
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      );

      const result = await apiClient.getAuditLogs('session-123');
      expect(result.logs).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should use default limit=50 and offset=0', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ logs: [], count: 0 }),
        } as Response)
      );

      await apiClient.getAuditLogs('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0')
      );
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.getAuditLogs('session-123')).rejects.toThrow(ApiError);
    });

    it('should throw ZodError on malformed response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ logs: [{ invalid: 'structure' }] }),
        } as Response)
      );

      await expect(apiClient.getAuditLogs('session-123')).rejects.toThrow(ZodError);
    });
  });

  // =========================================================================
  // Chat
  // =========================================================================

  const createMockChatMessage = (overrides = {}) => ({
    message_id: 'msg-789',
    session_id: 'session-123',
    role: 'user',
    content: 'Hello, how can you help?',
    status: 'completed',
    error_message: null,
    created_at: '2026-02-01T10:00:00Z',
    completed_at: '2026-02-01T10:00:05Z',
    token_count: 10,
    duration_ms: 5000,
    metadata_json: null,
    ...overrides,
  });

  describe('sendChatMessage', () => {
    it('should return message with stream URL on success', async () => {
      const mockResponse = {
        ...createMockChatMessage({ role: 'assistant', status: 'pending', content: '' }),
        stream_url: '/api/v1/sessions/session-123/chat/stream/msg-789',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.sendChatMessage('session-123', 'Hello!');
      expect(result.stream_url).toBe('/api/v1/sessions/session-123/chat/stream/msg-789');
      expect(result.role).toBe('assistant');
    });

    it('should use POST method with JSON body', async () => {
      const mockResponse = {
        ...createMockChatMessage({ role: 'assistant', status: 'pending' }),
        stream_url: '/api/v1/sessions/session-123/chat/stream/msg-789',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await apiClient.sendChatMessage('session-123', 'Test message');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test message' }),
        })
      );
    });

    it('should throw ApiError on session not indexed', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'SESSION_NOT_INDEXED', message: 'Session must be indexed' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.sendChatMessage('session-123', 'Hello');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('SESSION_NOT_INDEXED');
      }
    });
  });

  describe('listChatMessages', () => {
    it('should return chat messages on success', async () => {
      const mockData = {
        messages: [
          createMockChatMessage(),
          createMockChatMessage({ message_id: 'msg-790', role: 'assistant' }),
        ],
        count: 2,
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      );

      const result = await apiClient.listChatMessages('session-123');
      expect(result.messages).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should use default limit=50 and offset=0', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [], count: 0 }),
        } as Response)
      );

      await apiClient.listChatMessages('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0')
      );
    });

    it('should respect custom limit and offset', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [], count: 0 }),
        } as Response)
      );

      await apiClient.listChatMessages('session-123', 20, 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10')
      );
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.listChatMessages('session-123')).rejects.toThrow(ApiError);
    });
  });

  describe('getChatMessage', () => {
    it('should return single chat message on success', async () => {
      const mockMessage = createMockChatMessage();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessage),
        } as Response)
      );

      const result = await apiClient.getChatMessage('session-123', 'msg-789');
      expect(result.message_id).toBe('msg-789');
      expect(result.content).toBe('Hello, how can you help?');
    });

    it('should throw ApiError on message not found', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'CHAT_MESSAGE_NOT_FOUND', message: 'Message not found' },
              },
            }),
        } as Response)
      );

      await expect(apiClient.getChatMessage('session-123', 'nonexistent')).rejects.toThrow(
        ApiError
      );
    });
  });

  describe('deleteChatMessage', () => {
    it('should complete without error on success', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await expect(
        apiClient.deleteChatMessage('session-123', 'msg-789')
      ).resolves.toBeUndefined();
    });

    it('should use DELETE method', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await apiClient.deleteChatMessage('session-123', 'msg-789');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/chat/msg-789'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('clearChatHistory', () => {
    it('should complete without error on success (204)', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await expect(apiClient.clearChatHistory('session-123')).resolves.toBeUndefined();
    });

    it('should use DELETE method on session chat endpoint', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
        } as Response)
      );

      await apiClient.clearChatHistory('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/chat'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw ApiError on 404 (session not found)', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.clearChatHistory('nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('SESSION_NOT_FOUND');
      }
    });

    it('should throw ApiError on HTTP error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(apiClient.clearChatHistory('session-123')).rejects.toThrow(ApiError);
    });
  });

  describe('getFullStreamUrl', () => {
    it('should prepend API base URL to stream URL', () => {
      const streamUrl = '/api/v1/sessions/session-123/chat/stream/msg-789';
      const fullUrl = apiClient.getFullStreamUrl(streamUrl);

      expect(fullUrl).toContain(streamUrl);
      expect(fullUrl).toMatch(/^https?:\/\//);
    });
  });
});

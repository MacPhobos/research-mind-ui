import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../src/lib/api/client';
import { ApiError } from '../src/lib/api/errors';

describe('Chat Export API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // =========================================================================
  // exportChatHistory
  // =========================================================================

  describe('exportChatHistory', () => {
    it('should return blob and filename for markdown export', async () => {
      const mockBlob = new Blob(['# Chat Export\n\nTest content'], { type: 'text/markdown' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="chat-export-session-123-2026-02-04.md"',
            'Content-Type': 'text/markdown',
          }),
        } as Response)
      );

      const result = await apiClient.exportChatHistory('session-123', {
        format: 'markdown',
        include_metadata: true,
        include_timestamps: true,
      });

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('chat-export-session-123-2026-02-04.md');
    });

    it('should return blob and filename for PDF export', async () => {
      const mockBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="chat-export-session-123-2026-02-04.pdf"',
            'Content-Type': 'application/pdf',
          }),
        } as Response)
      );

      const result = await apiClient.exportChatHistory('session-123', {
        format: 'pdf',
        include_metadata: false,
        include_timestamps: false,
      });

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('chat-export-session-123-2026-02-04.pdf');
    });

    it('should use default filename if Content-Disposition header missing', async () => {
      const mockBlob = new Blob(['# Chat Export'], { type: 'text/markdown' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({}),
        } as Response)
      );

      const result = await apiClient.exportChatHistory('session-abc', {
        format: 'markdown',
      });

      expect(result.filename).toBe('chat-export-session-abc.md');
    });

    it('should use default PDF filename if Content-Disposition header missing', async () => {
      const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({}),
        } as Response)
      );

      const result = await apiClient.exportChatHistory('session-xyz', {
        format: 'pdf',
      });

      expect(result.filename).toBe('chat-export-session-xyz.pdf');
    });

    it('should use POST method with JSON body', async () => {
      const mockBlob = new Blob(['test']);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({}),
        } as Response)
      );

      await apiClient.exportChatHistory('session-123', {
        format: 'markdown',
        include_metadata: true,
        include_timestamps: false,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/chat/export'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'markdown',
            include_metadata: true,
            include_timestamps: false,
          }),
        })
      );
    });

    it('should throw ApiError on session not found', async () => {
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
        await apiClient.exportChatHistory('nonexistent-session', { format: 'markdown' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('SESSION_NOT_FOUND');
      }
    });

    it('should throw ApiError on no chat messages', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'NO_CHAT_MESSAGES', message: 'No chat messages found' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.exportChatHistory('empty-session', { format: 'pdf' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NO_CHAT_MESSAGES');
      }
    });
  });

  // =========================================================================
  // exportSingleMessage
  // =========================================================================

  describe('exportSingleMessage', () => {
    it('should return blob and filename for markdown Q/A export', async () => {
      const mockBlob = new Blob(['# Q&A Export\n\nQ: Test?\nA: Answer'], { type: 'text/markdown' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="qa-export-msg-123-2026-02-04.md"',
            'Content-Type': 'text/markdown',
          }),
        } as Response)
      );

      const result = await apiClient.exportSingleMessage('session-123', 'msg-123', {
        format: 'markdown',
        include_metadata: true,
        include_timestamps: true,
      });

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('qa-export-msg-123-2026-02-04.md');
    });

    it('should return blob and filename for PDF Q/A export', async () => {
      const mockBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="qa-export-msg-456-2026-02-04.pdf"',
            'Content-Type': 'application/pdf',
          }),
        } as Response)
      );

      const result = await apiClient.exportSingleMessage('session-123', 'msg-456', {
        format: 'pdf',
      });

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('qa-export-msg-456-2026-02-04.pdf');
    });

    it('should use default filename if Content-Disposition header missing', async () => {
      const mockBlob = new Blob(['# Q&A'], { type: 'text/markdown' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({}),
        } as Response)
      );

      const result = await apiClient.exportSingleMessage('session-abc', 'msg-xyz', {
        format: 'markdown',
      });

      expect(result.filename).toBe('qa-export-msg-xyz.md');
    });

    it('should use POST method with correct URL and body', async () => {
      const mockBlob = new Blob(['test']);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
          headers: new Headers({}),
        } as Response)
      );

      await apiClient.exportSingleMessage('session-123', 'msg-456', {
        format: 'pdf',
        include_metadata: false,
        include_timestamps: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-123/chat/msg-456/export'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'pdf',
            include_metadata: false,
            include_timestamps: true,
          }),
        })
      );
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

      try {
        await apiClient.exportSingleMessage('session-123', 'nonexistent-msg', { format: 'markdown' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('CHAT_MESSAGE_NOT_FOUND');
      }
    });

    it('should throw ApiError on not an assistant message', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'NOT_ASSISTANT_MESSAGE', message: 'Can only export assistant messages' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.exportSingleMessage('session-123', 'user-msg', { format: 'markdown' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NOT_ASSISTANT_MESSAGE');
      }
    });

    it('should throw ApiError on export generation failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () =>
            Promise.resolve({
              detail: {
                error: { code: 'EXPORT_GENERATION_FAILED', message: 'Failed to generate export' },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.exportSingleMessage('session-123', 'msg-123', { format: 'pdf' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('EXPORT_GENERATION_FAILED');
      }
    });
  });
});

// =========================================================================
// Download Utility
// =========================================================================

describe('downloadBlob utility', () => {
  it('should export downloadBlob function', async () => {
    const { downloadBlob } = await import('../src/lib/utils/download');
    expect(downloadBlob).toBeDefined();
    expect(typeof downloadBlob).toBe('function');
  });

  it('should trigger file download', async () => {
    const { downloadBlob } = await import('../src/lib/utils/download');

    // Mock URL methods since jsdom doesn't have them
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:test-url');
    URL.revokeObjectURL = vi.fn();

    // Mock document methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

    const blob = new Blob(['test content'], { type: 'text/plain' });
    downloadBlob(blob, 'test-file.txt');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('blob:test-url');
    expect(mockLink.download).toBe('test-file.txt');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

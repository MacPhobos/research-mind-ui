import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../src/lib/api/client';
import { ApiError } from '../src/lib/api/errors';

describe('Multi-URL API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractLinks', () => {
    it('should extract links from URL successfully', async () => {
      const mockResponse = {
        source_url: 'https://example.com/docs/',
        page_title: 'Documentation Index',
        extracted_at: '2026-02-04T10:30:00Z',
        link_count: 15,
        categories: {
          main_content: [
            {
              url: 'https://example.com/docs/getting-started',
              text: 'Getting Started',
              is_external: false,
              source_element: 'main',
            },
          ],
          navigation: [],
          sidebar: [],
          footer: [],
          other: [],
        },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.extractLinks({
        url: 'https://example.com/docs/',
        include_external: true,
      });

      expect(result.source_url).toBe('https://example.com/docs/');
      expect(result.link_count).toBe(15);
      expect(result.categories.main_content).toHaveLength(1);
      expect(result.categories.main_content?.[0].url).toBe(
        'https://example.com/docs/getting-started'
      );
      expect(result.categories.main_content?.[0].is_external).toBe(false);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/content/extract-links'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'https://example.com/docs/',
            include_external: true,
          }),
        })
      );
    });

    it('should use include_external true by default', async () => {
      const mockResponse = {
        source_url: 'https://example.com/',
        page_title: 'Example',
        extracted_at: '2026-02-04T10:30:00Z',
        link_count: 5,
        categories: {
          main_content: [],
          navigation: [],
          sidebar: [],
          footer: [],
          other: [],
        },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await apiClient.extractLinks({ url: 'https://example.com/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            url: 'https://example.com/',
            include_external: true,
          }),
        })
      );
    });

    it('should handle extraction failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'EXTRACTION_FAILED',
                  message: 'Failed to fetch page',
                },
              },
            }),
        } as Response)
      );

      await expect(
        apiClient.extractLinks({ url: 'https://invalid.example.com/' })
      ).rejects.toThrow('Failed to fetch page');
    });

    it('should handle invalid URL error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'INVALID_URL',
                  message: 'URL is malformed',
                },
              },
            }),
        } as Response)
      );

      await expect(apiClient.extractLinks({ url: 'not-a-valid-url' })).rejects.toThrow(
        'URL is malformed'
      );
    });

    it('should handle timeout error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 408,
          statusText: 'Request Timeout',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'TIMEOUT',
                  message: 'Request timed out',
                },
              },
            }),
        } as Response)
      );

      await expect(
        apiClient.extractLinks({ url: 'https://slow.example.com/' })
      ).rejects.toThrow('Request timed out');
    });

    it('should handle empty categories response', async () => {
      const mockResponse = {
        source_url: 'https://example.com/',
        page_title: null,
        extracted_at: '2026-02-04T10:30:00Z',
        link_count: 0,
        categories: {},
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.extractLinks({ url: 'https://example.com/' });

      expect(result.link_count).toBe(0);
      expect(result.page_title).toBeNull();
    });
  });

  describe('batchAddContent', () => {
    it('should batch add URLs successfully', async () => {
      const mockResponse = {
        session_id: 'test-session-123',
        total_count: 3,
        success_count: 2,
        error_count: 1,
        duplicate_count: 0,
        items: [
          {
            content_id: 'content-1',
            url: 'https://example.com/docs/page1',
            status: 'success',
            title: 'Page 1',
            error: null,
          },
          {
            content_id: 'content-2',
            url: 'https://example.com/docs/page2',
            status: 'success',
            title: 'Page 2',
            error: null,
          },
          {
            content_id: null,
            url: 'https://example.com/docs/private',
            status: 'error',
            title: null,
            error: 'HTTP 403: Forbidden',
          },
        ],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.batchAddContent('test-session-123', {
        urls: [
          { url: 'https://example.com/docs/page1', title: 'Page 1' },
          { url: 'https://example.com/docs/page2', title: 'Page 2' },
          { url: 'https://example.com/docs/private' },
        ],
        source_url: 'https://example.com/docs/',
      });

      expect(result.session_id).toBe('test-session-123');
      expect(result.total_count).toBe(3);
      expect(result.success_count).toBe(2);
      expect(result.error_count).toBe(1);
      expect(result.items).toHaveLength(3);
      expect(result.items[0].status).toBe('success');
      expect(result.items[2].status).toBe('error');
      expect(result.items[2].error).toBe('HTTP 403: Forbidden');
    });

    it('should send correct request format', async () => {
      const mockResponse = {
        session_id: 'session-123',
        total_count: 1,
        success_count: 1,
        error_count: 0,
        duplicate_count: 0,
        items: [
          {
            content_id: 'content-1',
            url: 'https://example.com/page',
            status: 'success',
            title: 'Page',
            error: null,
          },
        ],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await apiClient.batchAddContent('session-123', {
        urls: [{ url: 'https://example.com/page', title: 'Page' }],
        source_url: 'https://example.com/',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/session-123/content/batch'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: [{ url: 'https://example.com/page', title: 'Page' }],
            source_url: 'https://example.com/',
          }),
        })
      );
    });

    it('should handle session not found', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'SESSION_NOT_FOUND',
                  message: "Session 'invalid-id' not found",
                },
              },
            }),
        } as Response)
      );

      await expect(
        apiClient.batchAddContent('invalid-id', {
          urls: [{ url: 'https://example.com/page' }],
        })
      ).rejects.toThrow("Session 'invalid-id' not found");
    });

    it('should handle too many URLs error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'TOO_MANY_URLS',
                  message: 'Maximum 50 URLs allowed',
                },
              },
            }),
        } as Response)
      );

      const tooManyUrls = Array.from({ length: 51 }, (_, i) => ({
        url: `https://example.com/page${i}`,
      }));

      await expect(
        apiClient.batchAddContent('session-123', { urls: tooManyUrls })
      ).rejects.toThrow('Maximum 50 URLs allowed');
    });

    it('should handle duplicate URLs', async () => {
      const mockResponse = {
        session_id: 'session-123',
        total_count: 2,
        success_count: 1,
        error_count: 0,
        duplicate_count: 1,
        items: [
          {
            content_id: 'content-1',
            url: 'https://example.com/new',
            status: 'success',
            title: 'New Page',
            error: null,
          },
          {
            content_id: null,
            url: 'https://example.com/existing',
            status: 'duplicate',
            title: null,
            error: 'URL already exists in session',
          },
        ],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.batchAddContent('session-123', {
        urls: [
          { url: 'https://example.com/new' },
          { url: 'https://example.com/existing' },
        ],
      });

      expect(result.duplicate_count).toBe(1);
      expect(result.items[1].status).toBe('duplicate');
      expect(result.items[1].error).toBe('URL already exists in session');
    });

    it('should handle request without source_url', async () => {
      const mockResponse = {
        session_id: 'session-123',
        total_count: 1,
        success_count: 1,
        error_count: 0,
        duplicate_count: 0,
        items: [
          {
            content_id: 'content-1',
            url: 'https://example.com/page',
            status: 'success',
            title: 'Page',
            error: null,
          },
        ],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await apiClient.batchAddContent('session-123', {
        urls: [{ url: 'https://example.com/page' }],
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            urls: [{ url: 'https://example.com/page' }],
            source_url: undefined,
          }),
        })
      );
    });

    it('should handle partial success response', async () => {
      const mockResponse = {
        session_id: 'session-123',
        total_count: 5,
        success_count: 3,
        error_count: 1,
        duplicate_count: 1,
        items: [
          { content_id: 'c1', url: 'https://example.com/1', status: 'success', title: 'Page 1', error: null },
          { content_id: 'c2', url: 'https://example.com/2', status: 'success', title: 'Page 2', error: null },
          { content_id: 'c3', url: 'https://example.com/3', status: 'success', title: 'Page 3', error: null },
          { content_id: null, url: 'https://example.com/4', status: 'error', title: null, error: 'Connection timeout' },
          { content_id: null, url: 'https://example.com/5', status: 'duplicate', title: null, error: 'Already exists' },
        ],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiClient.batchAddContent('session-123', {
        urls: [
          { url: 'https://example.com/1' },
          { url: 'https://example.com/2' },
          { url: 'https://example.com/3' },
          { url: 'https://example.com/4' },
          { url: 'https://example.com/5' },
        ],
      });

      // Verify counts
      expect(result.success_count + result.error_count + result.duplicate_count).toBe(
        result.total_count
      );

      // Verify we can filter by status
      const successItems = result.items.filter((item) => item.status === 'success');
      const errorItems = result.items.filter((item) => item.status === 'error');
      const duplicateItems = result.items.filter((item) => item.status === 'duplicate');

      expect(successItems).toHaveLength(3);
      expect(errorItems).toHaveLength(1);
      expect(duplicateItems).toHaveLength(1);
    });

    it('should handle server error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An unexpected error occurred',
                },
              },
            }),
        } as Response)
      );

      await expect(
        apiClient.batchAddContent('session-123', {
          urls: [{ url: 'https://example.com/page' }],
        })
      ).rejects.toThrow('An unexpected error occurred');
    });
  });

  describe('ApiError handling', () => {
    it('should create ApiError with correct properties', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'SESSION_NOT_FOUND',
                  message: "Session 'test' not found",
                },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.extractLinks({ url: 'https://example.com/' });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe('SESSION_NOT_FOUND');
        expect(apiError.isNotFound()).toBe(true);
      }
    });

    it('should handle validation errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 422,
          statusText: 'Unprocessable Entity',
          json: () =>
            Promise.resolve({
              detail: {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid request body',
                },
              },
            }),
        } as Response)
      );

      try {
        await apiClient.batchAddContent('session-123', { urls: [] });
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.isValidationError()).toBe(true);
      }
    });
  });
});

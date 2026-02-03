import { describe, it, expect, vi } from 'vitest';
import { ApiError, ErrorCodes } from '../src/lib/api/errors';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should set status, statusText, message, and name', () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
      } as Response;

      const error = new ApiError('Session not found', mockResponse);

      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.message).toBe('Session not found: 404 Not Found');
    });
  });

  describe('fromResponse', () => {
    it('should parse error code from JSON body', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          detail: {
            error: {
              code: 'SESSION_NOT_FOUND',
              message: "Session 'test-id' not found",
            },
          },
        }),
      } as unknown as Response;

      const error = await ApiError.fromResponse('Failed to get session', mockResponse);

      expect(error.code).toBe('SESSION_NOT_FOUND');
      expect(error.message).toBe("Session 'test-id' not found");
      expect(error.status).toBe(404);
    });

    it('should handle non-JSON body gracefully', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      const error = await ApiError.fromResponse('Server error', mockResponse);

      expect(error.code).toBeUndefined();
      expect(error.status).toBe(500);
      expect(error.message).toBe('Server error: 500 Internal Server Error');
    });

    it('should handle JSON body without error.code', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Validation failed' }),
      } as unknown as Response;

      const error = await ApiError.fromResponse('Validation error', mockResponse);

      expect(error.code).toBeUndefined();
      expect(error.status).toBe(400);
    });
  });

  describe('helper methods', () => {
    it('isCode should check error code', () => {
      const mockResponse = { status: 404, statusText: 'Not Found' } as Response;
      const error = new ApiError('Error', mockResponse);
      error.code = 'SESSION_NOT_FOUND';

      expect(error.isCode('SESSION_NOT_FOUND')).toBe(true);
      expect(error.isCode('CONTENT_NOT_FOUND')).toBe(false);
    });

    it('isNotFound should return true for 404', () => {
      const mockResponse = { status: 404, statusText: 'Not Found' } as Response;
      const error = new ApiError('Error', mockResponse);

      expect(error.isNotFound()).toBe(true);
    });

    it('isNotFound should return false for non-404', () => {
      const mockResponse = { status: 500, statusText: 'Server Error' } as Response;
      const error = new ApiError('Error', mockResponse);

      expect(error.isNotFound()).toBe(false);
    });

    it('isValidationError should return true for 400 and 422', () => {
      const mockResponse400 = { status: 400, statusText: 'Bad Request' } as Response;
      const mockResponse422 = { status: 422, statusText: 'Unprocessable Entity' } as Response;
      const mockResponse404 = { status: 404, statusText: 'Not Found' } as Response;

      expect(new ApiError('Error', mockResponse400).isValidationError()).toBe(true);
      expect(new ApiError('Error', mockResponse422).isValidationError()).toBe(true);
      expect(new ApiError('Error', mockResponse404).isValidationError()).toBe(false);
    });

    it('isServerError should return true for 5xx errors', () => {
      const mockResponse500 = { status: 500, statusText: 'Server Error' } as Response;
      const mockResponse502 = { status: 502, statusText: 'Bad Gateway' } as Response;
      const mockResponse404 = { status: 404, statusText: 'Not Found' } as Response;

      expect(new ApiError('Error', mockResponse500).isServerError()).toBe(true);
      expect(new ApiError('Error', mockResponse502).isServerError()).toBe(true);
      expect(new ApiError('Error', mockResponse404).isServerError()).toBe(false);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.SESSION_NOT_FOUND).toBe('SESSION_NOT_FOUND');
      expect(ErrorCodes.CONTENT_NOT_FOUND).toBe('CONTENT_NOT_FOUND');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.INVALID_METADATA).toBe('INVALID_METADATA');
      expect(ErrorCodes.WORKSPACE_NOT_FOUND).toBe('WORKSPACE_NOT_FOUND');
      expect(ErrorCodes.TOOL_NOT_FOUND).toBe('TOOL_NOT_FOUND');
      expect(ErrorCodes.INDEXING_TIMEOUT).toBe('INDEXING_TIMEOUT');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});

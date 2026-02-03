/**
 * API Error class for structured error handling.
 *
 * Captures HTTP status, status text, and optionally parses error detail from the response body.
 * All API client methods use this class instead of generic Error.
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  code?: string;

  constructor(message: string, response: Response) {
    super(`${message}: ${response.status} ${response.statusText}`);
    this.name = 'ApiError';
    this.status = response.status;
    this.statusText = response.statusText;
  }

  /**
   * Create an ApiError from a Response, attempting to parse error details from JSON body.
   *
   * Expected error format from backend:
   * {
   *   "detail": {
   *     "error": {
   *       "code": "SESSION_NOT_FOUND",
   *       "message": "Session 'nonexistent-id' not found"
   *     }
   *   }
   * }
   */
  static async fromResponse(message: string, response: Response): Promise<ApiError> {
    const error = new ApiError(message, response);
    try {
      const body = await response.json();
      if (body?.detail?.error?.code) {
        error.code = body.detail.error.code;
        error.message = body.detail.error.message || error.message;
      }
    } catch {
      // Response body was not JSON - use default message
    }
    return error;
  }

  /**
   * Check if error matches a specific error code.
   */
  isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if this is a not found error (404).
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if this is a validation error (400 or 422).
   */
  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  /**
   * Check if this is a server error (5xx).
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * Standard error codes from the API contract.
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_METADATA: 'INVALID_METADATA',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  INDEXING_TIMEOUT: 'INDEXING_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

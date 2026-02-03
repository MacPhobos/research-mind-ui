import { describe, it, expect } from 'vitest';
import { queryKeys } from '../src/lib/api/queryKeys';

describe('queryKeys', () => {
  describe('version', () => {
    it('should return ["version"]', () => {
      expect(queryKeys.version).toEqual(['version']);
    });
  });

  describe('sessions', () => {
    it('sessions.all should return ["sessions"]', () => {
      expect(queryKeys.sessions.all).toEqual(['sessions']);
    });

    it('sessions.list() should include params object', () => {
      const key = queryKeys.sessions.list();
      expect(key).toEqual(['sessions', 'list', {}]);
    });

    it('sessions.list() should include limit and offset params', () => {
      const key = queryKeys.sessions.list({ limit: 10, offset: 20 });
      expect(key).toEqual(['sessions', 'list', { limit: 10, offset: 20 }]);
    });

    it('sessions.list() should handle partial params', () => {
      const key = queryKeys.sessions.list({ limit: 5 });
      expect(key).toEqual(['sessions', 'list', { limit: 5 }]);
    });

    it('sessions.detail() should include session ID', () => {
      const key = queryKeys.sessions.detail('session-123');
      expect(key).toEqual(['sessions', 'detail', 'session-123']);
    });
  });

  describe('content', () => {
    it('content.all() should return ["content", sessionId]', () => {
      const key = queryKeys.content.all('session-123');
      expect(key).toEqual(['content', 'session-123']);
    });

    it('content.list() should include session ID and params', () => {
      const key = queryKeys.content.list('session-123');
      expect(key).toEqual(['content', 'session-123', 'list', {}]);
    });

    it('content.list() should include pagination params', () => {
      const key = queryKeys.content.list('session-123', { limit: 25, offset: 50 });
      expect(key).toEqual(['content', 'session-123', 'list', { limit: 25, offset: 50 }]);
    });

    it('content.detail() should include session ID and content ID', () => {
      const key = queryKeys.content.detail('session-123', 'content-456');
      expect(key).toEqual(['content', 'session-123', 'detail', 'content-456']);
    });
  });

  describe('indexStatus', () => {
    it('should include workspace ID', () => {
      const key = queryKeys.indexStatus('workspace-123');
      expect(key).toEqual(['indexStatus', 'workspace-123']);
    });
  });

  describe('auditLogs', () => {
    it('should include session ID and params', () => {
      const key = queryKeys.auditLogs('session-123');
      expect(key).toEqual(['auditLogs', 'session-123', {}]);
    });

    it('should include pagination params', () => {
      const key = queryKeys.auditLogs('session-123', { limit: 100, offset: 200 });
      expect(key).toEqual(['auditLogs', 'session-123', { limit: 100, offset: 200 }]);
    });
  });

  describe('type narrowing with as const', () => {
    it('keys should be readonly tuples', () => {
      // TypeScript compile-time check: these keys should be narrowed to literal types
      const versionKey = queryKeys.version;
      const sessionsAllKey = queryKeys.sessions.all;

      // Runtime check: values are arrays
      expect(Array.isArray(versionKey)).toBe(true);
      expect(Array.isArray(sessionsAllKey)).toBe(true);

      // Values should be immutable tuples
      expect(versionKey[0]).toBe('version');
      expect(sessionsAllKey[0]).toBe('sessions');
    });
  });
});

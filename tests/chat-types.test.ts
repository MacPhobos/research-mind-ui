import { describe, it, expect } from 'vitest';
import {
  ChatStreamEventType,
  ChatStreamStage,
  parseEventType,
  getStageForEventType,
  formatSystemEvent,
} from '../src/lib/types/chat';

describe('Chat Types', () => {
  describe('ChatStreamEventType enum', () => {
    it('should have all expected event types', () => {
      expect(ChatStreamEventType.START).toBe('start');
      expect(ChatStreamEventType.INIT_TEXT).toBe('init_text');
      expect(ChatStreamEventType.SYSTEM_INIT).toBe('system_init');
      expect(ChatStreamEventType.SYSTEM_HOOK).toBe('system_hook');
      expect(ChatStreamEventType.STREAM_TOKEN).toBe('stream_token');
      expect(ChatStreamEventType.ASSISTANT).toBe('assistant');
      expect(ChatStreamEventType.RESULT).toBe('result');
      expect(ChatStreamEventType.ERROR).toBe('error');
      expect(ChatStreamEventType.HEARTBEAT).toBe('heartbeat');
      expect(ChatStreamEventType.CHUNK).toBe('chunk');
      expect(ChatStreamEventType.COMPLETE).toBe('complete');
    });
  });

  describe('ChatStreamStage enum', () => {
    it('should have expandable and primary stages', () => {
      expect(ChatStreamStage.EXPANDABLE).toBe(1);
      expect(ChatStreamStage.PRIMARY).toBe(2);
    });
  });

  describe('parseEventType', () => {
    it('should parse known event types', () => {
      expect(parseEventType('start')).toBe(ChatStreamEventType.START);
      expect(parseEventType('init_text')).toBe(ChatStreamEventType.INIT_TEXT);
      expect(parseEventType('system_init')).toBe(ChatStreamEventType.SYSTEM_INIT);
      expect(parseEventType('system_hook')).toBe(ChatStreamEventType.SYSTEM_HOOK);
      expect(parseEventType('stream_token')).toBe(ChatStreamEventType.STREAM_TOKEN);
      expect(parseEventType('assistant')).toBe(ChatStreamEventType.ASSISTANT);
      expect(parseEventType('result')).toBe(ChatStreamEventType.RESULT);
      expect(parseEventType('error')).toBe(ChatStreamEventType.ERROR);
      expect(parseEventType('heartbeat')).toBe(ChatStreamEventType.HEARTBEAT);
    });

    it('should parse legacy event types', () => {
      expect(parseEventType('chunk')).toBe(ChatStreamEventType.CHUNK);
      expect(parseEventType('complete')).toBe(ChatStreamEventType.COMPLETE);
    });

    it('should return CHUNK for unknown event types', () => {
      expect(parseEventType('unknown')).toBe(ChatStreamEventType.CHUNK);
      expect(parseEventType('')).toBe(ChatStreamEventType.CHUNK);
    });
  });

  describe('getStageForEventType', () => {
    it('should classify Stage 2 (primary) events correctly', () => {
      expect(getStageForEventType(ChatStreamEventType.ASSISTANT)).toBe(ChatStreamStage.PRIMARY);
      expect(getStageForEventType(ChatStreamEventType.RESULT)).toBe(ChatStreamStage.PRIMARY);
    });

    it('should classify Stage 1 (expandable) events correctly', () => {
      expect(getStageForEventType(ChatStreamEventType.INIT_TEXT)).toBe(ChatStreamStage.EXPANDABLE);
      expect(getStageForEventType(ChatStreamEventType.SYSTEM_INIT)).toBe(ChatStreamStage.EXPANDABLE);
      expect(getStageForEventType(ChatStreamEventType.SYSTEM_HOOK)).toBe(ChatStreamStage.EXPANDABLE);
      expect(getStageForEventType(ChatStreamEventType.STREAM_TOKEN)).toBe(ChatStreamStage.EXPANDABLE);
      expect(getStageForEventType(ChatStreamEventType.CHUNK)).toBe(ChatStreamStage.EXPANDABLE);
    });

    it('should default to Stage 1 for unknown event types', () => {
      expect(getStageForEventType(ChatStreamEventType.START)).toBe(ChatStreamStage.EXPANDABLE);
      expect(getStageForEventType(ChatStreamEventType.HEARTBEAT)).toBe(ChatStreamStage.EXPANDABLE);
    });
  });

  describe('formatSystemEvent', () => {
    it('should format hook_started event', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_HOOK,
        '',
        { subtype: 'hook_started', hook_name: 'SessionStart:startup' }
      );
      expect(result).toBe('[Hook] SessionStart:startup started');
    });

    it('should format hook_response event', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_HOOK,
        '',
        { subtype: 'hook_response', hook_name: 'SessionStart:startup', outcome: 'success' }
      );
      expect(result).toBe('[Hook] SessionStart:startup success');
    });

    it('should format system_init event with model', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_INIT,
        '',
        { model: 'claude-opus-4-5-20251101' }
      );
      expect(result).toBe('[Init] Session initialized (model: claude-opus-4-5-20251101)');
    });

    it('should format system_init event without model', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_INIT,
        '',
        {}
      );
      expect(result).toBe('[Init] Session initialized');
    });

    it('should return content for other event types', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.INIT_TEXT,
        'Claude MPM starting...',
        {}
      );
      expect(result).toBe('Claude MPM starting...');
    });

    it('should handle missing hook_name gracefully', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_HOOK,
        '',
        { subtype: 'hook_started' }
      );
      expect(result).toBe('[Hook] unknown started');
    });

    it('should handle hook_response without outcome', () => {
      const result = formatSystemEvent(
        ChatStreamEventType.SYSTEM_HOOK,
        '',
        { subtype: 'hook_response', hook_name: 'TestHook' }
      );
      expect(result).toBe('[Hook] TestHook completed');
    });
  });
});

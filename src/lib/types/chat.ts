/**
 * Chat streaming types for two-stage response display.
 *
 * Stage 1 (Expandable): Full process output in collapsible accordion (real-time streaming)
 * Stage 2 (Primary): Final answer shown prominently
 */

/**
 * SSE event types for chat streaming.
 */
export enum ChatStreamEventType {
  /** Session started, message_id returned */
  START = 'start',
  /** Plain text initialization line (claude-mpm banner, agent sync, etc.) - Stage 1 */
  INIT_TEXT = 'init_text',
  /** JSON system initialization event (cwd, tools, model, etc.) - Stage 1 */
  SYSTEM_INIT = 'system_init',
  /** JSON hook start/complete event - Stage 1 */
  SYSTEM_HOOK = 'system_hook',
  /** Token-by-token streaming delta (if available) - Stage 1 */
  STREAM_TOKEN = 'stream_token',
  /** Complete assistant message (may arrive before result) - Stage 2 */
  ASSISTANT = 'assistant',
  /** Final result with full metadata (tokens, duration, cost) - Stage 2 */
  RESULT = 'result',
  /** Error occurred */
  ERROR = 'error',
  /** Keep-alive ping */
  HEARTBEAT = 'heartbeat',
  /** Legacy chunk event (for backwards compatibility during transition) */
  CHUNK = 'chunk',
  /** Legacy complete event (for backwards compatibility during transition) */
  COMPLETE = 'complete',
}

/**
 * Stage classification for chat stream events.
 */
export enum ChatStreamStage {
  /** Plain text + system JSON -> collapsible accordion */
  EXPANDABLE = 1,
  /** Assistant answer + result -> main display */
  PRIMARY = 2,
}

/**
 * A structured source citation returned by the backend.
 */
export interface SourceCitation {
  file_path: string;
  content_id?: string;
  title: string;
  /** Original URL of the content item (from DB) */
  source_url?: string;
  /** Human-readable title of the content item (from DB) */
  content_title?: string;
  /** Content type: "url", "document", "text", etc. */
  content_type?: string;
}

/**
 * Metadata from the result event.
 */
export interface ChatResultMetadata {
  /** Output tokens from usage */
  token_count?: number;
  /** Input tokens from usage */
  input_tokens?: number;
  /** Cache read input tokens */
  cache_read_tokens?: number;
  /** Total duration in milliseconds */
  duration_ms?: number;
  /** API call duration in milliseconds */
  duration_api_ms?: number;
  /** Total cost in USD */
  cost_usd?: number;
  /** Claude session ID */
  session_id?: string;
  /** Number of conversation turns */
  num_turns?: number;
  /** Structured source citations from the backend */
  sources?: SourceCitation[];
}

/**
 * Chunk data from SSE stream.
 */
export interface ChatStreamChunk {
  /** Content of the chunk */
  content: string;
  /** Type of event */
  event_type: ChatStreamEventType;
  /** Stage classification (1 = expandable, 2 = primary) */
  stage: ChatStreamStage;
  /** Original JSON event for debugging/formatting */
  raw_json?: Record<string, unknown>;
  /** Metadata (only present on RESULT events) */
  metadata?: ChatResultMetadata;
  /** Message ID (present on START, COMPLETE, RESULT events) */
  message_id?: string;
}

/**
 * Maps event type string to ChatStreamEventType enum.
 */
export function parseEventType(eventType: string): ChatStreamEventType {
  const mapping: Record<string, ChatStreamEventType> = {
    start: ChatStreamEventType.START,
    init_text: ChatStreamEventType.INIT_TEXT,
    system_init: ChatStreamEventType.SYSTEM_INIT,
    system_hook: ChatStreamEventType.SYSTEM_HOOK,
    stream_token: ChatStreamEventType.STREAM_TOKEN,
    assistant: ChatStreamEventType.ASSISTANT,
    result: ChatStreamEventType.RESULT,
    error: ChatStreamEventType.ERROR,
    heartbeat: ChatStreamEventType.HEARTBEAT,
    chunk: ChatStreamEventType.CHUNK,
    complete: ChatStreamEventType.COMPLETE,
  };

  return mapping[eventType] ?? ChatStreamEventType.CHUNK;
}

/**
 * Determines the stage for an event type.
 */
export function getStageForEventType(eventType: ChatStreamEventType): ChatStreamStage {
  switch (eventType) {
    // Stage 2: Primary answer
    case ChatStreamEventType.ASSISTANT:
    case ChatStreamEventType.RESULT:
      return ChatStreamStage.PRIMARY;

    // Stage 1: Expandable content (all others)
    case ChatStreamEventType.INIT_TEXT:
    case ChatStreamEventType.SYSTEM_INIT:
    case ChatStreamEventType.SYSTEM_HOOK:
    case ChatStreamEventType.STREAM_TOKEN:
    case ChatStreamEventType.CHUNK:
    default:
      return ChatStreamStage.EXPANDABLE;
  }
}

/**
 * Formats a system event for display in the expandable section.
 */
export function formatSystemEvent(
  eventType: ChatStreamEventType,
  content: string,
  rawJson?: Record<string, unknown>
): string {
  if (eventType === ChatStreamEventType.SYSTEM_HOOK && rawJson) {
    const subtype = rawJson.subtype as string;
    const hookName = rawJson.hook_name as string;
    if (subtype === 'hook_started') {
      return `[Hook] ${hookName || 'unknown'} started`;
    } else if (subtype === 'hook_response') {
      const outcome = rawJson.outcome as string;
      return `[Hook] ${hookName || 'unknown'} ${outcome || 'completed'}`;
    }
  }

  if (eventType === ChatStreamEventType.SYSTEM_INIT && rawJson) {
    const model = rawJson.model as string;
    return `[Init] Session initialized${model ? ` (model: ${model})` : ''}`;
  }

  return content;
}

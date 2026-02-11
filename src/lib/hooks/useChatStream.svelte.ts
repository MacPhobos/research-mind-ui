/**
 * Svelte 5 Runes-based hook for handling SSE chat streams.
 *
 * Uses EventSource to connect to the backend's SSE endpoint and
 * provides two-stage content accumulation:
 * - Stage 1 (expandable): Full process output (plain text init + system JSON)
 * - Stage 2 (primary): Clean final answer
 */

import { apiClient } from '$lib/api/client';
import {
  ChatStreamEventType,
  parseEventType,
  formatSystemEvent,
  type ChatResultMetadata,
  type SourceCitation,
  type ProgressEvent,
} from '$lib/types/chat';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface StreamState {
  /** Stage 1 content (expandable accordion) */
  stage1Content: string;
  /** Stage 2 content (primary answer) */
  stage2Content: string;
  /** Current status */
  status: StreamStatus;
  /** Error message if any */
  error: string | null;
  /** Message ID */
  messageId: string | null;
  /** Result metadata */
  metadata: ChatResultMetadata | null;

  // Legacy properties for backwards compatibility
  /** @deprecated Use stage2Content instead */
  content: string;
  /** @deprecated Use metadata.token_count instead */
  tokenCount: number | null;
  /** @deprecated Use metadata.duration_ms instead */
  durationMs: number | null;
}

/**
 * Creates a reactive SSE stream handler using Svelte 5 Runes.
 *
 * @param onComplete - Callback when stream completes successfully
 * @returns Object with state getters and control functions
 */
export function createChatStream(onComplete?: () => void) {
  // Reactive state using $state - Two-stage content
  let stage1Content = $state('');
  let stage2Content = $state('');
  let status = $state<StreamStatus>('idle');
  let error = $state<string | null>(null);
  let messageId = $state<string | null>(null);
  let metadata = $state<ChatResultMetadata | null>(null);
  let latestProgress = $state<ProgressEvent | null>(null);

  // Store reference to EventSource for cleanup
  let eventSource: EventSource | null = null;

  /**
   * Handle an SSE event based on its type.
   */
  function handleEvent(eventType: ChatStreamEventType, data: Record<string, unknown>): void {
    switch (eventType) {
      case ChatStreamEventType.START:
        // Reset state at start
        stage1Content = '';
        stage2Content = '';
        metadata = null;
        latestProgress = null;
        messageId = (data.message_id as string) ?? null;
        status = 'streaming';
        break;

      // Stage 1: Expandable content
      case ChatStreamEventType.INIT_TEXT:
        stage1Content += (data.content as string) + '\n';
        break;

      case ChatStreamEventType.SYSTEM_INIT:
      case ChatStreamEventType.SYSTEM_HOOK: {
        // Format system events for display
        const formatted = formatSystemEvent(
          eventType,
          (data.content as string) ?? '',
          (data.raw_json as Record<string, unknown>) ?? data
        );
        stage1Content += formatted + '\n';
        break;
      }

      case ChatStreamEventType.STREAM_TOKEN:
        // Token streaming (Stage 1)
        stage1Content += data.content as string ?? '';
        break;

      // Stage 2: Primary answer
      case ChatStreamEventType.ASSISTANT:
        stage2Content = data.content as string ?? '';
        break;

      case ChatStreamEventType.RESULT:
        // Final answer with metadata
        stage2Content = data.content as string ?? data.result as string ?? stage2Content;
        metadata = extractMetadata(data);
        messageId = (data.message_id as string) ?? messageId;
        latestProgress = null;
        status = 'completed';
        eventSource?.close();
        eventSource = null;
        onComplete?.();
        break;

      // Legacy: 'chunk' event (backwards compatibility)
      case ChatStreamEventType.CHUNK:
        // Treat as Stage 1 content (legacy behavior accumulates to expandable)
        if (data.content) {
          stage1Content += (data.content as string) + '\n';
        }
        break;

      // Legacy: 'complete' event (backwards compatibility)
      case ChatStreamEventType.COMPLETE:
        messageId = (data.message_id as string) ?? messageId;
        // CRITICAL: Extract content from complete event as fallback
        // This ensures content is captured even if assistant/result events were missed
        if (data.content && typeof data.content === 'string') {
          // Only update if we don't already have stage2 content
          if (!stage2Content) {
            stage2Content = data.content;
          }
        }
        // Extract metadata from complete event
        // The backend sends rich metadata inside data.metadata (including sources)
        // as well as top-level token_count/duration_ms for legacy compatibility
        {
          const eventMetadata = data.metadata as Record<string, unknown> | undefined;
          metadata = {
            token_count: (eventMetadata?.token_count as number | undefined) ??
              (data.token_count as number | undefined),
            duration_ms: (eventMetadata?.duration_ms as number | undefined) ??
              (data.duration_ms as number | undefined),
            cost_usd: eventMetadata?.cost_usd as number | undefined,
            session_id: eventMetadata?.session_id as string | undefined,
            num_turns: eventMetadata?.num_turns as number | undefined,
            input_tokens: eventMetadata?.input_tokens as number | undefined,
            cache_read_tokens: eventMetadata?.cache_read_tokens as number | undefined,
            sources: eventMetadata?.sources as SourceCitation[] | undefined,
          };
        }
        status = 'completed';
        eventSource?.close();
        eventSource = null;
        onComplete?.();
        break;

      case ChatStreamEventType.PROGRESS: {
        try {
          const progressData = JSON.parse(data.content as string) as ProgressEvent;
          latestProgress = progressData;
        } catch {
          // Ignore malformed progress events
        }
        break;
      }

      case ChatStreamEventType.ERROR:
        error = (data.error as string) || 'Stream error occurred';
        messageId = (data.message_id as string) ?? messageId;
        status = 'error';
        eventSource?.close();
        eventSource = null;
        break;

      case ChatStreamEventType.HEARTBEAT:
        // Heartbeat received - connection is alive
        break;
    }
  }

  /**
   * Extract metadata from a result event.
   */
  function extractMetadata(data: Record<string, unknown>): ChatResultMetadata {
    const usage = data.usage as Record<string, unknown> | undefined;
    const nestedMetadata = data.metadata as Record<string, unknown> | undefined;
    return {
      duration_ms: data.duration_ms as number | undefined,
      duration_api_ms: data.duration_api_ms as number | undefined,
      cost_usd: data.total_cost_usd as number | undefined,
      session_id: data.session_id as string | undefined,
      num_turns: data.num_turns as number | undefined,
      token_count: usage?.output_tokens as number | undefined,
      input_tokens: usage?.input_tokens as number | undefined,
      cache_read_tokens: usage?.cache_read_input_tokens as number | undefined,
      sources: (data.sources as SourceCitation[] | undefined) ??
        (nestedMetadata?.sources as SourceCitation[] | undefined),
    };
  }

  /**
   * Connect to the SSE stream for a given stream URL.
   */
  function connect(streamUrl: string | null | undefined): void {
    // Clean up any existing connection
    disconnect();

    if (!streamUrl) {
      return;
    }

    // Reset state
    stage1Content = '';
    stage2Content = '';
    status = 'connecting';
    error = null;
    metadata = null;
    latestProgress = null;

    // Get full URL from the API client
    const fullUrl = apiClient.getFullStreamUrl(streamUrl);

    try {
      eventSource = new EventSource(fullUrl);

      // Handle SSE events by type
      const eventTypes = [
        'start',
        'init_text',
        'system_init',
        'system_hook',
        'stream_token',
        'assistant',
        'result',
        'progress',
        'error',
        'heartbeat',
        'chunk',     // Legacy
        'complete',  // Legacy
      ];

      for (const eventType of eventTypes) {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            handleEvent(parseEventType(eventType), data);
          } catch (e) {
            console.error(`Failed to parse ${eventType} event:`, event.data, e);
          }
        });
      }

      // Handle generic EventSource errors (connection issues)
      eventSource.onerror = () => {
        if (status === 'connecting' || status === 'streaming') {
          error = 'Connection lost';
          status = 'error';
          disconnect();
        }
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to connect';
      status = 'error';
    }
  }

  /**
   * Disconnect from the SSE stream.
   */
  function disconnect(): void {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  /**
   * Reset the stream state to initial values.
   */
  function reset(): void {
    disconnect();
    stage1Content = '';
    stage2Content = '';
    status = 'idle';
    error = null;
    messageId = null;
    metadata = null;
    latestProgress = null;
  }

  // Return reactive getters and control functions
  return {
    // Two-stage content getters
    get stage1Content() {
      return stage1Content;
    },
    get stage2Content() {
      return stage2Content;
    },
    get metadata() {
      return metadata;
    },
    get latestProgress() {
      return latestProgress;
    },

    // Status getters
    get status() {
      return status;
    },
    get error() {
      return error;
    },
    get messageId() {
      return messageId;
    },
    get isStreaming() {
      return status === 'streaming' || status === 'connecting';
    },
    get isComplete() {
      return status === 'completed';
    },
    get hasError() {
      return status === 'error';
    },

    // Legacy getters for backwards compatibility
    /** @deprecated Use stage2Content instead */
    get content() {
      // Return stage2Content if available, otherwise stage1Content (legacy behavior)
      return stage2Content || stage1Content;
    },
    /** @deprecated Use metadata.token_count instead */
    get tokenCount() {
      return metadata?.token_count ?? null;
    },
    /** @deprecated Use metadata.duration_ms instead */
    get durationMs() {
      return metadata?.duration_ms ?? null;
    },

    // Control functions
    connect,
    disconnect,
    reset,
  };
}

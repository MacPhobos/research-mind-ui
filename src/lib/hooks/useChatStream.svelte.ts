/**
 * Svelte 5 Runes-based hook for handling SSE chat streams.
 *
 * Uses EventSource to connect to the backend's SSE endpoint and
 * accumulates streamed content in real-time.
 */

import { apiClient } from '$lib/api/client';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface StreamState {
  content: string;
  status: StreamStatus;
  error: string | null;
  messageId: string | null;
  tokenCount: number | null;
  durationMs: number | null;
}

/**
 * Creates a reactive SSE stream handler using Svelte 5 Runes.
 *
 * @param onComplete - Callback when stream completes successfully
 * @returns Object with state getters and control functions
 */
export function createChatStream(onComplete?: () => void) {
  // Reactive state using $state
  let content = $state('');
  let status = $state<StreamStatus>('idle');
  let error = $state<string | null>(null);
  let messageId = $state<string | null>(null);
  let tokenCount = $state<number | null>(null);
  let durationMs = $state<number | null>(null);

  // Store reference to EventSource for cleanup
  let eventSource: EventSource | null = null;

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
    content = '';
    status = 'connecting';
    error = null;
    tokenCount = null;
    durationMs = null;

    // Get full URL from the API client
    const fullUrl = apiClient.getFullStreamUrl(streamUrl);

    try {
      eventSource = new EventSource(fullUrl);

      // Handle SSE events
      eventSource.addEventListener('start', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          messageId = data.message_id;
          status = 'streaming';
        } catch {
          console.error('Failed to parse start event:', event.data);
        }
      });

      eventSource.addEventListener('chunk', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          // Append the content with a newline if content exists
          if (data.content) {
            content += data.content + '\n';
          }
        } catch {
          console.error('Failed to parse chunk event:', event.data);
        }
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          messageId = data.message_id;
          tokenCount = data.token_count ?? null;
          durationMs = data.duration_ms ?? null;
          status = 'completed';
          disconnect();
          onComplete?.();
        } catch {
          console.error('Failed to parse complete event:', event.data);
        }
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          error = data.error || 'Stream error occurred';
          messageId = data.message_id;
          status = 'error';
          disconnect();
        } catch {
          // Not a JSON error event - could be connection error
          error = 'Connection error';
          status = 'error';
          disconnect();
        }
      });

      // Handle heartbeat (just log for now, no state change)
      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received - connection is alive
      });

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
    content = '';
    status = 'idle';
    error = null;
    messageId = null;
    tokenCount = null;
    durationMs = null;
  }

  // Return reactive getters and control functions
  return {
    // Getters for reactive state
    get content() {
      return content;
    },
    get status() {
      return status;
    },
    get error() {
      return error;
    },
    get messageId() {
      return messageId;
    },
    get tokenCount() {
      return tokenCount;
    },
    get durationMs() {
      return durationMs;
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

    // Control functions
    connect,
    disconnect,
    reset,
  };
}

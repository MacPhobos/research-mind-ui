<script lang="ts">
  import { Send, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-svelte';
  import { useChatMessagesQuery, useSendChatMessageMutation } from '$lib/api/hooks';
  import { createChatStream } from '$lib/hooks/useChatStream.svelte';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { queryKeys } from '$lib/api/queryKeys';
  import ChatMessage from './ChatMessage.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import type { ChatMessageResponse } from '$lib/api/client';

  interface Props {
    sessionId: string;
    isIndexed: boolean;
  }

  let { sessionId, isIndexed }: Props = $props();

  // Form state
  let inputContent = $state('');
  let textareaElement: HTMLTextAreaElement | null = $state(null);
  let messagesContainer: HTMLDivElement | null = $state(null);

  // Query client for invalidation
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const messagesQuery = useChatMessagesQuery(sessionId);
  const sendMutation = useSendChatMessageMutation();

  // SSE stream handler
  const stream = createChatStream(() => {
    // On stream complete, refetch messages
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.all(sessionId),
    });
  });

  // Streaming message placeholder for display
  const streamingMessage = $derived<ChatMessageResponse | null>(
    stream.isStreaming || (stream.isComplete && stream.content)
      ? {
          message_id: stream.messageId || 'streaming',
          session_id: sessionId,
          role: 'assistant',
          content: stream.content,
          status: stream.isStreaming ? 'streaming' : 'completed',
          error_message: stream.error,
          created_at: new Date().toISOString(),
          completed_at: null,
          token_count: stream.tokenCount,
          duration_ms: stream.durationMs,
          metadata_json: null,
        }
      : null
  );

  // Combined messages: API messages + streaming message if active
  const displayMessages = $derived(() => {
    const apiMessages = $messagesQuery.data?.messages ?? [];

    // If streaming, filter out the pending assistant message and add streaming one
    if (streamingMessage && stream.messageId) {
      const filtered = apiMessages.filter((m) => m.message_id !== stream.messageId);
      return [...filtered, streamingMessage];
    }

    return apiMessages;
  });

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    // Trigger on displayMessages change
    const _trigger = displayMessages();
    if (messagesContainer) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesContainer?.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
    }
  });

  // Handle form submission
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const content = inputContent.trim();
    if (!content || $sendMutation.isPending || stream.isStreaming) {
      return;
    }

    // Clear input immediately for better UX
    inputContent = '';

    // Reset stream state
    stream.reset();

    try {
      // Send the message
      const response = await $sendMutation.mutateAsync({ sessionId, content });

      // Connect to the SSE stream if stream_url is provided
      if (response.stream_url) {
        stream.connect(response.stream_url);
      }
    } catch (err) {
      // Error is handled by TanStack Query
      console.error('Failed to send message:', err);
    }

    // Refocus textarea
    textareaElement?.focus();
  }

  // Handle Ctrl+Enter or Cmd+Enter to submit
  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      const form = textareaElement?.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  }

  // Refresh messages
  function refreshMessages() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.all(sessionId),
    });
  }

  // Check if sending is disabled
  const isSendDisabled = $derived(
    !inputContent.trim() ||
      $sendMutation.isPending ||
      stream.isStreaming ||
      !isIndexed
  );
</script>

<div class="session-chat">
  {#if !isIndexed}
    <!-- Not indexed warning -->
    <div class="not-indexed-warning">
      <AlertCircle size={20} />
      <div class="warning-content">
        <p class="warning-title">Session not indexed</p>
        <p class="warning-text">
          Index your session content first to enable chat functionality.
        </p>
      </div>
    </div>
  {/if}

  <!-- Messages area -->
  <div class="messages-area" bind:this={messagesContainer}>
    {#if $messagesQuery.isPending}
      <div class="loading-state">
        <LoadingSpinner size="md" />
        <span>Loading messages...</span>
      </div>
    {:else if $messagesQuery.isError}
      <div class="error-state">
        <AlertCircle size={24} />
        <p>Failed to load messages</p>
        <p class="error-detail">{$messagesQuery.error?.message}</p>
        <button type="button" class="retry-btn" onclick={refreshMessages}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    {:else if displayMessages().length === 0}
      <div class="empty-state">
        <MessageSquare size={48} class="empty-icon" />
        <p class="empty-title">No messages yet</p>
        <p class="empty-text">
          {isIndexed
            ? 'Start a conversation about your session content.'
            : 'Index your session to start chatting.'}
        </p>
      </div>
    {:else}
      <div class="messages-list">
        {#each displayMessages() as message (message.message_id)}
          <ChatMessage
            {message}
            isStreaming={stream.isStreaming && message.message_id === stream.messageId}
            streamContent={message.message_id === stream.messageId ? stream.content : ''}
          />
        {/each}
      </div>
    {/if}

    {#if stream.hasError && stream.error}
      <div class="stream-error">
        <AlertCircle size={16} />
        <span>{stream.error}</span>
      </div>
    {/if}
  </div>

  <!-- Input area -->
  <form class="input-area" onsubmit={handleSubmit}>
    <div class="input-wrapper">
      <textarea
        bind:this={textareaElement}
        bind:value={inputContent}
        onkeydown={handleKeydown}
        placeholder={isIndexed
          ? 'Ask about your session content...'
          : 'Index session to enable chat'}
        rows={3}
        disabled={!isIndexed || stream.isStreaming}
        class="message-input"
      ></textarea>
    </div>

    <div class="input-actions">
      <span class="input-hint">
        {#if stream.isStreaming}
          <Loader2 size={14} class="spinner" />
          Generating response...
        {:else}
          Press Ctrl+Enter to send
        {/if}
      </span>
      <button
        type="submit"
        disabled={isSendDisabled}
        class="send-btn"
      >
        {#if $sendMutation.isPending}
          <Loader2 size={18} class="spinner" />
        {:else}
          <Send size={18} />
        {/if}
        Send
      </button>
    </div>
  </form>
</div>

<style>
  .session-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
    max-height: 600px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }

  .not-indexed-warning {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--warning-bg, rgba(245, 158, 11, 0.1));
    border-bottom: 1px solid var(--border-color);
    color: var(--warning-color, #d97706);
  }

  .warning-content {
    flex: 1;
  }

  .warning-title {
    margin: 0 0 var(--space-1) 0;
    font-weight: 600;
    font-size: var(--font-size-sm);
  }

  .warning-text {
    margin: 0;
    font-size: var(--font-size-xs);
    opacity: 0.8;
  }

  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-2);
  }

  .error-state {
    color: var(--error-color);
  }

  .error-detail {
    font-size: var(--font-size-xs);
    opacity: 0.8;
    margin: 0;
  }

  .retry-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .retry-btn:hover {
    background: var(--bg-hover);
  }

  .empty-state :global(.empty-icon) {
    color: var(--text-muted);
    opacity: 0.5;
  }

  .empty-title {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .empty-text {
    margin: var(--space-1) 0 0 0;
    font-size: var(--font-size-sm);
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .stream-error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding: var(--space-3);
    background: var(--error-bg, rgba(239, 68, 68, 0.1));
    border-radius: var(--border-radius-md);
    color: var(--error-color);
    font-size: var(--font-size-sm);
  }

  .input-area {
    border-top: 1px solid var(--border-color);
    padding: var(--space-4);
    background: var(--bg-primary);
  }

  .input-wrapper {
    margin-bottom: var(--space-3);
  }

  .message-input {
    width: 100%;
    padding: var(--space-3);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    resize: vertical;
    min-height: 60px;
    max-height: 200px;
    transition: border-color var(--transition-fast);
  }

  .message-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .message-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .message-input::placeholder {
    color: var(--text-muted);
  }

  .input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .input-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .input-hint :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .send-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--primary-color);
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .send-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @media (max-width: 480px) {
    .session-chat {
      max-height: none;
    }

    .input-actions {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
    }

    .input-hint {
      justify-content: center;
    }

    .send-btn {
      justify-content: center;
    }
  }
</style>

<script lang="ts">
  import { User, Bot, AlertCircle, Loader2 } from 'lucide-svelte';
  import { formatRelativeTime } from '$lib/utils/format';
  import type { ChatMessageResponse } from '$lib/api/client';

  interface Props {
    message: ChatMessageResponse;
    isStreaming?: boolean;
    streamContent?: string;
  }

  let { message, isStreaming = false, streamContent = '' }: Props = $props();

  // Determine which content to display
  const displayContent = $derived(
    isStreaming && streamContent ? streamContent : message.content
  );

  // Determine role styling
  const isUser = $derived(message.role === 'user');
  const isError = $derived(message.status === 'error');
  const isPending = $derived(message.status === 'pending');
</script>

<div class="chat-message" class:user={isUser} class:assistant={!isUser} class:error={isError}>
  <div class="message-avatar">
    {#if isUser}
      <User size={18} />
    {:else}
      <Bot size={18} />
    {/if}
  </div>

  <div class="message-content">
    <div class="message-header">
      <span class="message-role">{isUser ? 'You' : 'Assistant'}</span>
      <span class="message-time">{formatRelativeTime(message.created_at)}</span>
      {#if isStreaming}
        <span class="streaming-indicator">
          <Loader2 size={12} class="spinner" />
          Typing...
        </span>
      {/if}
    </div>

    <div class="message-body">
      {#if isError}
        <div class="error-content">
          <AlertCircle size={16} />
          <span>{message.error_message || 'An error occurred'}</span>
        </div>
      {:else if isPending && !isStreaming}
        <div class="pending-content">
          <Loader2 size={16} class="spinner" />
          <span>Waiting for response...</span>
        </div>
      {:else if displayContent}
        <div class="text-content">
          {#each displayContent.split('\n') as line, i}
            {#if line.trim()}
              <p>{line}</p>
            {:else if i < displayContent.split('\n').length - 1}
              <br />
            {/if}
          {/each}
        </div>
      {:else}
        <div class="empty-content">
          <span class="placeholder">No content</span>
        </div>
      {/if}
    </div>

    {#if message.token_count || message.duration_ms}
      <div class="message-meta">
        {#if message.token_count}
          <span class="meta-item">{message.token_count} tokens</span>
        {/if}
        {#if message.duration_ms}
          <span class="meta-item">{(message.duration_ms / 1000).toFixed(1)}s</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .chat-message {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--border-radius-lg);
    transition: background var(--transition-fast);
  }

  .chat-message.user {
    background: var(--bg-secondary);
  }

  .chat-message.assistant {
    background: var(--bg-tertiary, var(--bg-hover));
  }

  .chat-message.error {
    background: var(--error-bg, rgba(239, 68, 68, 0.1));
  }

  .message-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-full, 9999px);
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  .chat-message.user .message-avatar {
    background: var(--primary-color);
    color: white;
  }

  .chat-message.assistant .message-avatar {
    background: var(--bg-active);
    color: var(--text-primary);
  }

  .message-content {
    flex: 1;
    min-width: 0;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .message-role {
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .message-time {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .streaming-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-xs);
    color: var(--primary-color);
    margin-left: auto;
  }

  .streaming-indicator :global(.spinner) {
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

  .message-body {
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--text-primary);
  }

  .text-content p {
    margin: 0 0 var(--space-2) 0;
  }

  .text-content p:last-child {
    margin-bottom: 0;
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    color: var(--error-color);
  }

  .pending-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
  }

  .pending-content :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  .empty-content {
    color: var(--text-muted);
    font-style: italic;
  }

  .message-meta {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
</style>

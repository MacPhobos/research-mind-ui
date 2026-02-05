<script lang="ts">
  import { slide } from 'svelte/transition';
  import { User, Bot, AlertCircle, Loader2, ChevronRight, ChevronDown, Download } from 'lucide-svelte';
  import { formatRelativeTime, formatDuration } from '$lib/utils/format';
  import type { ChatMessageResponse, ChatExportFormat } from '$lib/api/client';
  import type { ChatResultMetadata } from '$lib/types/chat';
  import { useExportSingleMessageMutation } from '$lib/api/hooks';
  import { downloadBlob } from '$lib/utils/download';
  import { toastStore } from '$lib/stores/toast';
  import ExportDialog from './ExportDialog.svelte';
  import MarkdownContent from './MarkdownContent.svelte';

  interface Props {
    message: ChatMessageResponse;
    sessionId?: string;
    isStreaming?: boolean;
    /** @deprecated Use stage1Content and stage2Content instead */
    streamContent?: string;
    /** Stage 1 content (expandable process output) */
    stage1Content?: string;
    /** Stage 2 content (primary answer) */
    stage2Content?: string;
    /** Metadata from streaming result */
    streamMetadata?: ChatResultMetadata | null;
  }

  let {
    message,
    sessionId = '',
    isStreaming = false,
    streamContent = '',
    stage1Content = '',
    stage2Content = '',
    streamMetadata = null,
  }: Props = $props();

  // Expandable accordion state
  let expanded = $state(false);

  // Export dialog state
  let showExportDialog = $state(false);
  const exportMutation = useExportSingleMessageMutation();

  // Determine which content to display for primary area
  const displayContent = $derived(() => {
    // If streaming with two-stage, prefer stage2Content
    if (isStreaming || stage2Content || stage1Content) {
      return stage2Content || '';
    }
    // Legacy: use streamContent if provided
    if (streamContent) {
      return streamContent;
    }
    // Default to message content
    return message.content;
  });

  // Check if we have expandable content
  const hasExpandableContent = $derived(stage1Content.length > 0);

  // Determine role styling
  const isUser = $derived(message.role === 'user');
  const isError = $derived(message.status === 'error');
  const isPending = $derived(message.status === 'pending');

  // Get metadata for display (prefer streaming metadata, fall back to message)
  const displayMetadata = $derived(() => {
    if (streamMetadata) {
      return {
        token_count: streamMetadata.token_count,
        duration_ms: streamMetadata.duration_ms,
        cost_usd: streamMetadata.cost_usd,
        input_tokens: streamMetadata.input_tokens,
      };
    }
    return {
      token_count: message.token_count,
      duration_ms: message.duration_ms,
      cost_usd: undefined,
      input_tokens: undefined,
    };
  });

  // Toggle accordion with keyboard support
  function handleAccordionKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      expanded = !expanded;
    }
  }

  // Export handlers
  function openExportDialog() {
    showExportDialog = true;
  }

  async function handleExport(
    format: ChatExportFormat,
    includeMetadata: boolean,
    includeTimestamps: boolean
  ) {
    if (!sessionId) {
      toastStore.error('Session ID is required for export');
      return;
    }
    try {
      const response = await $exportMutation.mutateAsync({
        sessionId,
        messageId: message.message_id,
        request: {
          format,
          include_metadata: includeMetadata,
          include_timestamps: includeTimestamps,
        },
      });
      downloadBlob(response.blob, response.filename);
      toastStore.success(`Q&A exported as ${format.toUpperCase()}`);
      showExportDialog = false;
    } catch (err) {
      console.error('Failed to export message:', err);
      toastStore.error('Failed to export message');
    }
  }

  function handleExportCancel() {
    showExportDialog = false;
  }

  // Check if export is available (assistant messages only, not streaming)
  const canExport = $derived(!isUser && !isStreaming && sessionId && message.status === 'completed');
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
      {#if canExport}
        <button
          type="button"
          class="export-message-btn"
          onclick={openExportDialog}
          title="Export this Q&A"
          disabled={$exportMutation.isPending}
        >
          {#if $exportMutation.isPending}
            <Loader2 size={21} class="spinner" />
          {:else}
            <Download size={21} />
          {/if}
        </button>
      {/if}
    </div>

    <!-- Stage 1: Expandable Process Output (only for assistant messages) -->
    {#if !isUser && hasExpandableContent}
      <div class="expandable-section">
        <button
          type="button"
          class="expand-toggle"
          onclick={() => (expanded = !expanded)}
          onkeydown={handleAccordionKeydown}
          aria-expanded={expanded}
          aria-controls="stage1-content"
        >
          <span class="toggle-icon">
            {#if expanded}
              <ChevronDown size={14} />
            {:else}
              <ChevronRight size={14} />
            {/if}
          </span>
          <span class="toggle-text">Full Process Output</span>
          {#if isStreaming}
            <span class="streaming-dot" aria-label="Streaming"></span>
          {/if}
        </button>

        {#if expanded}
          <pre
            id="stage1-content"
            class="stage1-content"
            transition:slide={{ duration: 200 }}
          >{stage1Content}</pre>
        {/if}
      </div>
    {/if}

    <!-- Stage 2: Primary Answer / Main Content -->
    <div class="message-body">
      {#if isError}
        <div class="error-content">
          <AlertCircle size={16} />
          <span>{message.error_message || 'An error occurred'}</span>
        </div>
      {:else if isPending && !isStreaming && !stage1Content}
        <div class="pending-content">
          <Loader2 size={16} class="spinner" />
          <span>Waiting for response...</span>
        </div>
      {:else if displayContent()}
        {#if isUser}
          <!-- User messages: plain text rendering -->
          <div class="text-content">
            {#each displayContent().split('\n') as line, i}
              {#if line.trim()}
                <p>{line}</p>
              {:else if i < displayContent().split('\n').length - 1}
                <br />
              {/if}
            {/each}
          </div>
        {:else}
          <!-- Assistant messages: markdown rendering -->
          <MarkdownContent content={displayContent()} {isStreaming} />
        {/if}
      {:else if isStreaming && stage1Content && !stage2Content}
        <div class="loading-placeholder">
          <Loader2 size={16} class="spinner" />
          <span>Generating response...</span>
        </div>
      {:else}
        <div class="empty-content">
          <span class="placeholder">No content</span>
        </div>
      {/if}
    </div>

    <!-- Metadata Footer -->
    {#if !isStreaming && (displayMetadata().token_count || displayMetadata().duration_ms || displayMetadata().cost_usd)}
      <div class="message-meta">
        {#if displayMetadata().duration_ms}
          <span class="meta-item">
            <span class="meta-label">Duration:</span>
            {formatDuration(displayMetadata().duration_ms!)}
          </span>
        {/if}
        {#if displayMetadata().token_count}
          <span class="meta-item">
            <span class="meta-label">Tokens:</span>
            {displayMetadata().token_count}
            {#if displayMetadata().input_tokens}
              ({displayMetadata().input_tokens} in)
            {/if}
          </span>
        {/if}
        {#if displayMetadata().cost_usd}
          <span class="meta-item">
            <span class="meta-label">Cost:</span>
            ${displayMetadata().cost_usd!.toFixed(4)}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if canExport}
  <ExportDialog
    bind:open={showExportDialog}
    title="Export Q&A"
    onExport={handleExport}
    onCancel={handleExportCancel}
    isLoading={$exportMutation.isPending}
  />
{/if}

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

  .export-message-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding: 0.375rem;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm, 4px);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast, 0.15s ease);
    opacity: 0;
  }

  .chat-message:hover .export-message-btn {
    opacity: 1;
  }

  .export-message-btn:hover:not(:disabled) {
    color: var(--primary-color);
    background: var(--primary-bg, rgba(0, 102, 204, 0.1));
  }

  .export-message-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-message-btn :global(.spinner) {
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

  /* Expandable Section (Stage 1) */
  .expandable-section {
    margin-bottom: var(--space-3);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }

  .expand-toggle {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-secondary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-align: left;
    transition: background var(--transition-fast);
  }

  .expand-toggle:hover {
    background: var(--bg-hover);
  }

  .expand-toggle:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .toggle-text {
    flex: 1;
  }

  .streaming-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success-color, #22c55e);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .stage1-content {
    padding: var(--space-3);
    background: var(--bg-code, #1e1e2e);
    color: var(--text-code, #cdd6f4);
    font-family: var(--font-mono, 'Monaco', 'Consolas', monospace);
    font-size: var(--font-size-xs);
    line-height: 1.5;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  /* Message Body (Stage 2) */
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

  .pending-content,
  .loading-placeholder {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }

  .pending-content :global(.spinner),
  .loading-placeholder :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  .empty-content {
    color: var(--text-muted);
    font-style: italic;
  }

  /* Metadata Footer */
  .message-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-color);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .meta-label {
    color: var(--text-muted);
  }
</style>

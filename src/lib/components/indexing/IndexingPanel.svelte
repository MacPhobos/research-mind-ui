<script lang="ts">
  import { Database, Clock, AlertCircle, CheckCircle } from 'lucide-svelte';
  import { useIndexStatusQuery } from '$lib/api/hooks';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import IndexStatusDisplay from './IndexStatusDisplay.svelte';
  import IndexTriggerButton from './IndexTriggerButton.svelte';
  import type { IndexResultResponse } from '$lib/api/client';
  import { formatDuration } from '$lib/utils/format';

  interface Props {
    sessionId: string;
  }

  let { sessionId }: Props = $props();

  // Use derived value for reactive tracking with TanStack Query
  const currentSessionId = $derived(sessionId);

  const statusQuery = useIndexStatusQuery(currentSessionId);

  let lastResult = $state<IndexResultResponse | null>(null);

  function handleIndexSuccess(result: IndexResultResponse) {
    lastResult = result;
    // Refetch status after successful indexing
    $statusQuery.refetch();
  }
</script>

<div class="indexing-panel">
  <section class="panel-section">
    <div class="section-header">
      <Database size={20} />
      <h2>Indexing Status</h2>
    </div>

    <div class="section-content">
      {#if $statusQuery.isPending}
        <div class="loading-container">
          <LoadingSpinner size="md" label="Loading status..." />
        </div>
      {:else if $statusQuery.isError}
        <div class="error-message">
          <AlertCircle size={16} />
          <span>Failed to load indexing status: {$statusQuery.error?.message}</span>
        </div>
        <button
          type="button"
          class="retry-btn"
          onclick={() => $statusQuery.refetch()}
        >
          Retry
        </button>
      {:else if $statusQuery.data}
        <IndexStatusDisplay status={$statusQuery.data} />
      {/if}
    </div>
  </section>

  <section class="panel-section">
    <div class="section-header">
      <Clock size={20} />
      <h2>Index Controls</h2>
    </div>

    <div class="section-content">
      <p class="help-text">
        Index your workspace to enable search functionality. This process analyzes
        all content files and creates a searchable index.
      </p>

      <IndexTriggerButton
        {sessionId}
        disabled={$statusQuery.isPending}
        onSuccess={handleIndexSuccess}
      />
    </div>
  </section>

  {#if lastResult}
    <section class="panel-section result-section" class:success={lastResult.success} class:error={!lastResult.success}>
      <div class="section-header">
        {#if lastResult.success}
          <CheckCircle size={20} />
        {:else}
          <AlertCircle size={20} />
        {/if}
        <h2>Last Index Result</h2>
      </div>

      <div class="section-content">
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">Status:</span>
            <span class="stat-value">{lastResult.status}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Duration:</span>
            <span class="stat-value">{formatDuration(lastResult.elapsed_seconds * 1000)}</span>
          </div>
        </div>

        {#if lastResult.stdout}
          <details class="output-details">
            <summary>Output</summary>
            <pre class="output-content">{lastResult.stdout}</pre>
          </details>
        {/if}

        {#if lastResult.stderr}
          <details class="output-details error-output">
            <summary>Errors</summary>
            <pre class="output-content">{lastResult.stderr}</pre>
          </details>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .indexing-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .panel-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--bg-hover);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .section-header h2 {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .section-content {
    padding: var(--space-4);
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: var(--space-4);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--error-color);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-3);
  }

  .retry-btn {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .retry-btn:hover {
    background: var(--bg-hover);
  }

  .help-text {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .result-section.success {
    border-color: var(--success-color);
  }

  .result-section.success .section-header {
    background: rgba(0, 170, 0, 0.1);
    color: var(--success-color);
  }

  .result-section.error {
    border-color: var(--error-color);
  }

  .result-section.error .section-header {
    background: rgba(204, 0, 0, 0.1);
    color: var(--error-color);
  }

  .result-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .stat {
    display: flex;
    gap: var(--space-2);
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .stat-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-weight: 500;
  }

  .output-details {
    margin-top: var(--space-3);
  }

  .output-details summary {
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    padding: var(--space-2) 0;
  }

  .output-details summary:hover {
    color: var(--text-primary);
  }

  .output-content {
    margin: var(--space-2) 0 0 0;
    padding: var(--space-3);
    background: var(--bg-primary);
    border-radius: var(--border-radius-md);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: var(--font-size-xs);
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-primary);
  }

  .error-output .output-content {
    background: rgba(204, 0, 0, 0.05);
    color: var(--error-color);
  }
</style>

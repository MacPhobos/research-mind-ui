<script lang="ts">
  import { ArrowRight, Database, FileText, Clock, Plus } from 'lucide-svelte';
  import { useSessionQuery, useIndexStatusQuery, useContentQuery } from '$lib/api/hooks';
  import { formatDate, formatRelativeTime } from '$lib/utils/format';
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import ContentList from '$lib/components/sessions/ContentList.svelte';
  import AddContentForm from '$lib/components/sessions/AddContentForm.svelte';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();

  // Derive sessionId to track prop changes reactively
  const sessionId = $derived(data.sessionId);
  // Create a stable getter for TanStack Query to avoid state capture warning
  const currentSessionId = $derived(sessionId);

  const sessionQuery = useSessionQuery(currentSessionId);
  const indexQuery = useIndexStatusQuery(currentSessionId);
  const contentQuery = useContentQuery(currentSessionId);

  // State for showing add content form
  let showAddContent = $state(false);

  function handleContentAdded() {
    showAddContent = false;
  }
</script>

<svelte:head>
  <title>
    {$sessionQuery.data?.name ?? 'Session'} - Research Mind
  </title>
</svelte:head>

<div class="overview-page">
  <!-- Content Management Section -->
  <section class="card">
    <div class="card-header-with-action">
      <h2 class="card-title">
        <FileText size={20} />
        Content
        {#if $contentQuery.data}
          <span class="content-count">({$contentQuery.data.count})</span>
        {/if}
      </h2>
      {#if !showAddContent}
        <button
          type="button"
          class="add-content-btn"
          onclick={() => showAddContent = true}
        >
          <Plus size={16} />
          Add Content
        </button>
      {/if}
    </div>

    {#if showAddContent}
      <div class="add-content-wrapper">
        <AddContentForm
          sessionId={currentSessionId}
          onSuccess={handleContentAdded}
          onCancel={() => showAddContent = false}
        />
      </div>
    {/if}

    {#if $contentQuery.isPending}
      <div class="loading-inline">
        <LoadingSpinner size="sm" />
        <span>Loading content...</span>
      </div>
    {:else if $contentQuery.isError}
      <p class="error-text">Failed to load content: {$contentQuery.error?.message}</p>
    {:else if $contentQuery.data}
      <ContentList
        sessionId={currentSessionId}
        items={$contentQuery.data.items}
      />
    {/if}
  </section>

  <!-- Indexing Status Card -->
  <section class="card">
    <h2 class="card-title">
      <Database size={20} />
      Indexing Status
    </h2>

    {#if $indexQuery.isPending}
      <div class="loading-inline">
        <LoadingSpinner size="sm" />
        <span>Checking index status...</span>
      </div>
    {:else if $indexQuery.isError}
      <p class="error-text">Failed to load indexing status</p>
    {:else if $indexQuery.data}
      <div class="index-status">
        <StatusBadge status={$indexQuery.data.is_indexed ? 'indexed' : 'not_indexed'} />
        <span class="status-message">{$indexQuery.data.message}</span>
      </div>

      {#if !$indexQuery.data.is_indexed}
        <p class="hint">
          Index your session to enable search and analysis features.
        </p>
        <a href="/sessions/{currentSessionId}/indexing" class="action-link">
          Index Now
          <ArrowRight size={16} />
        </a>
      {/if}
    {/if}
  </section>

  <!-- Session Details Card -->
  <section class="card">
    <h2 class="card-title">
      <FileText size={20} />
      Session Details
    </h2>
    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">
          {#if $sessionQuery.data}
            <StatusBadge status={$sessionQuery.data.status} />
          {:else}
            -
          {/if}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Created</span>
        <span class="detail-value">
          {$sessionQuery.data ? formatDate($sessionQuery.data.created_at) : '-'}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Last Accessed</span>
        <span class="detail-value">
          {$sessionQuery.data ? formatRelativeTime($sessionQuery.data.last_accessed) : '-'}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Workspace Path</span>
        <span class="detail-value mono">
          {$sessionQuery.data?.workspace_path ?? '-'}
        </span>
      </div>
      {#if $sessionQuery.data?.ttl_seconds}
        <div class="detail-row">
          <span class="detail-label">TTL</span>
          <span class="detail-value">
            {Math.floor($sessionQuery.data.ttl_seconds / 3600)} hours
          </span>
        </div>
      {/if}
    </div>
  </section>

  <!-- Quick Actions Card -->
  <section class="card">
    <h2 class="card-title">
      <Clock size={20} />
      Quick Actions
    </h2>
    <div class="actions-list">
      <a href="/sessions/{currentSessionId}/audit" class="action-item">
        <span>View Audit Log</span>
        <ArrowRight size={16} />
      </a>
      <a href="/sessions/{currentSessionId}/settings" class="action-item">
        <span>Go to Settings</span>
        <ArrowRight size={16} />
      </a>
    </div>
  </section>
</div>

<style>
  .overview-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-5);
  }

  .card-header-with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-4) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .card-header-with-action .card-title {
    margin-bottom: 0;
  }

  .content-count {
    font-weight: 400;
    color: var(--text-muted);
    font-size: var(--font-size-base);
  }

  .add-content-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .add-content-btn:hover {
    opacity: 0.9;
  }

  .add-content-wrapper {
    margin-bottom: var(--space-4);
  }

  .details-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-color);
  }

  .detail-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .detail-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .detail-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    text-align: right;
  }

  .detail-value.mono {
    font-family: monospace;
    font-size: var(--font-size-xs);
  }

  .loading-inline {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .error-text {
    margin: 0;
    color: var(--error-color);
    font-size: var(--font-size-sm);
  }

  .index-status {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .status-message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .hint {
    margin: 0 0 var(--space-3) 0;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .action-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--primary-color);
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition: opacity var(--transition-fast);
  }

  .action-link:hover {
    opacity: 0.8;
  }

  .actions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3);
    background: var(--bg-hover);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }

  .action-item:hover {
    background: var(--bg-active);
    color: var(--primary-color);
  }

  @media (max-width: 480px) {
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-1);
    }

    .detail-value {
      text-align: left;
    }

    .card-header-with-action {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .add-content-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>

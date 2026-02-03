<script lang="ts">
  import { FolderOpen, Plus } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { useSessionsQuery } from '$lib/api/hooks';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import { formatRelativeTime, formatDate } from '$lib/utils/format';

  const query = useSessionsQuery(100, 0);

  function handleCreateSession() {
    goto('/sessions/new');
  }
</script>

<svelte:head>
  <title>Sessions - Research Mind</title>
</svelte:head>

<div class="page-header">
  <div class="header-content">
    <h1>Sessions</h1>
    <p class="subtitle">Manage your research sessions</p>
  </div>
  <button class="create-button" onclick={handleCreateSession} type="button">
    <Plus size={18} />
    <span>New Session</span>
  </button>
</div>

<div class="sessions-container">
  {#if $query.isPending}
    <div class="loading-state">
      <LoadingSpinner size="lg" />
      <p>Loading sessions...</p>
    </div>
  {:else if $query.isError}
    <div class="error-state">
      <p class="error-message">Failed to load sessions: {$query.error?.message}</p>
      <button
        class="retry-button"
        onclick={() => $query.refetch()}
        type="button"
      >
        Retry
      </button>
    </div>
  {:else if $query.data?.sessions.length === 0}
    <EmptyState
      title="No sessions yet"
      description="Create your first research session to organize your work and start exploring."
      icon={FolderOpen}
      actionLabel="Create Session"
      onAction={handleCreateSession}
    />
  {:else}
    <div class="sessions-grid">
      {#each $query.data?.sessions ?? [] as session (session.session_id)}
        <a href="/sessions/{session.session_id}" class="session-card-large">
          <div class="card-header">
            <h3 class="card-title">{session.name}</h3>
            <StatusBadge status={session.status} />
          </div>

          {#if session.description}
            <p class="card-description">{session.description}</p>
          {/if}

          <div class="card-meta">
            <div class="meta-row">
              <span class="meta-label">Content</span>
              <span class="meta-value">{session.content_count} {session.content_count === 1 ? 'item' : 'items'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Created</span>
              <span class="meta-value">{formatDate(session.created_at)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Last accessed</span>
              <span class="meta-value">{formatRelativeTime(session.last_accessed)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Indexed</span>
              <span class="meta-value">{session.is_indexed ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .header-content h1 {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .subtitle {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .create-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
    white-space: nowrap;
  }

  .create-button:hover {
    opacity: 0.9;
  }

  .sessions-container {
    min-height: 300px;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    gap: var(--space-4);
    text-align: center;
  }

  .loading-state p {
    margin: 0;
    color: var(--text-secondary);
  }

  .error-message {
    color: var(--error-color);
    margin: 0;
  }

  .retry-button {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .retry-button:hover {
    background: var(--bg-hover);
  }

  .sessions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }

  .session-card-large {
    display: block;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-5);
    transition:
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
  }

  .session-card-large:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .card-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .card-description {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-color);
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
  }

  .meta-label {
    color: var(--text-muted);
  }

  .meta-value {
    color: var(--text-secondary);
  }

  @media (max-width: 767px) {
    .page-header {
      flex-direction: column;
    }

    .create-button {
      width: 100%;
      justify-content: center;
    }

    .sessions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import { FileText, AlertCircle } from 'lucide-svelte';
  import { useAuditLogsQuery } from '$lib/api/hooks';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import Pagination from '$lib/components/shared/Pagination.svelte';
  import AuditLogEntry from './AuditLogEntry.svelte';

  interface Props {
    sessionId: string;
  }

  let { sessionId }: Props = $props();

  let limit = $state(20);
  let offset = $state(0);

  // Use derived values for reactive tracking with TanStack Query
  const currentSessionId = $derived(sessionId);
  const currentLimit = $derived(limit);
  const currentOffset = $derived(offset);

  const query = useAuditLogsQuery(currentSessionId, currentLimit, currentOffset);

  function handlePageChange(newOffset: number) {
    offset = newOffset;
  }

  // Reset offset when sessionId changes
  $effect(() => {
    // Access sessionId to track it
    sessionId;
    offset = 0;
  });
</script>

<div class="audit-log-container">
  {#if $query.isPending}
    <div class="loading-state">
      <LoadingSpinner size="lg" label="Loading audit logs..." />
    </div>
  {:else if $query.isError}
    <div class="error-state">
      <div class="error-message">
        <AlertCircle size={20} />
        <span>Failed to load audit logs: {$query.error?.message}</span>
      </div>
      <button
        type="button"
        class="retry-btn"
        onclick={() => $query.refetch()}
      >
        Retry
      </button>
    </div>
  {:else if $query.data && $query.data.logs.length === 0}
    <EmptyState
      icon={FileText}
      title="No Audit Entries"
      description="No audit log entries have been recorded for this session yet. Entries will appear here as you perform actions."
    />
  {:else if $query.data}
    <div class="table-wrapper">
      <table class="audit-table" aria-label="Audit log entries">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Time</th>
            <th scope="col">Action</th>
            <th scope="col">Status</th>
            <th scope="col">Duration</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {#each $query.data.logs as log (log.id)}
            <AuditLogEntry {log} showDetails />
          {/each}
        </tbody>
      </table>
    </div>

    <Pagination
      total={$query.data.count}
      {limit}
      {offset}
      onPageChange={handlePageChange}
    />
  {/if}
</div>

<style>
  .audit-log-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8);
    text-align: center;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--error-color);
    font-size: var(--font-size-sm);
  }

  .retry-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-secondary);
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

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    background: var(--bg-secondary);
  }

  .audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .audit-table th {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-hover);
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }

  /* Responsive: hide table headers on mobile, handled by entry component */
  @media (max-width: 768px) {
    .audit-table thead {
      display: none;
    }

    .audit-table tbody {
      display: block;
    }
  }
</style>

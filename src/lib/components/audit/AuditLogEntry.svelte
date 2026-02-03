<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import { formatDate, formatRelativeTime, formatDuration } from '$lib/utils/format';
  import type { AuditLogResponse } from '$lib/api/client';

  interface Props {
    log: AuditLogResponse;
    showDetails?: boolean;
  }

  let { log, showDetails = false }: Props = $props();

  // Map action types to display labels
  const actionLabels: Record<string, string> = {
    session_created: 'Session Created',
    session_updated: 'Session Updated',
    session_deleted: 'Session Deleted',
    content_added: 'Content Added',
    content_deleted: 'Content Deleted',
    index_started: 'Indexing Started',
    index_completed: 'Indexing Completed',
    index_failed: 'Indexing Failed',
    search_performed: 'Search Performed',
  };

  const actionLabel = $derived(actionLabels[log.action] || log.action);
  const formattedTimestamp = $derived(formatDate(log.timestamp));
  const relativeTime = $derived(formatRelativeTime(log.timestamp));
  const formattedDuration = $derived(log.duration_ms ? formatDuration(log.duration_ms) : null);

  let detailsOpen = $state(false);
  const hasDetails = $derived(Boolean(log.query || log.error || log.metadata_json));

  function toggleDetails() {
    detailsOpen = !detailsOpen;
  }
</script>

<tr class="audit-entry" class:has-error={log.status === 'error'}>
  <td class="cell-id" data-label="ID">{log.id}</td>
  <td class="cell-timestamp" data-label="Time">
    <span class="relative-time" title={formattedTimestamp}>{relativeTime}</span>
  </td>
  <td class="cell-action" data-label="Action">
    <span class="action-label">{actionLabel}</span>
  </td>
  <td class="cell-status" data-label="Status">
    <StatusBadge status={log.status} />
  </td>
  <td class="cell-duration" data-label="Duration">
    {formattedDuration || '-'}
  </td>
  {#if showDetails}
    <td class="cell-details" data-label="Details">
      {#if hasDetails}
        <button
          type="button"
          class="details-toggle"
          onclick={toggleDetails}
          aria-expanded={detailsOpen}
        >
          {detailsOpen ? 'Hide' : 'Show'}
        </button>
      {:else}
        <span class="no-details">-</span>
      {/if}
    </td>
  {/if}
</tr>

{#if showDetails && detailsOpen && hasDetails}
  <tr class="details-row">
    <td colspan={showDetails ? 6 : 5}>
      <div class="details-content">
        {#if log.query}
          <div class="detail-item">
            <span class="detail-label">Query:</span>
            <code class="detail-value">{log.query}</code>
          </div>
        {/if}
        {#if log.result_count !== null && log.result_count !== undefined}
          <div class="detail-item">
            <span class="detail-label">Results:</span>
            <span class="detail-value">{log.result_count}</span>
          </div>
        {/if}
        {#if log.error}
          <div class="detail-item error-detail">
            <span class="detail-label">Error:</span>
            <span class="detail-value">{log.error}</span>
          </div>
        {/if}
        {#if log.metadata_json}
          <div class="detail-item">
            <span class="detail-label">Metadata:</span>
            <pre class="metadata-json">{JSON.stringify(log.metadata_json, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </td>
  </tr>
{/if}

<style>
  .audit-entry {
    transition: background var(--transition-fast);
  }

  .audit-entry:hover {
    background: var(--bg-hover);
  }

  .audit-entry.has-error {
    background: rgba(204, 0, 0, 0.03);
  }

  td {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    vertical-align: middle;
    border-bottom: 1px solid var(--border-color);
  }

  .cell-id {
    color: var(--text-muted);
    font-family: monospace;
    width: 60px;
  }

  .cell-timestamp {
    white-space: nowrap;
  }

  .relative-time {
    cursor: help;
  }

  .cell-action {
    min-width: 150px;
  }

  .action-label {
    text-transform: capitalize;
  }

  .cell-status {
    width: 100px;
  }

  .cell-duration {
    color: var(--text-secondary);
    font-family: monospace;
    width: 80px;
  }

  .cell-details {
    width: 80px;
    text-align: center;
  }

  .details-toggle {
    padding: var(--space-1) var(--space-2);
    background: var(--bg-primary);
    color: var(--primary-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .details-toggle:hover {
    background: var(--bg-hover);
    border-color: var(--primary-color);
  }

  .no-details {
    color: var(--text-muted);
  }

  .details-row td {
    padding: 0;
    background: var(--bg-primary);
  }

  .details-content {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .detail-item {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
  }

  .detail-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    min-width: 80px;
    flex-shrink: 0;
  }

  .detail-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .error-detail .detail-value {
    color: var(--error-color);
  }

  code {
    padding: var(--space-1) var(--space-2);
    background: var(--bg-secondary);
    border-radius: var(--border-radius-sm);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: var(--font-size-xs);
  }

  .metadata-json {
    margin: 0;
    padding: var(--space-2);
    background: var(--bg-secondary);
    border-radius: var(--border-radius-sm);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: var(--font-size-xs);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Mobile responsive - stack cells as cards */
  @media (max-width: 768px) {
    td {
      display: block;
      padding: var(--space-2) var(--space-4);
      border-bottom: none;
    }

    td::before {
      content: attr(data-label) ': ';
      font-weight: 500;
      color: var(--text-secondary);
    }

    .audit-entry {
      display: block;
      border-bottom: 1px solid var(--border-color);
      padding: var(--space-2) 0;
    }

    .cell-id {
      width: auto;
    }

    .cell-status,
    .cell-duration,
    .cell-details {
      width: auto;
      text-align: left;
    }

    .details-row td {
      padding: var(--space-3);
    }
  }
</style>

<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import type { IndexStatusResponse } from '$lib/api/client';

  interface Props {
    status: IndexStatusResponse;
  }

  let { status }: Props = $props();

  const indexStatus = $derived(status.is_indexed ? 'indexed' : 'not_indexed');
</script>

<div class="status-display">
  <div class="status-row">
    <span class="label">Status:</span>
    <StatusBadge status={indexStatus} />
  </div>

  <p class="message">{status.message}</p>

  {#if status.status !== 'ready' && status.status !== 'not_ready'}
    <div class="status-row">
      <span class="label">Current State:</span>
      <span class="value">{status.status}</span>
    </div>
  {/if}
</div>

<style>
  .status-display {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    min-width: 80px;
  }

  .value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .message {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>

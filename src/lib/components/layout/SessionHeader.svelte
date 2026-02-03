<script lang="ts">
  import type { SessionResponse } from '$lib/api/client';
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import { formatRelativeTime } from '$lib/utils/format';

  interface Props {
    session: SessionResponse;
  }

  let { session }: Props = $props();
</script>

<div class="session-header">
  <div class="header-main">
    <h1 class="session-name">{session.name}</h1>
    <StatusBadge status={session.status} />
  </div>

  {#if session.description}
    <p class="session-description">{session.description}</p>
  {/if}

  <p class="last-accessed">
    Last accessed: {formatRelativeTime(session.last_accessed)}
  </p>
</div>

<style>
  .session-header {
    margin-bottom: var(--space-4);
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .session-name {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .session-description {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    max-width: 600px;
  }

  .last-accessed {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  @media (max-width: 767px) {
    .header-main {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .session-name {
      font-size: var(--font-size-xl);
    }
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { useSessionQuery } from '$lib/api/hooks';
  import SessionHeader from '$lib/components/layout/SessionHeader.svelte';
  import SessionTabs from '$lib/components/layout/SessionTabs.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';

  interface Props {
    data: {
      sessionId: string;
    };
    children: Snippet;
  }

  let { data, children }: Props = $props();

  // Derive sessionId to track prop changes reactively
  const sessionId = $derived(data.sessionId);
  // Create a stable getter for TanStack Query to avoid state capture warning
  const currentSessionId = $derived(sessionId);

  const query = useSessionQuery(currentSessionId);

  // Handle 404 - redirect to sessions list
  $effect(() => {
    if ($query.isError && $query.error?.status === 404) {
      goto('/sessions');
    }
  });
</script>

<div class="session-detail-layout">
  {#if $query.isPending}
    <div class="loading-state">
      <LoadingSpinner size="lg" />
      <p>Loading session...</p>
    </div>
  {:else if $query.isError}
    <div class="error-state">
      <h2>Session Not Found</h2>
      <p>The session you're looking for doesn't exist or has been deleted.</p>
      <a href="/sessions" class="back-link">Back to Sessions</a>
    </div>
  {:else if $query.data}
    <SessionHeader session={$query.data} />
    <SessionTabs sessionId={currentSessionId} />
    {@render children()}
  {/if}
</div>

<style>
  .session-detail-layout {
    max-width: 1000px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    gap: var(--space-4);
  }

  .loading-state p {
    margin: 0;
    color: var(--text-secondary);
  }

  .error-state {
    text-align: center;
    padding: var(--space-8);
  }

  .error-state h2 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
  }

  .error-state p {
    margin: 0 0 var(--space-4) 0;
    color: var(--text-secondary);
  }

  .back-link {
    display: inline-block;
    padding: var(--space-2) var(--space-4);
    background: var(--primary-color);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition: opacity var(--transition-fast);
  }

  .back-link:hover {
    opacity: 0.9;
  }
</style>

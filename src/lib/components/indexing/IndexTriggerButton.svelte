<script lang="ts">
  import { RefreshCw } from 'lucide-svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { useIndexWorkspaceMutation } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';
  import type { IndexResultResponse } from '$lib/api/client';

  interface Props {
    sessionId: string;
    disabled?: boolean;
    onSuccess?: (result: IndexResultResponse) => void;
  }

  let { sessionId, disabled = false, onSuccess }: Props = $props();

  let forceIndex = $state(true);

  // Explicitly use sessionId in a reactive context to satisfy Svelte's state tracking
  const currentSessionId = $derived(sessionId);

  const mutation = useIndexWorkspaceMutation();

  const isPending = $derived($mutation.isPending);

  function handleTriggerIndex() {
    $mutation.mutate(
      {
        workspaceId: currentSessionId,
        request: { force: forceIndex },
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toastStore.success(`Workspace indexed successfully in ${result.elapsed_seconds.toFixed(1)}s`);
          } else {
            toastStore.warning('Indexing completed with issues. Check the output for details.');
          }
          onSuccess?.(result);
        },
        onError: (error) => {
          toastStore.error(error.message || 'Failed to index workspace');
        },
      }
    );
  }
</script>

<div class="trigger-container">
  <div class="options">
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={forceIndex} disabled={isPending} />
      <span>Force reindex (rebuild from scratch)</span>
    </label>
  </div>

  <button
    type="button"
    class="trigger-btn"
    onclick={handleTriggerIndex}
    disabled={disabled || isPending}
    aria-label={isPending ? 'Indexing in progress' : 'Start indexing'}
  >
    {#if isPending}
      <LoadingSpinner size="sm" />
      <span>Indexing...</span>
    {:else}
      <RefreshCw size={16} />
      <span>Index Workspace</span>
    {/if}
  </button>
</div>

<style>
  .trigger-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .checkbox-label input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .checkbox-label input:disabled {
    cursor: not-allowed;
  }

  .trigger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      opacity var(--transition-fast),
      background var(--transition-fast);
    min-width: 160px;
  }

  .trigger-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .trigger-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

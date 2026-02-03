<script lang="ts">
  import type { Snippet } from 'svelte';
  import { AlertTriangle, RefreshCw } from 'lucide-svelte';

  interface Props {
    children: Snippet;
    fallback?: Snippet<[{ error: Error; reset: () => void }]>;
    onError?: (error: Error) => void;
  }

  let { children, fallback, onError }: Props = $props();

  let error = $state<Error | null>(null);
  let hasError = $state(false);

  function handleError(event: ErrorEvent) {
    error = event.error;
    hasError = true;
    onError?.(event.error);
  }

  function reset() {
    error = null;
    hasError = false;
  }

  // Listen for unhandled errors within this boundary
  $effect(() => {
    const handler = (event: ErrorEvent) => handleError(event);
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  });
</script>

{#if hasError && error}
  {#if fallback}
    {@render fallback({ error, reset })}
  {:else}
    <div class="error-boundary" role="alert" aria-live="assertive">
      <div class="error-icon">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-message">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        type="button"
        class="retry-button"
        onclick={reset}
        aria-label="Try again"
      >
        <RefreshCw size={16} />
        <span>Try Again</span>
      </button>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}

<style>
  .error-boundary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--space-8);
    text-align: center;
  }

  .error-icon {
    color: var(--error-color);
    margin-bottom: var(--space-4);
  }

  .error-title {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .error-message {
    margin: 0 0 var(--space-6) 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    max-width: 400px;
  }

  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .retry-button:hover {
    opacity: 0.9;
  }

  .retry-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
</style>

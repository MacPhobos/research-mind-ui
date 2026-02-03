<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  interface Props {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (offset: number) => void;
  }

  let { total, limit, offset, onPageChange }: Props = $props();

  const currentPage = $derived(Math.floor(offset / limit) + 1);
  const totalPages = $derived(Math.ceil(total / limit));
  const showingFrom = $derived(total > 0 ? offset + 1 : 0);
  const showingTo = $derived(Math.min(offset + limit, total));
  const hasPrev = $derived(offset > 0);
  const hasNext = $derived(offset + limit < total);

  function handlePrev() {
    if (hasPrev) {
      onPageChange(Math.max(0, offset - limit));
    }
  }

  function handleNext() {
    if (hasNext) {
      onPageChange(offset + limit);
    }
  }
</script>

{#if total > 0}
  <nav class="pagination" aria-label="Pagination">
    <span class="showing-text">
      Showing {showingFrom}-{showingTo} of {total}
    </span>

    <div class="controls">
      <button
        type="button"
        class="page-btn"
        onclick={handlePrev}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        <span class="btn-text">Previous</span>
      </button>

      <span class="page-info">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        class="page-btn"
        onclick={handleNext}
        disabled={!hasNext}
        aria-label="Next page"
      >
        <span class="btn-text">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  </nav>
{/if}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    border-top: 1px solid var(--border-color);
  }

  .showing-text {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .page-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .page-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--secondary-color);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    padding: 0 var(--space-2);
  }

  .btn-text {
    display: none;
  }

  @media (min-width: 640px) {
    .btn-text {
      display: inline;
    }
  }
</style>

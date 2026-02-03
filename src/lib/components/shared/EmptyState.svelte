<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    // Lucide icons - component type compatibility requires flexible typing
    icon?: typeof import('lucide-svelte').FileText;
  }

  let { title, description, actionLabel, onAction, icon: Icon }: Props = $props();
</script>

<div class="empty-state">
  {#if Icon}
    <div class="icon-container">
      <svelte:component this={Icon} size={48} strokeWidth={1.5} />
    </div>
  {/if}

  <h3 class="title">{title}</h3>

  {#if description}
    <p class="description">{description}</p>
  {/if}

  {#if actionLabel && onAction}
    <button class="action-button" onclick={onAction} type="button">
      {actionLabel}
    </button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    min-height: 200px;
  }

  .icon-container {
    color: var(--secondary-color, #666);
    margin-bottom: 1rem;
  }

  .title {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
  }

  .description {
    margin: 0 0 1rem 0;
    color: var(--secondary-color, #666);
    font-size: 0.875rem;
    max-width: 300px;
  }

  .action-button {
    padding: 0.5rem 1rem;
    background: var(--primary-color, #0066cc);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .action-button:hover {
    opacity: 0.9;
  }

  .action-button:focus-visible {
    outline: 2px solid var(--primary-color, #0066cc);
    outline-offset: 2px;
  }
</style>

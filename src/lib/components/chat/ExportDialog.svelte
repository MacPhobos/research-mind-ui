<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { FileText, FileDown, Loader2 } from 'lucide-svelte';
  import type { ChatExportFormat } from '$lib/api/client';

  interface Props {
    open: boolean;
    title?: string;
    onExport: (format: ChatExportFormat, includeMetadata: boolean, includeTimestamps: boolean) => void;
    onCancel: () => void;
    isLoading?: boolean;
  }

  let {
    open = $bindable(false),
    title = 'Export Chat',
    onExport,
    onCancel,
    isLoading = false,
  }: Props = $props();

  // Form state
  let selectedFormat = $state<ChatExportFormat>('markdown');
  let includeMetadata = $state(true);
  let includeTimestamps = $state(true);

  function handleExport() {
    onExport(selectedFormat, includeMetadata, includeTimestamps);
  }

  function handleCancel() {
    onCancel();
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && !isLoading) {
      onCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open && !isLoading) {
      event.preventDefault();
      onCancel();
    }
  }

  // Reset form when dialog opens
  $effect(() => {
    if (open) {
      selectedFormat = 'markdown';
      includeMetadata = true;
      includeTimestamps = true;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content
      class="dialog-content export-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <Dialog.Title id="export-dialog-title" class="dialog-title">
        {title}
      </Dialog.Title>

      <div class="format-section">
        <p class="section-label">Export Format</p>
        <div class="format-options">
          <button
            type="button"
            class="format-card"
            class:selected={selectedFormat === 'markdown'}
            onclick={() => (selectedFormat = 'markdown')}
            disabled={isLoading}
          >
            <FileText size={24} />
            <span class="format-name">Markdown</span>
            <span class="format-desc">Plain text format</span>
          </button>

          <button
            type="button"
            class="format-card"
            class:selected={selectedFormat === 'pdf'}
            onclick={() => (selectedFormat = 'pdf')}
            disabled={isLoading}
          >
            <FileDown size={24} />
            <span class="format-name">PDF</span>
            <span class="format-desc">Formatted document</span>
          </button>
        </div>
      </div>

      <div class="options-section">
        <p class="section-label">Options</p>
        <div class="options-list">
          <label class="option-item">
            <input
              type="checkbox"
              bind:checked={includeMetadata}
              disabled={isLoading}
            />
            <span>Include metadata (session name, export date)</span>
          </label>

          <label class="option-item">
            <input
              type="checkbox"
              bind:checked={includeTimestamps}
              disabled={isLoading}
            />
            <span>Include timestamps</span>
          </label>
        </div>
      </div>

      <div class="dialog-actions">
        <button
          class="btn btn-secondary"
          onclick={handleCancel}
          type="button"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={handleExport}
          type="button"
          disabled={isLoading}
        >
          {#if isLoading}
            <Loader2 size={16} class="spinner" />
            Exporting...
          {:else}
            Export
          {/if}
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  :global(.dialog-content.export-dialog) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary, white);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border-color, #e5e7eb);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 101;
    min-width: 360px;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
  }

  :global(.dialog-title) {
    margin: 0 0 1.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .section-label {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary, #666);
  }

  .format-section {
    margin-bottom: 1.25rem;
  }

  .format-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .format-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    background: var(--bg-primary, white);
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--text-secondary, #666);
  }

  .format-card:hover:not(:disabled) {
    border-color: var(--primary-color, #0066cc);
    background: var(--bg-hover, #f5f5f5);
  }

  .format-card.selected {
    border-color: var(--primary-color, #0066cc);
    background: var(--primary-bg, rgba(0, 102, 204, 0.08));
    color: var(--primary-color, #0066cc);
  }

  .format-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .format-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-primary, #333);
  }

  .format-card.selected .format-name {
    color: var(--primary-color, #0066cc);
  }

  .format-desc {
    font-size: 0.75rem;
    color: var(--text-muted, #999);
  }

  .options-section {
    margin-bottom: 1.5rem;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-primary, #333);
    cursor: pointer;
  }

  .option-item input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color, #0066cc);
  }

  .option-item input[type='checkbox']:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--primary-color, #0066cc);
    outline-offset: 2px;
  }

  .btn-primary {
    background: var(--primary-color, #0066cc);
    color: white;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

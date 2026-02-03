<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
  }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      onCancel();
    }
  }

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    onCancel();
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content
      class="dialog-content"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <Dialog.Title id="dialog-title" class="dialog-title">
        {title}
      </Dialog.Title>
      <Dialog.Description id="dialog-description" class="dialog-description">
        {message}
      </Dialog.Description>

      <div class="dialog-actions">
        <button class="btn btn-secondary" onclick={handleCancel} type="button">
          {cancelLabel}
        </button>
        <button
          class="btn"
          class:btn-danger={variant === 'danger'}
          class:btn-primary={variant === 'default'}
          onclick={handleConfirm}
          type="button"
        >
          {confirmLabel}
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

  :global(.dialog-content) {
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
    min-width: 320px;
    max-width: 450px;
    max-height: 85vh;
    overflow-y: auto;
  }

  :global(.dialog-title) {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  :global(.dialog-description) {
    margin: 0 0 1.5rem 0;
    color: var(--secondary-color, #666);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .btn:hover {
    opacity: 0.9;
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

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    background: var(--error-color, #cc0000);
    color: white;
  }

  .btn-danger:focus-visible {
    outline-color: var(--error-color, #cc0000);
  }
</style>

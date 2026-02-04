<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    title?: string;
    description?: string;
  }

  let { title = 'Dialog Title', description = 'Dialog description goes here.' }: Props = $props();

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="dialog-trigger">Open Dialog</Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title class="dialog-title">{title}</Dialog.Title>
      <Dialog.Description class="dialog-description">{description}</Dialog.Description>

      <div class="dialog-actions">
        <Dialog.Close class="dialog-close">Close</Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.dialog-trigger) {
    padding: 0.5rem 1rem;
    background: var(--primary-color, #0066cc);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  :global(.dialog-trigger:hover) {
    opacity: 0.9;
  }

  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 50;
  }

  :global(.dialog-content) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 51;
    min-width: 300px;
    max-width: 450px;
  }

  :global(.dialog-title) {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }

  :global(.dialog-description) {
    margin: 0 0 1rem 0;
    color: var(--secondary-color, #666);
    font-size: 0.875rem;
  }

  :global(.dialog-actions) {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  :global(.dialog-close) {
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  :global(.dialog-close:hover) {
    background: #eee;
  }
</style>

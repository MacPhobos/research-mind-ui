<script lang="ts">
  import { toastStore } from '$lib/stores/toast';
  import Toast from './Toast.svelte';
</script>

<div class="toast-container" aria-label="Notifications">
  {#each $toastStore.toasts as toast (toast.id)}
    <Toast {toast} onDismiss={toastStore.removeToast} />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }

  .toast-container > :global(*) {
    pointer-events: auto;
  }

  @media (max-width: 480px) {
    .toast-container {
      left: 1rem;
      right: 1rem;
    }

    .toast-container > :global(.toast) {
      max-width: none;
      width: 100%;
    }
  }
</style>

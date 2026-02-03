<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Toast } from '$lib/stores/toast';

  interface Props {
    toast: Toast;
    onDismiss: (id: string) => void;
  }

  let { toast, onDismiss }: Props = $props();

  const typeConfig: Record<
    Toast['type'],
    { bg: string; border: string; icon: string; ariaLive: 'polite' | 'assertive' }
  > = {
    success: {
      bg: '#f0fdf4',
      border: 'var(--success-color, #00aa00)',
      icon: 'check',
      ariaLive: 'polite',
    },
    error: {
      bg: '#fef2f2',
      border: 'var(--error-color, #cc0000)',
      icon: 'x',
      ariaLive: 'assertive',
    },
    warning: {
      bg: '#fffbeb',
      border: '#f59e0b',
      icon: 'alert',
      ariaLive: 'polite',
    },
    info: {
      bg: '#eff6ff',
      border: 'var(--info-color, #3b82f6)',
      icon: 'info',
      ariaLive: 'polite',
    },
  };

  const config = $derived(typeConfig[toast.type]);

  function handleDismiss() {
    onDismiss(toast.id);
  }
</script>

<div
  class="toast"
  role="alert"
  aria-live={config.ariaLive}
  style="background-color: {config.bg}; border-left-color: {config.border};"
>
  <span class="message">{toast.message}</span>
  <button
    class="dismiss-btn"
    onclick={handleDismiss}
    type="button"
    aria-label="Dismiss notification"
  >
    <X size={16} />
  </button>
</div>

<style>
  .toast {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: 6px;
    border-left: 4px solid;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    animation: slideIn 0.2s ease-out;
    min-width: 280px;
    max-width: 400px;
  }

  .message {
    flex: 1;
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.4;
  }

  .dismiss-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #6b7280;
    transition: background-color 0.15s ease;
  }

  .dismiss-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #374151;
  }

  .dismiss-btn:focus-visible {
    outline: 2px solid var(--primary-color, #0066cc);
    outline-offset: 2px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>

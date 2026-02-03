<script lang="ts">
  type SessionStatus = 'active' | 'archived';
  type ContentStatus = 'pending' | 'processing' | 'ready' | 'error' | 'success' | 'indexed' | 'not_indexed';

  interface Props {
    status: SessionStatus | ContentStatus | string;
    variant?: 'session' | 'content';
  }

  // variant prop is reserved for future styling variations by context
  let { status, variant: _variant = 'content' }: Props = $props();

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    // Session statuses
    active: { bg: 'var(--success-color, #00aa00)', text: 'white', label: 'Active' },
    archived: { bg: '#6b7280', text: 'white', label: 'Archived' },

    // Content statuses
    pending: { bg: '#f59e0b', text: 'white', label: 'Pending' },
    processing: { bg: 'var(--info-color, #3b82f6)', text: 'white', label: 'Processing' },
    ready: { bg: 'var(--success-color, #00aa00)', text: 'white', label: 'Ready' },
    success: { bg: 'var(--success-color, #00aa00)', text: 'white', label: 'Success' },
    error: { bg: 'var(--error-color, #cc0000)', text: 'white', label: 'Error' },
    indexed: { bg: 'var(--success-color, #00aa00)', text: 'white', label: 'Indexed' },
    not_indexed: { bg: '#9ca3af', text: '#374151', label: 'Not Indexed' },
  };

  const config = $derived(
    statusConfig[status] || { bg: '#9ca3af', text: '#374151', label: status }
  );

  const isProcessing = $derived(status === 'processing');
</script>

<span
  class="badge"
  class:processing={isProcessing}
  role="status"
  aria-label="Status: {config.label}"
  style="background-color: {config.bg}; color: {config.text};"
>
  {config.label}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .processing {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>

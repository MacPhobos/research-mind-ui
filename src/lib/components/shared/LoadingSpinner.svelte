<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
  }

  let { size = 'md', label }: Props = $props();

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const diameter = $derived(sizeMap[size]);
</script>

<div
  class="spinner-container"
  role="status"
  aria-label={label || 'Loading'}
>
  <div
    class="spinner"
    style="width: {diameter}px; height: {diameter}px; border-width: {Math.max(2, diameter / 8)}px;"
  ></div>
  {#if label}
    <span class="label">{label}</span>
  {/if}
</div>

<style>
  .spinner-container {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    border: solid var(--border-color, #ddd);
    border-top-color: var(--primary-color, #0066cc);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .label {
    color: var(--secondary-color, #666);
    font-size: 0.875rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

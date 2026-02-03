<script lang="ts">
  import { page } from '$app/stores';
  import { AlertTriangle } from 'lucide-svelte';
</script>

<div class="error-page">
  <div class="error-icon">
    <AlertTriangle size={64} strokeWidth={1.5} />
  </div>

  <h1>
    {$page.status}
  </h1>

  <p class="error-message">
    {$page.error?.message ?? 'Something went wrong'}
  </p>

  <div class="error-actions">
    <a href="/sessions" class="back-link">
      Back to Sessions
    </a>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--nav-height));
    padding: var(--space-8);
    text-align: center;
  }

  .error-icon {
    color: var(--error-color);
    margin-bottom: var(--space-4);
  }

  h1 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--text-primary);
  }

  .error-message {
    margin: 0 0 var(--space-6) 0;
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    max-width: 400px;
  }

  .error-actions {
    display: flex;
    gap: var(--space-3);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    padding: var(--space-3) var(--space-5);
    background: var(--primary-color);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition: opacity var(--transition-fast);
  }

  .back-link:hover {
    opacity: 0.9;
  }
</style>

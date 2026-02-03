<script lang="ts">
  import '../app.css';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import AppShell from '$lib/components/layout/AppShell.svelte';
  import ToastContainer from '$lib/components/shared/ToastContainer.svelte';
  import { uiStore } from '$lib/stores/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  // Create query client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Apply theme to document
  $effect(() => {
    const theme = $uiStore.theme;
    document.documentElement.setAttribute('data-theme', theme);
  });
</script>

<!-- Skip to main content link for accessibility -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<QueryClientProvider client={queryClient}>
  <AppShell>
    {@render children()}
  </AppShell>
  <ToastContainer />
</QueryClientProvider>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary-color);
    color: white;
    padding: 8px 16px;
    z-index: 1000;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    border-radius: 0 0 4px 0;
    transition: top 0.2s ease;
  }

  .skip-link:focus {
    top: 0;
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
</style>

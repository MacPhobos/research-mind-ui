<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import { goto } from '$app/navigation';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();


  function handleCreateSession() {
    // Navigate to create session page
    goto('/sessions/new');
  }
</script>

<div class="sessions-layout">
  <Sidebar onCreateSession={handleCreateSession} />

  <div class="main-content">
    {@render children()}
  </div>
</div>

<style>
  .sessions-layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
    margin-left: 0;
    transition: margin-left var(--transition-normal);
  }

  /* Desktop: account for fixed sidebar */
  @media (min-width: 1024px) {
    .main-content {
      margin-left: var(--sidebar-width);
    }
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Header from './Header.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="app-shell">
  <Header />
  <main class="app-content" id="main-content">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .app-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>

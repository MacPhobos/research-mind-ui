<script lang="ts">
  import IndexingPanel from '$lib/components/indexing/IndexingPanel.svelte';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>Indexing - Research Mind</title>
</svelte:head>

<div class="indexing-page">
  <IndexingPanel sessionId={data.sessionId} />
</div>

<style>
  .indexing-page {
    padding: var(--space-4) 0;
  }
</style>

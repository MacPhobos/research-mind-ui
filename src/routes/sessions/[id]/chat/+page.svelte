<script lang="ts">
  import { useIndexStatusQuery } from '$lib/api/hooks';
  import { toReactiveStore } from '$lib/api/reactiveQuery.svelte';
  import { SessionChat } from '$lib/components/chat';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();

  const sessionId = $derived(data.sessionId);

  // Convert to reactive store for TanStack Query
  const sessionIdStore = toReactiveStore(() => sessionId);

  // Use reactive store for TanStack Query updates on navigation
  const indexQuery = useIndexStatusQuery(sessionIdStore);
</script>

<svelte:head>
  <title>Chat - Research Mind</title>
</svelte:head>

<div class="chat-page">
  <SessionChat
    sessionId={sessionId}
    isIndexed={$indexQuery.data?.is_indexed ?? false}
  />
</div>

<style>
  .chat-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 300px);
    min-height: 500px;
  }

  .chat-page :global(.session-chat) {
    flex: 1;
    max-height: none;
  }
</style>

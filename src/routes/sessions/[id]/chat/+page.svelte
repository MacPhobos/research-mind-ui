<script lang="ts">
  import { useIndexStatusQuery } from '$lib/api/hooks';
  import { SessionChat } from '$lib/components/chat';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();

  const sessionId = $derived(data.sessionId);

  const indexQuery = useIndexStatusQuery(sessionId);
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

<script lang="ts">
  import { page } from '$app/stores';

  interface Props {
    sessionId: string;
  }

  let { sessionId }: Props = $props();

  // Generate tabs dynamically based on sessionId
  const tabs = $derived([
    { id: 'chat', label: 'Chat', href: `/sessions/${sessionId}/chat` },
    { id: 'overview', label: 'Overview', href: `/sessions/${sessionId}` },
    { id: 'indexing', label: 'Indexing', href: `/sessions/${sessionId}/indexing` },
    { id: 'audit', label: 'Audit Log', href: `/sessions/${sessionId}/audit` },
    { id: 'settings', label: 'Settings', href: `/sessions/${sessionId}/settings` },
  ] as const);

  // Determine active tab from current path
  const activeTab = $derived(() => {
    const pathname = $page.url.pathname;
    const sessionPath = `/sessions/${sessionId}`;

    if (pathname === sessionPath || pathname === `${sessionPath}/`) {
      return 'overview';
    }

    for (const tab of tabs) {
      if (tab.id !== 'overview' && pathname.startsWith(`${sessionPath}/${tab.id}`)) {
        return tab.id;
      }
    }

    return 'overview';
  }) as () => 'chat' | 'overview' | 'indexing' | 'audit' | 'settings';
</script>

<div class="session-tabs" role="tablist" aria-label="Session navigation">
  {#each tabs as tab (tab.id)}
    <a
      href={tab.href}
      class="tab"
      class:active={activeTab() === tab.id}
      role="tab"
      aria-selected={activeTab() === tab.id}
    >
      {tab.label}
    </a>
  {/each}
</div>

<style>
  .session-tabs {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--space-6);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
    margin-bottom: -1px;
  }

  .tab:hover {
    color: var(--text-primary);
  }

  .tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }

  @media (max-width: 480px) {
    .tab {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-xs);
    }
  }
</style>

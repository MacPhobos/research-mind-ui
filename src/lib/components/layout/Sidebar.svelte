<script lang="ts">
  import { Plus, Search, FolderOpen } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { uiStore, toggleSidebar } from '$lib/stores/ui';
  import { useSessionsQuery } from '$lib/api/hooks';
  import { formatRelativeTime } from '$lib/utils/format';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';

  interface Props {
    onCreateSession?: () => void;
  }

  let { onCreateSession }: Props = $props();

  // Fetch sessions
  const query = useSessionsQuery(100, 0);

  // Local state
  let searchQuery = $state('');

  // Derive filtered sessions
  const filteredSessions = $derived(() => {
    const sessions = $query.data?.sessions ?? [];
    if (!searchQuery.trim()) {
      return sessions;
    }
    const search = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        (s.description?.toLowerCase().includes(search) ?? false)
    );
  });

  // Separate active and archived sessions
  const activeSessions = $derived(filteredSessions().filter((s) => !s.archived));
  const archivedSessions = $derived(filteredSessions().filter((s) => s.archived));

  // Get current session ID from URL
  const currentSessionId = $derived(() => {
    const pathname = $page.url.pathname;
    const match = pathname.match(/\/sessions\/([^/]+)/);
    return match ? match[1] : null;
  });

  // Sidebar visibility
  const isOpen = $derived($uiStore.sidebarOpen);

  // Handle backdrop click on mobile
  function handleBackdropClick() {
    toggleSidebar();
  }

  // Handle keyboard shortcut for search
  function handleKeydown(event: KeyboardEvent) {
    // Check if we're not already in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // / or Ctrl+K focuses search
    if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
      event.preventDefault();
      const searchInput = document.getElementById('sidebar-search');
      searchInput?.focus();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Mobile backdrop -->
{#if isOpen}
  <div
    class="backdrop"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
    role="button"
    tabindex="-1"
    aria-label="Close sidebar"
  ></div>
{/if}

<aside class="sidebar" class:open={isOpen} aria-label="Session list">
  <!-- Create Session Button -->
  <div class="sidebar-header">
    <button class="create-button" onclick={onCreateSession} type="button">
      <Plus size={18} />
      <span>New Session</span>
    </button>
  </div>

  <!-- Search -->
  <div class="search-container">
    <Search size={16} class="search-icon" />
    <input
      id="sidebar-search"
      type="search"
      placeholder="Search sessions... (/)"
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <!-- Session List -->
  <nav class="session-list">
    {#if $query.isPending}
      <div class="loading-container">
        <LoadingSpinner size="md" />
      </div>
    {:else if $query.isError}
      <div class="error-container">
        <p class="error-message">Failed to load sessions</p>
        <button
          class="retry-button"
          onclick={() => $query.refetch()}
          type="button"
        >
          Retry
        </button>
      </div>
    {:else if filteredSessions().length === 0}
      {#if searchQuery.trim()}
        <EmptyState
          title="No matches"
          description="No sessions match your search."
        />
      {:else}
        <EmptyState
          title="No sessions yet"
          description="Create your first research session to get started."
          icon={FolderOpen}
          actionLabel="Create Session"
          onAction={onCreateSession}
        />
      {/if}
    {:else}
      <!-- Active Sessions -->
      {#if activeSessions.length > 0}
        <div class="session-group">
          <h3 class="group-title">Active</h3>
          <ul class="session-items">
            {#each activeSessions as session (session.session_id)}
              <li>
                <a
                  href="/sessions/{session.session_id}"
                  class="session-card"
                  class:active={currentSessionId() === session.session_id}
                  aria-current={currentSessionId() === session.session_id ? 'page' : undefined}
                >
                  <div class="session-header">
                    <span class="session-name">{session.name}</span>
                    <StatusBadge status={session.status} />
                  </div>
                  {#if session.description}
                    <p class="session-description">{session.description}</p>
                  {/if}
                  <span class="session-time">{formatRelativeTime(session.last_accessed)}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Archived Sessions -->
      {#if archivedSessions.length > 0}
        <div class="session-group">
          <h3 class="group-title">Archived</h3>
          <ul class="session-items">
            {#each archivedSessions as session (session.session_id)}
              <li>
                <a
                  href="/sessions/{session.session_id}"
                  class="session-card"
                  class:active={currentSessionId() === session.session_id}
                  aria-current={currentSessionId() === session.session_id ? 'page' : undefined}
                >
                  <div class="session-header">
                    <span class="session-name">{session.name}</span>
                    <StatusBadge status={session.status} />
                  </div>
                  {#if session.description}
                    <p class="session-description">{session.description}</p>
                  {/if}
                  <span class="session-time">{formatRelativeTime(session.last_accessed)}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </nav>
</aside>

<style>
  .backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }

  .sidebar {
    position: fixed;
    top: var(--nav-height);
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-color);
  }

  .create-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .create-button:hover {
    opacity: 0.9;
  }

  .search-container {
    position: relative;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-color);
  }

  .search-container :global(.search-icon) {
    position: absolute;
    left: calc(var(--space-4) + var(--space-3));
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    padding-left: calc(var(--space-3) + 20px);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2) 0;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    gap: var(--space-4);
  }

  .error-message {
    color: var(--error-color);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .retry-button {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .retry-button:hover {
    background: var(--bg-hover);
  }

  .session-group {
    margin-bottom: var(--space-4);
  }

  .group-title {
    padding: var(--space-2) var(--space-4);
    margin: 0;
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .session-items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .session-card {
    display: block;
    padding: var(--space-3) var(--space-4);
    margin: 0 var(--space-2);
    border-radius: var(--border-radius-md);
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
    border-left: 3px solid transparent;
  }

  .session-card:hover {
    background: var(--bg-hover);
  }

  .session-card.active {
    background: var(--bg-active);
    border-left-color: var(--primary-color);
  }

  .session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }

  .session-name {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .session-description {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-time {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  /* Tablet: show backdrop when sidebar is open */
  @media (max-width: 1023px) {
    .backdrop {
      display: block;
    }
  }

  /* Desktop: sidebar always visible */
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }

    .backdrop {
      display: none;
    }
  }

  /* Mobile: full-width sidebar */
  @media (max-width: 767px) {
    .sidebar {
      width: 100%;
    }
  }
</style>

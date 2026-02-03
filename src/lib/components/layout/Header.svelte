<script lang="ts">
  import { Menu, Sun, Moon } from 'lucide-svelte';
  import { uiStore, toggleSidebar, setTheme } from '$lib/stores/ui';
  import { page } from '$app/stores';

  // Derive current theme from store
  const theme = $derived($uiStore.theme);

  // Derive breadcrumb from current route
  const breadcrumb = $derived(() => {
    const pathname = $page.url.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return [{ label: 'Home', href: '/' }];
    }

    const crumbs: Array<{ label: string; href: string }> = [];
    let path = '';

    for (const segment of segments) {
      path += `/${segment}`;
      // Format segment: replace hyphens with spaces, capitalize
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      crumbs.push({ label, href: path });
    }

    return crumbs;
  });


  function handleThemeToggle() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }
</script>

<header class="header">
  <div class="header-left">
    <button
      class="menu-button"
      onclick={toggleSidebar}
      aria-label="Toggle sidebar"
      type="button"
    >
      <Menu size={20} />
    </button>

    <a href="/sessions" class="logo">
      Research Mind
    </a>

    <nav class="breadcrumb" aria-label="Breadcrumb">
      {#each breadcrumb() as crumb, index}
        {#if index > 0}
          <span class="separator">/</span>
        {/if}
        {#if index === breadcrumb().length - 1}
          <span class="current" aria-current="page">{crumb.label}</span>
        {:else}
          <a href={crumb.href}>{crumb.label}</a>
        {/if}
      {/each}
    </nav>
  </div>

  <div class="header-right">
    <button
      class="icon-button"
      onclick={handleThemeToggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      type="button"
    >
      {#if theme === 'light'}
        <Moon size={20} />
      {:else}
        <Sun size={20} />
      {/if}
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--nav-height);
    padding: 0 var(--space-4);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-primary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .menu-button:hover {
    background: var(--bg-hover);
  }

  .logo {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-color);
    white-space: nowrap;
  }

  .breadcrumb {
    display: none;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    overflow: hidden;
  }

  .breadcrumb a {
    color: var(--text-secondary);
    transition: color var(--transition-fast);
    white-space: nowrap;
  }

  .breadcrumb a:hover {
    color: var(--primary-color);
  }

  .breadcrumb .separator {
    color: var(--text-muted);
  }

  .breadcrumb .current {
    color: var(--text-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-primary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .icon-button:hover {
    background: var(--bg-hover);
  }

  /* Show breadcrumb on larger screens */
  @media (min-width: 768px) {
    .breadcrumb {
      display: flex;
    }
  }

  /* Hide menu button on desktop where sidebar is always visible */
  @media (min-width: 1024px) {
    .menu-button {
      display: none;
    }
  }
</style>

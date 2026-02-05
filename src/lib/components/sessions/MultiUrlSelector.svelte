<script lang="ts">
  import { Link, Loader2, ChevronDown, ChevronRight, ExternalLink, X } from 'lucide-svelte';
  import { useExtractLinksMutation, useBatchAddContentMutation } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';
  import type { ExtractedLinksResponse, ExtractedLinkSchema } from '$lib/api/client';

  interface Props {
    sessionId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { sessionId, onSuccess, onCancel }: Props = $props();

  // Mutations
  const extractMutation = useExtractLinksMutation();
  const batchMutation = useBatchAddContentMutation();

  // Step management
  type Step = 'input' | 'loading' | 'select' | 'adding';
  let currentStep = $state<Step>('input');

  // Input state
  let sourceUrl = $state('');
  let includeExternal = $state(true);

  // Extracted data
  let extractedLinks = $state<ExtractedLinksResponse | null>(null);

  // Selection state
  let selectedUrls = $state<Set<string>>(new Set());
  let expandedCategories = $state<Set<string>>(new Set(['main_content']));

  // Category display names
  const categoryLabels: Record<string, string> = {
    main_content: 'Main Content',
    navigation: 'Navigation',
    sidebar: 'Sidebar',
    footer: 'Footer',
    other: 'Other',
  };

  // Derived values
  const allLinks = $derived(() => {
    if (!extractedLinks?.categories) return [];
    const categories = extractedLinks.categories;
    return [
      ...(categories.main_content ?? []),
      ...(categories.navigation ?? []),
      ...(categories.sidebar ?? []),
      ...(categories.footer ?? []),
      ...(categories.other ?? []),
    ];
  });

  const totalLinkCount = $derived(allLinks().length);
  const selectedCount = $derived(selectedUrls.size);

  // Helper functions
  function getCategoryLinks(category: string): ExtractedLinkSchema[] {
    if (!extractedLinks?.categories) return [];
    const categories = extractedLinks.categories;
    switch (category) {
      case 'main_content':
        return categories.main_content ?? [];
      case 'navigation':
        return categories.navigation ?? [];
      case 'sidebar':
        return categories.sidebar ?? [];
      case 'footer':
        return categories.footer ?? [];
      case 'other':
        return categories.other ?? [];
      default:
        return [];
    }
  }

  function getCategoryCount(category: string): number {
    return getCategoryLinks(category).length;
  }

  function toggleCategory(category: string) {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    expandedCategories = newSet;
  }

  function toggleUrl(url: string) {
    const newSet = new Set(selectedUrls);
    if (newSet.has(url)) {
      newSet.delete(url);
    } else {
      newSet.add(url);
    }
    selectedUrls = newSet;
  }

  function selectAll() {
    selectedUrls = new Set(allLinks().map((link) => link.url));
  }

  function deselectAll() {
    selectedUrls = new Set();
  }

  async function handleExtract() {
    if (!sourceUrl.trim()) return;

    currentStep = 'loading';

    try {
      const result = await $extractMutation.mutateAsync({
        url: sourceUrl.trim(),
        include_external: includeExternal,
      });

      extractedLinks = result;
      // Pre-select main_content links by default
      const mainContentLinks = result.categories.main_content ?? [];
      selectedUrls = new Set(mainContentLinks.map((link) => link.url));
      currentStep = 'select';
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to extract links from page';
      toastStore.error(message);
      currentStep = 'input';
    }
  }

  async function handleAdd() {
    if (selectedUrls.size === 0) return;

    currentStep = 'adding';

    try {
      // Build URL list with titles from extracted links
      const urlsToAdd = Array.from(selectedUrls).map((url) => {
        const link = allLinks().find((l) => l.url === url);
        return {
          url,
          title: link?.text || undefined,
        };
      });

      const result = await $batchMutation.mutateAsync({
        sessionId,
        urls: urlsToAdd,
        source_url: extractedLinks?.source_url,
      });

      // Show result summary
      if (result.error_count > 0) {
        toastStore.warning(
          `Added ${result.success_count} URLs. ${result.error_count} failed, ${result.duplicate_count} duplicates skipped.`
        );
      } else if (result.duplicate_count > 0) {
        toastStore.success(
          `Added ${result.success_count} URLs. ${result.duplicate_count} duplicates skipped.`
        );
      } else {
        toastStore.success(`Successfully added ${result.success_count} URLs`);
      }

      // Reset and notify success
      resetState();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add URLs to session';
      toastStore.error(message);
      currentStep = 'select';
    }
  }

  function resetState() {
    currentStep = 'input';
    sourceUrl = '';
    includeExternal = true;
    extractedLinks = null;
    selectedUrls = new Set();
    expandedCategories = new Set(['main_content']);
  }

  function handleCancel() {
    resetState();
    onCancel?.();
  }

  function handleBack() {
    currentStep = 'input';
  }

  // Categories to display (only those with links)
  const visibleCategories = $derived(() => {
    const cats = ['main_content', 'navigation', 'sidebar', 'footer', 'other'];
    return cats.filter((cat) => getCategoryCount(cat) > 0);
  });
</script>

<div class="multi-url-selector">
  <div class="header">
    <h3>Add Multiple URLs</h3>
    {#if onCancel}
      <button type="button" class="close-btn" onclick={handleCancel} aria-label="Close">
        <X size={18} />
      </button>
    {/if}
  </div>

  {#if currentStep === 'input'}
    <div class="step-input">
      <p class="description">
        Enter a URL to extract all links from the page. You can then select which links to add to
        your session.
      </p>

      <div class="form-group">
        <label for="source-url">
          <Link size={16} />
          Source URL
        </label>
        <input
          id="source-url"
          type="url"
          bind:value={sourceUrl}
          placeholder="https://example.com/documentation"
        />
      </div>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" bind:checked={includeExternal} />
          Include external links
        </label>
      </div>

      <div class="actions">
        {#if onCancel}
          <button type="button" class="btn-secondary" onclick={handleCancel}> Cancel </button>
        {/if}
        <button
          type="button"
          class="btn-primary"
          disabled={!sourceUrl.trim()}
          onclick={handleExtract}
        >
          Extract Links
        </button>
      </div>
    </div>
  {:else if currentStep === 'loading'}
    <div class="step-loading">
      <Loader2 size={32} class="spinner" />
      <p>Extracting links from page...</p>
    </div>
  {:else if currentStep === 'select'}
    <div class="step-select">
      <div class="select-header">
        <div class="page-info">
          <h4>{extractedLinks?.page_title || 'Extracted Links'}</h4>
          <p class="source-url">{extractedLinks?.source_url}</p>
        </div>

        <div class="selection-controls">
          <button type="button" class="btn-text" onclick={selectAll}>
            Select All ({totalLinkCount})
          </button>
          <button type="button" class="btn-text" onclick={deselectAll}> Deselect All </button>
          <span class="selected-count">{selectedCount} selected</span>
        </div>
      </div>

      <div class="categories-list">
        {#each visibleCategories() as category}
          {@const links = getCategoryLinks(category)}
          {@const count = links.length}
          {@const isExpanded = expandedCategories.has(category)}

          <div class="category">
            <button type="button" class="category-header" onclick={() => toggleCategory(category)}>
              {#if isExpanded}
                <ChevronDown size={16} />
              {:else}
                <ChevronRight size={16} />
              {/if}
              <span class="category-name">{categoryLabels[category] || category}</span>
              <span class="category-count">({count} links)</span>
            </button>

            {#if isExpanded}
              <div class="links-list">
                {#each links as link}
                  <label class="link-item">
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(link.url)}
                      onchange={() => toggleUrl(link.url)}
                    />
                    <span class="link-text">{link.text || link.url}</span>
                    {#if link.is_external}
                      <span class="external-badge">
                        <ExternalLink size={12} />
                        external
                      </span>
                    {/if}
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="actions">
        <button type="button" class="btn-secondary" onclick={handleBack}> Back </button>
        <button
          type="button"
          class="btn-primary"
          disabled={selectedCount === 0}
          onclick={handleAdd}
        >
          Add {selectedCount} URLs
        </button>
      </div>
    </div>
  {:else if currentStep === 'adding'}
    <div class="step-adding">
      <Loader2 size={32} class="spinner" />
      <p>Adding {selectedCount} URLs to session...</p>
    </div>
  {/if}
</div>

<style>
  .multi-url-selector {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-5);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .description {
    margin: 0 0 var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-group input[type='url'] {
    width: 100%;
    padding: var(--space-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    transition: border-color var(--transition-fast);
  }

  .form-group input[type='url']::placeholder {
    color: var(--text-muted);
  }

  .form-group input[type='url']:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .checkbox-group {
    margin-bottom: var(--space-4);
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    cursor: pointer;
  }

  .checkbox-group input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
  }

  .btn-text {
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: none;
    font-size: var(--font-size-xs);
    color: var(--primary-color);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .btn-text:hover {
    opacity: 0.8;
  }

  /* Loading states */
  .step-loading,
  .step-adding {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    gap: var(--space-4);
  }

  .step-loading p,
  .step-adding p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
    color: var(--primary-color);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Select step */
  .select-header {
    margin-bottom: var(--space-4);
  }

  .page-info h4 {
    margin: 0 0 var(--space-1);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  .source-url {
    margin: 0;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    word-break: break-all;
  }

  .selection-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding: var(--space-2);
    background: var(--bg-primary);
    border-radius: var(--border-radius-md);
  }

  .selected-count {
    margin-left: auto;
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .categories-list {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
  }

  .category {
    border-bottom: 1px solid var(--border-color);
  }

  .category:last-child {
    border-bottom: none;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3);
    background: var(--bg-primary);
    border: none;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .category-header:hover {
    background: var(--bg-hover);
  }

  .category-name {
    flex: 1;
    text-align: left;
  }

  .category-count {
    font-weight: 400;
    color: var(--text-muted);
  }

  .links-list {
    padding: var(--space-2);
    background: var(--bg-secondary);
  }

  .link-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .link-item:hover {
    background: var(--bg-hover);
  }

  .link-item input[type='checkbox'] {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: var(--primary-color);
  }

  .link-text {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    word-break: break-word;
  }

  .external-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    padding: 2px 6px;
    background: var(--bg-hover);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
</style>

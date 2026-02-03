<script lang="ts">
  import { FileText, Link, Trash2, AlertCircle } from 'lucide-svelte';
  import type { ContentItemResponse } from '$lib/api/client';
  import { useDeleteContentMutation } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import { formatRelativeTime } from '$lib/utils/format';

  interface Props {
    sessionId: string;
    items: ContentItemResponse[];
    isLoading?: boolean;
  }

  let { sessionId, items, isLoading = false }: Props = $props();

  const deleteMutation = useDeleteContentMutation();

  // State for delete confirmation
  let showDeleteConfirm = $state(false);
  let contentToDelete = $state<ContentItemResponse | null>(null);

  function getContentIcon(contentType: string) {
    switch (contentType) {
      case 'url':
        return Link;
      case 'text':
      default:
        return FileText;
    }
  }

  function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleDeleteClick(content: ContentItemResponse) {
    contentToDelete = content;
    showDeleteConfirm = true;
  }

  async function confirmDelete() {
    if (!contentToDelete) return;

    try {
      await $deleteMutation.mutateAsync({
        sessionId,
        contentId: contentToDelete.content_id,
      });
      toastStore.success('Content deleted successfully');
    } catch {
      toastStore.error($deleteMutation.error?.message || 'Failed to delete content');
    } finally {
      showDeleteConfirm = false;
      contentToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false;
    contentToDelete = null;
  }
</script>

{#if isLoading}
  <div class="loading-state">
    <div class="skeleton-item"></div>
    <div class="skeleton-item"></div>
    <div class="skeleton-item"></div>
  </div>
{:else if items.length === 0}
  <EmptyState
    title="No content yet"
    description="Add text, URLs, or files to this session to start organizing your research."
    icon={FileText}
  />
{:else}
  <div class="content-list">
    {#each items as item (item.content_id)}
      {@const Icon = getContentIcon(item.content_type)}
      <div class="content-item" class:has-error={item.status === 'error'}>
        <div class="item-icon">
          <Icon size={20} />
        </div>
        <div class="item-info">
          <div class="item-header">
            <h4 class="item-title">{item.title}</h4>
            <StatusBadge status={item.status} />
          </div>
          <div class="item-meta">
            <span class="meta-type">{item.content_type}</span>
            {#if item.size_bytes}
              <span class="meta-sep">|</span>
              <span class="meta-size">{formatFileSize(item.size_bytes)}</span>
            {/if}
            <span class="meta-sep">|</span>
            <span class="meta-time">{formatRelativeTime(item.created_at)}</span>
          </div>
          {#if item.source_ref}
            <p class="item-source" title={item.source_ref}>
              {item.content_type === 'url' ? item.source_ref : 'Text content'}
            </p>
          {/if}
          {#if item.status === 'error' && item.error_message}
            <div class="item-error">
              <AlertCircle size={14} />
              <span>{item.error_message}</span>
            </div>
          {/if}
        </div>
        <button
          type="button"
          class="delete-btn"
          onclick={() => handleDeleteClick(item)}
          aria-label="Delete content"
          disabled={$deleteMutation.isPending}
        >
          <Trash2 size={16} />
        </button>
      </div>
    {/each}
  </div>
{/if}

<ConfirmDialog
  bind:open={showDeleteConfirm}
  title="Delete Content"
  message="Are you sure you want to delete '{contentToDelete?.title}'? This action cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .skeleton-item {
    height: 72px;
    background: var(--bg-hover);
    border-radius: var(--border-radius-md);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .content-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .content-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    transition: border-color var(--transition-fast);
  }

  .content-item:hover {
    border-color: var(--primary-color);
  }

  .content-item.has-error {
    border-color: var(--error-color);
    background: rgba(204, 0, 0, 0.02);
  }

  .item-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg-hover);
    border-radius: var(--border-radius-md);
    color: var(--text-secondary);
  }

  .item-info {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }

  .item-title {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .meta-sep {
    color: var(--border-color);
  }

  .meta-type {
    text-transform: capitalize;
  }

  .item-source {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--error-color);
  }

  .delete-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-md);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .delete-btn:hover:not(:disabled) {
    background: rgba(204, 0, 0, 0.1);
    color: var(--error-color);
  }

  .delete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

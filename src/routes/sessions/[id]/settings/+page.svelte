<script lang="ts">
  import { goto } from '$app/navigation';
  import { Settings, Trash2, Archive, ArchiveRestore, Loader } from 'lucide-svelte';
  import {
    useSessionQuery,
    useUpdateSessionMutation,
    useDeleteSessionMutation,
  } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';
  import { formatDate } from '$lib/utils/format';
  import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';

  interface Props {
    data: {
      sessionId: string;
    };
  }

  let { data }: Props = $props();

  // Derive sessionId to track prop changes reactively
  const sessionId = $derived(data.sessionId);
  // Create a stable getter for TanStack Query to avoid state capture warning
  const currentSessionId = $derived(sessionId);

  const sessionQuery = useSessionQuery(currentSessionId);
  const updateMutation = useUpdateSessionMutation();
  const deleteMutation = useDeleteSessionMutation();

  // Edit form state - initialize from session data
  let editName = $state('');
  let editDescription = $state('');
  let touched = $state({ name: false, description: false });
  let isEditing = $state(false);

  // Sync form state when session data loads
  $effect(() => {
    if ($sessionQuery.data && !isEditing) {
      editName = $sessionQuery.data.name;
      editDescription = $sessionQuery.data.description || '';
    }
  });

  // Validation
  const nameError = $derived(
    !touched.name ? null :
    editName.trim().length === 0 ? 'Name is required' :
    editName.trim().length > 255 ? 'Name must be 255 characters or fewer' :
    null
  );

  const descriptionError = $derived(
    !touched.description ? null :
    editDescription.length > 1024 ? 'Description must be 1024 characters or fewer' :
    null
  );

  const isFormValid = $derived(
    editName.trim().length > 0 &&
    editName.trim().length <= 255 &&
    editDescription.length <= 1024
  );

  const hasChanges = $derived(
    $sessionQuery.data &&
    (editName.trim() !== $sessionQuery.data.name ||
     editDescription.trim() !== ($sessionQuery.data.description || ''))
  );

  // Dialog state
  let showDeleteDialog = $state(false);
  let showArchiveDialog = $state(false);

  function startEditing() {
    isEditing = true;
    touched = { name: false, description: false };
  }

  function cancelEditing() {
    if ($sessionQuery.data) {
      editName = $sessionQuery.data.name;
      editDescription = $sessionQuery.data.description || '';
    }
    isEditing = false;
    touched = { name: false, description: false };
  }

  async function saveChanges() {
    if (!isFormValid || !hasChanges || $updateMutation.isPending) return;

    try {
      await $updateMutation.mutateAsync({
        sessionId: currentSessionId,
        request: {
          name: editName.trim(),
          description: editDescription.trim() || null,
        },
      });
      toastStore.success('Session updated successfully');
      isEditing = false;
      touched = { name: false, description: false };
    } catch {
      toastStore.error($updateMutation.error?.message || 'Failed to update session');
    }
  }

  async function toggleArchive() {
    if (!$sessionQuery.data) return;

    const newStatus = $sessionQuery.data.archived ? 'active' : 'archived';

    try {
      await $updateMutation.mutateAsync({
        sessionId: currentSessionId,
        request: {
          status: newStatus,
        },
      });
      toastStore.success(
        newStatus === 'archived' ? 'Session archived' : 'Session restored'
      );
      showArchiveDialog = false;
    } catch {
      toastStore.error($updateMutation.error?.message || 'Failed to update session');
    }
  }

  async function confirmDelete() {
    try {
      await $deleteMutation.mutateAsync(currentSessionId);
      toastStore.success('Session deleted successfully');
      goto('/sessions');
    } catch {
      toastStore.error($deleteMutation.error?.message || 'Failed to delete session');
    } finally {
      showDeleteDialog = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - Research Mind</title>
</svelte:head>

{#if $sessionQuery.isPending}
  <div class="loading-state">
    <LoadingSpinner size="lg" />
    <p>Loading session settings...</p>
  </div>
{:else if $sessionQuery.isError}
  <div class="error-state">
    <p class="error-text">Failed to load session: {$sessionQuery.error?.message}</p>
  </div>
{:else if $sessionQuery.data}
  <div class="settings-page">
    <!-- Session Information Section -->
    <section class="card">
      <div class="card-header">
        <h2 class="card-title">
          <Settings size={20} />
          Session Information
        </h2>
        {#if !isEditing}
          <button type="button" class="edit-btn" onclick={startEditing}>
            Edit
          </button>
        {/if}
      </div>

      {#if isEditing}
        <form onsubmit={(e) => { e.preventDefault(); saveChanges(); }}>
          <div class="form-group">
            <label for="session-name">
              Name <span class="required">*</span>
            </label>
            <input
              id="session-name"
              type="text"
              bind:value={editName}
              onblur={() => (touched.name = true)}
              class:error={nameError}
              placeholder="Enter session name"
            />
            {#if nameError}
              <p class="error-text">{nameError}</p>
            {/if}
          </div>

          <div class="form-group">
            <label for="session-description">Description</label>
            <textarea
              id="session-description"
              bind:value={editDescription}
              onblur={() => (touched.description = true)}
              class:error={descriptionError}
              placeholder="Describe what this session is about (optional)"
              rows="4"
            ></textarea>
            {#if descriptionError}
              <p class="error-text">{descriptionError}</p>
            {/if}
            <p class="hint">{editDescription.length}/1024 characters</p>
          </div>

          {#if $updateMutation.isError}
            <div class="form-error">
              <p>{$updateMutation.error?.message || 'Failed to update session'}</p>
            </div>
          {/if}

          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={cancelEditing}>
              Cancel
            </button>
            <button
              type="submit"
              class="save-btn"
              disabled={!isFormValid || !hasChanges || $updateMutation.isPending}
            >
              {#if $updateMutation.isPending}
                <Loader size={16} class="spinner" />
                Saving...
              {:else}
                Save Changes
              {/if}
            </button>
          </div>
        </form>
      {:else}
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">{$sessionQuery.data.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Description</span>
            <span class="info-value">
              {$sessionQuery.data.description || 'No description'}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value capitalize">{$sessionQuery.data.status}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Created</span>
            <span class="info-value">{formatDate($sessionQuery.data.created_at)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Session ID</span>
            <span class="info-value mono">{$sessionQuery.data.session_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Workspace Path</span>
            <span class="info-value mono">{$sessionQuery.data.workspace_path}</span>
          </div>
        </div>
      {/if}
    </section>

    <!-- Archive Section -->
    <section class="card">
      <h2 class="card-title">
        {#if $sessionQuery.data.archived}
          <ArchiveRestore size={20} />
          Restore Session
        {:else}
          <Archive size={20} />
          Archive Session
        {/if}
      </h2>
      <p class="section-description">
        {#if $sessionQuery.data.archived}
          This session is currently archived. Restoring it will make it active again
          and visible in the main session list.
        {:else}
          Archiving this session will hide it from the main session list.
          You can restore it later from the archived sessions view.
        {/if}
      </p>
      <button
        type="button"
        class="archive-btn"
        class:restore={$sessionQuery.data.archived}
        onclick={() => showArchiveDialog = true}
        disabled={$updateMutation.isPending}
      >
        {#if $sessionQuery.data.archived}
          <ArchiveRestore size={16} />
          Restore Session
        {:else}
          <Archive size={16} />
          Archive Session
        {/if}
      </button>
    </section>

    <!-- Danger Zone -->
    <section class="card danger-zone">
      <h2 class="card-title danger">
        <Trash2 size={20} />
        Danger Zone
      </h2>
      <p class="section-description">
        Deleting this session is permanent. All associated content and workspace files
        will be removed. This action cannot be undone.
      </p>
      <button
        type="button"
        class="delete-btn"
        onclick={() => showDeleteDialog = true}
        disabled={$deleteMutation.isPending}
      >
        {#if $deleteMutation.isPending}
          <Loader size={16} class="spinner" />
          Deleting...
        {:else}
          <Trash2 size={16} />
          Delete Session
        {/if}
      </button>
    </section>
  </div>
{/if}

<!-- Archive Confirmation Dialog -->
<ConfirmDialog
  bind:open={showArchiveDialog}
  title={$sessionQuery.data?.archived ? 'Restore Session' : 'Archive Session'}
  message={$sessionQuery.data?.archived
    ? `Are you sure you want to restore "${$sessionQuery.data?.name}"? It will become active and visible in the main session list.`
    : `Are you sure you want to archive "${$sessionQuery.data?.name}"? It will be hidden from the main session list.`}
  confirmLabel={$sessionQuery.data?.archived ? 'Restore' : 'Archive'}
  variant="default"
  onConfirm={toggleArchive}
  onCancel={() => showArchiveDialog = false}
/>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Session"
  message={`Are you sure you want to permanently delete "${$sessionQuery.data?.name}"? This action cannot be undone and all associated content will be lost.`}
  confirmLabel="Delete Permanently"
  variant="danger"
  onConfirm={confirmDelete}
  onCancel={() => showDeleteDialog = false}
/>

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    gap: var(--space-4);
  }

  .loading-state p {
    margin: 0;
    color: var(--text-secondary);
  }

  .error-state {
    padding: var(--space-6);
    text-align: center;
  }

  .error-text {
    margin: 0;
    color: var(--error-color);
    font-size: var(--font-size-sm);
  }

  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 700px;
  }

  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-5);
  }

  .card.danger-zone {
    border-color: var(--error-color);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-4) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .card-header .card-title {
    margin-bottom: 0;
  }

  .card-title.danger {
    color: var(--error-color);
  }

  .edit-btn {
    padding: var(--space-2) var(--space-3);
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .edit-btn:hover {
    background: var(--primary-color);
    color: white;
  }

  .section-description {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-color);
  }

  .info-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .info-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    flex-shrink: 0;
    margin-right: var(--space-4);
  }

  .info-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    text-align: right;
    word-break: break-word;
  }

  .info-value.mono {
    font-family: monospace;
    font-size: var(--font-size-xs);
  }

  .info-value.capitalize {
    text-transform: capitalize;
  }

  .form-group {
    margin-bottom: var(--space-4);
  }

  label {
    display: block;
    margin-bottom: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .required {
    color: var(--error-color);
  }

  input,
  textarea {
    width: 100%;
    padding: var(--space-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-base);
    color: var(--text-primary);
    transition: border-color var(--transition-fast);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--text-muted);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  input.error,
  textarea.error {
    border-color: var(--error-color);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .hint {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    text-align: right;
  }

  .form-error {
    margin-bottom: var(--space-4);
    padding: var(--space-3);
    background: rgba(204, 0, 0, 0.1);
    border: 1px solid var(--error-color);
    border-radius: var(--border-radius-md);
  }

  .form-error p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--error-color);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
  }

  .cancel-btn {
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

  .cancel-btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
  }

  .save-btn {
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

  .save-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .archive-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
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

  .archive-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
  }

  .archive-btn.restore {
    color: var(--success-color);
    border-color: var(--success-color);
  }

  .archive-btn.restore:hover:not(:disabled) {
    background: rgba(0, 170, 0, 0.1);
  }

  .archive-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--error-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .delete-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .delete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.spinner) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .info-row {
      flex-direction: column;
      gap: var(--space-1);
    }

    .info-value {
      text-align: left;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .cancel-btn,
    .save-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>

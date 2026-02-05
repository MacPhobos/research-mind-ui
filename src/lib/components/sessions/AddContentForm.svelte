<script lang="ts">
  import { FileText, Link, Link2, GitBranch, Loader, X } from 'lucide-svelte';
  import { useAddContentMutation } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';
  import MultiUrlSelector from './MultiUrlSelector.svelte';

  interface Props {
    sessionId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { sessionId, onSuccess, onCancel }: Props = $props();

  const mutation = useAddContentMutation();

  // Content types
  const contentTypes = [
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'url', label: 'URL', icon: Link },
    { value: 'multi_url', label: 'Multi-URL', icon: Link2 },
    { value: 'git_repo', label: 'Git Repository', icon: GitBranch },
  ] as const;

  type ContentType = (typeof contentTypes)[number]['value'];

  // Form state
  let contentType = $state<ContentType>('text');
  let title = $state('');
  let source = $state('');
  let gitUrl = $state('');
  let touched = $state({ title: false, source: false, gitUrl: false });

  // Validation
  const titleError = $derived(
    !touched.title ? null :
    title.trim().length === 0 ? 'Title is required' :
    title.trim().length > 255 ? 'Title must be 255 characters or fewer' :
    null
  );

  const sourceError = $derived(
    !touched.source ? null :
    source.trim().length === 0 ? (contentType === 'text' ? 'Content is required' : 'URL is required') :
    contentType === 'url' && !isValidUrl(source.trim()) ? 'Please enter a valid URL' :
    null
  );

  const gitUrlError = $derived(
    !touched.gitUrl ? null :
    gitUrl.trim().length === 0 ? 'Git URL is required' :
    !isValidGitUrl(gitUrl.trim()) ? 'Please enter a valid Git URL (HTTPS, SSH, or git://)' :
    null
  );

  const isValid = $derived(() => {
    if (contentType === 'git_repo') {
      return gitUrl.trim().length > 0 && isValidGitUrl(gitUrl.trim());
    }
    return (
      title.trim().length > 0 &&
      title.trim().length <= 255 &&
      source.trim().length > 0 &&
      (contentType !== 'url' || isValidUrl(source.trim()))
    );
  });

  function isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  function isValidGitUrl(url: string): boolean {
    if (!url || url.trim() === '') return false;
    // Support HTTPS, SSH, and git:// protocols
    const patterns = [
      /^https?:\/\/.+/, // HTTPS URLs
      /^git@.+:.+/, // SSH URLs (git@github.com:user/repo.git)
      /^git:\/\/.+/, // Git protocol
    ];
    return patterns.some((p) => p.test(url.trim()));
  }

  function extractRepoName(url: string): string {
    // Extract repo name from URL for default title
    // Handle: https://github.com/user/repo.git, git@github.com:user/repo.git, etc.
    const trimmed = url.trim().replace(/\.git$/, '');
    const parts = trimmed.split(/[/:]/);
    return parts[parts.length - 1] || url;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid() || $mutation.isPending) return;

    try {
      if (contentType === 'git_repo') {
        // For git_repo, use gitUrl as source and extract repo name for title
        const repoName = extractRepoName(gitUrl);
        await $mutation.mutateAsync({
          sessionId,
          contentType,
          options: {
            title: repoName,
            source: gitUrl.trim(),
          },
        });
      } else {
        await $mutation.mutateAsync({
          sessionId,
          contentType,
          options: {
            title: title.trim(),
            source: source.trim(),
          },
        });
      }

      toastStore.success('Content added successfully');

      // Reset form
      title = '';
      source = '';
      gitUrl = '';
      touched = { title: false, source: false, gitUrl: false };

      onSuccess?.();
    } catch {
      toastStore.error($mutation.error?.message || 'Failed to add content');
    }
  }

  function handleCancel() {
    title = '';
    source = '';
    gitUrl = '';
    touched = { title: false, source: false, gitUrl: false };
    onCancel?.();
  }

  function handleMultiUrlSuccess() {
    // Reset form state and switch back to default content type
    contentType = 'text';
    title = '';
    source = '';
    gitUrl = '';
    touched = { title: false, source: false, gitUrl: false };
    // Call the parent's onSuccess if provided
    onSuccess?.();
  }
</script>

<form class="add-content-form" onsubmit={handleSubmit}>
  <div class="form-header">
    <h3>Add Content</h3>
    {#if onCancel}
      <button type="button" class="close-btn" onclick={handleCancel} aria-label="Close">
        <X size={18} />
      </button>
    {/if}
  </div>

  <div class="type-selector">
    {#each contentTypes as ct}
      <button
        type="button"
        class="type-btn"
        class:active={contentType === ct.value}
        onclick={() => (contentType = ct.value)}
      >
        <ct.icon size={16} />
        {ct.label}
      </button>
    {/each}
  </div>

  {#if contentType === 'multi_url'}
    <MultiUrlSelector
      {sessionId}
      onSuccess={handleMultiUrlSuccess}
      onCancel={onCancel}
    />
  {:else if contentType === 'git_repo'}
    <div class="form-group">
      <label for="git-url">
        Git URL <span class="required">*</span>
      </label>
      <input
        id="git-url"
        type="text"
        bind:value={gitUrl}
        onblur={() => (touched.gitUrl = true)}
        class:error={gitUrlError}
        placeholder="https://github.com/user/repo.git"
        required
      />
      {#if gitUrlError}
        <p class="error-text">{gitUrlError}</p>
      {/if}
      <p class="help-text">Supports HTTPS, SSH (git@...), and git:// URLs</p>
    </div>
  {:else}
    <div class="form-group">
      <label for="content-title">
        Title <span class="required">*</span>
      </label>
      <input
        id="content-title"
        type="text"
        bind:value={title}
        onblur={() => (touched.title = true)}
        class:error={titleError}
        placeholder="Enter a title for this content"
        required
      />
      {#if titleError}
        <p class="error-text">{titleError}</p>
      {/if}
    </div>

    <div class="form-group">
      <label for="content-source">
        {contentType === 'text' ? 'Content' : 'URL'} <span class="required">*</span>
      </label>
      {#if contentType === 'text'}
        <textarea
          id="content-source"
          bind:value={source}
          onblur={() => (touched.source = true)}
          class:error={sourceError}
          placeholder="Enter your text content here..."
          rows="6"
          required
        ></textarea>
      {:else}
        <input
          id="content-source"
          type="url"
          bind:value={source}
          onblur={() => (touched.source = true)}
          class:error={sourceError}
          placeholder="https://example.com/article"
          required
        />
      {/if}
      {#if sourceError}
        <p class="error-text">{sourceError}</p>
      {/if}
    </div>
  {/if}

  {#if contentType !== 'multi_url'}
    {#if $mutation.isError}
      <div class="form-error">
        <p>{$mutation.error?.message || 'Failed to add content'}</p>
      </div>
    {/if}

    <div class="form-actions">
      {#if onCancel}
        <button type="button" class="cancel-btn" onclick={handleCancel}>
          Cancel
        </button>
      {/if}
      <button
        type="submit"
        class="submit-btn"
        disabled={!isValid() || $mutation.isPending}
      >
        {#if $mutation.isPending}
          <Loader size={16} class="spinner" />
          Adding...
        {:else}
          Add Content
        {/if}
      </button>
    </div>
  {/if}
</form>

<style>
  .add-content-form {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-5);
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .form-header h3 {
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
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .type-selector {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .type-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .type-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
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
    min-height: 120px;
    font-family: inherit;
  }

  .error-text {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--error-color);
  }

  .help-text {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
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
    margin-top: var(--space-4);
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

  .submit-btn {
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

  .submit-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .submit-btn:disabled {
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
</style>

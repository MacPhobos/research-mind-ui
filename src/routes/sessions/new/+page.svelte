<script lang="ts">
  import { goto } from '$app/navigation';
  import { useCreateSessionMutation } from '$lib/api/hooks';
  import { toastStore } from '$lib/stores/toast';

  const mutation = useCreateSessionMutation();

  let name = $state('');
  let description = $state('');
  let touched = $state({ name: false, description: false });

  // Validation - $derived takes an expression, not a function
  const nameError = $derived(
    !touched.name ? null :
    name.trim().length === 0 ? 'Name is required' :
    name.trim().length > 255 ? 'Name must be 255 characters or fewer' :
    null
  );

  const descriptionError = $derived(
    !touched.description ? null :
    description.length > 1024 ? 'Description must be 1024 characters or fewer' :
    null
  );

  const isValid = $derived(
    name.trim().length > 0 &&
    name.trim().length <= 255 &&
    description.length <= 1024
  );

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid || $mutation.isPending) return;

    try {
      const result = await $mutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      toastStore.success('Session created successfully');
      goto(`/sessions/${result.session_id}`);
    } catch {
      // Error is handled by the mutation state
    }
  }

  function handleCancel() {
    goto('/sessions');
  }
</script>

<svelte:head>
  <title>Create Session - Research Mind</title>
</svelte:head>

<div class="page-container">
  <div class="form-card">
    <h1>Create New Session</h1>
    <p class="subtitle">Start a new research session to organize your work.</p>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="name">
          Name <span class="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          bind:value={name}
          onblur={() => (touched.name = true)}
          class:error={nameError}
          placeholder="Enter session name"
          required
        />
        {#if nameError}
          <p class="error-text">{nameError}</p>
        {/if}
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          bind:value={description}
          onblur={() => (touched.description = true)}
          class:error={descriptionError}
          placeholder="Describe what this session is about (optional)"
          rows="4"
        ></textarea>
        {#if descriptionError}
          <p class="error-text">{descriptionError}</p>
        {/if}
        <p class="hint">{description.length}/1024 characters</p>
      </div>

      {#if $mutation.isError}
        <div class="form-error">
          <p>{$mutation.error?.message || 'Failed to create session'}</p>
        </div>
      {/if}

      <div class="form-actions">
        <button
          type="button"
          class="cancel-button"
          onclick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="submit-button"
          disabled={!isValid || $mutation.isPending}
        >
          {$mutation.isPending ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .page-container {
    max-width: 560px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  .form-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-lg);
    padding: var(--space-6);
  }

  h1 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .subtitle {
    margin: 0 0 var(--space-6) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .form-group {
    margin-bottom: var(--space-5);
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

  .error-text {
    margin: var(--space-2) 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--error-color);
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
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
  }

  .cancel-button {
    padding: var(--space-3) var(--space-5);
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .cancel-button:hover {
    background: var(--bg-hover);
    border-color: var(--text-secondary);
  }

  .submit-button {
    padding: var(--space-3) var(--space-5);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .submit-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .page-container {
      padding: var(--space-4);
    }

    .form-card {
      padding: var(--space-4);
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .cancel-button,
    .submit-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>

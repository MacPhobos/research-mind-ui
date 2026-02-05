/**
 * Utility for making TanStack Query options reactive in Svelte 5.
 *
 * TanStack Query Svelte accepts either static options or a Svelte Readable store.
 * This utility converts a getter function into a Readable store that updates
 * whenever the getter returns a different value.
 *
 * IMPORTANT: This file uses .svelte.ts extension to enable Svelte 5 runes ($effect.pre).
 *
 * Usage in components:
 * ```svelte
 * <script lang="ts">
 *   import { toReactiveStore } from '$lib/api/reactiveQuery.svelte';
 *
 *   const sessionId = $derived(data.sessionId);
 *   const sessionIdStore = toReactiveStore(() => sessionId);
 *   const query = useSessionQuery(sessionIdStore);
 * </script>
 * ```
 */
import { writable, type Readable } from 'svelte/store';

/**
 * Creates a Readable store from a getter function that auto-updates
 * when the getter's return value changes (using $effect.pre).
 *
 * This function MUST be called from a component context where $effect.pre
 * is available (not from module-level code in .ts files).
 *
 * @param getValue - Getter function that returns the value
 * @returns Readable store that updates when the value changes
 */
export function toReactiveStore<T>(getValue: () => T): Readable<T> {
  const store = writable<T>(getValue());

  $effect.pre(() => {
    store.set(getValue());
  });

  return store;
}

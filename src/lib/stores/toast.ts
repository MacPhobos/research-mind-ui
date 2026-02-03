import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export interface ToastState {
  toasts: Toast[];
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  error: 8000,
};

function createToastStore() {
  const { subscribe, update } = writable<ToastState>({ toasts: [] });

  const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

  function addToast(toast: Omit<Toast, 'id'>): string {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? DEFAULT_DURATION[toast.type];

    update((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    // Set auto-dismiss timeout
    const timeout = setTimeout(() => {
      removeToast(id);
    }, duration);

    timeoutMap.set(id, timeout);

    return id;
  }

  function removeToast(id: string): void {
    // Clear timeout if exists
    const timeout = timeoutMap.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMap.delete(id);
    }

    update((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  }

  function clearAll(): void {
    // Clear all timeouts
    timeoutMap.forEach((timeout) => clearTimeout(timeout));
    timeoutMap.clear();

    update(() => ({ toasts: [] }));
  }

  return {
    subscribe,
    addToast,
    removeToast,
    clearAll,
    // Convenience methods
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration: duration ?? DEFAULT_DURATION.success }),
    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration: duration ?? DEFAULT_DURATION.error }),
    warning: (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration: duration ?? DEFAULT_DURATION.warning }),
    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration: duration ?? DEFAULT_DURATION.info }),
  };
}

export const toastStore = createToastStore();

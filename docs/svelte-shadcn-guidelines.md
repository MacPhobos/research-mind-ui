# Svelte shadcn/bits-ui Guidelines

**Project:** research-mind-ui
**Last Updated:** 2026-02-03
**Stack:** SvelteKit 5, Svelte 5 Runes, TypeScript, bits-ui with Custom CSS

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation and Setup](#2-installation-and-setup)
3. [Component Usage Patterns](#3-component-usage-patterns)
4. [Styling Approach](#4-styling-approach)
5. [Theming](#5-theming)
6. [Common Components Guide](#6-common-components-guide)
7. [Accessibility](#7-accessibility)
8. [Performance Considerations](#8-performance-considerations)
9. [Best Practices](#9-best-practices)
10. [Migration Notes](#10-migration-notes)
11. [Resources](#11-resources)

---

## 1. Overview

### What is shadcn-svelte?

**shadcn-svelte** is a collection of re-usable UI components for Svelte, inspired by shadcn/ui for React. Unlike traditional component libraries, shadcn-svelte components are:

- **Copy-paste components**: You own the code, not a dependency
- **Built on bits-ui**: Uses headless primitives for accessibility
- **Tailwind-styled by default**: Ships with Tailwind CSS styling

### What is bits-ui?

**bits-ui** is a headless component library for Svelte 5 that provides:

- **40+ accessible UI components** with zero default styling
- **WAI-ARIA compliance** out of the box
- **Svelte 5 Runes support** (`$state`, `$derived`, `$effect`, `$props`)
- **TypeScript-first** with full type coverage
- **Flexible styling** - works with any CSS approach

### Our Approach: bits-ui with Custom CSS

This project uses **bits-ui directly** (not full shadcn-svelte) with **custom CSS styling**. This approach provides:

| Benefit | Description |
|---------|-------------|
| No Tailwind dependency | Lighter bundle, simpler toolchain |
| Full styling control | Use existing CSS variables and patterns |
| Accessibility built-in | bits-ui handles ARIA, focus, keyboard navigation |
| Svelte 5 native | Components use modern Runes API |
| Incremental adoption | Add components as needed |

### When to Use What

| Scenario | Recommendation |
|----------|----------------|
| Need accessible interactive component | Use bits-ui primitive |
| Simple static element | Use plain HTML with custom CSS |
| Complex form input | Use bits-ui (Select, Combobox, etc.) |
| Layout container | Use plain HTML/CSS |
| Modal/Dialog | Use bits-ui Dialog |
| Dropdown menu | Use bits-ui Dropdown Menu |
| Icon | Use lucide-svelte |

---

## 2. Installation and Setup

### Installing bits-ui

```bash
npm install bits-ui
```

That is all. No additional configuration required.

### What is NOT Required

- **Tailwind CSS** - Not needed for our custom CSS approach
- **PostCSS configuration** - Not needed
- **shadcn CLI** - Not needed (we use bits-ui directly)
- **Configuration files** - bits-ui works with existing Vite/SvelteKit config

### Project-Specific Configuration

The project already has the required setup:

**vite.config.ts** - No changes needed
**svelte.config.js** - No changes needed
**tsconfig.json** - Ensure `moduleResolution: "bundler"` is set (already configured)

### Directory Structure

Components using bits-ui should be placed in:

```
src/lib/components/ui/
├── Button.svelte
├── Dialog.svelte
├── Select.svelte
└── ... other UI components
```

### Tooltip Provider Setup (Required for Tooltips)

If using tooltips, wrap the app in `Tooltip.Provider`:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import '../app.css';

  let { children } = $props();
</script>

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
```

---

## 3. Component Usage Patterns

### Import Patterns

**Namespace Import (Recommended)**

```typescript
import { Dialog } from 'bits-ui';

// Usage: Dialog.Root, Dialog.Trigger, Dialog.Content, etc.
```

**Direct Import (Alternative)**

```typescript
import { Root, Trigger, Content } from 'bits-ui/dialog';

// Usage: Root, Trigger, Content
// Useful when you want shorter names or are aliasing
```

### Compound Component API

bits-ui uses a compound component pattern. Each component has multiple sub-components:

```svelte
<script lang="ts">
  import { Accordion } from 'bits-ui';
</script>

<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Section Title</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>
      Section content goes here.
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

**Common Sub-Component Patterns:**

| Component | Sub-Components |
|-----------|----------------|
| Dialog | Root, Trigger, Portal, Overlay, Content, Title, Description, Close |
| Select | Root, Trigger, Value, Content, Item, ItemText, ItemIndicator |
| Accordion | Root, Item, Header, Trigger, Content |
| Dropdown | Root, Trigger, Content, Item, Separator |
| Tabs | Root, List, Trigger, Content |

### Svelte 5 Runes Integration

bits-ui v1.x is built for Svelte 5 and uses the Runes API:

**State Binding with $state()**

```svelte
<script lang="ts">
  import { Dialog } from 'bits-ui';

  let open = $state(false);

  function handleOpen() {
    open = true;
  }
</script>

<Dialog.Root bind:open>
  <!-- ... -->
</Dialog.Root>

<button onclick={handleOpen}>Open Externally</button>
```

**Controlled vs Uncontrolled Components**

```svelte
<script lang="ts">
  import { Select } from 'bits-ui';

  // Controlled: You manage state
  let selectedValue = $state('option-1');

  // Uncontrolled: Component manages state internally
  // Just omit the bind:value
</script>

<!-- Controlled -->
<Select.Root bind:value={selectedValue}>
  <!-- ... -->
</Select.Root>

<!-- Uncontrolled (with optional default) -->
<Select.Root value="default-option">
  <!-- ... -->
</Select.Root>
```

**Using $derived() with Component State**

```svelte
<script lang="ts">
  import { Tabs } from 'bits-ui';

  let activeTab = $state('tab-1');
  let tabLabel = $derived(activeTab === 'tab-1' ? 'Overview' : 'Details');
</script>

<p>Current section: {tabLabel}</p>

<Tabs.Root bind:value={activeTab}>
  <!-- ... -->
</Tabs.Root>
```

### Props Typing with TypeScript

**Component Props Interface**

```svelte
<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    title: string;
    description?: string;
    onConfirm?: () => void;
  }

  let { title, description = '', onConfirm }: Props = $props();

  let open = $state(false);

  function handleConfirm() {
    onConfirm?.();
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="dialog-trigger">Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title>{title}</Dialog.Title>
      {#if description}
        <Dialog.Description>{description}</Dialog.Description>
      {/if}
      <button onclick={handleConfirm}>Confirm</button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Event Handler Types**

```svelte
<script lang="ts">
  import { Select } from 'bits-ui';

  interface Props {
    onValueChange?: (value: string) => void;
  }

  let { onValueChange }: Props = $props();

  let value = $state('');

  $effect(() => {
    if (value) {
      onValueChange?.(value);
    }
  });
</script>

<Select.Root bind:value>
  <!-- ... -->
</Select.Root>
```

---

## 4. Styling Approach

### CSS Custom Properties (Our Approach)

This project uses CSS custom properties defined in `src/app.css`:

```css
:root {
  --primary-color: #0066cc;
  --secondary-color: #666;
  --error-color: #cc0000;
  --success-color: #00aa00;
}
```

Use these variables when styling bits-ui components.

### Styling bits-ui via Class Props

Pass class names directly to bits-ui components:

```svelte
<Dialog.Trigger class="dialog-trigger">Open</Dialog.Trigger>
<Dialog.Content class="dialog-content">
  <!-- ... -->
</Dialog.Content>
```

### Styling with :global() Selectors

Since bits-ui components render their own elements, use `:global()` to style them:

```svelte
<style>
  :global(.dialog-trigger) {
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  :global(.dialog-trigger:hover) {
    opacity: 0.9;
  }

  :global(.dialog-content) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
</style>
```

### Data Attribute Selectors for States

bits-ui components expose data attributes for styling different states:

```svelte
<style>
  /* Base state */
  :global([data-accordion-trigger]) {
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
  }

  /* Open state */
  :global([data-accordion-trigger][data-state="open"]) {
    background: var(--primary-color);
    color: white;
  }

  /* Closed state */
  :global([data-accordion-trigger][data-state="closed"]) {
    background: white;
    color: #333;
  }

  /* Disabled state */
  :global([data-accordion-trigger][data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Focus visible */
  :global([data-accordion-trigger]:focus-visible) {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
</style>
```

**Common Data Attributes:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `open`, `closed`, `checked`, `unchecked` | Component state |
| `data-disabled` | Present when disabled | Disabled state |
| `data-highlighted` | Present when highlighted | Keyboard/mouse highlight |
| `data-orientation` | `horizontal`, `vertical` | Component orientation |

### Scoped Styles in Components

For component-specific styles, combine `:global()` with unique class prefixes:

```svelte
<!-- ConfirmDialog.svelte -->
<Dialog.Root bind:open>
  <Dialog.Trigger class="confirm-dialog-trigger">Confirm</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="confirm-dialog-overlay" />
    <Dialog.Content class="confirm-dialog-content">
      <!-- ... -->
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  /* Scoped by unique prefix */
  :global(.confirm-dialog-trigger) {
    background: var(--error-color);
  }

  :global(.confirm-dialog-content) {
    border: 2px solid var(--error-color);
  }
</style>
```

### CSS Variables Exposed by bits-ui

Some bits-ui components expose CSS variables for sizing:

```css
/* Accordion content height animation */
:global(.accordion-content) {
  overflow: hidden;
  height: var(--bits-accordion-content-height);
  transition: height 0.2s ease-out;
}

/* Collapsible content */
:global(.collapsible-content) {
  height: var(--bits-collapsible-content-height);
  width: var(--bits-collapsible-content-width);
}
```

---

## 5. Theming

### CSS Variables System

Define theme variables in `src/app.css`:

```css
:root {
  /* Colors */
  --primary-color: #0066cc;
  --primary-color-hover: #0055aa;
  --secondary-color: #666;
  --error-color: #cc0000;
  --success-color: #00aa00;
  --warning-color: #ff9900;

  /* Backgrounds */
  --bg-color: #f5f5f5;
  --bg-card: #ffffff;
  --bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text */
  --text-primary: #333;
  --text-secondary: #666;
  --text-muted: #999;

  /* Borders */
  --border-color: #ddd;
  --border-radius: 4px;
  --border-radius-lg: 8px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.2);

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* Z-index layers */
  --z-dropdown: 40;
  --z-overlay: 50;
  --z-modal: 51;
  --z-tooltip: 60;
}
```

### Dark/Light Mode Implementation

**CSS-Based Toggle**

```css
/* src/app.css */
:root {
  /* Light mode (default) */
  --bg-color: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: #ddd;
}

:root.dark {
  /* Dark mode */
  --bg-color: #1a1a1a;
  --bg-card: #2a2a2a;
  --text-primary: #f5f5f5;
  --text-secondary: #999;
  --border-color: #444;
}

body {
  background: var(--bg-color);
  color: var(--text-primary);
  transition: background-color 0.2s, color 0.2s;
}
```

**Theme Store**

```typescript
// src/lib/stores/theme.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
  const getInitialTheme = (): Theme => {
    if (!browser) return 'light';
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const { subscribe, set, update } = writable<Theme>(getInitialTheme());

  return {
    subscribe,
    toggle: () => {
      update((current) => {
        const next = current === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', next);
          document.documentElement.classList.toggle('dark', next === 'dark');
        }
        return next;
      });
    },
    set: (theme: Theme) => {
      set(theme);
      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    },
  };
}

export const theme = createThemeStore();
```

**Theme Toggle Component**

```svelte
<!-- src/lib/components/ui/ThemeToggle.svelte -->
<script lang="ts">
  import { Switch } from 'bits-ui';
  import { theme } from '$lib/stores/theme';
  import { Sun, Moon } from 'lucide-svelte';

  let checked = $state($theme === 'dark');

  $effect(() => {
    theme.set(checked ? 'dark' : 'light');
  });
</script>

<Switch.Root bind:checked class="theme-toggle">
  <Switch.Thumb class="theme-toggle-thumb">
    {#if checked}
      <Moon size={14} />
    {:else}
      <Sun size={14} />
    {/if}
  </Switch.Thumb>
</Switch.Root>

<style>
  :global(.theme-toggle) {
    width: 44px;
    height: 24px;
    background: var(--border-color);
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    border: none;
  }

  :global(.theme-toggle[data-state="checked"]) {
    background: var(--primary-color);
  }

  :global(.theme-toggle-thumb) {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.theme-toggle[data-state="checked"] .theme-toggle-thumb) {
    transform: translateX(20px);
  }
</style>
```

### Consistent Color Usage

Use CSS variables consistently across all components:

```svelte
<style>
  /* Good: Use variables */
  :global(.button-primary) {
    background: var(--primary-color);
    color: white;
  }

  :global(.button-primary:hover) {
    background: var(--primary-color-hover);
  }

  /* Avoid: Hard-coded values */
  :global(.button-bad) {
    background: #0066cc; /* Don't do this */
  }
</style>
```

---

## 6. Common Components Guide

### Dialog/Modal

```svelte
<!-- src/lib/components/ui/Dialog.svelte -->
<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { X } from 'lucide-svelte';

  interface Props {
    title: string;
    description?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    title,
    description,
    open = $bindable(false),
    onOpenChange,
  }: Props = $props();

  $effect(() => {
    onOpenChange?.(open);
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="dialog-trigger">
    <slot name="trigger">Open</slot>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <div class="dialog-header">
        <Dialog.Title class="dialog-title">{title}</Dialog.Title>
        <Dialog.Close class="dialog-close-icon">
          <X size={20} />
        </Dialog.Close>
      </div>

      {#if description}
        <Dialog.Description class="dialog-description">
          {description}
        </Dialog.Description>
      {/if}

      <div class="dialog-body">
        <slot />
      </div>

      <div class="dialog-footer">
        <slot name="footer">
          <Dialog.Close class="dialog-close-button">Close</Dialog.Close>
        </slot>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.dialog-trigger) {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  :global(.dialog-trigger:hover) {
    background: var(--primary-color-hover);
  }

  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: var(--z-overlay);
  }

  :global(.dialog-content) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-modal);
    min-width: 320px;
    max-width: 500px;
    max-height: 85vh;
    overflow-y: auto;
  }

  :global(.dialog-header) {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  :global(.dialog-title) {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  :global(.dialog-close-icon) {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    color: var(--text-secondary);
    border-radius: var(--border-radius);
  }

  :global(.dialog-close-icon:hover) {
    background: var(--bg-color);
  }

  :global(.dialog-description) {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  :global(.dialog-body) {
    margin-bottom: var(--spacing-md);
  }

  :global(.dialog-footer) {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }

  :global(.dialog-close-button) {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  :global(.dialog-close-button:hover) {
    background: var(--border-color);
  }
</style>
```

### Button

```svelte
<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    onclick,
    children,
  }: Props = $props();
</script>

<button
  class="button button-{variant} button-{size}"
  {type}
  {disabled}
  {onclick}
>
  {@render children()}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.15s, opacity 0.15s;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Variants */
  .button-primary {
    background: var(--primary-color);
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background: var(--primary-color-hover);
  }

  .button-secondary {
    background: var(--bg-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .button-secondary:hover:not(:disabled) {
    background: var(--border-color);
  }

  .button-ghost {
    background: transparent;
    color: var(--text-primary);
  }

  .button-ghost:hover:not(:disabled) {
    background: var(--bg-color);
  }

  .button-danger {
    background: var(--error-color);
    color: white;
  }

  .button-danger:hover:not(:disabled) {
    opacity: 0.9;
  }

  /* Sizes */
  .button-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  .button-md {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
  }

  .button-lg {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }
</style>
```

### Form Input

```svelte
<!-- src/lib/components/ui/Input.svelte -->
<script lang="ts">
  interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'search';
    value?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    label,
    error,
    disabled = false,
    required = false,
    id = crypto.randomUUID(),
  }: Props = $props();
</script>

<div class="input-wrapper" class:has-error={!!error}>
  {#if label}
    <label class="input-label" for={id}>
      {label}
      {#if required}<span class="required">*</span>{/if}
    </label>
  {/if}

  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    {required}
    bind:value
    class="input"
  />

  {#if error}
    <p class="input-error">{error}</p>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .input-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .required {
    color: var(--error-color);
  }

  .input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    background: var(--bg-card);
    color: var(--text-primary);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }

  .input:disabled {
    background: var(--bg-color);
    cursor: not-allowed;
  }

  .input::placeholder {
    color: var(--text-muted);
  }

  .has-error .input {
    border-color: var(--error-color);
  }

  .has-error .input:focus {
    box-shadow: 0 0 0 2px rgba(204, 0, 0, 0.2);
  }

  .input-error {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--error-color);
  }
</style>
```

### Dropdown/Select

```svelte
<!-- src/lib/components/ui/Select.svelte -->
<script lang="ts">
  import { Select } from 'bits-ui';
  import { ChevronDown, Check } from 'lucide-svelte';

  interface Option {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    options: Option[];
    value?: string;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
  }

  let {
    options,
    value = $bindable(''),
    placeholder = 'Select an option',
    label,
    disabled = false,
  }: Props = $props();

  let selectedLabel = $derived(
    options.find((opt) => opt.value === value)?.label ?? placeholder
  );
</script>

<div class="select-wrapper">
  {#if label}
    <span class="select-label">{label}</span>
  {/if}

  <Select.Root bind:value {disabled}>
    <Select.Trigger class="select-trigger">
      <span class="select-value" class:placeholder={!value}>
        {selectedLabel}
      </span>
      <ChevronDown size={16} class="select-icon" />
    </Select.Trigger>

    <Select.Portal>
      <Select.Content class="select-content" sideOffset={4}>
        {#each options as option}
          <Select.Item
            class="select-item"
            value={option.value}
            disabled={option.disabled}
          >
            <Select.ItemIndicator class="select-item-indicator">
              <Check size={14} />
            </Select.ItemIndicator>
            <span>{option.label}</span>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .select-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  :global(.select-trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    min-width: 180px;
  }

  :global(.select-trigger:focus) {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }

  :global(.select-trigger[data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-value {
    color: var(--text-primary);
  }

  .select-value.placeholder {
    color: var(--text-muted);
  }

  :global(.select-content) {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-md);
    z-index: var(--z-dropdown);
    min-width: 180px;
    max-height: 300px;
    overflow-y: auto;
  }

  :global(.select-item) {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    cursor: pointer;
    color: var(--text-primary);
  }

  :global(.select-item[data-highlighted]) {
    background: var(--bg-color);
  }

  :global(.select-item[data-disabled]) {
    color: var(--text-muted);
    cursor: not-allowed;
  }

  :global(.select-item-indicator) {
    width: 14px;
  }
</style>
```

### Toast Notifications

```svelte
<!-- src/lib/components/ui/Toast.svelte -->
<script lang="ts">
  import { X } from 'lucide-svelte';

  type ToastType = 'info' | 'success' | 'warning' | 'error';

  interface Props {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
  }

  let { message, type = 'info', duration = 5000, onClose }: Props = $props();

  let visible = $state(true);

  $effect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        visible = false;
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  });

  function handleClose() {
    visible = false;
    onClose?.();
  }
</script>

{#if visible}
  <div class="toast toast-{type}" role="alert">
    <span class="toast-message">{message}</span>
    <button class="toast-close" onclick={handleClose}>
      <X size={16} />
    </button>
  </div>
{/if}

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-md);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-info {
    background: var(--primary-color);
    color: white;
  }

  .toast-success {
    background: var(--success-color);
    color: white;
  }

  .toast-warning {
    background: var(--warning-color);
    color: white;
  }

  .toast-error {
    background: var(--error-color);
    color: white;
  }

  .toast-message {
    flex: 1;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.8;
    padding: var(--spacing-xs);
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
```

**Toast Container and Store**

```typescript
// src/lib/stores/toast.ts
import { writable } from 'svelte/store';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    add: (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      update((toasts) => [...toasts, { ...toast, id }]);
      return id;
    },
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
    success: (message: string, duration?: number) => {
      return createToastStore().add({ message, type: 'success', duration });
    },
    error: (message: string, duration?: number) => {
      return createToastStore().add({ message, type: 'error', duration });
    },
  };
}

export const toasts = createToastStore();
```

### Accordion

```svelte
<!-- src/lib/components/ui/Accordion.svelte -->
<script lang="ts">
  import { Accordion } from 'bits-ui';
  import { ChevronDown } from 'lucide-svelte';

  interface Item {
    value: string;
    title: string;
    content: string;
  }

  interface Props {
    items: Item[];
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
  }

  let { items, type = 'single', defaultValue }: Props = $props();
</script>

<Accordion.Root {type} value={defaultValue} class="accordion">
  {#each items as item}
    <Accordion.Item value={item.value} class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          <span>{item.title}</span>
          <ChevronDown size={16} class="accordion-chevron" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <div class="accordion-content-inner">
          {item.content}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>

<style>
  :global(.accordion) {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  :global(.accordion-item) {
    border-bottom: 1px solid var(--border-color);
  }

  :global(.accordion-item:last-child) {
    border-bottom: none;
  }

  :global(.accordion-trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--spacing-md);
    background: var(--bg-card);
    border: none;
    cursor: pointer;
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--text-primary);
    text-align: left;
  }

  :global(.accordion-trigger:hover) {
    background: var(--bg-color);
  }

  :global(.accordion-chevron) {
    transition: transform 0.2s;
  }

  :global(.accordion-trigger[data-state="open"] .accordion-chevron) {
    transform: rotate(180deg);
  }

  :global(.accordion-content) {
    overflow: hidden;
    background: var(--bg-card);
  }

  :global(.accordion-content[data-state="open"]) {
    animation: slideDown 0.2s ease-out;
  }

  :global(.accordion-content[data-state="closed"]) {
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      height: 0;
    }
    to {
      height: var(--bits-accordion-content-height);
    }
  }

  @keyframes slideUp {
    from {
      height: var(--bits-accordion-content-height);
    }
    to {
      height: 0;
    }
  }

  :global(.accordion-content-inner) {
    padding: 0 var(--spacing-md) var(--spacing-md);
    color: var(--text-secondary);
  }
</style>
```

---

## 7. Accessibility

### Built-in ARIA Attributes

bits-ui components automatically include appropriate ARIA attributes:

| Component | ARIA Attributes |
|-----------|----------------|
| Dialog | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` |
| Accordion | `aria-expanded`, `aria-controls`, `role="region"` |
| Select | `role="listbox"`, `aria-selected`, `aria-activedescendant` |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Switch | `role="switch"`, `aria-checked` |

### Keyboard Navigation

bits-ui components support full keyboard navigation:

**Dialog:**
- `Escape` - Close dialog
- `Tab` - Move focus within dialog
- Focus is trapped inside dialog when open

**Select/Dropdown:**
- `Enter`/`Space` - Open/select
- `Arrow Up/Down` - Navigate options
- `Escape` - Close
- `Home/End` - First/last option

**Accordion:**
- `Enter`/`Space` - Toggle section
- `Arrow Up/Down` - Navigate headers
- `Home/End` - First/last header

**Tabs:**
- `Arrow Left/Right` - Navigate tabs (horizontal)
- `Arrow Up/Down` - Navigate tabs (vertical)
- `Home/End` - First/last tab

### Focus Management

bits-ui handles focus automatically:

```svelte
<script lang="ts">
  import { Dialog } from 'bits-ui';

  let open = $state(false);
</script>

<!-- Focus moves to dialog content when opened -->
<!-- Focus returns to trigger when closed -->
<Dialog.Root bind:open>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <!-- First focusable element receives focus -->
      <input type="text" placeholder="Auto-focused" />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Screen Reader Considerations

**Provide meaningful labels:**

```svelte
<Dialog.Root>
  <Dialog.Trigger aria-label="Open settings dialog">
    <Settings size={20} />
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Content>
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Description>
        Configure your application preferences
      </Dialog.Description>
      <!-- Content -->
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Use proper heading hierarchy:**

```svelte
<Dialog.Content>
  <Dialog.Title>Main Heading</Dialog.Title> <!-- Rendered as h2 by default -->
  <h3>Section Heading</h3>
  <p>Content...</p>
</Dialog.Content>
```

**Announce dynamic content:**

```svelte
<div aria-live="polite" aria-atomic="true">
  {#if loading}
    Loading results...
  {:else}
    {results.length} results found
  {/if}
</div>
```

---

## 8. Performance Considerations

### Tree-Shaking (Import Only What You Need)

**Good: Import specific components**

```typescript
// Only Dialog is bundled
import { Dialog } from 'bits-ui';
```

**Better: Import from subpath (when available)**

```typescript
// Smallest bundle - only dialog module
import { Root, Trigger, Content } from 'bits-ui/dialog';
```

**Avoid: Importing everything**

```typescript
// Don't do this - imports entire library
import * as Bits from 'bits-ui';
```

### Bundle Size Optimization

**Check bundle size impact:**

```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts for analysis
```

**Typical component sizes (approximate):**

| Component | Size (minified + gzipped) |
|-----------|---------------------------|
| Dialog | ~3KB |
| Select | ~5KB |
| Accordion | ~2KB |
| Tabs | ~2KB |
| Switch | ~1KB |

### Lazy Loading Components

For components not needed on initial load:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let SettingsDialog: typeof import('./SettingsDialog.svelte').default;

  onMount(async () => {
    const module = await import('./SettingsDialog.svelte');
    SettingsDialog = module.default;
  });
</script>

{#if SettingsDialog}
  <svelte:component this={SettingsDialog} />
{/if}
```

**Route-based code splitting (SvelteKit):**

```svelte
<!-- src/routes/settings/+page.svelte -->
<script lang="ts">
  // This component only loads on /settings route
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
</script>

<SettingsPanel />
```

### Render Optimization

**Avoid unnecessary re-renders:**

```svelte
<script lang="ts">
  import { Select } from 'bits-ui';

  // Stable reference - options don't recreate on each render
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ];

  let selected = $state('1');
</script>

<Select.Root bind:value={selected}>
  <!-- ... -->
</Select.Root>
```

**Use $derived for computed values:**

```svelte
<script lang="ts">
  let items = $state([...]);

  // Computed only when items changes
  let filteredItems = $derived(items.filter(item => item.active));
</script>
```

---

## 9. Best Practices

### Do's

**Use semantic component structure:**

```svelte
<!-- Good: Clear hierarchy -->
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Use bind: for two-way state:**

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <!-- Parent can read/write open state -->
</Dialog.Root>
```

**Provide fallback styling:**

```css
:global(.dialog-trigger) {
  background: var(--primary-color, #0066cc); /* Fallback value */
}
```

**Keep styles close to components:**

```svelte
<!-- Component file -->
<Dialog.Root>
  <!-- ... -->
</Dialog.Root>

<style>
  /* Styles for this component only */
  :global(.dialog-content) { ... }
</style>
```

**Use TypeScript for props:**

```svelte
<script lang="ts">
  interface Props {
    title: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger';
  }

  let { title, onConfirm, variant = 'default' }: Props = $props();
</script>
```

### Don'ts

**Don't fight the component API:**

```svelte
<!-- Bad: Recreating dialog behavior manually -->
<div class="my-dialog" onclick={(e) => e.stopPropagation()}>
  <!-- Manual focus trap, escape handling, etc. -->
</div>

<!-- Good: Use bits-ui Dialog -->
<Dialog.Root>
  <Dialog.Content>
    <!-- All behavior handled automatically -->
  </Dialog.Content>
</Dialog.Root>
```

**Don't mix styling approaches inconsistently:**

```css
/* Bad: Mixing hard-coded values and variables */
:global(.button) {
  background: #0066cc;        /* Hard-coded */
  color: var(--text-primary); /* Variable */
  border-radius: 4px;         /* Hard-coded */
}

/* Good: Consistent use of variables */
:global(.button) {
  background: var(--primary-color);
  color: white;
  border-radius: var(--border-radius);
}
```

**Don't override accessibility features:**

```svelte
<!-- Bad: Removing keyboard support -->
<Dialog.Trigger tabindex="-1" onkeydown={(e) => e.preventDefault()}>
  Open
</Dialog.Trigger>

<!-- Good: Let bits-ui handle accessibility -->
<Dialog.Trigger>Open</Dialog.Trigger>
```

**Don't nest interactive elements:**

```svelte
<!-- Bad: Button inside button -->
<Dialog.Trigger>
  <button>Click me</button>
</Dialog.Trigger>

<!-- Good: Style the trigger directly -->
<Dialog.Trigger class="styled-button">
  Click me
</Dialog.Trigger>
```

### Component Composition

**Wrapper pattern for reuse:**

```svelte
<!-- src/lib/components/ui/ConfirmDialog.svelte -->
<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }

  let {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  }: Props = $props();

  let open = $state(false);

  function handleConfirm() {
    onConfirm();
    open = false;
  }

  function handleCancel() {
    onCancel?.();
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="confirm-trigger">
    <slot name="trigger">Open</slot>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="confirm-overlay" />
    <Dialog.Content class="confirm-content">
      <Dialog.Title class="confirm-title">{title}</Dialog.Title>
      <Dialog.Description class="confirm-message">{message}</Dialog.Description>
      <div class="confirm-actions">
        <button class="confirm-cancel" onclick={handleCancel}>{cancelLabel}</button>
        <button class="confirm-submit" onclick={handleConfirm}>{confirmLabel}</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<!-- Usage -->
<!-- <ConfirmDialog
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmLabel="Delete"
  onConfirm={handleDelete}
>
  <button slot="trigger">Delete</button>
</ConfirmDialog> -->
```

### State Management with Runes

**Local state with $state():**

```svelte
<script lang="ts">
  let open = $state(false);
  let value = $state('');
</script>
```

**Derived state with $derived():**

```svelte
<script lang="ts">
  let items = $state<string[]>([]);
  let hasItems = $derived(items.length > 0);
  let itemCount = $derived(items.length);
</script>
```

**Side effects with $effect():**

```svelte
<script lang="ts">
  let open = $state(false);

  $effect(() => {
    if (open) {
      console.log('Dialog opened');
      // Fetch data, track analytics, etc.
    }
  });
</script>
```

### Error Handling Patterns

**Form validation:**

```svelte
<script lang="ts">
  import { z } from 'zod';

  const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be 8+ characters'),
  });

  let formData = $state({ email: '', password: '' });
  let errors = $state<Record<string, string>>({});

  function validate() {
    const result = schema.safeParse(formData);
    if (!result.success) {
      errors = result.error.flatten().fieldErrors as Record<string, string>;
      return false;
    }
    errors = {};
    return true;
  }

  function handleSubmit() {
    if (validate()) {
      // Submit form
    }
  }
</script>

<form onsubmit|preventDefault={handleSubmit}>
  <Input
    label="Email"
    type="email"
    bind:value={formData.email}
    error={errors.email}
  />
  <Input
    label="Password"
    type="password"
    bind:value={formData.password}
    error={errors.password}
  />
  <Button type="submit">Submit</Button>
</form>
```

**API error handling with TanStack Query:**

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { apiClient } from '$lib/api/client';

  const query = createQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getUser(),
  });
</script>

{#if $query.isPending}
  <p>Loading...</p>
{:else if $query.isError}
  <div class="error">
    Error: {$query.error.message}
    <button onclick={() => $query.refetch()}>Retry</button>
  </div>
{:else if $query.data}
  <p>Welcome, {$query.data.name}</p>
{/if}
```

---

## 10. Migration Notes

### If/When Migrating to Full shadcn-svelte with Tailwind

This project currently uses bits-ui with custom CSS. If migrating to full shadcn-svelte with Tailwind:

**Step 1: Install Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Configure Tailwind**

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Step 3: Add Tailwind to CSS**

```css
/* src/app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Keep existing CSS variables for gradual migration */
:root {
  --primary-color: #0066cc;
  /* ... */
}
```

**Step 4: Install shadcn-svelte CLI**

```bash
npx shadcn-svelte@latest init
```

**Step 5: Add components**

```bash
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add dialog
```

### Keeping Compatibility

**During migration, components can coexist:**

```svelte
<script lang="ts">
  // Old: Custom styled bits-ui
  import CustomDialog from '$lib/components/ui/Dialog.svelte';

  // New: shadcn-svelte with Tailwind
  import * as ShadcnDialog from '$lib/components/ui/shadcn/dialog';
</script>

<!-- Use whichever fits the context -->
```

**CSS variables can map to Tailwind:**

```css
/* Bridge CSS variables to Tailwind */
:root {
  --primary: theme('colors.blue.600');
  --primary-foreground: theme('colors.white');
}
```

### Migration Checklist

- [ ] Install Tailwind CSS and configure
- [ ] Run shadcn-svelte init
- [ ] Add components incrementally
- [ ] Update styling from `:global()` to Tailwind classes
- [ ] Test accessibility (should remain intact)
- [ ] Remove old custom CSS when components are migrated
- [ ] Update documentation

---

## 11. Resources

### Official Documentation

- **bits-ui Documentation**: [https://bits-ui.com/docs](https://bits-ui.com/docs)
- **bits-ui Getting Started**: [https://bits-ui.com/docs/getting-started](https://bits-ui.com/docs/getting-started)
- **bits-ui Styling Guide**: [https://bits-ui.com/docs/styling](https://bits-ui.com/docs/styling)
- **bits-ui GitHub**: [https://github.com/huntabyte/bits-ui](https://github.com/huntabyte/bits-ui)

### shadcn-svelte (for future reference)

- **shadcn-svelte Documentation**: [https://www.shadcn-svelte.com](https://www.shadcn-svelte.com)
- **shadcn-svelte Components**: [https://www.shadcn-svelte.com/docs/components](https://www.shadcn-svelte.com/docs/components)
- **Svelte 5 Migration Guide**: [https://www.shadcn-svelte.com/docs/migration/svelte-5](https://www.shadcn-svelte.com/docs/migration/svelte-5)

### Svelte 5 References

- **Svelte 5 Documentation**: [https://svelte.dev/docs/svelte/overview](https://svelte.dev/docs/svelte/overview)
- **Runes API**: [https://svelte.dev/docs/svelte/$state](https://svelte.dev/docs/svelte/$state)
- **SvelteKit Documentation**: [https://kit.svelte.dev/docs](https://kit.svelte.dev/docs)

### Accessibility

- **WAI-ARIA Authoring Practices**: [https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/)
- **MDN ARIA Documentation**: [https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

### Project-Specific

- **API Contract**: `/docs/api-contract.md`
- **bits-ui Integration Analysis**: `/docs/research/bits-ui-integration-analysis-2026-02-03.md`
- **UI CLAUDE.md**: `/CLAUDE.md`

---

## Quick Reference Card

### Common Imports

```typescript
// bits-ui components
import { Dialog, Select, Accordion, Tabs, Switch, Tooltip } from 'bits-ui';

// Icons
import { X, ChevronDown, Check, Settings } from 'lucide-svelte';

// Project components
import { Button, Input, Toast } from '$lib/components/ui';
```

### Common Patterns

```svelte
<!-- Controlled component -->
<Dialog.Root bind:open>

<!-- Styling -->
<Dialog.Trigger class="my-class">

<!-- Data attributes -->
:global([data-state="open"]) { }

<!-- CSS variables -->
background: var(--primary-color);
```

### File Locations

| Item | Path |
|------|------|
| UI Components | `src/lib/components/ui/` |
| Global Styles | `src/app.css` |
| Theme Store | `src/lib/stores/theme.ts` |
| Toast Store | `src/lib/stores/toast.ts` |
| API Client | `src/lib/api/client.ts` |

---

*Document Version: 1.0.0*
*Last Updated: 2026-02-03*

# research-mind-ui Development Guide

## Project Overview

The **research-mind-ui** is a modern SvelteKit frontend application providing a user interface for the research-mind service. Built with Svelte 5, TypeScript, and TanStack Query for optimal type safety and developer experience.

**Tech Stack**:
- **Framework**: SvelteKit 5.x with Svelte 5.0 (Runes API)
- **Language**: TypeScript 5.6+ (strict mode)
- **UI Components**: bits-ui (headless components) with custom CSS
- **Data Fetching**: TanStack Query (@tanstack/svelte-query)
- **Validation**: Zod for runtime type safety
- **Testing**: Vitest with jsdom
- **Linting**: ESLint + Prettier
- **Icons**: lucide-svelte

**Configuration**:
- **UI Port**: 15000 (localhost)
- **Service API**: http://localhost:15010
- **Node**: 20.x or 22.x
- **Package Manager**: npm

---

## Quick Start

```bash
cd research-mind-ui
npm install
npm run dev
```

Open http://localhost:15000 in your browser.

**Verify Service Connection**:
```bash
curl http://localhost:15010/health
```

The UI expects the service to be running on port 15010.

---

## Project Structure

```
research-mind-ui/
├── src/
│   ├── routes/              # SvelteKit pages and layouts
│   │   ├── +layout.svelte   # Root layout with global styles
│   │   └── +page.svelte     # Home page
│   ├── lib/
│   │   ├── api/             # API client and hooks
│   │   │   ├── client.ts    # API client with Zod schemas
│   │   │   ├── generated.ts # Auto-generated TypeScript types (DO NOT EDIT)
│   │   │   └── hooks.ts     # TanStack Query hooks
│   │   ├── components/      # Reusable Svelte components
│   │   │   └── ApiStatus.svelte
│   │   ├── stores/          # Svelte stores for global state
│   │   │   └── ui.ts        # UI state (sidebar, theme, etc.)
│   │   └── utils/           # Utility functions
│   │       └── env.ts       # Environment variable helpers
│   ├── app.css              # Global CSS variables and base styles
│   ├── app.html             # HTML template
│   └── vite-env.d.ts        # Vite environment types
├── tests/
│   └── api.test.ts          # API client tests
├── docs/
│   └── api-contract.md      # API contract (MUST match service)
├── package.json
├── vite.config.ts           # Vite configuration (port 15000)
├── svelte.config.js         # SvelteKit configuration
├── tsconfig.json            # TypeScript configuration (strict mode)
├── vitest.config.ts         # Test configuration (jsdom)
├── eslint.config.js         # ESLint configuration
├── .prettierrc              # Prettier configuration
├── .env.example             # Environment variable template
└── Makefile                 # Development tasks
```

---

## API Contract (Critical)

### The Golden Rule

The API contract is **FROZEN** and the **single source of truth** for all communication between service and UI. All changes must flow through the contract first.

**Contract Locations**:
- **Backend source of truth**: `research-mind-service/docs/api-contract.md`
- **Frontend copy**: `research-mind-ui/docs/api-contract.md` (must be identical)

**NEVER**:
- Manually edit `src/lib/api/generated.ts` (auto-generated)
- Update UI without regenerating types after backend changes
- Let the two `api-contract.md` files diverge
- Change API without version bump if breaking

### Contract Sync Workflow (End-to-End)

This is the **complete workflow** covering both service and UI sides:

**Backend → Frontend (strict ordering)**:

1. **Update contract** (Service side):
   - Edit `research-mind-service/docs/api-contract.md`
   - Add new endpoints, change schemas, update error codes
   - Version bump if breaking change

2. **Update backend models** (Service side):
   - Add Pydantic schemas in `research-mind-service/app/schemas/`

3. **Implement backend** (Service side):
   - Add routes in `research-mind-service/app/routes/`

4. **Run backend tests** (Service side):
   ```bash
   cd research-mind-service
   make test  # All tests must pass
   ```

5. **Copy contract to frontend** (Service → UI):
   ```bash
   cp research-mind-service/docs/api-contract.md research-mind-ui/docs/api-contract.md
   ```

6. **Regenerate frontend types** (UI side):
   ```bash
   cd research-mind-ui
   npm run gen:api  # Generates src/lib/api/generated.ts
   ```

   **What this does**:
   - Fetches OpenAPI schema from http://localhost:15010/openapi.json
   - Generates TypeScript types in `src/lib/api/generated.ts`
   - Requires service to be running

7. **Update frontend code** (UI side):
   - Use new generated types in components
   - Update API client (`src/lib/api/client.ts`)
   - Update TanStack Query hooks (`src/lib/api/hooks.ts`)

8. **Run frontend tests** (UI side):
   ```bash
   npm run test  # All tests must pass
   ```

### Contract Change Checklist

When the API changes:

- [ ] Contract updated in `research-mind-service/docs/api-contract.md`
- [ ] Version bumped (major/minor/patch as appropriate)
- [ ] Changelog entry added to contract
- [ ] Backend schemas/models updated
- [ ] Backend tests pass (`make test`)
- [ ] Contract copied to `research-mind-ui/docs/api-contract.md`
- [ ] Frontend types regenerated (`npm run gen:api`)
- [ ] Frontend code updated to use new types
- [ ] Frontend tests pass (`npm run test`)
- [ ] Both `api-contract.md` files are identical

### Type Generation Details

**How It Works**:

1. **Backend** (FastAPI):
   - OpenAPI spec auto-generated at `http://localhost:15010/openapi.json`
   - Based on Pydantic models in `app/schemas/`

2. **Type Generation**:
   - Script: `npm run gen:api`
   - Command: `openapi-typescript http://localhost:15010/openapi.json -o src/lib/api/generated.ts`
   - Output: `src/lib/api/generated.ts` (auto-generated, **DO NOT EDIT**)

3. **Frontend Usage**:
   ```typescript
   import type { Session, IndexingJob, SearchResult } from '$lib/api/generated';

   // These types are guaranteed to match the backend
   const session: Session = await fetch('/api/v1/sessions/123').then(r => r.json());
   ```

**Workflow**:
```
Service schema change
    ↓
Backend test passes
    ↓
npm run gen:api
    ↓
Types updated automatically
    ↓
UI code updated
    ↓
Frontend test passes
```

**Important**: Generated types are always in sync with backend because they're derived from OpenAPI schema.

---

## SvelteKit Patterns (Svelte 5)

This project uses **Svelte 5** with the modern **Runes API** for fine-grained reactivity.

### Svelte 5 Runes

**$state()** - Fine-grained reactive state:
```typescript
let count = $state(0);
let user = $state({ name: 'Alice', age: 30 });
```

**$derived()** - Computed values (replaces `$:`):
```typescript
let doubled = $derived(count * 2);
let fullName = $derived(`${user.firstName} ${user.lastName}`);
```

**$effect()** - Side effects with automatic cleanup (replaces `$:` and onMount for effects):
```typescript
$effect(() => {
  console.log(`Count changed to ${count}`);
  return () => console.log('Cleanup');
});
```

**$props()** - Type-safe component props:
```typescript
let { user, onUpdate }: { user: User; onUpdate: (u: User) => void } = $props();
```

**$bindable()** - Two-way binding with parent components:
```typescript
// Child component
let { value = $bindable('') } = $props<{ value: string }>();

// Parent component
<SearchInput bind:value={searchTerm} />
```

### Component Example (Actual Pattern from Codebase)

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { getApiBaseUrl } from '$lib/utils/env';

  const apiBaseUrl = getApiBaseUrl();

  let loading = $state(true);
  let apiStatus = $state('Checking...');

  $effect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/version`);
        if (response.ok) {
          apiStatus = 'Connected';
        } else {
          apiStatus = `API Error: ${response.status}`;
        }
      } catch (error) {
        apiStatus = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } finally {
        loading = false;
      }
    };
    checkApi();
  });
</script>

<div class="container">
  <h1>Research Mind</h1>

  {#if loading}
    <p>Checking API status...</p>
  {:else}
    <p>{apiStatus}</p>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
```

### Component Conventions

**File Naming**:
- Components: PascalCase (`ApiStatus.svelte`)
- Routes: +page.svelte, +layout.svelte
- Server-only: +page.server.ts
- Universal: +page.ts

**Props Pattern**:
```svelte
<script lang="ts">
  interface QueryState {
    isPending: boolean;
    isError: boolean;
    data?: any;
    error?: Error | null;
  }

  let { query }: { query: QueryState } = $props();
</script>
```

**Scoped Styles**:
```svelte
<style>
  /* Styles are scoped to this component by default */
  .container {
    padding: 1rem;
  }
</style>
```

### Routing Patterns

**+layout.svelte** - Shared layout for all pages:
```svelte
<script lang="ts">
  import '../app.css';
</script>

<slot />
```

**+page.svelte** - Page component

**+page.ts** - Universal load function (runs on server and client)

**+page.server.ts** - Server-only load function (not used in this project yet)

---

## State Management & Data Fetching

### TanStack Query (Server State)

**Pattern**: Create hooks for each API endpoint.

**Example Hook** (`src/lib/api/hooks.ts`):
```typescript
import { createQuery } from '@tanstack/svelte-query';
import { apiClient, type VersionResponse } from './client';

export function useVersionQuery() {
  return createQuery<VersionResponse>({
    queryKey: ['version'],
    queryFn: () => apiClient.getVersion(),
    staleTime: 60000,    // 1 minute
    gcTime: 300000,      // 5 minutes (formerly cacheTime)
  });
}
```

**Usage in Component**:
```svelte
<script lang="ts">
  import { useVersionQuery } from '$lib/api/hooks';

  const query = useVersionQuery();
</script>

{#if $query.isPending}
  <p>Loading...</p>
{:else if $query.isError}
  <p>Error: {$query.error.message}</p>
{:else if $query.data}
  <p>Version: {$query.data.version}</p>
{/if}
```

### API Client Pattern

**Location**: `src/lib/api/client.ts`

**Pattern**: Zod schemas for runtime validation:
```typescript
import { z } from 'zod';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:15010';

const VersionResponseSchema = z.object({
  version: z.string(),
  environment: z.string().optional(),
  timestamp: z.string().optional(),
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;

export const apiClient = {
  async getVersion(): Promise<VersionResponse> {
    const response = await fetch(`${apiBaseUrl}/api/v1/version`);
    if (!response.ok) {
      throw new Error(`Failed to fetch version: ${response.statusText}`);
    }
    const data = await response.json();
    return VersionResponseSchema.parse(data);  // Runtime validation
  },
};
```

### Svelte Stores (Client State)

**Pattern**: Use Svelte 4 stores for global UI state (Svelte 5 runes are component-scoped).

**Example** (`src/lib/stores/ui.ts`):
```typescript
import { writable } from 'svelte/store';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
};

export const uiStore = writable<UIState>(initialState);

export function toggleSidebar() {
  uiStore.update((state) => ({ ...state, sidebarOpen: !state.sidebarOpen }));
}

export function setTheme(theme: 'light' | 'dark') {
  uiStore.update((state) => ({ ...state, theme }));
}
```

**Usage**:
```svelte
<script lang="ts">
  import { uiStore, toggleSidebar } from '$lib/stores/ui';
</script>

<button onclick={toggleSidebar}>
  Toggle Sidebar ({$uiStore.sidebarOpen ? 'Open' : 'Closed'})
</button>
```

### Error Handling

**API Errors**:
```typescript
try {
  const data = await apiClient.getSession(id);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error
    console.error('Invalid API response', error.errors);
  } else {
    // Network or other error
    console.error('API error', error);
  }
}
```

**TanStack Query Errors**:
```svelte
{#if $query.isError}
  <div class="error">
    {$query.error?.message || 'Unknown error'}
  </div>
{/if}
```

### Environment Variables

**Location**: `.env.local` (not committed)

**Available Variables**:
- `VITE_API_BASE_URL` - Service API URL (default: http://localhost:15010)

**Usage**:
```typescript
// src/lib/utils/env.ts
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:15010';
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function isProduction(): boolean {
  return import.meta.env.PROD;
}
```

---

## Testing & Tooling

### Vitest Configuration

**Location**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**Features**:
- **Environment**: jsdom for DOM testing
- **Globals**: `describe`, `it`, `expect` available globally
- **Hot reload**: Disabled during tests

### Test Patterns

**Location**: `tests/` directory

**API Client Tests** (`tests/api.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../src/lib/api/client';

describe('API Client', () => {
  it('should have getVersion method', () => {
    expect(apiClient.getVersion).toBeDefined();
    expect(typeof apiClient.getVersion).toBe('function');
  });

  it('should return version response schema', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0', environment: 'test' }),
      } as Response)
    );

    const result = await apiClient.getVersion();
    expect(result).toHaveProperty('version');
    expect(typeof result.version).toBe('string');
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: 'Not Found',
      } as Response)
    );

    await expect(apiClient.getVersion()).rejects.toThrow('Failed to fetch version');
  });
});
```

**Component Tests**: (Not yet implemented - placeholder for future)
```typescript
import { render } from '@testing-library/svelte';
import ApiStatus from '../src/lib/components/ApiStatus.svelte';

it('renders loading state', () => {
  const { getByText } = render(ApiStatus, { props: { query: { isPending: true } } });
  expect(getByText('Loading API status...')).toBeInTheDocument();
});
```

### Testing Commands

```bash
npm run test          # Run tests once
npm run test -- --watch  # Run tests in watch mode
npm run test:ui       # Run tests with UI
```

### ESLint Configuration

**Location**: `.eslintrc.json`

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:svelte/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "svelte"],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2020,
    "extraFileExtensions": [".svelte"]
  },
  "overrides": [
    {
      "files": ["*.svelte"],
      "parser": "svelte-eslint-parser",
      "parserOptions": {
        "parser": "@typescript-eslint/parser"
      }
    }
  ]
}
```

**Key Rules**:
- TypeScript strict mode
- Svelte-specific linting
- Prettier integration (no style conflicts)

### Prettier Configuration

**Location**: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "useTabs": false,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-svelte"]
}
```

### TypeScript Configuration

**Location**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "$lib": ["src/lib"],
      "$lib/*": ["src/lib/*"]
    }
  }
}
```

**Key Features**:
- **Strict mode**: Enabled
- **Path aliases**: `$lib` → `src/lib`
- **Module resolution**: Bundler mode for Vite

---

## Styling & Components

### Global Styles

**Location**: `src/app.css`

```css
:root {
  --primary-color: #0066cc;
  --secondary-color: #666;
  --error-color: #cc0000;
  --success-color: #00aa00;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background: #f5f5f5;
  color: #333;
}
```

**Usage**:
```svelte
<style>
  .button {
    background: var(--primary-color);
  }
</style>
```

### Component Styling

**Pattern**: Scoped styles by default.

```svelte
<div class="container">
  <h1>Title</h1>
</div>

<style>
  /* Automatically scoped to this component */
  .container {
    padding: 2rem;
  }
</style>
```

**Global Styles** (when needed):
```svelte
<style>
  :global(.highlight) {
    background: yellow;
  }
</style>
```

### Icons

**Library**: lucide-svelte

```svelte
<script lang="ts">
  import { Check, AlertCircle, Loader } from 'lucide-svelte';
</script>

<Check size={20} />
<AlertCircle size={24} color="red" />
<Loader size={16} class="animate-spin" />
```

### Design System

**Current Status**: bits-ui headless components with custom CSS variables.

**Guidelines**: See [`docs/svelte-shadcn-guidelines.md`](docs/svelte-shadcn-guidelines.md) for:
- Component usage patterns (Dialog, Button, Select, etc.)
- Styling with CSS custom properties and `:global()` selectors
- Theming and dark mode implementation
- Accessibility best practices
- Performance considerations

**Note**: We use bits-ui directly (the underlying library for shadcn-svelte) with custom CSS instead of Tailwind. This gives us full control over styling while maintaining accessible, headless components.

---

## Environment & Configuration

### Environment Variables

**File**: `.env.local` (create from `.env.example`)

```env
VITE_API_BASE_URL=http://localhost:15010
```

**Rules**:
- Never commit `.env.local`
- Always update `.env.example` when adding new variables
- All variables must be prefixed with `VITE_` to be exposed to client

### Configuration Files

**vite.config.ts** - Vite configuration:
```typescript
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 15000,
    host: 'localhost',
  },
});
```

**svelte.config.js** - SvelteKit configuration:
```javascript
import adapter from '@sveltejs/adapter-auto';

export default {
  kit: {
    adapter: adapter(),
  },
};
```

---

## Guard Rails

### UI-Specific Rules

1. **No manual type editing**: `src/lib/api/generated.ts` is auto-generated. Run `npm run gen:api` instead.

2. **Test requirements**: Every new feature must have tests. Minimum coverage: 1 test per component/function.

3. **Type safety**: All API calls must use generated types. No `any` types in production code.

4. **Contract sync**: Before working on API integration, verify `docs/api-contract.md` matches service version.

5. **Environment variables**: Never hardcode URLs. Use `import.meta.env.VITE_API_BASE_URL`.

6. **Svelte 5 patterns**: Use Runes API ($state, $derived, $effect) for new components. No Svelte 4 patterns.

7. **Linting**: Code must pass `npm run lint` before commit.

8. **Formatting**: Code must pass `npm run format` before commit.

9. **TypeScript**: Code must pass `npm run typecheck` before commit.

10. **Service dependency**: Service must be running on port 15010 for type generation and development.

---

## Common Commands

### Development

```bash
npm run dev          # Start dev server on port 15000
npm run build        # Build for production
npm run preview      # Preview production build
```

### Type Generation

```bash
npm run gen:api      # Regenerate TypeScript types from OpenAPI
                     # Requires service running on port 15010
```

### Testing

```bash
npm run test         # Run tests once
npm run test:ui      # Run tests with UI
```

### Quality Checks

```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run format       # Prettier formatting
```

### Makefile Targets

```bash
make help            # Show all available targets
make install         # Install dependencies
make dev             # Start dev server
make test            # Run tests
make lint            # Run linter
make fmt             # Format code
make typecheck       # Type check
make check           # Run lint + typecheck + tests
make clean           # Remove build artifacts
```

---

## Adding a New Feature

**Example**: Adding a "Sessions List" feature.

### 1. Verify Contract Updated

```bash
# Check if session endpoints exist in contract
cat docs/api-contract.md | grep "GET /api/v1/sessions"
```

### 2. Regenerate Types

```bash
# Ensure service is running
curl http://localhost:15010/health

# Regenerate types
npm run gen:api
```

### 3. Add API Client Method

Edit `src/lib/api/client.ts`:

```typescript
import type { components } from './generated';

type Session = components['schemas']['Session'];
type PaginatedResponse<T> = components['schemas']['PaginatedResponse'];

export const apiClient = {
  async getSessions(limit = 10, offset = 0): Promise<PaginatedResponse<Session>> {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/sessions?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    return response.json();
  },
};
```

### 4. Add TanStack Query Hook

Edit `src/lib/api/hooks.ts`:

```typescript
import type { components } from './generated';

type Session = components['schemas']['Session'];
type PaginatedResponse<T> = components['schemas']['PaginatedResponse'];

export function useSessionsQuery(limit = 10, offset = 0) {
  return createQuery<PaginatedResponse<Session>>({
    queryKey: ['sessions', limit, offset],
    queryFn: () => apiClient.getSessions(limit, offset),
    staleTime: 30000,  // 30 seconds
  });
}
```

### 5. Create Component

Create `src/lib/components/SessionsList.svelte`:

```svelte
<script lang="ts">
  import { useSessionsQuery } from '$lib/api/hooks';

  let limit = $state(10);
  let offset = $state(0);

  const query = useSessionsQuery(limit, offset);
</script>

<div class="sessions-list">
  {#if $query.isPending}
    <p>Loading sessions...</p>
  {:else if $query.isError}
    <p>Error: {$query.error.message}</p>
  {:else if $query.data}
    <ul>
      {#each $query.data.data as session}
        <li>{session.name} - {session.status}</li>
      {/each}
    </ul>
    <p>Total: {$query.data.pagination.total}</p>
  {/if}
</div>

<style>
  .sessions-list {
    padding: 1rem;
  }
</style>
```

### 6. Add Route

Create `src/routes/sessions/+page.svelte`:

```svelte
<script lang="ts">
  import SessionsList from '$lib/components/SessionsList.svelte';
</script>

<h1>Sessions</h1>
<SessionsList />
```

### 7. Write Tests

Create `tests/sessions.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../src/lib/api/client';

describe('Sessions API', () => {
  it('should fetch sessions with pagination', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: '1', name: 'Test Session', status: 'active' }],
          pagination: { limit: 10, offset: 0, total: 1 }
        }),
      } as Response)
    );

    const result = await apiClient.getSessions(10, 0);
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});
```

### 8. Run Checks

```bash
npm run typecheck    # Verify types
npm run lint         # Verify code style
npm run test         # Verify tests pass
```

---

## Deployment

**Current Status**: Development only (no production deployment configured).

**Future**: Adapter auto will detect platform (Vercel, Node, etc.).

**Build Command**:
```bash
npm run build
```

**Output**: `dist/` directory

---

## API Versioning

The API uses `/api/v1` prefix. Future versions will use `/api/v2`, `/api/v3`, etc.

**When to Bump Version**:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New endpoints, new optional fields
- **Patch** (1.0.0 → 1.0.1): Bug fixes, documentation

**Deployment Safety**:
1. Backend deploys first with new endpoints
2. Frontend regenerates types, updates code
3. Never deploy frontend without updated types

---

## Troubleshooting

### Service Connection Failed

```bash
# Verify service is running
curl http://localhost:15010/health

# Check service logs
cd research-mind-service && make logs
```

### Type Generation Fails

```bash
# Ensure service is running
curl http://localhost:15010/openapi.json

# Check for syntax errors in OpenAPI spec
npm run gen:api
```

### Types Don't Match

```bash
# Verify contract files are identical
diff research-mind-service/docs/api-contract.md research-mind-ui/docs/api-contract.md

# Regenerate types
npm run gen:api
```

### Port Already in Use

```bash
# Change port in vite.config.ts
# Or kill existing process
lsof -ti:15000 | xargs kill
```

---

## Non-Goals

- User authentication (stubs planned, production auth TBD)
- Multi-environment setup (local dev only)
- Server-side rendering with +page.server.ts (not needed yet)
- Tailwind CSS (using bits-ui with custom CSS instead)

---

## Resources

- **Svelte 5 Docs**: https://svelte.dev/docs/svelte/overview
- **SvelteKit Docs**: https://kit.svelte.dev/docs
- **bits-ui Docs**: https://bits-ui.com/docs
- **shadcn-svelte**: https://shadcn-svelte.com/ (for reference patterns)
- **TanStack Query**: https://tanstack.com/query/latest/docs/framework/svelte/overview
- **Vite**: https://vitejs.dev/
- **Vitest**: https://vitest.dev/
- **Zod**: https://zod.dev/

---

**This guide is complete and standalone. Developers working on the UI should have everything they need without referencing the root CLAUDE.md.**

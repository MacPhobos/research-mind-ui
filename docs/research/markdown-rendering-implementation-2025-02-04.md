# Markdown Rendering Implementation Research

**Date:** 2025-02-04
**Project:** research-mind-ui
**Status:** Research Complete

---

## Executive Summary

This document provides a comprehensive analysis of markdown rendering options for the research-mind-ui chat interface. The chat receives markdown-formatted responses from claude-mpm via SSE streaming, requiring a solution that handles progressive content rendering, security (XSS prevention), and code syntax highlighting.

**Recommendation:** Use `marked` + `DOMPurify` with custom rendering logic, integrated with `shiki` for code syntax highlighting. This provides the best balance of performance, security, Svelte 5 compatibility, and control for SSE streaming scenarios.

---

## 1. Current Chat Implementation Analysis

### File Locations

| File | Purpose |
|------|---------|
| `/Users/mac/workspace/research-mind/research-mind-ui/src/lib/components/chat/ChatMessage.svelte` | Individual chat message component |
| `/Users/mac/workspace/research-mind/research-mind-ui/src/lib/components/chat/SessionChat.svelte` | Main chat container with SSE integration |
| `/Users/mac/workspace/research-mind/research-mind-ui/src/lib/hooks/useChatStream.svelte.ts` | SSE streaming hook with two-stage content |
| `/Users/mac/workspace/research-mind/research-mind-ui/src/routes/sessions/[id]/chat/+page.svelte` | Chat page route |

### Current Rendering Approach

The current implementation displays chat messages as **plain text** with basic paragraph splitting:

```svelte
<!-- ChatMessage.svelte, lines 150-158 -->
<div class="text-content">
  {#each displayContent().split('\n') as line, i}
    {#if line.trim()}
      <p>{line}</p>
    {:else if i < displayContent().split('\n').length - 1}
      <br />
    {/if}
  {/each}
</div>
```

**Key Observations:**
1. **No markdown rendering** - Content is displayed verbatim as text
2. **No code syntax highlighting** - Code blocks render as plain text
3. **Two-stage streaming architecture** - Stage 1 (expandable process output) and Stage 2 (primary answer)
4. **Stage 1 content** uses `<pre>` tag with monospace font (suitable for process logs)
5. **No sanitization** needed currently since content is rendered as text, not HTML

### Streaming Architecture

The SSE streaming hook (`useChatStream.svelte.ts`) accumulates content progressively:

- **Stage 1 (expandable):** Process output, system events, debug info
- **Stage 2 (primary):** Final assistant response (this needs markdown rendering)

Content arrives via these event types:
- `init_text`, `system_init`, `system_hook`, `stream_token` -> Stage 1
- `assistant`, `result` -> Stage 2

### Existing Dependencies

```json
{
  "dependencies": {
    "@tanstack/svelte-query": "^5.51.23",
    "bits-ui": "^2.15.5",
    "lucide-svelte": "^0.344.0",
    "zod": "^3.22.0"
  }
}
```

**No markdown libraries currently installed.**

---

## 2. Markdown Library Options Analysis

### Option A: marked + DOMPurify (Recommended)

**Libraries:**
- `marked` - Fast, lightweight markdown parser
- `dompurify` - XSS sanitization

**Pros:**
- Extremely fast parsing (~2x faster than markdown-it)
- Small bundle size (~8KB minified)
- CommonMark compliant
- Mature, battle-tested (10+ years, 32k GitHub stars)
- Full control over rendering pipeline
- Works perfectly with streaming content
- No Svelte-specific wrapper needed (direct HTML rendering)

**Cons:**
- Requires manual DOMPurify integration for security
- Custom code highlighting requires additional setup
- No built-in Svelte component support

**Performance:** ~1.5ms for typical chat message

**Streaming Support:** Excellent - can re-parse on each token without issues

### Option B: @humanspeak/svelte-markdown

**Library:** `@humanspeak/svelte-markdown`

**Pros:**
- Native Svelte 5 runes support (`$state`, `$props`)
- Built-in token caching (50-200x faster re-renders)
- TypeScript strict mode support
- XSS protection via HTMLParser2
- Custom renderer support via Svelte snippets
- Active maintenance (last update: ~1 month ago)

**Cons:**
- Additional abstraction layer
- Caching may not help with streaming (content constantly changes)
- Less control over rendering pipeline
- Newer library with smaller community

**Performance:** ~150ms first render, <1ms cached re-renders

**Streaming Support:** Good - caching helps for non-streaming, but streaming negates cache benefits

### Option C: svelte-streamdown

**Library:** `svelte-streamdown`

**Pros:**
- Purpose-built for AI streaming content
- Handles incomplete markdown blocks gracefully
- Built-in Shiki syntax highlighting
- KaTeX math support
- Mermaid diagram support
- Smooth streaming animations

**Cons:**
- Requires Tailwind CSS (project uses custom CSS variables)
- Opinionated styling
- Less flexibility for custom styling
- Newer library (less community support)

**Performance:** Optimized for streaming scenarios

**Streaming Support:** Excellent - specifically designed for token-by-token rendering

### Option D: markdown-it + plugins

**Library:** `markdown-it`

**Pros:**
- Highly extensible plugin system
- CommonMark compliant
- Secure by default
- Good plugin ecosystem
- Popular choice (17k GitHub stars)

**Cons:**
- Slower than marked (~2x)
- Larger bundle size (~25KB)
- Plugin management complexity
- Still requires sanitization for untrusted content

**Performance:** ~3ms for typical chat message

**Streaming Support:** Good

### Option E: remark/rehype ecosystem (unified)

**Libraries:** `remark`, `rehype`, `unified`

**Pros:**
- Most powerful and extensible
- AST-based transformation
- Vast plugin ecosystem
- Great for complex transformations

**Cons:**
- Complex setup
- Larger bundle size
- Overkill for basic markdown rendering
- Slower than marked/markdown-it
- Steeper learning curve

**Performance:** ~5-10ms for typical chat message

**Streaming Support:** Moderate - AST rebuilding has overhead

---

## 3. Recommendation: marked + DOMPurify

### Justification

1. **Performance for Streaming:** With SSE streaming, content updates frequently. `marked` is the fastest option (~1.5ms per parse), making it ideal for real-time rendering without UI lag.

2. **Bundle Size:** Adding `marked` (~8KB) + `dompurify` (~10KB) keeps the bundle lean compared to alternatives.

3. **Full Control:** Direct HTML generation allows precise styling with the existing CSS variables system (no Tailwind dependency).

4. **Svelte 5 Compatibility:** No wrapper library needed - works with `{@html}` directive and Svelte 5's reactivity.

5. **Security:** DOMPurify is the industry standard for XSS prevention, more battle-tested than library-specific solutions.

6. **Code Highlighting Integration:** Easy to extend with Shiki or highlight.js through marked's renderer API.

### Alternative Consideration

If streaming performance becomes an issue (unlikely), consider **svelte-streamdown** as a purpose-built solution, but it would require adopting Tailwind CSS.

---

## 4. Security Approach

### XSS Prevention Strategy

```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(content: string): string {
  // 1. Parse markdown to HTML
  const rawHtml = marked.parse(content);

  // 2. Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'em', 'del', 's',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class',
      'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Allow target for links
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });

  return cleanHtml;
}
```

### Link Safety

```typescript
// Configure marked to add rel="noopener noreferrer" to external links
marked.use({
  renderer: {
    link(href, title, text) {
      const isExternal = href?.startsWith('http');
      const rel = isExternal ? 'rel="noopener noreferrer"' : '';
      const target = isExternal ? 'target="_blank"' : '';
      const titleAttr = title ? `title="${title}"` : '';
      return `<a href="${href}" ${rel} ${target} ${titleAttr}>${text}</a>`;
    }
  }
});
```

---

## 5. Code Syntax Highlighting Recommendation

### Recommended: Shiki

**Why Shiki over Prism/highlight.js:**

1. **VS Code Themes:** Uses same grammars as VS Code, supporting 100+ themes
2. **Svelte Support:** Native Svelte syntax highlighting (important for AI responses about Svelte)
3. **Accuracy:** More accurate highlighting than Prism
4. **Modern:** Actively maintained, unlike Prism (v2 stalled)
5. **TypeScript:** First-class TypeScript support

### Implementation Approach

```typescript
import { createHighlighter } from 'shiki';

// Initialize once at app startup
let highlighter: Awaited<ReturnType<typeof createHighlighter>>;

async function initHighlighter() {
  highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['javascript', 'typescript', 'python', 'svelte', 'json', 'bash', 'markdown']
  });
}

// Custom marked renderer for code blocks
marked.use({
  renderer: {
    code(code, language) {
      if (highlighter && language) {
        try {
          return highlighter.codeToHtml(code, {
            lang: language,
            theme: 'github-dark' // or detect from app theme
          });
        } catch {
          // Fallback for unsupported languages
        }
      }
      // Fallback: plain code block
      return `<pre><code class="language-${language || 'text'}">${escapeHtml(code)}</code></pre>`;
    }
  }
});
```

### Alternative: highlight.js (Lighter Weight)

If bundle size is critical, highlight.js (~25KB for common languages) is acceptable:

```typescript
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
// Import only needed languages

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
```

---

## 6. SSE Streaming Considerations

### Challenge: Incomplete Markdown

During streaming, markdown may be incomplete:
- Unclosed code blocks: ` ```python\nprint("hello` (no closing ```)
- Partial formatting: `**bold` (no closing `**`)
- Incomplete links: `[text](url` (no closing `)`)

### Solution: Defensive Parsing

```typescript
function renderStreamingMarkdown(content: string): string {
  // Add closing markers for incomplete blocks
  let processed = content;

  // Handle unclosed code blocks
  const codeBlockCount = (processed.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    processed += '\n```';
  }

  // Parse with marked (handles most incomplete markdown gracefully)
  const html = marked.parse(processed);

  // Sanitize
  return DOMPurify.sanitize(html);
}
```

### Performance Optimization: Debounced Rendering

```typescript
import { debounce } from '$lib/utils/debounce';

// Only re-render every 50ms during rapid streaming
const debouncedRender = debounce((content: string) => {
  renderedHtml = renderStreamingMarkdown(content);
}, 50);
```

### Smooth UX Pattern

```svelte
<script lang="ts">
  let { content }: { content: string } = $props();

  let renderedHtml = $state('');

  // Re-render on content change with defensive parsing
  $effect(() => {
    renderedHtml = renderStreamingMarkdown(content);
  });
</script>

<div class="markdown-content">
  {@html renderedHtml}
</div>
```

---

## 7. Existing Patterns to Follow

### CSS Variables System

The project uses CSS custom properties extensively. Match this pattern:

```css
/* In ChatMessage.svelte or a new MarkdownContent.svelte */
.markdown-content {
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-primary);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  color: var(--text-primary);
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}

.markdown-content code {
  font-family: var(--font-mono, 'Monaco', 'Consolas', monospace);
  background: var(--bg-code, #1e1e2e);
  color: var(--text-code, #cdd6f4);
  padding: 0.2em 0.4em;
  border-radius: var(--border-radius-sm);
}

.markdown-content pre {
  background: var(--bg-code, #1e1e2e);
  padding: var(--space-4);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
}

.markdown-content a {
  color: var(--primary-color);
  text-decoration: underline;
}

.markdown-content blockquote {
  border-left: 4px solid var(--border-color);
  padding-left: var(--space-4);
  margin-left: 0;
  color: var(--text-secondary);
}
```

### Component Structure Pattern

Follow the existing component patterns:

```svelte
<!-- src/lib/components/chat/MarkdownContent.svelte -->
<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  interface Props {
    content: string;
    isStreaming?: boolean;
  }

  let { content, isStreaming = false }: Props = $props();

  const renderedHtml = $derived(renderMarkdown(content));

  function renderMarkdown(source: string): string {
    if (!source) return '';

    let processed = source;

    // Handle incomplete code blocks during streaming
    if (isStreaming) {
      const codeBlockCount = (processed.match(/```/g) || []).length;
      if (codeBlockCount % 2 !== 0) {
        processed += '\n```';
      }
    }

    const html = marked.parse(processed);
    return DOMPurify.sanitize(html);
  }
</script>

<div class="markdown-content" class:streaming={isStreaming}>
  {@html renderedHtml}
</div>

<style>
  .markdown-content {
    /* Styles as shown above */
  }

  .markdown-content.streaming {
    /* Optional: subtle animation for streaming */
  }
</style>
```

### Integration with ChatMessage.svelte

Replace the current text rendering in `ChatMessage.svelte`:

```svelte
<!-- Before (current) -->
<div class="text-content">
  {#each displayContent().split('\n') as line, i}
    <!-- ... -->
  {/each}
</div>

<!-- After (with markdown) -->
<MarkdownContent
  content={displayContent()}
  isStreaming={isStreaming}
/>
```

---

## 8. Implementation Checklist

### Phase 1: Core Setup
- [ ] Install `marked` and `dompurify`
- [ ] Create `src/lib/utils/markdown.ts` with parsing utilities
- [ ] Create `src/lib/components/chat/MarkdownContent.svelte` component

### Phase 2: Styling
- [ ] Add markdown CSS variables to `app.css`
- [ ] Style headings, lists, blockquotes, tables
- [ ] Style inline code and code blocks
- [ ] Support dark theme

### Phase 3: Code Highlighting
- [ ] Install `shiki`
- [ ] Initialize highlighter at app startup
- [ ] Configure marked renderer for code blocks
- [ ] Add syntax highlighting CSS

### Phase 4: Integration
- [ ] Update `ChatMessage.svelte` to use `MarkdownContent`
- [ ] Test with streaming content
- [ ] Handle edge cases (incomplete blocks, special characters)

### Phase 5: Testing
- [ ] Unit tests for markdown parsing
- [ ] Security tests for XSS prevention
- [ ] Visual regression tests for styling
- [ ] Performance benchmarks for streaming

---

## 9. Dependencies to Install

```bash
npm install marked dompurify shiki
npm install -D @types/dompurify
```

**Bundle Size Impact:**
- `marked`: ~8KB (minified + gzipped)
- `dompurify`: ~10KB (minified + gzipped)
- `shiki`: ~200KB+ (includes grammars/themes, but tree-shakeable)

**Alternative (lighter):**
```bash
npm install marked dompurify highlight.js
npm install -D @types/dompurify
```
- `highlight.js` (core + 10 languages): ~25KB

---

## 10. References

### Documentation
- [marked Documentation](https://marked.js.org/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Shiki Documentation](https://shiki.style/)

### Research Sources
- [npm-compare: marked vs markdown-it vs remark](https://npm-compare.com/markdown-it,marked,remark,showdown)
- [Rodney Lab: SvelteKit Shiki Syntax Highlighting](https://rodneylab.com/sveltekit-shiki-syntax-highlighting/)
- [GitHub: svelte-streamdown](https://github.com/beynar/svelte-streamdown)
- [GitHub: @humanspeak/svelte-markdown](https://github.com/humanspeak/svelte-markdown)
- [Svelte Markdown Guide](https://caisy.io/blog/svelte-render-markdown)
- [Strapi: React Markdown Security Guide](https://strapi.io/blog/react-markdown-complete-guide-security-styling)

---

## Summary

| Aspect | Recommendation | Rationale |
|--------|----------------|-----------|
| **Markdown Parser** | `marked` | Fastest, smallest, streaming-friendly |
| **Sanitization** | `DOMPurify` | Industry standard XSS protection |
| **Code Highlighting** | `shiki` | VS Code themes, Svelte support |
| **Svelte Wrapper** | None (use `{@html}`) | Maximum control, simpler debugging |
| **Streaming Strategy** | Defensive parsing + debounce | Handle incomplete markdown gracefully |

This approach provides the best balance of performance, security, and maintainability for the research-mind-ui chat interface.

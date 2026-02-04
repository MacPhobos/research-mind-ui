# Markdown Rendering Implementation Plan

**Date:** 2025-02-04
**Status:** Awaiting Approval
**Research:** [markdown-rendering-implementation-2025-02-04.md](../../research/markdown-rendering-implementation-2025-02-04.md)

---

## Overview

Implement markdown rendering for the chat interface in research-mind-ui. The claude-mpm responses are markdown-formatted and currently display as plain text. This plan adds proper markdown rendering with code syntax highlighting and XSS protection.

## Goals

1. Render markdown content (headings, lists, code blocks, links, tables) in chat responses
2. Syntax highlight code blocks with support for common languages (TypeScript, Python, Svelte, etc.)
3. Handle SSE streaming gracefully (incomplete markdown during token streaming)
4. Prevent XSS attacks through proper sanitization
5. Match existing design system (CSS variables, dark theme support)

## Non-Goals

- Math/LaTeX rendering (can be added later if needed)
- Mermaid diagrams (can be added later if needed)
- Copy-to-clipboard for code blocks (separate enhancement)
- Editable markdown (this is display-only)

---

## Technical Approach

### Selected Libraries

| Library | Purpose | Bundle Size |
|---------|---------|-------------|
| `marked` | Markdown parsing | ~8KB |
| `dompurify` | XSS sanitization | ~10KB |
| `shiki` | Code syntax highlighting | ~200KB (tree-shakeable) |

**Total Impact:** ~218KB (with full Shiki) or ~43KB (with highlight.js alternative)

### Why These Libraries

- **marked**: Fastest parser (~1.5ms), ideal for real-time streaming
- **DOMPurify**: Industry-standard XSS prevention
- **Shiki**: VS Code-quality highlighting, native Svelte syntax support

---

## Implementation Phases

### Phase 1: Core Markdown Utilities (Est. 1-2 hours)

**Files to Create:**
- `src/lib/utils/markdown.ts` - Markdown parsing utilities

**Tasks:**
1. Install dependencies: `npm install marked dompurify shiki && npm install -D @types/dompurify`
2. Create markdown parser with DOMPurify sanitization
3. Configure marked for safe link rendering (noopener noreferrer)
4. Add streaming-aware parsing (handle incomplete code blocks)

**Code Structure:**
```typescript
// src/lib/utils/markdown.ts
export function parseMarkdown(content: string, isStreaming?: boolean): string;
export function initSyntaxHighlighter(): Promise<void>;
```

### Phase 2: MarkdownContent Component (Est. 2-3 hours)

**Files to Create:**
- `src/lib/components/chat/MarkdownContent.svelte` - Reusable markdown renderer

**Tasks:**
1. Create component with Svelte 5 runes ($state, $derived, $props)
2. Accept `content` and `isStreaming` props
3. Use `{@html}` directive with sanitized output
4. Handle re-rendering efficiently during streaming

**Props Interface:**
```typescript
interface Props {
  content: string;
  isStreaming?: boolean;
}
```

### Phase 3: Markdown Styling (Est. 2-3 hours)

**Files to Modify:**
- `src/app.css` - Add global CSS variables for code/markdown

**Files to Create:**
- Scoped styles within `MarkdownContent.svelte`

**Elements to Style:**
- Headings (h1-h6)
- Lists (ul, ol)
- Blockquotes
- Code blocks (pre + code)
- Inline code
- Links
- Tables
- Horizontal rules

**CSS Variable Additions:**
```css
:root {
  --bg-code: #1e1e2e;
  --text-code: #cdd6f4;
  --border-code: #313244;
}
```

### Phase 4: Syntax Highlighting Integration (Est. 2-3 hours)

**Files to Modify:**
- `src/lib/utils/markdown.ts` - Add Shiki integration
- `src/routes/+layout.svelte` - Initialize highlighter at app startup

**Supported Languages (initial):**
- TypeScript/JavaScript
- Python
- Svelte
- JSON
- Bash/Shell
- Markdown
- CSS
- SQL

**Tasks:**
1. Initialize Shiki highlighter at app load
2. Configure marked renderer to use Shiki for code blocks
3. Fallback to plain code display for unsupported languages
4. Support both light and dark themes

### Phase 5: ChatMessage Integration (Est. 1-2 hours)

**Files to Modify:**
- `src/lib/components/chat/ChatMessage.svelte`

**Changes:**
```svelte
<!-- Replace this: -->
<div class="text-content">
  {#each displayContent().split('\n') as line, i}
    {#if line.trim()}
      <p>{line}</p>
    {:else if i < displayContent().split('\n').length - 1}
      <br />
    {/if}
  {/each}
</div>

<!-- With this: -->
<MarkdownContent
  content={displayContent()}
  isStreaming={isStreaming}
/>
```

**Note:** Stage 1 (expandable process output) keeps `<pre>` rendering - only Stage 2 (primary response) uses markdown.

### Phase 6: Testing (Est. 2-3 hours)

**Files to Create:**
- `tests/markdown.test.ts` - Unit tests for markdown utilities

**Test Cases:**
1. Basic markdown elements render correctly
2. Code blocks get syntax highlighting
3. XSS payloads are sanitized
4. Streaming content with incomplete blocks renders gracefully
5. Links have proper security attributes

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `src/lib/utils/markdown.ts` | Markdown parsing and sanitization |
| `src/lib/components/chat/MarkdownContent.svelte` | Reusable markdown renderer |
| `tests/markdown.test.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/app.css` | Add CSS variables for code styling |
| `src/routes/+layout.svelte` | Initialize Shiki highlighter |
| `src/lib/components/chat/ChatMessage.svelte` | Use MarkdownContent component |
| `package.json` | Add dependencies |

---

## Security Considerations

### XSS Prevention
- All markdown output sanitized through DOMPurify
- Whitelist-only approach for HTML tags
- Block dangerous tags: `<script>`, `<style>`, `<iframe>`, `<form>`
- Strip event handlers: `onerror`, `onclick`, etc.

### Link Safety
- External links get `rel="noopener noreferrer"`
- External links open in new tab (`target="_blank"`)

### Sanitization Config
```typescript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em',
    'del', 's', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
});
```

---

## Streaming Considerations

### Problem
During SSE streaming, markdown may be incomplete:
- Unclosed code blocks: ` ```python\nprint("hello` (missing closing ```)
- Partial formatting: `**bold` (missing closing `**`)

### Solution
Defensive parsing that detects and temporarily closes incomplete blocks:

```typescript
function parseStreaming(content: string): string {
  let processed = content;

  // Close unclosed code blocks
  const codeBlockCount = (processed.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    processed += '\n```';
  }

  return parseMarkdown(processed);
}
```

---

## Acceptance Criteria

- [ ] Markdown headings, lists, blockquotes, and links render correctly
- [ ] Code blocks display with syntax highlighting
- [ ] No XSS vulnerabilities (tested with common payloads)
- [ ] Streaming content renders without visual glitches
- [ ] Styles match existing design system (CSS variables)
- [ ] All tests pass
- [ ] TypeScript types are correct (no `any`)

---

## Alternative Considered: Lighter Bundle

If 200KB for Shiki is too large, use highlight.js instead:

```bash
npm install highlight.js
# Instead of shiki
```

**Trade-offs:**
- Smaller bundle (~25KB for core + languages)
- Less accurate highlighting
- No native Svelte syntax support
- Fewer themes

**Recommendation:** Start with Shiki. Optimize if bundle size becomes an issue.

---

## Timeline Estimate

| Phase | Estimate |
|-------|----------|
| Phase 1: Core Utilities | 1-2 hours |
| Phase 2: MarkdownContent Component | 2-3 hours |
| Phase 3: Styling | 2-3 hours |
| Phase 4: Syntax Highlighting | 2-3 hours |
| Phase 5: ChatMessage Integration | 1-2 hours |
| Phase 6: Testing | 2-3 hours |
| **Total** | **10-16 hours** |

---

## Decisions (Approved)

1. **Shiki vs highlight.js**: Use **Shiki** for better highlighting quality
2. **Theme support**: **Auto light/dark** - detect from app theme
3. **Language scope**: **8 languages initially**, architecture must be extensible for adding languages
4. **Copy button**: **Include now** - add copy-to-clipboard on code blocks

---

## Approval

**Approved by:** User
**Date:** 2025-02-04
**Notes:** Proceed with implementation using Shiki, auto theme detection, extensible language support, and copy button included.

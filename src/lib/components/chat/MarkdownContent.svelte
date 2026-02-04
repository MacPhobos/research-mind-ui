<script lang="ts">
  import { parseMarkdown, initCopyButtons } from '$lib/utils/markdown';

  interface Props {
    content: string;
    isStreaming?: boolean;
  }

  let { content, isStreaming = false }: Props = $props();

  // Parse markdown content reactively
  const renderedHtml = $derived(parseMarkdown(content, isStreaming));

  // Reference to the container element for copy button initialization
  let containerRef: HTMLElement | null = $state(null);

  // Initialize copy buttons when content changes
  $effect(() => {
    if (containerRef && renderedHtml) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (containerRef) {
          initCopyButtons(containerRef);
        }
      });
    }
  });
</script>

<div class="markdown-content" class:streaming={isStreaming} bind:this={containerRef}>
  {@html renderedHtml}
</div>

<style>
  .markdown-content {
    font-size: var(--font-size-sm);
    line-height: 1.7;
    color: var(--text-primary);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* Headings */
  .markdown-content :global(h1),
  .markdown-content :global(h2),
  .markdown-content :global(h3),
  .markdown-content :global(h4),
  .markdown-content :global(h5),
  .markdown-content :global(h6) {
    margin-top: var(--space-6);
    margin-bottom: var(--space-3);
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-primary);
  }

  .markdown-content :global(h1) {
    font-size: var(--font-size-2xl);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-color);
  }

  .markdown-content :global(h2) {
    font-size: var(--font-size-xl);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-color);
  }

  .markdown-content :global(h3) {
    font-size: var(--font-size-lg);
  }

  .markdown-content :global(h4) {
    font-size: var(--font-size-base);
  }

  .markdown-content :global(h5),
  .markdown-content :global(h6) {
    font-size: var(--font-size-sm);
  }

  /* First heading should not have top margin */
  .markdown-content :global(> h1:first-child),
  .markdown-content :global(> h2:first-child),
  .markdown-content :global(> h3:first-child),
  .markdown-content :global(> h4:first-child),
  .markdown-content :global(> h5:first-child),
  .markdown-content :global(> h6:first-child) {
    margin-top: 0;
  }

  /* Paragraphs */
  .markdown-content :global(p) {
    margin: 0 0 var(--space-4) 0;
  }

  .markdown-content :global(p:last-child) {
    margin-bottom: 0;
  }

  /* Lists */
  .markdown-content :global(ul),
  .markdown-content :global(ol) {
    margin: 0 0 var(--space-4) 0;
    padding-left: var(--space-6);
  }

  .markdown-content :global(li) {
    margin-bottom: var(--space-2);
  }

  .markdown-content :global(li:last-child) {
    margin-bottom: 0;
  }

  .markdown-content :global(li > ul),
  .markdown-content :global(li > ol) {
    margin-top: var(--space-2);
    margin-bottom: 0;
  }

  /* Blockquotes */
  .markdown-content :global(blockquote) {
    margin: 0 0 var(--space-4) 0;
    padding: var(--space-3) var(--space-4);
    border-left: 4px solid var(--primary-color);
    background: var(--bg-hover);
    color: var(--text-secondary);
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  }

  .markdown-content :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Inline code */
  .markdown-content :global(code:not(pre code)) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    padding: 0.2em 0.4em;
    background: var(--bg-code-inline);
    border-radius: var(--border-radius-sm);
    color: var(--text-primary);
  }

  /* Links */
  .markdown-content :global(a) {
    color: var(--primary-color);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .markdown-content :global(a:hover) {
    text-decoration: none;
  }

  /* Images */
  .markdown-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius-md);
    margin: var(--space-4) 0;
  }

  /* Tables */
  .markdown-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-4) 0;
    font-size: var(--font-size-sm);
  }

  .markdown-content :global(th),
  .markdown-content :global(td) {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-color);
    text-align: left;
  }

  .markdown-content :global(th) {
    background: var(--bg-hover);
    font-weight: 600;
  }

  .markdown-content :global(tr:nth-child(even)) {
    background: var(--bg-secondary);
  }

  /* Horizontal rules */
  .markdown-content :global(hr) {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: var(--space-6) 0;
  }

  /* Strong and emphasis */
  .markdown-content :global(strong) {
    font-weight: 600;
  }

  .markdown-content :global(em) {
    font-style: italic;
  }

  .markdown-content :global(del),
  .markdown-content :global(s) {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  /* Streaming indicator - cursor blink effect at the end */
  .markdown-content.streaming::after {
    content: '';
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--primary-color);
    vertical-align: text-bottom;
    margin-left: 2px;
    animation: cursor-blink 1s step-end infinite;
  }

  @keyframes cursor-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>

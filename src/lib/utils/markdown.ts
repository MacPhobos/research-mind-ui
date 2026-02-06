/**
 * Markdown parsing utilities with XSS protection and syntax highlighting.
 *
 * Uses marked for parsing, DOMPurify for sanitization, and Shiki for code highlighting.
 */

import { marked, type Renderer, type Tokens } from 'marked';
import DOMPurify from 'dompurify';
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

// Highlighter singleton - initialized once at app startup
let highlighter: Highlighter | null = null;
let highlighterInitializing = false;
let highlighterInitPromise: Promise<void> | null = null;

// Current theme for syntax highlighting
let currentTheme: 'light' | 'dark' = 'light';

/**
 * Initial set of supported languages.
 * Architecture is extensible - add languages here to support more.
 */
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'typescript',
  'javascript',
  'python',
  'svelte',
  'json',
  'bash',
  'markdown',
  'css',
  'sql',
];

/**
 * Theme mapping for light/dark modes
 */
const THEME_MAP = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

/**
 * DOMPurify configuration - whitelist-only approach
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'strong',
    'em',
    'del',
    's',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'div',
    'button',
  ] as string[],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'target',
    'rel',
    'data-code',
    'type',
  ] as string[],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'textarea', 'select'] as string[],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
  ] as string[],
  ALLOW_DATA_ATTR: false,
};

/**
 * HTML escape function for fallback code rendering
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Initialize the Shiki syntax highlighter.
 * Call this once at app startup (e.g., in +layout.svelte).
 *
 * @param theme - Initial theme ('light' or 'dark')
 */
export async function initSyntaxHighlighter(theme: 'light' | 'dark' = 'light'): Promise<void> {
  if (highlighter) return;

  if (highlighterInitializing && highlighterInitPromise) {
    return highlighterInitPromise;
  }

  highlighterInitializing = true;
  currentTheme = theme;

  highlighterInitPromise = (async () => {
    try {
      highlighter = await createHighlighter({
        themes: [THEME_MAP.light, THEME_MAP.dark],
        langs: SUPPORTED_LANGUAGES,
      });
      configureMarkedRenderer();
    } catch (error) {
      console.error('Failed to initialize syntax highlighter:', error);
      // Continue without syntax highlighting
      configureMarkedRenderer();
    } finally {
      highlighterInitializing = false;
    }
  })();

  return highlighterInitPromise;
}

/**
 * Update the current theme for syntax highlighting
 */
export function setHighlighterTheme(theme: 'light' | 'dark'): void {
  currentTheme = theme;
}

/**
 * Check if the highlighter is ready
 */
export function isHighlighterReady(): boolean {
  return highlighter !== null;
}

/**
 * Render link text from tokens
 */
function renderLinkText(tokens: Tokens.Link['tokens']): string {
  // Simple text extraction from tokens
  return tokens
    .map((token) => {
      if ('text' in token) return token.text;
      if ('raw' in token) return token.raw;
      return '';
    })
    .join('');
}

/**
 * Configure the marked renderer with custom code block handling
 */
function configureMarkedRenderer(): void {
  const renderer: Partial<Renderer> = {
    // Custom link rendering with security attributes
    link({ href, title, tokens }: Tokens.Link): string {
      // Render link text from tokens
      const text = renderLinkText(tokens);
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
      const rel = isExternal ? ' rel="noopener noreferrer"' : '';
      const target = isExternal ? ' target="_blank"' : '';
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href || '')}"${rel}${target}${titleAttr}>${text}</a>`;
    },

    // Custom code block rendering with Shiki highlighting and copy button
    code({ text, lang }: Tokens.Code): string {
      const language = lang || 'text';
      const codeContent = text || '';

      // Encode code for copy button data attribute
      const encodedCode = encodeURIComponent(codeContent);

      // Try to highlight with Shiki
      if (highlighter && language !== 'text') {
        try {
          const theme = THEME_MAP[currentTheme];
          // Check if language is supported
          const loadedLangs = highlighter.getLoadedLanguages();
          if (loadedLangs.includes(language as BundledLanguage)) {
            const highlighted = highlighter.codeToHtml(codeContent, {
              lang: language as BundledLanguage,
              theme,
            });
            // Wrap with copy button container
            return `<div class="code-block-wrapper">
              <button type="button" class="copy-code-button" data-code="${encodedCode}" title="Copy code">
                <span class="copy-icon">Copy</span>
              </button>
              ${highlighted}
            </div>`;
          }
        } catch {
          // Fall through to plain rendering
        }
      }

      // Fallback: plain code block with copy button
      return `<div class="code-block-wrapper">
        <button type="button" class="copy-code-button" data-code="${encodedCode}" title="Copy code">
          <span class="copy-icon">Copy</span>
        </button>
        <pre><code class="language-${escapeHtml(language)}">${escapeHtml(codeContent)}</code></pre>
      </div>`;
    },
  };

  marked.use({ renderer });
}

/**
 * Close unclosed code blocks in streaming content.
 * This prevents markdown parser from breaking during streaming.
 */
function closeIncompleteCodeBlocks(content: string): string {
  let processed = content;

  // Count code fence markers (```)
  const codeBlockMatches = processed.match(/```/g) || [];
  if (codeBlockMatches.length % 2 !== 0) {
    // Odd number of fences - add closing fence
    processed += '\n```';
  }

  return processed;
}

/**
 * Wrap a "Sources" or "References" section near the end of the HTML
 * in a styled container div for visual distinction.
 *
 * Must be called AFTER DOMPurify sanitization since it adds a wrapper div
 * with a class attribute (both already in the sanitize allowlist).
 */
function wrapSourcesSection(html: string): string {
  const sourcesPattern = /<h2[^>]*>(Sources|References)<\/h2>/i;
  const match = html.match(sourcesPattern);
  if (match && match.index !== undefined) {
    const beforeSources = html.slice(0, match.index);
    const sourcesSection = html.slice(match.index);
    return `${beforeSources}<div class="sources-section">${sourcesSection}</div>`;
  }
  return html;
}

/**
 * Parse markdown content to sanitized HTML.
 *
 * @param content - Raw markdown content
 * @param isStreaming - If true, handle incomplete markdown blocks
 * @returns Sanitized HTML string
 */
export function parseMarkdown(content: string, isStreaming = false): string {
  if (!content) return '';

  let processed = content;

  // Handle incomplete code blocks during streaming
  if (isStreaming) {
    processed = closeIncompleteCodeBlocks(processed);
  }

  // Parse markdown to HTML
  const rawHtml = marked.parse(processed, { async: false }) as string;

  // Sanitize HTML to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

  // Wrap Sources/References section in styled container (post-sanitization)
  return wrapSourcesSection(sanitizedHtml);
}

/**
 * Initialize copy button event listeners.
 * Call this after rendering markdown content.
 *
 * @param container - The container element with rendered markdown
 */
export function initCopyButtons(container: HTMLElement): void {
  const buttons = container.querySelectorAll('.copy-code-button');

  buttons.forEach((button) => {
    // Remove existing listener to prevent duplicates
    const newButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(newButton, button);

    newButton.addEventListener('click', async () => {
      const encodedCode = newButton.getAttribute('data-code');
      if (!encodedCode) return;

      try {
        const code = decodeURIComponent(encodedCode);
        await navigator.clipboard.writeText(code);

        // Show success feedback
        const iconSpan = newButton.querySelector('.copy-icon');
        if (iconSpan) {
          const originalText = iconSpan.textContent;
          iconSpan.textContent = 'Copied!';
          newButton.classList.add('copied');

          setTimeout(() => {
            iconSpan.textContent = originalText;
            newButton.classList.remove('copied');
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    });
  });
}

// Initialize renderer with fallback (no highlighting) if called before initSyntaxHighlighter
configureMarkedRenderer();

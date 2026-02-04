import { describe, it, expect, vi } from 'vitest';
import { parseMarkdown } from '../src/lib/utils/markdown';

// Mock DOMPurify for Node.js environment
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string, config?: Record<string, unknown>) => {
      // Simple sanitizer for testing - strips script tags and event handlers
      let sanitized = html;

      // Remove script tags
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Remove onclick, onerror, etc.
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

      // Remove javascript: URLs
      sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');

      // Filter tags if ALLOWED_TAGS is provided
      if (config?.ALLOWED_TAGS) {
        const allowedTags = config.ALLOWED_TAGS as string[];
        // Remove iframe, form, input if not in allowed tags
        if (!allowedTags.includes('iframe')) {
          sanitized = sanitized.replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '');
          sanitized = sanitized.replace(/<iframe\b[^>]*\/?>/gi, '');
        }
        if (!allowedTags.includes('form')) {
          sanitized = sanitized.replace(/<form\b[^>]*>.*?<\/form>/gi, '');
        }
        if (!allowedTags.includes('input')) {
          sanitized = sanitized.replace(/<input\b[^>]*\/?>/gi, '');
        }
        if (!allowedTags.includes('style')) {
          sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        }
      }

      return sanitized;
    },
  },
}));

// Mock Shiki (highlighter not initialized in tests)
vi.mock('shiki', () => ({
  createHighlighter: vi.fn(),
}));

describe('Markdown Parser', () => {
  describe('Basic Markdown Elements', () => {
    it('should render headings correctly', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<h1>Heading 1</h1>');
      expect(result).toContain('<h2>Heading 2</h2>');
      expect(result).toContain('<h3>Heading 3</h3>');
    });

    it('should render paragraphs', () => {
      const markdown = 'This is a paragraph.\n\nThis is another paragraph.';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<p>This is another paragraph.</p>');
    });

    it('should render unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('<li>Item 3</li>');
      expect(result).toContain('</ul>');
    });

    it('should render ordered lists', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
      expect(result).toContain('<li>Third</li>');
      expect(result).toContain('</ol>');
    });

    it('should render blockquotes', () => {
      const markdown = '> This is a quote';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<blockquote>');
      expect(result).toContain('This is a quote');
      expect(result).toContain('</blockquote>');
    });

    it('should render bold text', () => {
      const markdown = 'This is **bold** text';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<strong>bold</strong>');
    });

    it('should render italic text', () => {
      const markdown = 'This is *italic* text';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<em>italic</em>');
    });

    it('should render strikethrough text', () => {
      const markdown = 'This is ~~deleted~~ text';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<del>deleted</del>');
    });

    it('should render horizontal rules', () => {
      const markdown = 'Above\n\n---\n\nBelow';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<hr');
    });
  });

  describe('Code Blocks', () => {
    it('should render inline code', () => {
      const markdown = 'Use the `console.log()` function';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<code>console.log()</code>');
    });

    it('should render fenced code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = parseMarkdown(markdown);

      expect(result).toContain('code-block-wrapper');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('copy-code-button');
    });

    it('should include copy button in code blocks', () => {
      const markdown = '```python\nprint("hello")\n```';
      const result = parseMarkdown(markdown);

      expect(result).toContain('copy-code-button');
      expect(result).toContain('data-code=');
    });

    it('should escape HTML in code blocks', () => {
      const markdown = '```html\n<script>alert("xss")</script>\n```';
      const result = parseMarkdown(markdown);

      // Code content should be escaped, not executed
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
    });

    it('should handle code blocks without language', () => {
      const markdown = '```\nsome code\n```';
      const result = parseMarkdown(markdown);

      expect(result).toContain('some code');
      expect(result).toContain('code-block-wrapper');
    });
  });

  describe('Links', () => {
    it('should render links correctly', () => {
      const markdown = '[Click here](https://example.com)';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('>Click here</a>');
    });

    it('should add security attributes to external links', () => {
      const markdown = '[External](https://example.com)';
      const result = parseMarkdown(markdown);

      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
    });

    it('should not add external attributes to relative links', () => {
      const markdown = '[Internal](/page)';
      const result = parseMarkdown(markdown);

      expect(result).toContain('href="/page"');
      expect(result).not.toContain('target="_blank"');
    });

    it('should render links with titles', () => {
      const markdown = '[Link](https://example.com "Example Site")';
      const result = parseMarkdown(markdown);

      expect(result).toContain('title="Example Site"');
    });
  });

  describe('Tables', () => {
    it('should render tables', () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;
      const result = parseMarkdown(markdown);

      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<th>Header 1</th>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<td>Cell 1</td>');
      expect(result).toContain('</table>');
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags', () => {
      const markdown = '<script>alert("xss")</script>Hello';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("xss")');
    });

    it('should sanitize onclick handlers', () => {
      const markdown = '<div onclick="alert(1)">Click me</div>';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('onclick');
    });

    it('should sanitize onerror handlers', () => {
      const markdown = '<img src="x" onerror="alert(1)">';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('onerror');
    });

    it('should sanitize javascript: URLs', () => {
      const markdown = '[Click](javascript:alert(1))';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('javascript:alert');
    });

    it('should sanitize iframe tags', () => {
      const markdown = '<iframe src="https://evil.com"></iframe>';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('<iframe');
    });

    it('should sanitize form tags', () => {
      const markdown = '<form action="https://evil.com"><input></form>';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });

    it('should sanitize style tags', () => {
      const markdown = '<style>body { display: none; }</style>';
      const result = parseMarkdown(markdown);

      expect(result).not.toContain('<style>');
    });
  });

  describe('Streaming Content', () => {
    it('should handle incomplete code blocks during streaming', () => {
      const markdown = '```python\nprint("hello")';
      const result = parseMarkdown(markdown, true);

      // Should still render without errors
      expect(result).toContain('print');
      // Should close the code block
      expect(result).toContain('</code>');
    });

    it('should not modify complete code blocks', () => {
      const markdown = '```python\nprint("hello")\n```';
      const resultStreaming = parseMarkdown(markdown, true);
      const resultNormal = parseMarkdown(markdown, false);

      // Both should produce similar results for complete markdown
      expect(resultStreaming).toContain('print');
      expect(resultNormal).toContain('print');
    });

    it('should handle empty streaming content', () => {
      const result = parseMarkdown('', true);
      expect(result).toBe('');
    });

    it('should handle partial formatting during streaming', () => {
      const markdown = 'This is **bold';
      const result = parseMarkdown(markdown, true);

      // Should not throw and should contain the text
      expect(result).toContain('bold');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = parseMarkdown('');
      expect(result).toBe('');
    });

    it('should handle null-like content', () => {
      const result = parseMarkdown('');
      expect(result).toBe('');
    });

    it('should handle nested lists', () => {
      const markdown = '- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2';
      const result = parseMarkdown(markdown);

      expect(result).toContain('<ul>');
      expect(result).toContain('Nested 1');
      expect(result).toContain('Nested 2');
    });

    it('should handle mixed content', () => {
      const markdown = `
# Title

Some **bold** and *italic* text.

\`\`\`javascript
const x = 1;
\`\`\`

> A quote

- List item
`;
      const result = parseMarkdown(markdown);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('const x = 1');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('<li>List item</li>');
    });

    it('should handle special characters', () => {
      const markdown = 'Less than < and greater than > and ampersand &';
      const result = parseMarkdown(markdown);

      // Content should be in the output
      expect(result).toContain('Less than');
      expect(result).toContain('greater than');
      expect(result).toContain('ampersand');
    });
  });
});

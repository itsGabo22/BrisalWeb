/**
 * The tiny markdown subset the admin-authored legal documents support.
 *
 * Deliberately hand-parsed rather than pulled from a markdown library. The
 * project has no markdown dependency and this is the only place that would
 * need one, so adding `remark`/`rehype` (plus a sanitiser, since the output
 * would be raw HTML from a text field) is a lot of surface area for two
 * documents. Parsing to a small block union instead means the renderer emits
 * ordinary React elements and there is no `dangerouslySetInnerHTML` anywhere —
 * the content cannot inject markup no matter what is typed into the textarea.
 *
 * Supported, and nothing else:
 *   `## Heading`   → a section heading
 *   `- item` lines → a bullet list
 *   anything else  → a paragraph, with single newlines kept as line breaks
 *
 * Unsupported syntax (bold, links, tables) is simply shown as the literal
 * characters typed, which is the honest failure mode for a legal document:
 * visible and obviously wrong, rather than silently swallowed.
 */
export type LegalBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; lines: string[] };

/** Blank line = block separator, the one structural rule of the format. */
const BLOCK_SEPARATOR = /\n\s*\n/;

export function parseLegalText(source: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];

  for (const raw of source.replace(/\r\n/g, '\n').split(BLOCK_SEPARATOR)) {
    const chunk = raw.trim();
    if (!chunk) continue;

    const lines = chunk.split('\n').map((line) => line.trim());

    // A heading is its own block by definition, so only the first line is
    // examined — "## x" further down a paragraph is body text, not a heading.
    if (lines[0].startsWith('## ')) {
      const text = lines[0].slice(3).trim();
      if (text) blocks.push({ kind: 'heading', text });
      // Anything the client typed under the heading without a blank line is
      // still content, so it becomes a paragraph rather than being dropped.
      const rest = lines.slice(1).filter(Boolean);
      if (rest.length > 0) blocks.push({ kind: 'paragraph', lines: rest });
      continue;
    }

    // A list only if EVERY line is a bullet. A block that mixes prose and
    // dashes is prose that happens to contain dashes.
    if (lines.every((line) => line.startsWith('- '))) {
      const items = lines.map((line) => line.slice(2).trim()).filter(Boolean);
      if (items.length > 0) blocks.push({ kind: 'list', items });
      continue;
    }

    blocks.push({ kind: 'paragraph', lines });
  }

  return blocks;
}

/** Whether a stored field has anything worth rendering. */
export function hasLegalContent(source: string | null | undefined): boolean {
  return typeof source === 'string' && source.trim().length > 0;
}

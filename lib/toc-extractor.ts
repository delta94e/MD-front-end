export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Generate a slug from heading text, matching rehype-slug behavior.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse hyphens
    .replace(/(^-|-$)/g, ""); // trim hyphens
}

/**
 * Strip inline markdown formatting from heading text.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .trim();
}

/**
 * Extract headings from markdown content.
 * Skips headings inside fenced code blocks.
 */
export function extractHeadings(markdown: string): TOCItem[] {
  const lines = markdown.split("\n");
  const headings: TOCItem[] = [];
  let inCodeBlock = false;
  const seenIds = new Map<string, number>();

  for (const line of lines) {
    // Track fenced code blocks
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const rawText = match[2].trim();
    const text = stripMarkdown(rawText);
    let id = slugify(text);

    // Deduplicate IDs
    const count = seenIds.get(id) ?? 0;
    seenIds.set(id, count + 1);
    if (count > 0) {
      id = `${id}-${count}`;
    }

    headings.push({ id, text, level });
  }

  return headings;
}

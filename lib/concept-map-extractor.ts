import { slugify, stripMarkdown } from "@/lib/toc-extractor";

export interface ConceptNode {
  id: string;
  label: string;
  level: number; // 1-6 (heading depth)
  line: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  label: string;
}

export interface ConceptMap {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

const NODE_SIZES: Record<number, number> = {
  1: 8,
  2: 5,
  3: 3,
  4: 2,
  5: 2,
  6: 2,
};

/** Check if a line starts a fenced code block (backtick or tilde) */
function isFenceStart(line: string): boolean {
  const trimmed = line.trimStart();
  return /^(`{3,}|~{3,})/.test(trimmed);
}

/** Extract heading level and text from a line */
function parseHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  return { level: match[1].length, text: match[2].trim() };
}

/** Extract anchor links: [text](#anchor) */
function extractAnchorLinks(line: string): { text: string; anchor: string }[] {
  const links: { text: string; anchor: string }[] = [];
  const re = /\[([^\]]+)\]\(#([^)]+)\)/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    links.push({ text: match[1].trim(), anchor: match[2].trim() });
  }
  return links;
}

/** Extract file links: [text](./path.md) or [text](path.md) */
function extractFileLinks(line: string): { text: string; file: string }[] {
  const links: { text: string; file: string }[] = [];
  const re = /\[([^\]]+)\]\(((?:\.\/|\.\.\/|\/)?[^)#]+\.md)(?:#[^)]+)?\)/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    links.push({ text: match[1].trim(), file: match[2].trim() });
  }
  return links;
}

/**
 * Extract a concept map from markdown content.
 * - Nodes: headings (h1-h6)
 * - Edges: internal anchor links and file links
 */
export function extractConceptMap(markdown: string): ConceptMap {
  const lines = markdown.split("\n");
  const nodes: ConceptNode[] = [];
  const edges: ConceptEdge[] = [];
  let inCodeBlock = false;
  const seenIds = new Map<string, number>();

  // Track current heading context for edge creation
  let currentHeadingId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track fenced code blocks (backtick or tilde)
    if (isFenceStart(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Parse headings
    const heading = parseHeading(line);
    if (heading) {
      const text = stripMarkdown(heading.text);
      let id = slugify(text);

      // Deduplicate IDs
      const count = seenIds.get(id) ?? 0;
      seenIds.set(id, count + 1);
      if (count > 0) {
        id = `${id}-${count}`;
      }

      nodes.push({
        id,
        label: text,
        level: heading.level,
        line: i,
      });

      currentHeadingId = id;
      continue;
    }

    // Parse links (only if we have a current heading context)
    if (currentHeadingId) {
      // Anchor links → edges between headings in same file
      const anchors = extractAnchorLinks(line);
      for (const link of anchors) {
        const anchorSlug = slugify(stripMarkdown(link.text));
        // Exact match first, then check deduplicated variants
        const targetNode = nodes.find((n) => n.id === anchorSlug)
          ?? nodes.find((n) => n.id.startsWith(`${anchorSlug}-`));
        if (targetNode) {
          edges.push({
            source: currentHeadingId,
            target: targetNode.id,
            label: link.text,
          });
        }
      }

      // File links → edges to other files
      const fileLinks = extractFileLinks(line);
      for (const link of fileLinks) {
        const targetId = slugify(link.file.replace(/\.md$/, "").replace(/\.?\//g, ""));
        edges.push({
          source: currentHeadingId,
          target: targetId,
          label: link.text,
        });
      }
    }
  }

  return { nodes, edges };
}

/** Get node size based on heading level */
export function getNodeSize(level: number): number {
  return NODE_SIZES[level] ?? 2;
}

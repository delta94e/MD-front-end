import type { TreeNode } from "@/lib/fs";
import type { TopicCategory } from "@/lib/topic-index";

export interface GraphNode {
  id: string;
  name: string;
  path: string;
  category: string;
  color: string;
  size: number; // file size in bytes (0 if unknown)
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  javascript: "#f7df1e",
  react: "#61dafb",
  nextjs: "#ffffff",
  typescript: "#3178c6",
  browser: "#ff6b35",
  "css-html": "#264de4",
  css: "#264de4",
  accessibility: "#005a9c",
  performance: "#ff4444",
  webpack: "#8dd6f9",
  networking: "#4caf50",
  security: "#ff9800",
  "design-patterns": "#9c27b0",
  "web-apis": "#e91e63",
  "system-design": "#00bcd4",
  ai: "#7c3aed",
  interview: "#f59e0b",
  miscellaneous: "#6b7280",
};

const DEFAULT_COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getCategoryColor(category: string): string {
  const key = category.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Direct match
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k.replace(/[^a-z0-9]/g, ""))) return v;
  }
  // Fallback to deterministic color from palette
  return DEFAULT_COLORS[hashCode(category) % DEFAULT_COLORS.length];
}

export function buildNodes(
  tree: TreeNode[],
  categories: TopicCategory[],
  fileSizes?: Map<string, number>
): GraphNode[] {
  // Build a map from file path to category name
  const fileToCategory = new Map<string, string>();
  for (const cat of categories) {
    for (const file of cat.files) {
      fileToCategory.set(file.path, cat.name);
    }
  }

  const nodes: GraphNode[] = [];

  function walk(nodes_list: TreeNode[]) {
    for (const node of nodes_list) {
      if (node.type === "file") {
        const category = fileToCategory.get(node.path) || "Uncategorized";
        nodes.push({
          id: node.path,
          name: node.name.replace(/\.md$/, ""),
          path: node.path,
          category,
          color: getCategoryColor(category),
          size: fileSizes?.get(node.path) ?? node.size ?? 0,
        });
      }
      if (node.children) walk(node.children);
    }
  }

  walk(tree);
  return nodes;
}

/** Connect files sharing the same category */
export function buildCategoryEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const byCategory = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    const list = byCategory.get(node.category) || [];
    list.push(node);
    byCategory.set(node.category, list);
  }

  for (const [, group] of byCategory) {
    // Connect each file to the next one in the group (chain, not fully connected)
    for (let i = 0; i < group.length - 1; i++) {
      edges.push({
        source: group[i].id,
        target: group[i + 1].id,
        weight: 1.0,
      });
    }
    // Also connect first and last to form a ring for visual clustering
    if (group.length > 2) {
      edges.push({
        source: group[0].id,
        target: group[group.length - 1].id,
        weight: 0.8,
      });
    }
  }

  return edges;
}

/** Connect files in the same directory */
export function buildDirectoryEdges(
  tree: TreeNode[],
  nodes: GraphNode[]
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const nodeSet = new Set(nodes.map((n) => n.id));

  function walk(treeNodes: TreeNode[]) {
    const filesInDir = treeNodes
      .filter((n) => n.type === "file" && nodeSet.has(n.id))
      .map((n) => n.id);

    // Connect files in same directory (chain)
    for (let i = 0; i < filesInDir.length - 1; i++) {
      edges.push({
        source: filesInDir[i],
        target: filesInDir[i + 1],
        weight: 0.8,
      });
    }

    // Recurse into subdirectories
    for (const dir of treeNodes.filter((n) => n.type === "dir" && n.children)) {
      walk(dir.children!);
    }
  }

  walk(tree);
  return edges;
}

/** Stop words that appear in nearly every filename */
const TOKEN_STOP_WORDS = new Set([
  "deep", "dive", "guide", "study", "the", "and", "for", "with",
]);

/** Tokenize filename for similarity comparison */
function tokenizeFilename(name: string): Set<string> {
  return new Set(
    name
      .replace(/\.md$/, "")
      .split(/[-_\s]+/)
      .filter((t) => t.length > 2 && !TOKEN_STOP_WORDS.has(t.toLowerCase()))
      .map((t) => t.toLowerCase())
  );
}

/** Jaccard similarity between two sets */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

/** Connect files with similar filenames (Jaccard > threshold) */
export function buildFilenameEdges(
  nodes: GraphNode[],
  threshold = 0.6
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const tokens = nodes.map((n) => tokenizeFilename(n.name));

  for (let i = 0; i < nodes.length; i++) {
    if (tokens[i].size === 0) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      // Only compare files in different categories (cross-category edges)
      if (nodes[i].category === nodes[j].category) continue;
      if (tokens[j].size === 0) continue;
      const sim = jaccard(tokens[i], tokens[j]);
      if (sim >= threshold) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: 0.5,
        });
      }
    }
  }

  return edges;
}

/** Deduplicate edges, keeping the highest weight */
export function mergeEdges(...edgeSets: GraphEdge[][]): GraphEdge[] {
  const merged = new Map<string, GraphEdge>();

  for (const edges of edgeSets) {
    for (const edge of edges) {
      const key =
        edge.source < edge.target
          ? `${edge.source}::${edge.target}`
          : `${edge.target}::${edge.source}`;

      const existing = merged.get(key);
      if (!existing || edge.weight > existing.weight) {
        merged.set(key, { ...edge });
      }
    }
  }

  return Array.from(merged.values());
}

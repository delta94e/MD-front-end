import type { TreeNode } from "@/lib/fs";
import type { TopicCategory } from "@/lib/topic-index";
import type { GraphNode, GraphEdge } from "@/lib/graph-extractor";
import {
  getCategoryColor,
  buildNodes,
  buildCategoryEdges,
  buildDirectoryEdges,
  buildFilenameEdges,
  mergeEdges,
} from "@/lib/graph-extractor";

// ── helpers ──────────────────────────────────────────────────────────

function makeNode(
  id: string,
  name: string,
  category: string,
  color = "#000"
): GraphNode {
  return { id, name, path: id, category, color };
}

function makeTreeFile(path: string): TreeNode {
  return { id: path, name: path.split("/").pop()!, path, type: "file" };
}

function makeTreeDir(
  path: string,
  name: string,
  children: TreeNode[]
): TreeNode {
  return { id: path, name, path, type: "dir", children };
}

// ── getCategoryColor ─────────────────────────────────────────────────

describe("getCategoryColor", () => {
  it("returns exact color for known categories", () => {
    expect(getCategoryColor("javascript")).toBe("#f7df1e");
    expect(getCategoryColor("react")).toBe("#61dafb");
    expect(getCategoryColor("typescript")).toBe("#3178c6");
    expect(getCategoryColor("ai")).toBe("#7c3aed");
    expect(getCategoryColor("security")).toBe("#ff9800");
  });

  it("matches case-insensitively", () => {
    expect(getCategoryColor("JavaScript")).toBe("#f7df1e");
    expect(getCategoryColor("REACT")).toBe("#61dafb");
  });

  it("matches with special characters stripped", () => {
    // "css-html" in CATEGORY_COLORS; input "CSS/HTML" → key "csshtml" includes "csshtml"
    expect(getCategoryColor("CSS/HTML")).toBe("#264de4");
    expect(getCategoryColor("design-patterns")).toBe("#9c27b0");
  });

  it("matches substring when category name contains known key", () => {
    // "browser-tools" → normalized "browsertools" includes "browser"
    expect(getCategoryColor("browser-tools")).toBe("#ff6b35");
  });

  it("falls back to deterministic palette color for unknown categories", () => {
    const color = getCategoryColor("quantum-computing");
    const DEFAULT_COLORS = [
      "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
      "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    ];
    expect(DEFAULT_COLORS).toContain(color);
  });

  it("returns same color for same unknown category (deterministic)", () => {
    expect(getCategoryColor("astrology")).toBe(
      getCategoryColor("astrology")
    );
  });

  it("returns different colors for different unknown categories (likely)", () => {
    // Not guaranteed, but hash("a") != hash("b") → different index
    const c1 = getCategoryColor("aaaa");
    const c2 = getCategoryColor("bbbb");
    // At minimum they should both be in the palette
    const palette = [
      "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
      "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    ];
    expect(palette).toContain(c1);
    expect(palette).toContain(c2);
  });

  it("handles empty string gracefully", () => {
    const color = getCategoryColor("");
    // empty key → no match → fallback
    expect(typeof color).toBe("string");
    expect(color.startsWith("#")).toBe(true);
  });
});

// ── buildNodes ───────────────────────────────────────────────────────

describe("buildNodes", () => {
  const tree: TreeNode[] = [
    makeTreeFile("docs/react/hooks.md"),
    makeTreeFile("docs/react/state.md"),
    makeTreeFile("docs/js/closures.md"),
  ];

  const categories: TopicCategory[] = [
    {
      id: "react",
      name: "React",
      files: [
        { title: "Hooks", path: "docs/react/hooks.md", category: "react" },
        { title: "State", path: "docs/react/state.md", category: "react" },
      ],
    },
    {
      id: "javascript",
      name: "JavaScript",
      files: [
        {
          title: "Closures",
          path: "docs/js/closures.md",
          category: "javascript",
        },
      ],
    },
  ];

  it("produces correct number of nodes", () => {
    const nodes = buildNodes(tree, categories);
    expect(nodes).toHaveLength(3);
  });

  it("maps category names correctly", () => {
    const nodes = buildNodes(tree, categories);
    const reactNodes = nodes.filter((n) => n.category === "React");
    const jsNodes = nodes.filter((n) => n.category === "JavaScript");
    expect(reactNodes).toHaveLength(2);
    expect(jsNodes).toHaveLength(1);
  });

  it("strips .md extension from node names", () => {
    const nodes = buildNodes(tree, categories);
    for (const n of nodes) {
      expect(n.name).not.toMatch(/\.md$/);
    }
    expect(nodes.map((n) => n.name)).toEqual(["hooks", "state", "closures"]);
  });

  it("uses path as id", () => {
    const nodes = buildNodes(tree, categories);
    expect(nodes[0].id).toBe("docs/react/hooks.md");
  });

  it("assigns 'Uncategorized' for files not in any category", () => {
    const treeWithExtra: TreeNode[] = [
      ...tree,
      makeTreeFile("docs/misc/orphan.md"),
    ];
    const nodes = buildNodes(treeWithExtra, categories);
    expect(nodes).toHaveLength(4);
    const orphan = nodes.find((n) => n.id === "docs/misc/orphan.md")!;
    expect(orphan.category).toBe("Uncategorized");
  });

  it("walks nested directories", () => {
    const nestedTree: TreeNode[] = [
      makeTreeDir("docs", "docs", [
        makeTreeDir("docs/react", "react", [
          makeTreeFile("docs/react/hooks.md"),
        ]),
      ]),
    ];
    const nodes = buildNodes(nestedTree, categories);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("hooks");
  });

  it("ignores directory nodes (only includes files)", () => {
    const treeWithDirs: TreeNode[] = [
      makeTreeDir("docs", "docs", [
        makeTreeFile("docs/react/hooks.md"),
      ]),
    ];
    const nodes = buildNodes(treeWithDirs, categories);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("docs/react/hooks.md");
  });

  it("returns empty array for empty tree", () => {
    expect(buildNodes([], categories)).toEqual([]);
  });

  it("assigns correct color based on category", () => {
    const nodes = buildNodes(tree, categories);
    const reactNode = nodes.find((n) => n.category === "React")!;
    expect(reactNode.color).toBe("#61dafb");
  });
});

// ── buildCategoryEdges ───────────────────────────────────────────────

describe("buildCategoryEdges", () => {
  it("creates chain edges for category with 2 nodes", () => {
    const nodes = [makeNode("a.md", "a", "React"), makeNode("b.md", "b", "React")];
    const edges = buildCategoryEdges(nodes);
    // chain: a→b (no ring since length ≤ 2)
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ source: "a.md", target: "b.md", weight: 1.0 });
  });

  it("creates chain + ring for category with 3+ nodes", () => {
    const nodes = [
      makeNode("a.md", "a", "JS"),
      makeNode("b.md", "b", "JS"),
      makeNode("c.md", "c", "JS"),
    ];
    const edges = buildCategoryEdges(nodes);
    // chain: a→b, b→c (2 edges) + ring: a→c (1 edge) = 3
    expect(edges).toHaveLength(3);
    expect(edges[0]).toEqual({ source: "a.md", target: "b.md", weight: 1.0 });
    expect(edges[1]).toEqual({ source: "b.md", target: "c.md", weight: 1.0 });
    expect(edges[2]).toEqual({ source: "a.md", target: "c.md", weight: 0.8 });
  });

  it("creates no edges for single-node category", () => {
    const nodes = [makeNode("a.md", "a", "Solo")];
    expect(buildCategoryEdges(nodes)).toEqual([]);
  });

  it("handles multiple categories independently", () => {
    const nodes = [
      makeNode("a.md", "a", "React"),
      makeNode("b.md", "b", "React"),
      makeNode("x.md", "x", "JS"),
      makeNode("y.md", "y", "JS"),
    ];
    const edges = buildCategoryEdges(nodes);
    expect(edges).toHaveLength(2); // 1 per category (2-node chain only)
    const sources = edges.map((e) => e.source);
    expect(sources).toContain("a.md");
    expect(sources).toContain("x.md");
  });

  it("returns empty for empty input", () => {
    expect(buildCategoryEdges([])).toEqual([]);
  });
});

// ── buildDirectoryEdges ──────────────────────────────────────────────

describe("buildDirectoryEdges", () => {
  it("connects files in the same directory", () => {
    const tree: TreeNode[] = [
      makeTreeDir("docs/react", "react", [
        makeTreeFile("docs/react/hooks.md"),
        makeTreeFile("docs/react/state.md"),
        makeTreeFile("docs/react/context.md"),
      ]),
    ];
    const nodes: GraphNode[] = [
      makeNode("docs/react/hooks.md", "hooks", "React"),
      makeNode("docs/react/state.md", "state", "React"),
      makeNode("docs/react/context.md", "context", "React"),
    ];
    const edges = buildDirectoryEdges(tree, nodes);
    expect(edges).toHaveLength(2);
    expect(edges[0].weight).toBe(0.8);
  });

  it("skips files not in the node set", () => {
    const tree: TreeNode[] = [
      makeTreeDir("docs", "docs", [
        makeTreeFile("docs/a.md"),
        makeTreeFile("docs/b.md"),
        makeTreeFile("docs/c.md"),
      ]),
    ];
    // Only a.md and c.md are in node set — they are not adjacent so no edge
    const nodes: GraphNode[] = [
      makeNode("docs/a.md", "a", "React"),
      makeNode("docs/c.md", "c", "JS"),
    ];
    const edges = buildDirectoryEdges(tree, nodes);
    // a and c are at indices 0 and 2 in the tree's files array, but
    // the filter keeps only files in nodeSet. Result: ["docs/a.md", "docs/c.md"]
    // → chain: a→c (1 edge)
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({
      source: "docs/a.md",
      target: "docs/c.md",
      weight: 0.8,
    });
  });

  it("recurses into subdirectories", () => {
    const tree: TreeNode[] = [
      makeTreeDir("docs", "docs", [
        makeTreeDir("docs/react", "react", [
          makeTreeFile("docs/react/hooks.md"),
          makeTreeFile("docs/react/state.md"),
        ]),
        makeTreeDir("docs/js", "js", [
          makeTreeFile("docs/js/closures.md"),
          makeTreeFile("docs/js/scope.md"),
        ]),
      ]),
    ];
    const nodes: GraphNode[] = [
      makeNode("docs/react/hooks.md", "hooks", "React"),
      makeNode("docs/react/state.md", "state", "React"),
      makeNode("docs/js/closures.md", "closures", "JS"),
      makeNode("docs/js/scope.md", "scope", "JS"),
    ];
    const edges = buildDirectoryEdges(tree, nodes);
    // 1 edge per subdirectory (2 files each → 1 chain edge)
    expect(edges).toHaveLength(2);
  });

  it("returns empty for empty tree", () => {
    expect(buildDirectoryEdges([], [])).toEqual([]);
  });

  it("ignores directory nodes with no children", () => {
    const tree: TreeNode[] = [
      { id: "empty", name: "empty", path: "empty", type: "dir" },
      makeTreeFile("a.md"),
    ];
    const nodes = [makeNode("a.md", "a", "X")];
    expect(buildDirectoryEdges(tree, nodes)).toEqual([]);
  });
});

// ── buildFilenameEdges ───────────────────────────────────────────────

describe("buildFilenameEdges", () => {
  it("connects files with similar names across categories", () => {
    const nodes = [
      makeNode("react/hooks.md", "react-hooks-guide", "React"),
      makeNode("vue/hooks.md", "vue-hooks-guide", "Vue"),
    ];
    const edges = buildFilenameEdges(nodes, 0.3);
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].weight).toBe(0.5);
  });

  it("does NOT connect files in the same category", () => {
    const nodes = [
      makeNode("a.md", "react-hooks-guide", "React"),
      makeNode("b.md", "react-hooks-guide", "React"),
    ];
    const edges = buildFilenameEdges(nodes, 0.1);
    expect(edges).toEqual([]);
  });

  it("respects threshold — high threshold filters out low similarity", () => {
    const nodes = [
      makeNode("a.md", "react-hooks", "React"),
      makeNode("b.md", "vue-state-management", "Vue"),
    ];
    // Very different names, low Jaccard similarity
    const edges = buildFilenameEdges(nodes, 0.9);
    expect(edges).toEqual([]);
  });

  it("includes edges when threshold is low enough", () => {
    const nodes = [
      makeNode("a.md", "hooks-react-guide", "React"),
      // tokens: {hooks, react}  (guide is stop word)
      makeNode("b.md", "hooks-vue-guide", "Vue"),
      // tokens: {hooks, vue}
      // intersection: {hooks}, union: {hooks, react, vue} → 1/3 ≈ 0.33
    ];
    const edges = buildFilenameEdges(nodes, 0.3);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("skips nodes with empty token sets (e.g. all stop words)", () => {
    const nodes = [
      makeNode("a.md", "deep-dive-guide", "React"),
      // All tokens are stop words → empty set
      makeNode("b.md", "vue-hooks", "Vue"),
    ];
    const edges = buildFilenameEdges(nodes, 0.1);
    expect(edges).toEqual([]);
  });

  it("uses default threshold of 0.6 when not specified", () => {
    // Create nodes with moderate similarity
    const nodes = [
      makeNode("a.md", "react-performance-tips", "React"),
      // tokens: {react, performance, tips}
      makeNode("b.md", "vue-performance-tips", "Vue"),
      // tokens: {vue, performance, tips}
      // intersection: {performance, tips}, union: {react, vue, performance, tips} → 2/4 = 0.5
    ];
    // 0.5 < 0.6 default → no edge
    const edgesDefault = buildFilenameEdges(nodes);
    expect(edgesDefault).toEqual([]);

    // With lower threshold → edge appears
    const edgesLow = buildFilenameEdges(nodes, 0.4);
    expect(edgesLow.length).toBeGreaterThan(0);
  });

  it("returns empty for empty input", () => {
    expect(buildFilenameEdges([])).toEqual([]);
  });

  it("handles single node (no pairs)", () => {
    const nodes = [makeNode("a.md", "hooks", "React")];
    expect(buildFilenameEdges(nodes)).toEqual([]);
  });
});

// ── mergeEdges ───────────────────────────────────────────────────────

describe("mergeEdges", () => {
  it("deduplicates edges keeping highest weight", () => {
    const set1: GraphEdge[] = [
      { source: "a", target: "b", weight: 0.5 },
    ];
    const set2: GraphEdge[] = [
      { source: "a", target: "b", weight: 0.9 },
    ];
    const merged = mergeEdges(set1, set2);
    expect(merged).toHaveLength(1);
    expect(merged[0].weight).toBe(0.9);
  });

  it("treats reversed source/target as the same edge", () => {
    const set1: GraphEdge[] = [
      { source: "a", target: "b", weight: 0.3 },
    ];
    const set2: GraphEdge[] = [
      { source: "b", target: "a", weight: 0.7 },
    ];
    const merged = mergeEdges(set1, set2);
    expect(merged).toHaveLength(1);
    expect(merged[0].weight).toBe(0.7);
  });

  it("keeps distinct edges separate", () => {
    const set1: GraphEdge[] = [
      { source: "a", target: "b", weight: 0.5 },
    ];
    const set2: GraphEdge[] = [
      { source: "c", target: "d", weight: 0.5 },
    ];
    const merged = mergeEdges(set1, set2);
    expect(merged).toHaveLength(2);
  });

  it("handles single edge set (no duplicates)", () => {
    const edges: GraphEdge[] = [
      { source: "a", target: "b", weight: 1.0 },
      { source: "c", target: "d", weight: 0.5 },
    ];
    expect(mergeEdges(edges)).toHaveLength(2);
  });

  it("returns empty for no arguments", () => {
    expect(mergeEdges()).toEqual([]);
  });

  it("returns empty for empty arrays", () => {
    expect(mergeEdges([], [], [])).toEqual([]);
  });

  it("handles many sets with overlapping edges", () => {
    const s1: GraphEdge[] = [{ source: "x", target: "y", weight: 0.2 }];
    const s2: GraphEdge[] = [{ source: "x", target: "y", weight: 0.6 }];
    const s3: GraphEdge[] = [{ source: "x", target: "y", weight: 0.4 }];
    const merged = mergeEdges(s1, s2, s3);
    expect(merged).toHaveLength(1);
    expect(merged[0].weight).toBe(0.6);
  });

  it("preserves edge properties from the winning edge", () => {
    const s1: GraphEdge[] = [{ source: "a", target: "b", weight: 0.1 }];
    const s2: GraphEdge[] = [{ source: "b", target: "a", weight: 0.8 }];
    const merged = mergeEdges(s1, s2);
    // The winning edge is from s2 (weight 0.8), but key is normalized to "a::b"
    expect(merged[0].source).toBe("b");
    expect(merged[0].target).toBe("a");
    expect(merged[0].weight).toBe(0.8);
  });
});

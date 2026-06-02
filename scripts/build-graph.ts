import { readFile, writeFile, mkdir, stat } from "fs/promises";
import { join } from "path";
import { buildFileTree, type TreeNode } from "../lib/fs";
import { parseReadmeIndex } from "../lib/topic-index";
import {
  buildNodes,
  buildCategoryEdges,
  buildDirectoryEdges,
  buildFilenameEdges,
  mergeEdges,
  type GraphData,
} from "../lib/graph-extractor";

async function collectFileSizes(tree: TreeNode[], rootDir: string): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  async function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === "file") {
        try {
          const s = await stat(join(rootDir, node.path));
          sizes.set(node.path, s.size);
        } catch { /* skip */ }
      }
      if (node.children) await walk(node.children);
    }
  }
  await walk(tree);
  return sizes;
}

async function main() {
  const rootDir = process.env.CONTENT_DIR || process.cwd();

  console.log("Building knowledge graph...");
  console.log(`Root directory: ${rootDir}`);

  // Parse README categories
  const categories = await parseReadmeIndex();
  console.log(`Found ${categories.length} categories`);

  // Build file tree
  const tree = await buildFileTree(rootDir);
  console.log(`File tree built`);

  // Collect file sizes for node scaling
  const fileSizes = await collectFileSizes(tree, rootDir);
  console.log(`Collected ${fileSizes.size} file sizes`);

  // Build nodes with sizes
  const nodes = buildNodes(tree, categories, fileSizes);
  console.log(`Nodes: ${nodes.length}`);

  // Build edges from all three signals
  const categoryEdges = buildCategoryEdges(nodes);
  const dirEdges = buildDirectoryEdges(tree, nodes);
  const filenameEdges = buildFilenameEdges(nodes, 0.6);

  console.log(`Category edges: ${categoryEdges.length}`);
  console.log(`Directory edges: ${dirEdges.length}`);
  console.log(`Filename edges: ${filenameEdges.length}`);

  const edges = mergeEdges(categoryEdges, dirEdges, filenameEdges);
  console.log(`Total edges (after merge): ${edges.length}`);

  const graphData: GraphData = { nodes, edges };

  // Write output
  const outDir = join(rootDir, "public");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "graph.json");
  const json = JSON.stringify(graphData);
  await writeFile(outPath, json, "utf-8");

  const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(`\nWritten to: ${outPath}`);
  console.log(`Size: ${sizeKB} KB`);
  console.log(`Nodes: ${nodes.length}, Edges: ${edges.length}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Failed to build graph:", err);
  process.exit(1);
});

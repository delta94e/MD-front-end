import { readdir, readFile, writeFile } from "fs/promises";
import { join, relative, extname } from "path";

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
  size?: number;
}

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  ".claude",
  "plans",
  "docs",
  "public",
  "images",
  "app",
  "components",
  "hooks",
  "lib",
  ".DS_Store",
]);

function shouldSkip(name: string): boolean {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

export async function readDirRecursive(
  dirPath: string,
  rootDir: string
): Promise<TreeNode[]> {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`[readDirRecursive] Failed to read ${dirPath}:`, err);
    return [];
  }

  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (shouldSkip(entry.name)) continue;

    const fullPath = join(dirPath, entry.name);
    const relPath = relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      const children = await readDirRecursive(fullPath, rootDir);
      if (children.length > 0) {
        nodes.push({
          id: relPath,
          name: entry.name,
          path: relPath,
          type: "dir",
          children,
        });
      }
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      nodes.push({
        id: relPath,
        name: entry.name,
        path: relPath,
        type: "file",
      });
    }
  }

  // Sort: dirs first (alphabetical), then files (alphabetical)
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export async function getFileContent(filePath: string): Promise<string> {
  const rootDir = process.env.CONTENT_DIR || process.cwd();
  const fullPath = join(rootDir, filePath);

  // Security: validate path is within root
  const resolved = relative(rootDir, fullPath);
  if (resolved.startsWith("..") || resolved.startsWith("/")) {
    throw new Error("Invalid file path");
  }

  return await readFile(fullPath, "utf-8");
}

export async function saveFileContent(
  filePath: string,
  content: string
): Promise<void> {
  const rootDir = process.env.CONTENT_DIR || process.cwd();
  const fullPath = join(rootDir, filePath);

  // Security: validate path is within root
  const resolved = relative(rootDir, fullPath);
  if (resolved.startsWith("..") || resolved.startsWith("/")) {
    throw new Error("Invalid file path");
  }

  // Only allow writing .md files
  if (extname(filePath) !== ".md") {
    throw new Error("Only .md files can be saved");
  }

  await writeFile(fullPath, content, "utf-8");
}

export async function buildFileTree(rootDir: string): Promise<TreeNode[]> {
  return readDirRecursive(rootDir, rootDir);
}

export function countFiles(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "file") count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}

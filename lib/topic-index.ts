import { readFile } from "fs/promises";
import { join } from "path";

export interface TopicFile {
  title: string;
  path: string;
  category: string;
}

export interface TopicCategory {
  id: string;
  name: string;
  files: TopicFile[];
}

const SECTION_SKIP = new Set(["Mục Lục", "📋 Mục Lục"]);

function toCategoryId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–-]/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTableRows(sectionText: string, categoryName: string): TopicFile[] {
  const files: TopicFile[] = [];
  const lines = sectionText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Match table rows: | # | Title | [Link](path) |
    const match = trimmed.match(
      /^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*\[(.+?)\]\((.+?)\)\s*\|/
    );
    if (match) {
      const title = match[2].trim();
      const path = match[3].trim().replace(/^\.\//, "");
      files.push({ title, path, category: categoryName });
    }
  }

  return files;
}

export async function parseReadmeIndex(): Promise<TopicCategory[]> {
  const rootDir = process.env.CONTENT_DIR || process.cwd();
  const readmePath = join(rootDir, "README.md");
  const content = await readFile(readmePath, "utf-8");

  const categories: TopicCategory[] = [];
  // Split by ## headers
  const sections = content.split(/^## /m);

  for (const section of sections) {
    const lines = section.split("\n");
    const headerLine = lines[0]?.trim();

    if (!headerLine || SECTION_SKIP.has(headerLine)) continue;
    // Skip the title header (# level) and empty sections
    if (headerLine.startsWith("#") && !headerLine.startsWith("##")) continue;

    const categoryName = headerLine.replace(/^#+\s*/, "").trim();
    if (!categoryName) continue;

    const sectionText = lines.slice(1).join("\n");
    const files = parseTableRows(sectionText, categoryName);

    if (files.length > 0) {
      categories.push({
        id: toCategoryId(categoryName),
        name: categoryName,
        files,
      });
    }
  }

  return categories;
}

let cachedIndex: TopicCategory[] | null = null;

export async function getTopicCategories(): Promise<TopicCategory[]> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await parseReadmeIndex();
  return cachedIndex;
}

export async function getFilesForCategory(
  categoryId: string
): Promise<TopicFile[]> {
  const categories = await getTopicCategories();
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.files ?? [];
}

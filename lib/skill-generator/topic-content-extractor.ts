import { readFile } from "fs/promises";
import { join, resolve } from "path";
import {
  getTopicCategories,
  getFilesForCategory,
  type TopicFile,
  type TopicCategory,
} from "@/lib/topic-index";
import type { SkillConfig, TopicSummary } from "./types";

const rootDir = process.env.CONTENT_DIR || process.cwd();

export function generateSkillName(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/[—–()]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function generateSkillDescription(
  category: TopicCategory,
  fileCount: number
): string {
  const name = category.name;
  const trigger = `Use when working with ${name.toLowerCase()} topics, concepts, or code. `;
  const scope = `Covers ${fileCount} documents in the ${name} category.`;
  return (trigger + scope).slice(0, 200);
}

function extractHeaders(content: string): string[] {
  const headers: string[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      headers.push(match[2].trim());
    }
  }
  return headers.slice(0, 20);
}

function extractKeyTerms(content: string): string[] {
  const terms = new Set<string>();
  const boldMatches = [...content.matchAll(/\*\*(.+?)\*\*/g)];
  for (const m of boldMatches) {
    const term = m[1].trim();
    if (term.length > 2 && term.length < 50) {
      terms.add(term);
    }
  }
  const codeMatches = [...content.matchAll(/`([^`]{3,40})`/g)];
  for (const m of codeMatches) {
    terms.add(m[1]);
  }
  return Array.from(terms).slice(0, 30);
}

function extractCodeBlocks(content: string): string[] {
  const blocks: string[] = [];
  const matches = [...content.matchAll(/```[\w]*\n([\s\S]*?)```/g)];
  for (const m of matches) {
    const block = m[1].trim();
    if (block.length > 10 && block.length < 500) {
      blocks.push(block.slice(0, 300));
    }
  }
  return blocks.slice(0, 5);
}

async function readFileSafe(filePath: string): Promise<string> {
  try {
    const fullPath = resolve(rootDir, filePath);
    if (!fullPath.startsWith(resolve(rootDir))) return "";
    return await readFile(fullPath, "utf-8");
  } catch {
    return "";
  }
}

export async function extractTopicSummary(
  file: TopicFile
): Promise<TopicSummary> {
  const content = await readFileSafe(file.path);
  return {
    filePath: file.path,
    title: file.title,
    headers: extractHeaders(content),
    keyTerms: extractKeyTerms(content),
    codeBlocks: extractCodeBlocks(content),
  };
}

export async function extractCategorySummaries(
  categoryId: string
): Promise<{ config: SkillConfig; summaries: TopicSummary[] } | null> {
  const categories = await getTopicCategories();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;

  const files = await getFilesForCategory(categoryId);
  const summaries = await Promise.all(files.map(extractTopicSummary));

  const config: SkillConfig = {
    name: generateSkillName(category.name),
    description: generateSkillDescription(category, files.length),
    topicCategory: category.name,
    topicCategoryId: category.id,
    files,
  };

  return { config, summaries };
}

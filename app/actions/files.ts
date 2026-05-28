"use server";

import { buildFileTree, getFileContent, saveFileContent, type TreeNode } from "@/lib/fs";
import { getTopicCategories as fetchTopicCategories, getFilesForCategory as fetchFilesForCategory, type TopicCategory, type TopicFile } from "@/lib/topic-index";

const rootDir = process.env.CONTENT_DIR || process.cwd();

export async function getTreeData(): Promise<TreeNode[]> {
  try {
    const result = await Promise.race([
      buildFileTree(rootDir),
      new Promise<TreeNode[]>((_, reject) =>
        setTimeout(() => reject(new Error("Tree build timed out")), 15000)
      ),
    ]);
    return result;
  } catch (err) {
    console.error("[getTreeData] Error building file tree:", err);
    return [];
  }
}

export async function readFileContent(path: string): Promise<string> {
  try {
    return await getFileContent(path);
  } catch (err) {
    console.error(`[readFileContent] Error reading ${path}:`, err);
    throw new Error(`Failed to read file: ${path}`);
  }
}

export async function writeFileContent(
  path: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await saveFileContent(path, content);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save file",
    };
  }
}

export async function getTopicIndex(): Promise<TopicCategory[]> {
  try {
    return await fetchTopicCategories();
  } catch (err) {
    console.error("[getTopicIndex] Error:", err);
    return [];
  }
}

export async function getFilesForCategoryAction(
  categoryId: string
): Promise<TopicFile[]> {
  try {
    return await fetchFilesForCategory(categoryId);
  } catch (err) {
    console.error(`[getFilesForCategory] Error for ${categoryId}:`, err);
    return [];
  }
}

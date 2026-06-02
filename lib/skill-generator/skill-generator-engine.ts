import { mkdir, writeFile, rm } from "fs/promises";
import { join, resolve } from "path";
import { getTopicCategories } from "@/lib/topic-index";
import {
  extractCategorySummaries,
  generateSkillName,
  generateSkillDescription,
} from "./topic-content-extractor";
import { generateSkillMd, generateReferencesMd } from "./skill-template";
import {
  parseGitHubUrl,
  fetchFileTree,
  fetchAllFiles,
} from "./github-fetcher";
import { generateSkillWithAi } from "./ai-skill-generator";
import type { SkillConfig, SkillContent } from "./types";

const DEFAULT_OUTPUT_DIR = join(process.cwd(), ".claude", "skills");

export async function generateSkill(
  categoryId: string,
  outputDir: string = DEFAULT_OUTPUT_DIR
): Promise<SkillContent | null> {
  const result = await extractCategorySummaries(categoryId);
  if (!result) return null;

  const { config, summaries } = result;
  const skillMd = generateSkillMd(config, summaries);
  const references = generateReferencesMd(summaries);

  await writeSkillToDisk(config, skillMd, references, outputDir);

  return { config, skillMd, references };
}

export async function generateAllSkills(
  outputDir: string = DEFAULT_OUTPUT_DIR
): Promise<SkillContent[]> {
  const categories = await getTopicCategories();
  const results = await Promise.all(
    categories.map((cat) => generateSkill(cat.id, outputDir))
  );
  return results.filter((r): r is SkillContent => r !== null);
}

async function writeSkillToDisk(
  config: SkillConfig,
  skillMd: string,
  references: string,
  outputDir: string
): Promise<void> {
  const skillDir = resolve(outputDir, config.name);
  if (!skillDir.startsWith(resolve(outputDir))) {
    throw new Error(`Invalid skill name: ${config.name}`);
  }

  await rm(skillDir, { recursive: true, force: true });
  await mkdir(skillDir, { recursive: true });

  // Write SKILL.md
  await writeFile(join(skillDir, "SKILL.md"), skillMd, "utf-8");

  // Write references
  const refsDir = join(skillDir, "references");
  await mkdir(refsDir, { recursive: true });
  await writeFile(join(refsDir, "key-concepts.md"), references, "utf-8");
}

export async function generateSkillFromGithub(
  githubUrl: string,
  outputDir: string = DEFAULT_OUTPUT_DIR,
  onProgress?: (fetched: number, total: number) => void
): Promise<SkillContent & { fileCount: number; truncated: boolean }> {
  const repo = parseGitHubUrl(githubUrl);
  const tree = await fetchFileTree(repo);

  if (tree.length === 0) {
    throw new Error("No text files found in repository");
  }

  const truncated = tree.length > 200;
  onProgress?.(0, tree.length);
  const files = await fetchAllFiles(repo, tree, onProgress);

  // Use AI to generate high-quality skill content
  const aiResult = await generateSkillWithAi(repo.owner, repo.repo, files);

  const config: SkillConfig = {
    name: generateSkillName(`${repo.owner}-${repo.repo}`),
    description: `Use when working with ${repo.owner}/${repo.repo} repository. Covers ${files.length} files from the codebase.`,
    topicCategory: `${repo.owner}/${repo.repo}`,
    topicCategoryId: `${repo.owner}-${repo.repo}`,
    files: files.map((f) => ({
      title: f.path.split("/").pop() || f.path,
      path: f.path,
      category: `${repo.owner}/${repo.repo}`,
    })),
  };

  await writeSkillToDisk(config, aiResult.skillMd, aiResult.referencesMd, outputDir);

  return {
    config,
    skillMd: aiResult.skillMd,
    references: aiResult.referencesMd,
    fileCount: files.length,
    truncated,
  };
}

export { generateSkillName, generateSkillDescription };

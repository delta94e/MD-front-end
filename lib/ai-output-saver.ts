"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const OUTPUT_DIR = join(process.cwd(), "ai-outputs");

function dateSlug(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function saveAiOutput(
  type: "summarize" | "learning-path" | "study-guide",
  topic: string,
  content: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const slug = sanitize(topic);
    const date = dateSlug();
    const filename = `${type}-${slug}-${date}.md`;
    const filePath = join(OUTPUT_DIR, filename);

    const typeLabel = type === "summarize" ? "Summary" : type === "learning-path" ? "Learning Path" : "Study Guide";
    const header = `# ${typeLabel}: ${topic}\n\nGenerated: ${new Date().toISOString()}\n\n---\n\n`;

    await writeFile(filePath, header + content, "utf-8");

    return { success: true, path: filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save";
    console.error(`[saveAiOutput] Error:`, message);
    return { success: false, error: message };
  }
}

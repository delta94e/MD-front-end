import type { GitHubFile } from "./github-fetcher";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

interface AiSkillResult {
  skillMd: string;
  referencesMd: string;
}

function buildAnalysisPrompt(owner: string, repo: string, files: GitHubFile[]): string {
  const fileTree = files.map((f) => `- ${f.path}`).join("\n");
  const contentSamples = files
    .slice(0, 30)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`)
    .join("\n\n");

  return `Analyze this GitHub repository: ${owner}/${repo}

FILE TREE (${files.length} files total):
${fileTree}

CONTENT SAMPLES:
${contentSamples}

Generate TWO markdown documents for a Claude Code skill:

## DOCUMENT 1: SKILL.md

Create a SKILL.md that teaches Claude how to work with this codebase. MUST follow this structure:

\`\`\`yaml
---
name: ${owner}-${repo}
description: "[PUSHY description with specific triggers - under 200 chars]"
metadata:
  author: topic-skill-generator
  version: "1.0.0"
  source: https://github.com/${owner}/${repo}
---
\`\`\`

Body sections (MUST include ALL):
1. **Overview** — What this project does, its purpose, tech stack
2. **Architecture** — How the codebase is structured, key directories, data flow
3. **Core Patterns** — The main patterns/conventions used (with code examples)
4. **Workflow** — Step-by-step guide for common tasks (adding features, fixing bugs, etc.)
5. **Key Files** — Important files and what they do
6. **Anti-Patterns** — What NOT to do, common mistakes to avoid
7. **Quick Reference** — Cheat sheet for the most common operations

Rules:
- Use imperative form: "To do X, run Y"
- Include ACTUAL code examples from the repo
- Be specific, not generic
- Under 300 lines total
- Sacrifice grammar for concision

## DOCUMENT 2: references/key-concepts.md

Detailed reference doc with:
1. **API/Interface Reference** — Key types, interfaces, function signatures
2. **Configuration Guide** — How to configure, environment variables, settings
3. **Common Tasks** — Detailed walkthroughs for frequent operations
4. **Troubleshooting** — Common issues and solutions

Rules:
- Under 300 lines
- Include code snippets
- Be practical and actionable

Return the response as JSON:
{
  "skillMd": "<full SKILL.md content>",
  "referencesMd": "<full references/key-concepts.md content>"
}

Return ONLY valid JSON, no markdown fences.`;
}

export async function generateSkillWithAi(
  owner: string,
  repo: string,
  files: GitHubFile[]
): Promise<AiSkillResult> {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) throw new Error("MIMO_API_KEY not configured");

  const prompt = buildAnalysisPrompt(owner, repo, files);

  const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      model: MIMO_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a senior developer creating Claude Code skills. You analyze codebases and produce actionable, specific skill documentation. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MIMO API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");

  let result: AiSkillResult;
  try {
    result = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON in AI response");
  }

  // Enforce 300-line limit
  result.skillMd = enforceLineLimit(result.skillMd, 300);
  result.referencesMd = enforceLineLimit(result.referencesMd, 300);

  return result;
}

function enforceLineLimit(content: string, maxLines: number): string {
  const lines = content.split("\n");
  if (lines.length <= maxLines) return content;
  return lines.slice(0, maxLines).join("\n") + "\n";
}

import type { SkillConfig, TopicSummary } from "./types";

function buildKeyConceptsSection(summaries: TopicSummary[]): string {
  const allTerms = new Set<string>();
  const allHeaders: string[] = [];

  for (const s of summaries) {
    for (const t of s.keyTerms.slice(0, 5)) allTerms.add(t);
    for (const h of s.headers.slice(0, 3)) allHeaders.push(h);
  }

  const terms = Array.from(allTerms).slice(0, 15);
  const headers = allHeaders.slice(0, 10);

  let section = "## Key Concepts\n\n";
  if (headers.length > 0) {
    section += "### Topics Covered\n";
    for (const h of headers) {
      section += `- ${h}\n`;
    }
    section += "\n";
  }
  if (terms.length > 0) {
    section += "### Important Terms\n";
    for (const t of terms) {
      section += `- \`${t}\`\n`;
    }
    section += "\n";
  }
  return section;
}

function buildCommonPatternsSection(summaries: TopicSummary[]): string {
  const codeBlocks = summaries
    .flatMap((s) => s.codeBlocks)
    .slice(0, 3);

  if (codeBlocks.length === 0) return "";

  let section = "## Common Patterns\n\n";
  for (const block of codeBlocks) {
    section += "```\n" + block + "\n```\n\n";
  }
  return section;
}

function buildFilesSection(config: SkillConfig): string {
  let section = "## Related Files\n\n";
  for (const file of config.files.slice(0, 10)) {
    section += `- [${file.title}](../../../${file.path})\n`;
  }
  section += "\n";
  return section;
}

export function generateSkillMd(
  config: SkillConfig,
  summaries: TopicSummary[]
): string {
  const frontmatter = [
    "---",
    `name: ${config.name}`,
    `description: "${config.description.replace(/"/g, '\\"')}"`,
    "metadata:",
    "  author: topic-skill-generator",
    '  version: "1.0.0"',
    `  category: ${config.topicCategory}`,
    "---",
  ].join("\n");

  const title = config.topicCategory;
  let body = `\n# ${title}\n\n`;
  body += `This skill provides guidance for working with ${title.toLowerCase()} topics and concepts.\n\n`;
  body += buildKeyConceptsSection(summaries);
  body += buildCommonPatternsSection(summaries);
  body += buildFilesSection(config);
  body += "## Quick Reference\n\n";
  body += `When the user asks about ${title.toLowerCase()}, refer to the related files above for detailed content.\n`;

  const full = frontmatter + body;
  const lines = full.split("\n");
  if (lines.length > 300) {
    return lines.slice(0, 300).join("\n") + "\n";
  }
  return full;
}

export function generateReferencesMd(summaries: TopicSummary[]): string {
  let content = `# Key Concepts Reference\n\n`;
  for (const s of summaries) {
    if (s.headers.length === 0) continue;
    content += `## ${s.title}\n\n`;
    content += `Source: \`${s.filePath}\`\n\n`;
    for (const h of s.headers.slice(0, 5)) {
      content += `- ${h}\n`;
    }
    content += "\n";
  }
  const lines = content.split("\n");
  if (lines.length > 300) {
    return lines.slice(0, 300).join("\n") + "\n";
  }
  return content;
}

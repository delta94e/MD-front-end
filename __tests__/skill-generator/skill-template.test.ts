import {
  generateSkillMd,
  generateReferencesMd,
} from "@/lib/skill-generator/skill-template";
import type { SkillConfig, TopicSummary } from "@/lib/skill-generator/types";

const mockConfig: SkillConfig = {
  name: "react-hooks",
  description: "Use when working with react hooks topics.",
  topicCategory: "React Hooks",
  topicCategoryId: "react-hooks",
  files: [
    { title: "useState", path: "react/useState.md", category: "React Hooks" },
    { title: "useEffect", path: "react/useEffect.md", category: "React Hooks" },
  ],
};

const mockSummaries: TopicSummary[] = [
  {
    filePath: "react/useState.md",
    title: "useState",
    headers: ["Basic Usage", "Lazy Initialization"],
    keyTerms: ["useState", "state variable", "setter function"],
    codeBlocks: ["const [count, setCount] = useState(0);"],
  },
  {
    filePath: "react/useEffect.md",
    title: "useEffect",
    headers: ["Side Effects", "Cleanup"],
    keyTerms: ["useEffect", "dependency array", "cleanup"],
    codeBlocks: [],
  },
];

describe("generateSkillMd", () => {
  it("generates valid YAML frontmatter", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("name: react-hooks");
    expect(result).toContain("description:");
    expect(result).toContain("---\n");
  });

  it("includes topic category as title", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result).toContain("# React Hooks");
  });

  it("includes key concepts from summaries", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result).toContain("## Key Concepts");
    expect(result).toContain("useState");
    expect(result).toContain("useEffect");
  });

  it("includes related files section", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result).toContain("## Related Files");
    expect(result).toContain("useState");
  });

  it("stays under 300 lines", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result.split("\n").length).toBeLessThanOrEqual(300);
  });

  it("includes code blocks when available", () => {
    const result = generateSkillMd(mockConfig, mockSummaries);
    expect(result).toContain("```");
    expect(result).toContain("useState(0)");
  });
});

describe("generateReferencesMd", () => {
  it("generates references from summaries", () => {
    const result = generateReferencesMd(mockSummaries);
    expect(result).toContain("# Key Concepts Reference");
    expect(result).toContain("## useState");
    expect(result).toContain("## useEffect");
  });

  it("includes source file paths", () => {
    const result = generateReferencesMd(mockSummaries);
    expect(result).toContain("react/useState.md");
  });

  it("stays under 300 lines", () => {
    const result = generateReferencesMd(mockSummaries);
    expect(result.split("\n").length).toBeLessThanOrEqual(300);
  });
});

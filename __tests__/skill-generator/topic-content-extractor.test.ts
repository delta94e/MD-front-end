import {
  generateSkillName,
  generateSkillDescription,
} from "@/lib/skill-generator/topic-content-extractor";
import type { TopicCategory } from "@/lib/topic-index";

describe("generateSkillName", () => {
  it("converts simple name to kebab-case", () => {
    expect(generateSkillName("React Hooks")).toBe("react-hooks");
  });

  it("handles special characters", () => {
    expect(generateSkillName("CSS & Styling")).toBe("css-styling");
  });

  it("handles parentheses", () => {
    expect(generateSkillName("API (REST)")).toBe("api-rest");
  });

  it("handles em dashes", () => {
    expect(generateSkillName("State — Redux")).toBe("state-redux");
  });

  it("removes consecutive hyphens", () => {
    expect(generateSkillName("C++ Programming")).toBe("c-programming");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSkillName("-Leading")).toBe("leading");
  });

  it("truncates to 40 chars", () => {
    const long = "A Very Long Category Name That Exceeds The Limit";
    expect(generateSkillName(long).length).toBeLessThanOrEqual(40);
  });

  it("handles Vietnamese characters", () => {
    expect(generateSkillName("Học React")).toBe("hc-react");
  });
});

describe("generateSkillDescription", () => {
  const mockCategory: TopicCategory = {
    id: "react-hooks",
    name: "React Hooks",
    files: [
      { title: "useState", path: "react/useState.md", category: "React Hooks" },
      { title: "useEffect", path: "react/useEffect.md", category: "React Hooks" },
    ],
  };

  it("includes category name", () => {
    const desc = generateSkillDescription(mockCategory, 2);
    expect(desc).toContain("React Hooks");
  });

  it("includes file count", () => {
    const desc = generateSkillDescription(mockCategory, 2);
    expect(desc).toContain("2 documents");
  });

  it("stays under 200 chars", () => {
    const desc = generateSkillDescription(mockCategory, 2);
    expect(desc.length).toBeLessThanOrEqual(200);
  });

  it("contains trigger language", () => {
    const desc = generateSkillDescription(mockCategory, 2);
    expect(desc).toMatch(/use when/i);
  });
});

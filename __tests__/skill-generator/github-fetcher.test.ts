import { parseGitHubUrl } from "@/lib/skill-generator/github-fetcher";

describe("parseGitHubUrl", () => {
  it("parses basic repo URL", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "main" });
  });

  it("parses URL with tree and branch", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/tree/develop");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "develop" });
  });

  it("parses URL with blob and branch", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/blob/v2.0/README.md");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "v2.0" });
  });

  it("strips .git suffix", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "main" });
  });

  it("rejects non-GitHub URLs", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/owner/repo")).toThrow("Not a GitHub URL");
  });

  it("rejects URLs without owner/repo", () => {
    expect(() => parseGitHubUrl("https://github.com/")).toThrow("Invalid GitHub URL");
  });

  it("handles trailing slashes", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "main" });
  });
});

import { countFiles, type TreeNode } from "@/lib/fs";

// Test countFiles since it's a pure function with no fs dependency
describe("countFiles", () => {
  it("returns 0 for empty array", () => {
    expect(countFiles([])).toBe(0);
  });

  it("counts flat files", () => {
    const nodes: TreeNode[] = [
      { id: "a.md", name: "a.md", path: "a.md", type: "file" },
      { id: "b.md", name: "b.md", path: "b.md", type: "file" },
    ];
    expect(countFiles(nodes)).toBe(2);
  });

  it("counts files nested in directories", () => {
    const nodes: TreeNode[] = [
      {
        id: "dir",
        name: "dir",
        path: "dir",
        type: "dir",
        children: [
          { id: "dir/a.md", name: "a.md", path: "dir/a.md", type: "file" },
          { id: "dir/b.md", name: "b.md", path: "dir/b.md", type: "file" },
        ],
      },
    ];
    expect(countFiles(nodes)).toBe(2);
  });

  it("counts deeply nested files", () => {
    const nodes: TreeNode[] = [
      {
        id: "a",
        name: "a",
        path: "a",
        type: "dir",
        children: [
          {
            id: "a/b",
            name: "b",
            path: "a/b",
            type: "dir",
            children: [
              { id: "a/b/c.md", name: "c.md", path: "a/b/c.md", type: "file" },
            ],
          },
        ],
      },
    ];
    expect(countFiles(nodes)).toBe(1);
  });

  it("ignores directories without children", () => {
    const nodes: TreeNode[] = [
      { id: "dir", name: "dir", path: "dir", type: "dir" },
      { id: "a.md", name: "a.md", path: "a.md", type: "file" },
    ];
    expect(countFiles(nodes)).toBe(1);
  });
});

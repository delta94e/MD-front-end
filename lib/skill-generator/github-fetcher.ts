export interface GitHubFile {
  path: string;
  content: string;
  size: number;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch: string;
}

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".pyc", ".pyo", ".class", ".o", ".obj",
]);

const MAX_FILES = 200;
const CONCURRENCY = 3;

export function parseGitHubUrl(url: string): GitHubRepo {
  const parsed = new URL(url.trim());
  if (parsed.hostname !== "github.com") {
    throw new Error("Not a GitHub URL");
  }

  const parts = parsed.pathname.replace(/^\/|\/$/g, "").split("/");
  if (parts.length < 2) {
    throw new Error("Invalid GitHub URL: missing owner/repo");
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  let branch = "main";

  // Handle /tree/branch or /blob/branch
  if (parts.length >= 4 && (parts[2] === "tree" || parts[2] === "blob")) {
    branch = parts[3];
  }

  return { owner, repo, branch };
}

function isBinaryFile(path: string): boolean {
  const ext = path.lastIndexOf(".") >= 0
    ? path.slice(path.lastIndexOf(".")).toLowerCase()
    : "";
  return BINARY_EXTENSIONS.has(ext);
}

export async function fetchFileTree(repo: GitHubRepo): Promise<string[]> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${repo.branch}?recursive=1`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository or branch not found");
    if (res.status === 403) throw new Error("GitHub API rate limit exceeded");
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  const tree = data.tree as Array<{ path: string; type: string }>;

  return tree
    .filter((item) => item.type === "blob" && !isBinaryFile(item.path))
    .map((item) => item.path);
}

export async function fetchFileContent(
  repo: GitHubRepo,
  filePath: string
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${filePath}`;

  const res = await fetch(url);
  if (!res.ok) return "";

  return res.text();
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

export async function fetchAllFiles(
  repo: GitHubRepo,
  paths: string[],
  onProgress?: (fetched: number, total: number) => void
): Promise<GitHubFile[]> {
  const limited = paths.slice(0, MAX_FILES);
  let fetched = 0;

  const tasks = limited.map((path) => async () => {
    const content = await fetchFileContent(repo, path);
    fetched++;
    onProgress?.(fetched, limited.length);
    return { path, content, size: content.length };
  });

  return runWithConcurrency(tasks, CONCURRENCY);
}

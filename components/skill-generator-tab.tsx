"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, FolderOpen, CheckCircle2, GitBranch } from "lucide-react";
import { usePKMStore } from "@/lib/store";

interface CategoryInfo {
  id: string;
  name: string;
  fileCount: number;
}

export function SkillGeneratorTab() {
  const { activeCategory } = usePKMStore();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/generate-skills")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setError("Failed to load categories"));
  }, []);

  const handleGenerate = async (categoryId?: string) => {
    const isAll = !categoryId;
    if (isAll) setLoadingAll(true);
    else setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryId ? { categoryId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }
      const count = data.count ?? 1;
      const path = data.outputPath;
      setResult(`Generated ${count} skill(s) → ${path}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setLoadingAll(false);
    }
  };

  const handleGithubGenerate = async () => {
    if (!githubUrl.trim()) return;
    setLoadingGithub(true);
    setError(null);
    setResult(null);
    setProgress("Fetching repository files...");

    try {
      const res = await fetch("/api/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: githubUrl.trim() }),
      });
      setProgress("AI analyzing codebase & generating skill...");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }
      const warn = data.truncated ? " (truncated to 200 files)" : "";
      setResult(`Generated skill from ${data.fileCount} files → ${data.outputPath}${warn}`);
    } catch {
      setError("Network error");
    } finally {
      setLoadingGithub(false);
      setProgress(null);
    }
  };

  const currentCat = categories.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Generate Claude Code skills from topic categories or GitHub repos.
      </p>

      <div className="p-2 bg-muted/50 rounded border border-border space-y-2">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">From GitHub</span>
        </div>
        <input
          type="url"
          placeholder="https://github.com/owner/repo"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={loadingGithub}
        />
        <Button
          size="sm"
          onClick={handleGithubGenerate}
          disabled={loadingGithub || !githubUrl.trim()}
          className="w-full"
        >
          {loadingGithub ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <GitBranch className="h-3.5 w-3.5 mr-2" />
          )}
          {loadingGithub ? "Fetching..." : "Generate from GitHub"}
        </Button>
        {progress && (
          <p className="text-[10px] text-muted-foreground">{progress}</p>
        )}
      </div>

      {currentCat && (
        <div className="p-2 bg-muted/50 rounded border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">{currentCat.name}</span>
            <Badge variant="secondary" className="text-[10px]">
              {currentCat.fileCount} files
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={() => handleGenerate(currentCat.id)}
            disabled={loading || loadingAll}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 mr-2" />
            )}
            {loading ? "Generating..." : "Generate Skill for This Topic"}
          </Button>
        </div>
      )}

      {!currentCat && (
        <p className="text-xs text-muted-foreground italic">
          Select a topic category from the sidebar first.
        </p>
      )}

      <div className="border-t border-border pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleGenerate()}
          disabled={loading || loadingAll}
          className="w-full"
        >
          {loadingAll ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 mr-2" />
          )}
          {loadingAll
            ? "Generating All..."
            : `Generate All Skills (${categories.length})`}
        </Button>
      </div>

      {result && (
        <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded border border-green-500/20 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 rounded border border-red-500/20 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}

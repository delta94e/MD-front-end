"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Rss,
  TrendingUp,
  Clock,
  MessageSquare,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import type { CrawledArticle, DailyDevRanking } from "@/lib/daily-dev/types";

const RANKINGS: { value: DailyDevRanking; label: string; icon: typeof TrendingUp }[] = [
  { value: "POPULARITY", label: "Popular", icon: TrendingUp },
  { value: "TIME", label: "Recent", icon: Clock },
  { value: "DISCUSSION", label: "Discussed", icon: MessageSquare },
];

export function DailyDevTab() {
  const [ranking, setRanking] = useState<DailyDevRanking>("POPULARITY");
  const [count, setCount] = useState(10);
  const [articles, setArticles] = useState<CrawledArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, title: "" });
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = useCallback(async () => {
    setLoading(true);
    setError(null);
    setArticles([]);
    setProgress({ current: 0, total: count, title: "Fetching feed..." });

    try {
      const res = await fetch("/api/daily-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranking, first: count }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setArticles(data.articles);
      if (data.errors > 0) {
        setError(`${data.errors}/${data.total} articles failed to crawl`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crawl failed");
    } finally {
      setLoading(false);
    }
  }, [ranking, count]);

  const handleSaveArticle = useCallback((article: CrawledArticle) => {
    const blob = new Blob([article.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = article.title.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "article";
    a.download = `${safeName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Crawl articles from daily.dev and convert to markdown.
      </p>

      {/* Ranking selector */}
      <div className="flex gap-1">
        {RANKINGS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={ranking === value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setRanking(value)}
          >
            <Icon className="h-3 w-3 mr-0.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Count slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Articles</label>
          <span className="text-xs font-mono">{count}</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Crawl button */}
      <Button
        size="sm"
        onClick={handleCrawl}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Rss className="h-3.5 w-3.5 mr-2" />
        )}
        {loading
          ? `Crawling... ${progress.current}/${progress.total}`
          : "Crawl Feed"}
      </Button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              {articles.filter((a) => !a.error).length} articles crawled
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {articles.map((article, i) => (
              <div
                key={i}
                className="p-2 rounded-md border border-border bg-muted/30 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium line-clamp-2 flex-1">
                    {article.title}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {!article.error && article.content && (
                      <button
                        onClick={() => handleSaveArticle(article)}
                        className="p-1 rounded hover:bg-accent"
                        title="Download as .md"
                      >
                        <Download className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-accent"
                        title="Open original"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
                {article.error ? (
                  <p className="text-[10px] text-destructive">{article.error}</p>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 items-center">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[9px] px-1 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {article.author && (
                        <span className="text-[9px] text-muted-foreground">
                          by {article.author}
                        </span>
                      )}
                      {article.content && article.content === article.summary && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          summary only
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

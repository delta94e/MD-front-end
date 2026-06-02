"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { usePKMStore } from "@/lib/store";
import { getReviewStats, getAllFlashcards } from "@/lib/flashcard-db";
import type { ReviewStats } from "@/lib/flashcard-types";

export function StatsView() {
  const { setFlashcardSubView } = usePKMStore();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [fileGroups, setFileGroups] = useState<{ path: string; count: number }[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const [s, allCards] = await Promise.all([getReviewStats(), getAllFlashcards()]);
      setStats(s);

      const groups = new Map<string, number>();
      for (const card of allCards) {
        groups.set(card.filePath, (groups.get(card.filePath) || 0) + 1);
      }
      setFileGroups(
        Array.from(groups.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
      );
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!stats) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Total Cards" value={stats.totalCards} />
        <StatBox label="Due Today" value={stats.dueToday} highlight={stats.dueToday > 0} />
        <StatBox label="Reviewed Today" value={stats.reviewedToday} />
        <StatBox label="Streak" value={`${stats.streak} day${stats.streak !== 1 ? "s" : ""}`} />
      </div>

      <div className="text-xs text-muted-foreground">
        Avg ease factor: {stats.averageEase.toFixed(2)}
      </div>

      {stats.dueToday > 0 && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => setFlashcardSubView("review")}
        >
          <Play className="h-3.5 w-3.5 mr-2" />
          Review {stats.dueToday} Due Card{stats.dueToday !== 1 ? "s" : ""}
        </Button>
      )}

      {fileGroups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Cards by file</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {fileGroups.map(({ path, count }) => (
              <div
                key={path}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50"
              >
                <span className="truncate flex-1">{path.split("/").pop()}</span>
                <span className="text-muted-foreground ml-2">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

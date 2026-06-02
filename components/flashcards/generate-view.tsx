"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Play } from "lucide-react";
import { usePKMStore } from "@/lib/store";
import { addFlashcards, getFlashcardsByFile } from "@/lib/flashcard-db";
import type { Flashcard } from "@/lib/flashcard-types";

export function GenerateView() {
  const { editorContent, activeFile, setFlashcardSubView, setDueCardCount } = usePKMStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Flashcard[]>([]);
  const [existingCount, setExistingCount] = useState(0);

  useEffect(() => {
    if (!activeFile) return;
    getFlashcardsByFile(activeFile).then((cards) => setExistingCount(cards.length));
  }, [activeFile, generated]);

  const handleGenerate = useCallback(async () => {
    if (!editorContent) return;
    setLoading(true);
    setError(null);
    setGenerated([]);

    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editorContent, filePath: activeFile }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      const cards: Flashcard[] = (data.cards || []).map(
        (c: { front: string; back: string; tags: string[] }) => ({
          id: crypto.randomUUID(),
          filePath: activeFile || "unknown",
          front: c.front,
          back: c.back,
          tags: c.tags || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      if (cards.length > 0) {
        await addFlashcards(cards);
        // Refresh due count
        const { getDueCards } = await import("@/lib/flashcard-db");
        const due = await getDueCards(100);
        setDueCardCount(due.length);
      }
      setGenerated(cards);
    } catch {
      setError("Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  }, [editorContent, activeFile, setDueCardCount]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Generate flashcards from the current note to study key concepts.
      </p>

      {existingCount > 0 && (
        <p className="text-xs text-muted-foreground">
          This note already has {existingCount} card{existingCount !== 1 ? "s" : ""}.
        </p>
      )}

      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading || !editorContent}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 mr-2" />
        )}
        {loading ? "Generating..." : "Generate Flashcards"}
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {generated.length > 0 && (
        <div className="space-y-2 fade-in">
          <p className="text-sm font-medium">
            {generated.length} card{generated.length !== 1 ? "s" : ""} created!
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {generated.map((card) => (
              <div key={card.id} className="border rounded-lg p-2">
                <p className="text-sm font-medium">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {card.back}
                </p>
                {card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setFlashcardSubView("review")}
          >
            <Play className="h-3.5 w-3.5 mr-2" />
            Start Review
          </Button>
        </div>
      )}
    </div>
  );
}

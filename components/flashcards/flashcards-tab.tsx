"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePKMStore } from "@/lib/store";
import { getDueCards } from "@/lib/flashcard-db";
import { GenerateView } from "./generate-view";
import { ReviewSession } from "./review-session";
import { StatsView } from "./stats-view";

export function FlashcardsTab() {
  const { flashcardSubView, setFlashcardSubView, dueCardCount, setDueCardCount } = usePKMStore();

  useEffect(() => {
    getDueCards(100)
      .then((due) => setDueCardCount(due.length))
      .catch(() => {});
  }, [setDueCardCount]);

  // Default to review if there are due cards
  useEffect(() => {
    if (dueCardCount > 0 && flashcardSubView === "generate") {
      setFlashcardSubView("review");
    }
  }, [dueCardCount, flashcardSubView, setFlashcardSubView]);

  if (flashcardSubView === "review") {
    return <ReviewSession onExit={() => setFlashcardSubView("generate")} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <Button
          variant={flashcardSubView === "generate" ? "default" : "outline"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setFlashcardSubView("generate")}
        >
          Generate
        </Button>
        <Button
          variant={flashcardSubView === "stats" ? "default" : "outline"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setFlashcardSubView("stats")}
        >
          Stats
        </Button>
      </div>

      {flashcardSubView === "generate" && <GenerateView />}
      {flashcardSubView === "stats" && <StatsView />}
    </div>
  );
}

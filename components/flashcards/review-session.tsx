"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { Flashcard, FlashcardSchedule } from "@/lib/flashcard-types";
import { getDueCards, getSchedule, updateSchedule } from "@/lib/flashcard-db";
import { FlashcardCard } from "./flashcard-card";
import { RatingButtons } from "./rating-buttons";
import { ReviewComplete } from "./review-complete";

type SessionState = "loading" | "no-cards" | "showing-card" | "showing-answer" | "complete";

export function ReviewSession({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<SessionState>("loading");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [schedule, setSchedule] = useState<FlashcardSchedule | null>(null);
  const [results, setResults] = useState<{ quality: number }[]>([]);

  const loadDueCards = useCallback(async () => {
    setState("loading");
    const dueCards = await getDueCards(50);
    if (dueCards.length === 0) {
      setState("no-cards");
      return;
    }
    setCards(dueCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    const sched = await getSchedule(dueCards[0].id);
    setSchedule(sched);
    setState("showing-card");
  }, []);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const handleFlip = useCallback(() => {
    if (state === "showing-card") {
      setIsFlipped(true);
      setState("showing-answer");
    }
  }, [state]);

  const handleRate = useCallback(
    async (quality: number) => {
      const card = cards[currentIndex];
      await updateSchedule(card.id, quality);
      const newResults = [...results, { quality }];
      setResults(newResults);

      if (currentIndex + 1 >= cards.length) {
        setState("complete");
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        const nextSched = await getSchedule(cards[nextIndex].id);
        setSchedule(nextSched);
        setState("showing-card");
      }
    },
    [cards, currentIndex, results]
  );

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading due cards...</p>
      </div>
    );
  }

  if (state === "no-cards") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-xl font-medium">No cards due for review</p>
        <p className="text-muted-foreground">Come back later or generate new flashcards.</p>
        <Button onClick={onExit}>Back to Notes</Button>
      </div>
    );
  }

  if (state === "complete") {
    const breakdown: Record<number, number> = {};
    let totalQ = 0;
    for (const r of results) {
      breakdown[r.quality] = (breakdown[r.quality] || 0) + 1;
      totalQ += r.quality;
    }
    return (
      <ReviewComplete
        reviewed={results.length}
        averageQuality={results.length > 0 ? totalQ / results.length : 0}
        breakdown={breakdown}
        onReviewAgain={loadDueCards}
        onExit={onExit}
      />
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + (isFlipped ? 1 : 0)) / cards.length) * 100;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <FlashcardCard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />

      {state === "showing-answer" && schedule && (
        <RatingButtons schedule={schedule} onRate={handleRate} />
      )}

      {state === "showing-card" && (
        <p className="text-center text-sm text-muted-foreground">
          Click the card or press Space to reveal the answer
        </p>
      )}
    </div>
  );
}

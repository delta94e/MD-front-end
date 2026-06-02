"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { Flashcard } from "@/lib/flashcard-types";
import "./flashcard-styles.css";

interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardCard({ card, isFlipped, onFlip }: FlashcardCardProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        onFlip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFlip]);

  return (
    <div className="flashcard-container w-full">
      <div
        className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Answer shown. Click to see question." : "Question shown. Click to reveal answer."}
      >
        <div className="flashcard-front">
          <p className="text-sm text-muted-foreground mb-2">Question</p>
          <p className="text-lg font-medium flex-1">{card.front}</p>
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {card.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flashcard-back">
          <p className="text-sm text-muted-foreground mb-2">Answer</p>
          <p className="text-base flex-1">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardSchedule } from "@/lib/flashcard-types";
import { calculateNextReview } from "@/lib/sm-2";

const RATINGS = [
  { quality: 0, label: "Blackout", color: "text-red-500", description: "No recall at all" },
  { quality: 1, label: "Wrong", color: "text-orange-500", description: "Wrong answer" },
  { quality: 2, label: "Hard", color: "text-amber-500", description: "Correct with difficulty" },
  { quality: 3, label: "Okay", color: "text-yellow-500", description: "Correct with hesitation" },
  { quality: 4, label: "Good", color: "text-green-500", description: "Correct with some thought" },
  { quality: 5, label: "Easy", color: "text-emerald-500", description: "Instant recall" },
] as const;

function formatInterval(days: number): string {
  if (days < 1) return "now";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

interface RatingButtonsProps {
  schedule: FlashcardSchedule;
  onRate: (quality: number) => void;
}

export function RatingButtons({ schedule, onRate }: RatingButtonsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && !e.repeat) {
        e.preventDefault();
        onRate(num - 1); // keys 1-6 map to quality 0-5
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        How well did you recall this? (1-6 keys)
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {RATINGS.map(({ quality, label, color, description }) => {
          const next = calculateNextReview(
            { easeFactor: schedule.easeFactor, interval: schedule.interval, repetitions: schedule.repetitions },
            quality
          );
          const intervalStr = formatInterval(next.interval);

          return (
            <Button
              key={quality}
              variant="outline"
              className="flex flex-col h-auto py-2 px-1 gap-0.5"
              onClick={() => onRate(quality)}
              title={description}
            >
              <span className={`text-xs font-bold ${color}`}>{label}</span>
              <span className="text-[10px] text-muted-foreground">{intervalStr}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

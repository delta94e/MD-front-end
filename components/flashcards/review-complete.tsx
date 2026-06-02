"use client";

import { Button } from "@/components/ui/button";

interface ReviewCompleteProps {
  reviewed: number;
  averageQuality: number;
  breakdown: Record<number, number>;
  onReviewAgain: () => void;
  onExit: () => void;
}

const QUALITY_LABELS: Record<number, string> = {
  0: "Blackout",
  1: "Wrong",
  2: "Hard",
  3: "Okay",
  4: "Good",
  5: "Easy",
};

export function ReviewComplete({
  reviewed,
  averageQuality,
  breakdown,
  onReviewAgain,
  onExit,
}: ReviewCompleteProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold">Session Complete!</h2>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="rounded-lg border p-4">
          <p className="text-3xl font-bold">{reviewed}</p>
          <p className="text-sm text-muted-foreground">Cards Reviewed</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-3xl font-bold">{averageQuality.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Avg Quality</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-1">
        {[5, 4, 3, 2, 1, 0].map((q) => {
          const count = breakdown[q] || 0;
          if (count === 0) return null;
          const pct = (count / reviewed) * 100;
          return (
            <div key={q} className="flex items-center gap-2 text-sm">
              <span className="w-16 text-muted-foreground">{QUALITY_LABELS[q]}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button onClick={onReviewAgain}>Review Again</Button>
        <Button variant="outline" onClick={onExit}>
          Back to Notes
        </Button>
      </div>
    </div>
  );
}

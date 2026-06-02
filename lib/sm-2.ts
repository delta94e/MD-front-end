import type { FlashcardSchedule } from "./flashcard-types";

/**
 * SM-2 spaced repetition algorithm.
 * Returns updated ease factor, interval, and repetitions.
 */
export function calculateNextReview(
  current: Pick<FlashcardSchedule, "easeFactor" | "interval" | "repetitions">,
  quality: number
): Pick<FlashcardSchedule, "easeFactor" | "interval" | "repetitions"> {
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be 0-5");
  }

  let { easeFactor, interval, repetitions } = current;

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Update interval and repetitions
  if (quality < 3) {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  return { easeFactor, interval, repetitions };
}

/**
 * Calculate next review timestamp from interval in days.
 */
export function nextReviewTimestamp(intervalDays: number): number {
  const now = Date.now();
  return now + intervalDays * 24 * 60 * 60 * 1000;
}

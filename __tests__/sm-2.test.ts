import { calculateNextReview, nextReviewTimestamp } from "../lib/sm-2";

describe("SM-2 Algorithm", () => {
  const defaultInput = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };

  describe("calculateNextReview", () => {
    it("new card, quality 5 => interval=1, EF~2.6, reps=1", () => {
      const result = calculateNextReview(defaultInput, 5);
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });

    it("new card, quality 4 => interval=1, reps=1, EF stays at 2.5", () => {
      const result = calculateNextReview(defaultInput, 4);
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeCloseTo(2.5, 1);
    });

    it("after 1 rep success, quality 4 => interval=6, reps=2", () => {
      const afterFirstRep = { easeFactor: 2.6, interval: 1, repetitions: 1 };
      const result = calculateNextReview(afterFirstRep, 4);
      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
    });

    it("after 2 reps success, quality 4 => interval=round(6*EF), reps=3", () => {
      const afterSecondRep = { easeFactor: 2.6, interval: 6, repetitions: 2 };
      const result = calculateNextReview(afterSecondRep, 4);
      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(Math.round(6 * 2.6));
    });

    it("quality < 3 resets interval=1, reps=0", () => {
      const afterSomeReps = { easeFactor: 2.5, interval: 15, repetitions: 5 };
      const result = calculateNextReview(afterSomeReps, 2);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("quality 0 (complete blackout) resets", () => {
      const afterSomeReps = { easeFactor: 2.5, interval: 30, repetitions: 10 };
      const result = calculateNextReview(afterSomeReps, 0);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("quality 3 (barely correct) succeeds", () => {
      const result = calculateNextReview(defaultInput, 3);
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it("EF never drops below 1.3", () => {
      let state = { easeFactor: 1.35, interval: 10, repetitions: 5 };
      // Multiple failures should not drop below 1.3
      for (let i = 0; i < 10; i++) {
        state = calculateNextReview(state, 0);
      }
      expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("throws on quality < 0", () => {
      expect(() => calculateNextReview(defaultInput, -1)).toThrow(
        "Quality must be 0-5"
      );
    });

    it("throws on quality > 5", () => {
      expect(() => calculateNextReview(defaultInput, 6)).toThrow(
        "Quality must be 0-5"
      );
    });

    it("quality 1 resets like quality 2", () => {
      const afterSomeReps = { easeFactor: 2.5, interval: 10, repetitions: 3 };
      const result = calculateNextReview(afterSomeReps, 1);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe("nextReviewTimestamp", () => {
    it("returns now + interval in ms", () => {
      const now = Date.now();
      const result = nextReviewTimestamp(1);
      // Should be approximately now + 1 day in ms
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(result).toBeGreaterThanOrEqual(now + oneDayMs - 100);
      expect(result).toBeLessThanOrEqual(now + oneDayMs + 100);
    });

    it("0 interval returns approximately now", () => {
      const now = Date.now();
      const result = nextReviewTimestamp(0);
      expect(result).toBeGreaterThanOrEqual(now - 100);
      expect(result).toBeLessThanOrEqual(now + 100);
    });
  });
});

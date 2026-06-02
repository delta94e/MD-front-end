// Polyfill structuredClone BEFORE importing fake-indexeddb
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

import "fake-indexeddb/auto";
import {
  addFlashcards,
  getFlashcardsByFile,
  getAllFlashcards,
  getDueCards,
  getSchedule,
  updateSchedule,
  getReviewStats,
  deleteFlashcardsByFile,
  closeDb,
} from "../lib/flashcard-db";
import type { Flashcard } from "../lib/flashcard-types";

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: crypto.randomUUID(),
    filePath: "/notes/test.md",
    front: "What is X?",
    back: "X is Y",
    tags: ["test"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("FlashcardDB", () => {
  beforeEach(() => {
    closeDb();
    indexedDB.deleteDatabase("pkm-flashcards");
  });

  describe("addFlashcards & getFlashcardsByFile", () => {
    it("adds and retrieves cards by file path", async () => {
      const cards = [
        makeCard({ filePath: "/notes/a.md" }),
        makeCard({ filePath: "/notes/a.md" }),
        makeCard({ filePath: "/notes/b.md" }),
      ];
      await addFlashcards(cards);

      const result = await getFlashcardsByFile("/notes/a.md");
      expect(result).toHaveLength(2);
    });

    it("returns empty array for non-existent file", async () => {
      const result = await getFlashcardsByFile("/notes/none.md");
      expect(result).toHaveLength(0);
    });
  });

  describe("getAllFlashcards", () => {
    it("returns all cards across files", async () => {
      const cards = [makeCard(), makeCard(), makeCard()];
      await addFlashcards(cards);

      const result = await getAllFlashcards();
      expect(result).toHaveLength(3);
    });
  });

  describe("getDueCards", () => {
    it("returns cards due for review (nextReview <= now)", async () => {
      const cards = [makeCard(), makeCard()];
      await addFlashcards(cards);

      const due = await getDueCards();
      expect(due).toHaveLength(2);
    });

    it("respects limit parameter", async () => {
      const cards = [makeCard(), makeCard(), makeCard()];
      await addFlashcards(cards);

      const due = await getDueCards(2);
      expect(due).toHaveLength(2);
    });
  });

  describe("getSchedule & updateSchedule", () => {
    it("returns schedule for existing card", async () => {
      const card = makeCard();
      await addFlashcards([card]);

      const schedule = await getSchedule(card.id);
      expect(schedule).not.toBeNull();
      expect(schedule!.easeFactor).toBe(2.5);
      expect(schedule!.repetitions).toBe(0);
    });

    it("returns null for non-existent card", async () => {
      const schedule = await getSchedule("non-existent");
      expect(schedule).toBeNull();
    });

    it("updates schedule after review", async () => {
      const card = makeCard();
      await addFlashcards([card]);

      await updateSchedule(card.id, 4);

      const schedule = await getSchedule(card.id);
      expect(schedule!.repetitions).toBe(1);
      expect(schedule!.interval).toBe(1);
      expect(schedule!.lastReview).toBeGreaterThan(0);
    });

    it("resets on failed review (quality < 3)", async () => {
      const card = makeCard();
      await addFlashcards([card]);

      await updateSchedule(card.id, 4);
      let schedule = await getSchedule(card.id);
      expect(schedule!.repetitions).toBe(1);

      await updateSchedule(card.id, 1);
      schedule = await getSchedule(card.id);
      expect(schedule!.repetitions).toBe(0);
      expect(schedule!.interval).toBe(1);
    });
  });

  describe("getReviewStats", () => {
    it("returns correct stats", async () => {
      const cards = [makeCard(), makeCard(), makeCard()];
      await addFlashcards(cards);

      const stats = await getReviewStats();
      expect(stats.totalCards).toBe(3);
      expect(stats.dueToday).toBe(3);
      expect(stats.reviewedToday).toBe(0);
      expect(stats.streak).toBe(0);
      expect(stats.averageEase).toBe(2.5);
    });

    it("counts reviewed today after reviews", async () => {
      const card = makeCard();
      await addFlashcards([card]);
      await updateSchedule(card.id, 4);

      const stats = await getReviewStats();
      expect(stats.reviewedToday).toBe(1);
    });
  });

  describe("deleteFlashcardsByFile", () => {
    it("deletes cards and associated data", async () => {
      const cards = [
        makeCard({ filePath: "/notes/del.md" }),
        makeCard({ filePath: "/notes/del.md" }),
        makeCard({ filePath: "/notes/keep.md" }),
      ];
      await addFlashcards(cards);

      await deleteFlashcardsByFile("/notes/del.md");

      const remaining = await getAllFlashcards();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].filePath).toBe("/notes/keep.md");
    });

    it("does nothing for non-existent file", async () => {
      const card = makeCard();
      await addFlashcards([card]);

      await deleteFlashcardsByFile("/notes/none.md");

      const all = await getAllFlashcards();
      expect(all).toHaveLength(1);
    });
  });
});

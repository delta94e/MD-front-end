export interface Flashcard {
  id: string;
  filePath: string;
  front: string;
  back: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FlashcardReview {
  id: string;
  cardId: string;
  quality: number; // 0-5
  reviewedAt: number;
}

export interface FlashcardSchedule {
  cardId: string;
  easeFactor: number; // starts at 2.5
  interval: number; // days
  repetitions: number;
  nextReview: number; // epoch ms
  lastReview: number; // epoch ms, 0 if never
}

export interface ReviewStats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  streak: number;
  averageEase: number;
}

export const DEFAULT_SCHEDULE: Omit<FlashcardSchedule, "cardId" | "nextReview" | "lastReview"> = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

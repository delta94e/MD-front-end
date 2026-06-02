import type {
  Flashcard,
  FlashcardReview,
  FlashcardSchedule,
  ReviewStats,
} from "./flashcard-types";
import { DEFAULT_SCHEDULE } from "./flashcard-types";
import { calculateNextReview, nextReviewTimestamp } from "./sm-2";

const DB_NAME = "pkm-flashcards";
const DB_VERSION = 1;
const STORES = {
  flashcards: "flashcards",
  reviews: "reviews",
  schedules: "schedules",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

let cachedDb: IDBDatabase | null = null;

async function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) throw new Error("IndexedDB not available");
  if (cachedDb) return cachedDb;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.flashcards)) {
        const store = db.createObjectStore(STORES.flashcards, { keyPath: "id" });
        store.createIndex("filePath", "filePath", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.reviews)) {
        const store = db.createObjectStore(STORES.reviews, { keyPath: "id" });
        store.createIndex("cardId", "cardId", { unique: false });
        store.createIndex("reviewedAt", "reviewedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.schedules)) {
        db.createObjectStore(STORES.schedules, { keyPath: "cardId" });
      }
    };

    request.onsuccess = () => {
      cachedDb = request.result;
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Close cached connection (for testing) */
export function closeDb(): void {
  if (cachedDb) {
    cachedDb.close();
    cachedDb = null;
  }
}

function txStore<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = "readonly"
): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Add flashcards and create initial schedules */
export async function addFlashcards(cards: Flashcard[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(
    [STORES.flashcards, STORES.schedules],
    "readwrite"
  );
  const cardStore = tx.objectStore(STORES.flashcards);
  const schedStore = tx.objectStore(STORES.schedules);

  for (const card of cards) {
    cardStore.put(card);
    schedStore.put({
      cardId: card.id,
      ...DEFAULT_SCHEDULE,
      nextReview: Date.now(), // due immediately for first review
      lastReview: 0,
    } satisfies FlashcardSchedule);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get flashcards for a specific file */
export async function getFlashcardsByFile(
  filePath: string
): Promise<Flashcard[]> {
  const db = await openDb();
  const store = txStore(db, STORES.flashcards);
  const index = store.index("filePath");
  return promisify(index.getAll(filePath));
}

/** Get all flashcards */
export async function getAllFlashcards(): Promise<Flashcard[]> {
  const db = await openDb();
  const store = txStore(db, STORES.flashcards);
  return promisify(store.getAll());
}

/** Get cards due for review (nextReview <= now) */
export async function getDueCards(limit = 50): Promise<Flashcard[]> {
  const db = await openDb();
  const now = Date.now();

  // Get all schedules where nextReview <= now
  const schedStore = txStore(db, STORES.schedules);
  const allSchedules: FlashcardSchedule[] = await promisify(schedStore.getAll());
  const dueSchedules = allSchedules
    .filter((s) => s.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, limit);

  if (dueSchedules.length === 0) return [];

  // Fetch the actual cards
  const cardStore = txStore(db, STORES.flashcards);
  const cards: Flashcard[] = [];
  for (const sched of dueSchedules) {
    const card = await promisify(cardStore.get(sched.cardId));
    if (card) cards.push(card);
  }

  return cards;
}

/** Get schedule for a card */
export async function getSchedule(
  cardId: string
): Promise<FlashcardSchedule | null> {
  const db = await openDb();
  const store = txStore(db, STORES.schedules);
  const result = await promisify(store.get(cardId));
  return result ?? null;
}

/** Apply SM-2 rating and update schedule */
export async function updateSchedule(
  cardId: string,
  quality: number
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(
    [STORES.schedules, STORES.reviews],
    "readwrite"
  );
  const schedStore = tx.objectStore(STORES.schedules);
  const reviewStore = tx.objectStore(STORES.reviews);

  const current: FlashcardSchedule | undefined = await promisify(
    schedStore.get(cardId)
  );
  if (!current) throw new Error(`Schedule not found for card ${cardId}`);

  const updated = calculateNextReview(current, quality);
  const newSchedule: FlashcardSchedule = {
    cardId,
    ...updated,
    nextReview: nextReviewTimestamp(updated.interval),
    lastReview: Date.now(),
  };

  schedStore.put(newSchedule);

  const review: FlashcardReview = {
    id: crypto.randomUUID(),
    cardId,
    quality,
    reviewedAt: Date.now(),
  };
  reviewStore.put(review);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get review statistics */
export async function getReviewStats(): Promise<ReviewStats> {
  const db = await openDb();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const schedStore = txStore(db, STORES.schedules);
  const allSchedules: FlashcardSchedule[] = await promisify(
    schedStore.getAll()
  );

  const totalCards = allSchedules.length;
  const dueToday = allSchedules.filter((s) => s.nextReview <= now).length;

  // Count reviews today
  const reviewStore = txStore(db, STORES.reviews);
  const allReviews: FlashcardReview[] = await promisify(reviewStore.getAll());
  const reviewedToday = allReviews.filter(
    (r) => r.reviewedAt >= todayStartMs
  ).length;

  // Calculate streak (consecutive days with reviews)
  const reviewDays = new Set(
    allReviews.map((r) => {
      const d = new Date(r.reviewedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  let streak = 0;
  let checkDate = todayStartMs;
  while (reviewDays.has(checkDate)) {
    streak++;
    checkDate -= 24 * 60 * 60 * 1000;
  }

  // Average ease factor
  const averageEase =
    totalCards > 0
      ? allSchedules.reduce((sum, s) => sum + s.easeFactor, 0) / totalCards
      : 2.5;

  return { totalCards, dueToday, reviewedToday, streak, averageEase };
}

/** Delete all flashcards for a file */
export async function deleteFlashcardsByFile(filePath: string): Promise<void> {
  const db = await openDb();
  const cards = await getFlashcardsByFile(filePath);
  if (cards.length === 0) return;

  const cardIds = cards.map((c) => c.id);
  const tx = db.transaction(
    [STORES.flashcards, STORES.schedules, STORES.reviews],
    "readwrite"
  );
  const cardStore = tx.objectStore(STORES.flashcards);
  const schedStore = tx.objectStore(STORES.schedules);
  const reviewStore = tx.objectStore(STORES.reviews);

  for (const id of cardIds) {
    cardStore.delete(id);
    schedStore.delete(id);
    // Delete reviews by cardId (need to iterate since no compound key)
    const index = reviewStore.index("cardId");
    const reviews = await promisify(index.getAll(id));
    for (const review of reviews) {
      reviewStore.delete(review.id);
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

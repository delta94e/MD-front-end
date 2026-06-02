import Database from "better-sqlite3";
import { createHash } from "crypto";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export interface CachedEntry {
  urlHash: string;
  url: string;
  title: string;
  crawledContent: string;
  studyGuide?: string;
  createdAt: number;
  expiresAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getDbPath(): string {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  return join(dataDir, "content-cache.db");
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      url_hash TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      crawled_content TEXT NOT NULL,
      study_guide TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  return db;
}

export function hashInput(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function getCachedEntry(key: string): CachedEntry | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM cache WHERE url_hash = ? AND expires_at > ?")
    .get(key, Date.now()) as
    | {
        url_hash: string;
        url: string;
        title: string;
        crawled_content: string;
        study_guide: string | null;
        created_at: number;
        expires_at: number;
      }
    | undefined;

  if (!row) return null;

  return {
    urlHash: row.url_hash,
    url: row.url,
    title: row.title,
    crawledContent: row.crawled_content,
    studyGuide: row.study_guide ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function setCachedEntry(
  key: string,
  url: string,
  title: string,
  crawledContent: string,
  studyGuide?: string
): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT OR REPLACE INTO cache (url_hash, url, title, crawled_content, study_guide, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(key, url, title, crawledContent, studyGuide ?? null, now, now + TTL_MS);
}

export function cleanupExpired(): number {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM cache WHERE expires_at < ?")
    .run(Date.now());
  return result.changes;
}

import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export interface Annotation {
  id: string;
  filePath: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  note: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];

function getDbPath(): string {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  return join(dataDir, "annotations.db");
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      selected_text TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#fef08a',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_annotations_file_path ON annotations(file_path);
  `);

  return db;
}

export function getAnnotations(filePath: string): Annotation[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM annotations WHERE file_path = ? ORDER BY start_offset ASC")
    .all(filePath) as Array<{
    id: string;
    file_path: string;
    start_offset: number;
    end_offset: number;
    selected_text: string;
    note: string;
    color: string;
    created_at: number;
    updated_at: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    filePath: row.file_path,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    selectedText: row.selected_text,
    note: row.note,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function addAnnotation(annotation: Omit<Annotation, "createdAt" | "updatedAt">): Annotation {
  const db = getDb();
  const now = Date.now();

  db.prepare(
    `INSERT INTO annotations (id, file_path, start_offset, end_offset, selected_text, note, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    annotation.id,
    annotation.filePath,
    annotation.startOffset,
    annotation.endOffset,
    annotation.selectedText,
    annotation.note,
    annotation.color,
    now,
    now
  );

  return { ...annotation, createdAt: now, updatedAt: now };
}

export function updateAnnotation(
  id: string,
  updates: { note?: string; color?: string }
): boolean {
  const db = getDb();
  const now = Date.now();
  const sets: string[] = ["updated_at = ?"];
  const values: (string | number)[] = [now];

  if (updates.note !== undefined) {
    sets.push("note = ?");
    values.push(updates.note);
  }
  if (updates.color !== undefined) {
    sets.push("color = ?");
    values.push(updates.color);
  }

  values.push(id);
  const result = db
    .prepare(`UPDATE annotations SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values);

  return result.changes > 0;
}

export function deleteAnnotation(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM annotations WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAnnotationsForFile(filePath: string): number {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM annotations WHERE file_path = ?")
    .run(filePath);
  return result.changes;
}

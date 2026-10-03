import { app } from 'electron';
import path from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * Single SQLite database (node:sqlite, built into Electron's Node — no native
 * module, no WASM). Writes hit disk immediately in WAL mode, so there is no
 * flush step and no data loss on crash.
 */
let db: DatabaseSync | null = null;

export type DbParam = SQLInputValue;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history (
    url TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    last_visit INTEGER NOT NULL,
    visit_count INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit DESC);
  CREATE INDEX IF NOT EXISTS idx_history_title ON history(title);

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_title ON bookmarks(title);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_login_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS search_queries (
    query TEXT PRIMARY KEY,
    last_used INTEGER NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_search_queries_last_used ON search_queries(last_used DESC);

  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    username TEXT NOT NULL,
    secret BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(origin, username)
  );
  CREATE INDEX IF NOT EXISTS idx_passwords_origin ON passwords(origin);
`;

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'tekeli.db');
}

/** Open (or create) the database. Returns false and logs the real stack on failure. */
export async function initDatabase(file: string = getDbPath()): Promise<boolean> {
  if (db) return true;
  try {
    const opened = new DatabaseSync(file);
    opened.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;');
    opened.exec(SCHEMA);
    db = opened;
    return true;
  } catch (error) {
    console.error('[DB] Init failed:', error);
    db = null;
    return false;
  }
}

export function closeDatabase(): void {
  try {
    db?.close();
  } catch (error) {
    console.error('[DB] Close failed:', error);
  }
  db = null;
}

export function isDatabaseReady(): boolean {
  return db !== null;
}

/** Kept for call-site compatibility: WAL writes are durable, nothing to flush. */
export function flushDatabase(): void {
  /* no-op */
}

export function dbExec(sql: string): void {
  db?.exec(sql);
}

export function dbRun(sql: string, params: DbParam[] = []): void {
  if (!db) return;
  db.prepare(sql).run(...params);
}

export function dbGet<T extends object>(sql: string, params: DbParam[] = []): T | undefined {
  if (!db) return undefined;
  return db.prepare(sql).get(...params) as T | undefined;
}

export function dbAll<T extends object>(sql: string, params: DbParam[] = []): T[] {
  if (!db) return [];
  return db.prepare(sql).all(...params) as T[];
}

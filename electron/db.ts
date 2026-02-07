import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dbFilePath = '';
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

function getDbPath(): string {
  if (!dbFilePath) {
    dbFilePath = path.join(app.getPath('userData'), 'tekeli.db');
  }
  return dbFilePath;
}

function locateFile(file: string): string {
  const candidates: string[] = [];

  if (typeof process.resourcesPath === 'string') {
    candidates.push(path.join(process.resourcesPath, 'sql-wasm.wasm'));
    candidates.push(path.join(process.resourcesPath, file));
  }

  try {
    candidates.push(path.join(app.getAppPath(), 'dist-electron', file));
    candidates.push(path.join(app.getAppPath(), 'dist-electron', 'sql-wasm.wasm'));
  } catch {}

  candidates.push(path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file));

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }

  return candidates[0] || file;
}

export async function initDatabase(): Promise<boolean> {
  if (db) return true;
  try {
    SQL = await initSqlJs({ locateFile });
    const filePath = getDbPath();
    const fileData = fs.existsSync(filePath) ? new Uint8Array(fs.readFileSync(filePath)) : undefined;
    db = fileData ? new SQL.Database(fileData) : new SQL.Database();

    db.run(`
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
    `);

    flushDatabase();
    return true;
  } catch (error) {
    console.error('[DB] Init failed:', error);
    SQL = null;
    db = null;
    return false;
  }
}

function requireDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function flushDatabase(): void {
  if (!db) return;
  try {
    fs.writeFileSync(getDbPath(), Buffer.from(db.export()));
  } catch {}
}

export function scheduleFlush(): void {
  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushDatabase();
  }, 800);
}

export function dbRun(sql: string, params: Array<string | number> = []): void {
  if (!db) return;
  const d = requireDb();
  const stmt = d.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
  scheduleFlush();
}

export function dbGet<T extends Record<string, any>>(sql: string, params: Array<string | number> = []): T | undefined {
  if (!db) return undefined;
  const d = requireDb();
  const stmt = d.prepare(sql);
  try {
    stmt.bind(params);
    if (!stmt.step()) return undefined;
    return stmt.getAsObject() as T;
  } finally {
    stmt.free();
  }
}

export function dbAll<T extends Record<string, any>>(sql: string, params: Array<string | number> = []): T[] {
  if (!db) return [];
  const d = requireDb();
  const stmt = d.prepare(sql);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

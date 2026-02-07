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
  const packaged = typeof process.resourcesPath === 'string'
    ? path.join(process.resourcesPath, file)
    : '';
  if (packaged && fs.existsSync(packaged)) return packaged;
  return path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', file);
}

export async function initDatabase(): Promise<void> {
  if (db) return;

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

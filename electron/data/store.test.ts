import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: { getPath: () => tmpdir() } }));

import { closeDatabase, dbAll, dbRun, initDatabase } from '../db';
import {
  addBookmark, clearHistory, clearSearchQueries, getBookmarks, getHistory, importBookmarks, listBookmarkFolders, setBookmarkFolder,
} from './store';

let file: string;
beforeEach(() => { file = path.join(mkdtempSync(path.join(tmpdir(), 'tekeli-db-')), 'test.db'); });
afterEach(() => closeDatabase());

const visit = (url: string, ts: number) => dbRun('INSERT INTO history (url, title, last_visit, visit_count) VALUES (?, ?, ?, 1)', [url, url, ts]);

describe('time-range clearing', () => {
  it('clearHistory(since) drops only rows at or after the cutoff', async () => {
    await initDatabase(file);
    visit('https://old.test/', 1_000);
    visit('https://mid.test/', 5_000);
    visit('https://new.test/', 9_000);
    clearHistory(5_000);
    expect(getHistory().map((h) => h.url)).toEqual(['https://old.test/']);
  });

  it('clearHistory() with no cutoff clears everything', async () => {
    await initDatabase(file);
    visit('https://old.test/', 1_000);
    visit('https://new.test/', 9_000);
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('clearSearchQueries(since) only drops recent queries', async () => {
    await initDatabase(file);
    dbRun('INSERT INTO search_queries (query, last_used, use_count) VALUES (?, ?, 1)', ['old', 1_000]);
    dbRun('INSERT INTO search_queries (query, last_used, use_count) VALUES (?, ?, 1)', ['new', 9_000]);
    clearSearchQueries(5_000);
    expect(dbAll<{ query: string }>('SELECT query FROM search_queries').map((r) => r.query)).toEqual(['old']);
  });
});

describe('bookmark folders', () => {
  it('adds the folder column to a database created before it existed', async () => {
    const legacy = new DatabaseSync(file);
    legacy.exec('CREATE TABLE bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, title TEXT NOT NULL, created_at INTEGER NOT NULL)');
    legacy.prepare('INSERT INTO bookmarks (url, title, created_at) VALUES (?, ?, ?)').run('https://legacy.test/', 'Legacy', 1);
    legacy.close();

    expect(await initDatabase(file)).toBe(true);
    expect(getBookmarks()[0]).toMatchObject({ url: 'https://legacy.test/', folder: '' });
    setBookmarkFolder('https://legacy.test/', '  Reading  ');
    expect(getBookmarks()[0].folder).toBe('Reading');
    expect(listBookmarkFolders()).toEqual(['Reading']);
  });

  it('importBookmarks counts only new links and never overwrites an existing folder', async () => {
    await initDatabase(file);
    addBookmark('https://keep.test/', 'Keep');
    setBookmarkFolder('https://keep.test/', 'Mine');
    addBookmark('https://nofolder.test/', 'NoFolder');
    const added = importBookmarks([
      { url: 'https://keep.test/', title: 'Other title', folder: 'Imported' },
      { url: 'https://nofolder.test/', title: 'x', folder: 'Imported' },
      { url: 'https://fresh.test/', title: 'Fresh', folder: 'Imported' },
      { url: 'javascript:alert(1)', title: 'bad', folder: '' },
    ]);
    expect(added).toBe(1);
    const byUrl = Object.fromEntries(getBookmarks().map((b) => [b.url, b]));
    expect(byUrl['https://keep.test/']).toMatchObject({ title: 'Keep', folder: 'Mine' });
    expect(byUrl['https://nofolder.test/'].folder).toBe('Imported');
    expect(byUrl['https://fresh.test/']).toMatchObject({ title: 'Fresh', folder: 'Imported' });
    expect(Object.keys(byUrl)).toHaveLength(3);
  });
});

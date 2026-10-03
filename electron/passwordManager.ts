/**
 * Password manager. Secrets are encrypted with Electron `safeStorage`
 * (Windows DPAPI / macOS Keychain / libsecret) — no home-made crypto, no master
 * password to forget. The renderer only ever receives metadata; plaintext is
 * returned on explicit `password-reveal` for a single entry.
 */
import { safeStorage } from 'electron';
import crypto from 'node:crypto';
import { handle } from './core/ipc';
import { dbAll, dbGet, dbRun } from './db';

export interface PasswordMeta {
  id: number;
  origin: string;
  username: string;
  createdAt: number;
  updatedAt: number;
}

interface PasswordRow {
  id: number;
  origin: string;
  username: string;
  secret: Uint8Array;
  created_at: number;
  updated_at: number;
}

export interface BreachResult {
  breached: boolean;
  count?: number;
}

export function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

/** Passwords are keyed by origin (scheme+host+port), never by a loose domain match. */
export function normalizeOrigin(input: string): string {
  const url = new URL(input);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Unsupported origin');
  }
  return url.origin;
}

function toMeta(r: PasswordRow): PasswordMeta {
  return { id: r.id, origin: r.origin, username: r.username, createdAt: r.created_at, updatedAt: r.updated_at };
}

export function savePassword(origin: string, username: string, password: string): void {
  if (!isEncryptionAvailable()) throw new Error('Encryption unavailable');
  const secret = safeStorage.encryptString(password);
  const now = Date.now();
  dbRun(
    `INSERT INTO passwords (origin, username, secret, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(origin, username) DO UPDATE SET secret = excluded.secret, updated_at = excluded.updated_at`,
    [normalizeOrigin(origin), username, secret, now, now],
  );
}

export function listPasswords(query = ''): PasswordMeta[] {
  const like = `%${query.replace(/[%_]/g, '')}%`;
  const rows = dbAll<PasswordRow>(
    `SELECT * FROM passwords WHERE origin LIKE ? OR username LIKE ? ORDER BY updated_at DESC LIMIT 1000`,
    [like, like],
  );
  return rows.map(toMeta);
}

export function listPasswordsForOrigin(origin: string): PasswordMeta[] {
  return dbAll<PasswordRow>('SELECT * FROM passwords WHERE origin = ? ORDER BY updated_at DESC', [normalizeOrigin(origin)]).map(toMeta);
}

export function revealPassword(id: number): string | null {
  const row = dbGet<PasswordRow>('SELECT * FROM passwords WHERE id = ?', [id]);
  if (!row) return null;
  return safeStorage.decryptString(Buffer.from(row.secret));
}

export function deletePassword(id: number): void {
  dbRun('DELETE FROM passwords WHERE id = ?', [id]);
}

export function clearAllPasswords(): void {
  dbRun('DELETE FROM passwords');
}

/** k-anonymity lookup: only the first 5 hex chars of the SHA-1 leave the machine. */
export async function checkBreach(password: string): Promise<BreachResult> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding': 'true' } });
    if (!res.ok) return { breached: false };
    const body = await res.text();
    for (const line of body.split('\n')) {
      const [s, count] = line.trim().split(':');
      if (s === suffix && Number(count) > 0) return { breached: true, count: Number(count) };
    }
    return { breached: false };
  } catch {
    return { breached: false };
  }
}

export function initPasswordManager(): void {
  handle('password-available', () => ({ available: isEncryptionAvailable() }));
  handle('password-list', (_e, query: string = '') => ({ passwords: listPasswords(String(query)) }));
  handle('password-add', (_e, origin: string, username: string, password: string) => {
    savePassword(String(origin), String(username), String(password));
    return { success: true };
  });
  handle('password-reveal', (_e, id: number) => ({ password: revealPassword(Number(id)) }));
  handle('password-delete', (_e, id: number) => {
    deletePassword(Number(id));
    return { success: true };
  });
  handle('password-check-breach', (_e, password: string) => checkBreach(String(password)));
  console.log('[PasswordManager] Initialized');
}

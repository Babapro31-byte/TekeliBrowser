/**
 * TekeliBrowser Password Manager
 * AES-256-GCM encrypted password storage with breach monitoring
 */

import { app, ipcMain } from 'electron';
import { isValidSender } from './ipcValidation.js';
import { dbRun, dbGet, dbAll } from './db.js';
import crypto from 'crypto';

interface PasswordEntry {
  id: number;
  origin: string;
  username: string;
  password: string;
  createdAt: number;
  lastUsed: number;
  timesUsed: number;
}

interface BreachResult {
  breached: boolean;
  breachDate?: string;
  description?: string;
}

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

let masterKey: Buffer | null = null;
let isUnlocked = false;

function deriveKey(masterPassword: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterPassword, salt, 100000, KEY_LENGTH, 'sha256');
}

function encrypt(text: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, key);
  cipher.setAAD(Buffer.from('tekeli-browser'));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: Buffer): string {
  const decipher = crypto.createDecipher(ALGORITHM, key);
  decipher.setAAD(Buffer.from('tekeli-browser'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function initPasswordDB(): void {
  dbRun(`
    CREATE TABLE IF NOT EXISTS password_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used INTEGER NOT NULL,
      times_used INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_passwords_origin ON passwords(origin);
    CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
  `);
}

function getSalt(): Buffer {
  const row = dbGet<{ value: string }>("SELECT value FROM password_metadata WHERE key = 'salt'");
  if (row?.value) {
    return Buffer.from(row.value, 'hex');
  }
  const salt = crypto.randomBytes(32);
  dbRun("INSERT OR REPLACE INTO password_metadata (key, value) VALUES ('salt', ?)", [salt.toString('hex')]);
  return salt;
}

function setMasterPassword(password: string): void {
  const salt = getSalt();
  masterKey = deriveKey(password, salt);
  isUnlocked = true;
}

function checkMasterPassword(password: string): boolean {
  try {
    const salt = getSalt();
    const testKey = deriveKey(password, salt);
    // Verify by trying to decrypt a known dummy value
    const dummyRow = dbGet<{ value: string }>("SELECT value FROM password_metadata WHERE key = 'dummy'");
    if (!dummyRow) {
      // First time, create dummy
      const dummy = encrypt('dummy', testKey);
      dbRun("INSERT OR REPLACE INTO password_metadata (key, value) VALUES ('dummy', ?)", [JSON.stringify(dummy)]);
      return true;
    }
    const dummy = JSON.parse(dummyRow.value);
    decrypt(dummy, testKey);
    masterKey = testKey;
    isUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function addPassword(origin: string, username: string, password: string): void {
  if (!isUnlocked || !masterKey) throw new Error('Password manager locked');
  const encrypted = encrypt(password, masterKey);
  const now = Date.now();
  dbRun(`
    INSERT INTO passwords (origin, username, password, created_at, last_used, times_used)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(origin, username) DO UPDATE SET
      password = excluded.password,
      last_used = ?,
      times_used = times_used + 1
  `, [origin, username, JSON.stringify(encrypted), now, now, now]);
}

export function getPasswordsByOrigin(origin: string): PasswordEntry[] {
  if (!isUnlocked || !masterKey) return [];
  const rows = dbAll<PasswordEntry>(`
    SELECT id, origin, username, password, created_at as createdAt, last_used as lastUsed, times_used as timesUsed
    FROM passwords
    WHERE origin = ?
    ORDER BY last_used DESC
  `, [origin]);
  return rows.map(r => ({
    ...r,
    password: decrypt(JSON.parse(r.password), masterKey!)
  }));
}

export function getAllPasswords(): PasswordEntry[] {
  if (!isUnlocked || !masterKey) return [];
  const rows = dbAll<PasswordEntry>(`
    SELECT id, origin, username, password, created_at as createdAt, last_used as lastUsed, times_used as timesUsed
    FROM passwords
    ORDER BY last_used DESC
  `);
  return rows.map(r => ({
    ...r,
    password: decrypt(JSON.parse(r.password), masterKey!)
  }));
}

export function deletePassword(id: number): void {
  dbRun('DELETE FROM passwords WHERE id = ?', [id]);
}

export async function checkBreach(password: string): Promise<BreachResult> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const https = await import('https');
    const data = await new Promise<string>((resolve, reject) => {
      https.get(`https://api.pwnedpasswords.com/range/${prefix}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });
    const lines = data.split('\n');
    for (const line of lines) {
      const [s, count] = line.split(':');
      if (s === suffix) {
        return { breached: true, breachDate: 'Unknown', description: `Found ${count} times` };
      }
    }
    return { breached: false };
  } catch {
    return { breached: false };
  }
}

export function initPasswordManager(): void {
  initPasswordDB();

  ipcMain.handle('password-set-master', async (event, password: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    setMasterPassword(password);
    return { success: true };
  });

  ipcMain.handle('password-unlock', async (event, password: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const ok = checkMasterPassword(password);
    return { success: ok };
  });

  ipcMain.handle('password-add', async (event, origin: string, username: string, password: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    try {
      addPassword(origin, username, password);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('password-get-by-origin', async (event, origin: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    try {
      const list = getPasswordsByOrigin(origin);
      return { passwords: list };
    } catch (e: any) {
      return { passwords: [], error: e.message };
    }
  });

  ipcMain.handle('password-get-all', async (event) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    try {
      const list = getAllPasswords();
      return { passwords: list };
    } catch (e: any) {
      return { passwords: [], error: e.message };
    }
  });

  ipcMain.handle('password-delete', async (event, id: number) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    deletePassword(id);
    return { success: true };
  });

  ipcMain.handle('password-check-breach', async (event, password: string) => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const result = await checkBreach(password);
    return result;
  });

  console.log('[PasswordManager] Initialized');
}

export default { initPasswordManager };
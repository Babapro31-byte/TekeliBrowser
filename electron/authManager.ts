import { ipcMain } from 'electron';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { dbGet, dbRun } from './db.js';
import { isValidSender } from './ipcValidation.js';

type AuthResponse = {
  success: boolean;
  user?: AuthUser | null;
  error?: string;
};

type DbUser = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  updated_at: number;
  last_login_at?: number | null;
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
};

const AUTH_SESSION_KEY = 'auth.currentUserId';

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function toAuthUser(row: DbUser): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at ?? undefined
  };
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || randomBytes(16).toString('hex');
  const hash = scryptSync(password, finalSalt, 64).toString('hex');
  return { hash, salt: finalSalt };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const derived = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function setCurrentUserId(userId: string | null): void {
  const val = userId || '';
  dbRun(
    `
    INSERT INTO meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `,
    [AUTH_SESSION_KEY, val]
  );
}

function getCurrentUserId(): string | null {
  const row = dbGet<{ value: string }>('SELECT value FROM meta WHERE key = ?', [AUTH_SESSION_KEY]);
  if (!row?.value) return null;
  return row.value;
}

function getUserById(id: string): DbUser | undefined {
  return dbGet<DbUser>(
    `
      SELECT
        id,
        email,
        name,
        password_hash,
        password_salt,
        created_at,
        updated_at,
        last_login_at
      FROM users
      WHERE id = ?
    `,
    [id]
  );
}

function getUserByEmail(email: string): DbUser | undefined {
  return dbGet<DbUser>(
    `
      SELECT
        id,
        email,
        name,
        password_hash,
        password_salt,
        created_at,
        updated_at,
        last_login_at
      FROM users
      WHERE email = ?
    `,
    [email]
  );
}

export function initAuthManager(): void {
  ipcMain.handle('auth-register', async (event, payload: { email: string; password: string; name?: string }): Promise<AuthResponse> => {
    if (!isValidSender(event)) throw new Error('Invalid sender');

    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || '');
    const name = String(payload?.name || '').trim() || email.split('@')[0] || 'User';

    if (!isValidEmail(email)) return { success: false, error: 'Invalid email address' };
    if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

    const existing = getUserByEmail(email);
    if (existing) return { success: false, error: 'This email is already registered' };

    const now = Date.now();
    const userId = `${now}-${randomBytes(8).toString('hex')}`;
    const pass = hashPassword(password);

    dbRun(
      `
      INSERT INTO users (id, email, name, password_hash, password_salt, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, email, name, pass.hash, pass.salt, now, now, now]
    );

    setCurrentUserId(userId);
    const user = getUserById(userId);
    return { success: true, user: user ? toAuthUser(user) : null };
  });

  ipcMain.handle('auth-login', async (event, payload: { email: string; password: string }): Promise<AuthResponse> => {
    if (!isValidSender(event)) throw new Error('Invalid sender');

    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || '');

    if (!isValidEmail(email) || !password) return { success: false, error: 'Invalid credentials' };

    const user = getUserByEmail(email);
    if (!user) return { success: false, error: 'Invalid credentials' };

    if (!verifyPassword(password, user.password_salt, user.password_hash)) {
      return { success: false, error: 'Invalid credentials' };
    }

    const now = Date.now();
    dbRun('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [now, now, user.id]);
    setCurrentUserId(user.id);

    const updated = getUserById(user.id);
    return { success: true, user: updated ? toAuthUser(updated) : null };
  });

  ipcMain.handle('auth-logout', async (event): Promise<{ success: boolean }> => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    setCurrentUserId(null);
    return { success: true };
  });

  ipcMain.handle('auth-get-current-user', async (event): Promise<AuthResponse> => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return { success: true, user: null };

    const user = getUserById(currentUserId);
    if (!user) {
      setCurrentUserId(null);
      return { success: true, user: null };
    }

    return { success: true, user: toAuthUser(user) };
  });

  ipcMain.handle('auth-update-profile', async (event, payload: { name: string }): Promise<AuthResponse> => {
    if (!isValidSender(event)) throw new Error('Invalid sender');
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return { success: false, error: 'Not authenticated' };

    const nextName = String(payload?.name || '').trim();
    if (!nextName) return { success: false, error: 'Name is required' };

    dbRun('UPDATE users SET name = ?, updated_at = ? WHERE id = ?', [nextName, Date.now(), currentUserId]);
    const user = getUserById(currentUserId);
    if (!user) return { success: false, error: 'User not found' };

    return { success: true, user: toAuthUser(user) };
  });

  console.log('[AuthManager] Initialized');
}

export default { initAuthManager };

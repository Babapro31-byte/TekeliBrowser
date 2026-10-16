import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BYTES = 1_000_000;
const KEEP_FILES = 3;

let logPath = '';
let queue: string[] = [];
let flushing = false;
let patched = false;

/** Strip query/hash from URLs so logs never carry browsing detail. */
export function redactUrls(text: string): string {
  return text.replace(/\bhttps?:\/\/[^\s"'<>)]+/gi, (m) => {
    try {
      const u = new URL(m);
      return `${u.origin}${u.pathname === '/' ? '' : u.pathname}`;
    } catch {
      return m;
    }
  });
}

export function formatArg(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.stack || `${a.name}: ${a.message}`;
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

function resolveLogPath(): string {
  if (!logPath) logPath = path.join(app.getPath('userData'), 'tekeli.log');
  return logPath;
}

function rotateIfNeeded(file: string): void {
  try {
    if (fs.statSync(file).size < MAX_BYTES) return;
  } catch {
    return;
  }
  for (let i = KEEP_FILES - 1; i >= 1; i--) {
    try { fs.renameSync(`${file}.${i}`, `${file}.${i + 1}`); } catch { /* missing */ }
  }
  try { fs.renameSync(file, `${file}.1`); } catch { /* ignore */ }
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const chunk = queue.join('');
  queue = [];
  try {
    const file = resolveLogPath();
    rotateIfNeeded(file);
    await fs.promises.appendFile(file, chunk, 'utf-8');
  } catch {
    /* logging must never throw */
  } finally {
    flushing = false;
    if (queue.length > 0) void flush();
  }
}

function write(level: string, args: unknown[]): void {
  const line = `[${new Date().toISOString()}] ${level} ${redactUrls(args.map(formatArg).join(' '))}\n`;
  queue.push(line);
  void flush();
}

export const log = {
  info: (...args: unknown[]) => write('INFO', args),
  warn: (...args: unknown[]) => write('WARN', args),
  error: (...args: unknown[]) => write('ERROR', args),
};

/** Mirror console.* into the log file (async, rotated, stack-aware). Idempotent. */
export function installConsoleLogging(): void {
  if (patched) return;
  patched = true;
  const orig = { log: console.log, warn: console.warn, error: console.error };
  console.log = (...a: unknown[]) => { orig.log(...a); write('INFO', a); };
  console.warn = (...a: unknown[]) => { orig.warn(...a); write('WARN', a); };
  console.error = (...a: unknown[]) => { orig.error(...a); write('ERROR', a); };
}

export function flushLogsSync(): void {
  if (queue.length === 0) return;
  try {
    fs.appendFileSync(resolveLogPath(), queue.join(''), 'utf-8');
  } catch { /* ignore */ }
  queue = [];
}

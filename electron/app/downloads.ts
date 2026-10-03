/** Downloads for every web session: progress, pause/resume/cancel, open, show in folder, persistence. */
import { app, dialog, shell, type DownloadItem, type Session } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { currentLang } from './settingsStore';
import { handle } from '../core/ipc';
import { log } from '../core/logger';
import { broadcast } from './window';

export type DownloadState = 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';

export interface DownloadInfo {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  received: number;
  total: number;
  state: DownloadState;
  startedAt: number;
  endedAt?: number;
  dangerous: boolean;
}

const DANGEROUS = new Set(['.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.ps1', '.vbs', '.js', '.jse', '.wsf', '.jar', '.lnk', '.reg', '.hta', '.dll', '.apk', '.dmg', '.pkg', '.sh', '.appimage']);
const MAX_KEPT = 100;

const records = new Map<string, DownloadInfo>();
const live = new Map<string, DownloadItem>();
let loaded = false;
let saveTimer: NodeJS.Timeout | null = null;
let emitTimer: NodeJS.Timeout | null = null;

const storeFile = () => path.join(app.getPath('userData'), 'downloads.json');

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+/, '').replace(/[. ]+$/, '').slice(0, 180);
  return cleaned || 'download';
}

export function uniquePath(dir: string, filename: string, exists: (p: string) => boolean = fs.existsSync): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  for (let i = 1; exists(candidate); i++) candidate = path.join(dir, `${base} (${i})${ext}`);
  return candidate;
}

export const isDangerous = (filename: string): boolean => DANGEROUS.has(path.extname(filename).toLowerCase());

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    const arr = JSON.parse(fs.readFileSync(storeFile(), 'utf-8')) as DownloadInfo[];
    for (const r of arr.slice(0, MAX_KEPT)) {
      if (!r?.id || !r.savePath) continue;
      records.set(r.id, { ...r, state: r.state === 'progressing' || r.state === 'paused' ? 'interrupted' : r.state });
    }
  } catch { /* first run */ }
}

function persistSoon(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const list = [...records.values()].sort((a, b) => b.startedAt - a.startedAt).slice(0, MAX_KEPT);
      fs.writeFileSync(storeFile(), JSON.stringify(list));
    } catch (err) { log.warn('[downloads] save failed:', err); }
  }, 500);
}

export const listDownloads = (): DownloadInfo[] => [...records.values()].sort((a, b) => b.startedAt - a.startedAt);

function emitSoon(): void {
  if (emitTimer) return;
  emitTimer = setTimeout(() => { emitTimer = null; broadcast('downloads:changed', listDownloads()); }, 250);
}

export function attachDownloads(ses: Session, isPrivate: boolean): void {
  load();
  ses.on('will-download', (_event, item) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const filename = sanitizeFilename(item.getFilename());
    const savePath = uniquePath(app.getPath('downloads'), filename);
    item.setSavePath(savePath);

    const info: DownloadInfo = {
      id, url: item.getURL(), filename: path.basename(savePath), savePath,
      received: 0, total: item.getTotalBytes(), state: 'progressing', startedAt: Date.now(), dangerous: isDangerous(filename),
    };
    records.set(id, info);
    live.set(id, item);
    emitSoon();

    item.on('updated', (_e, state) => {
      info.received = item.getReceivedBytes();
      info.total = item.getTotalBytes();
      info.state = state === 'interrupted' ? 'interrupted' : item.isPaused() ? 'paused' : 'progressing';
      emitSoon();
    });
    item.once('done', (_e, state) => {
      live.delete(id);
      info.received = item.getReceivedBytes();
      info.state = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted';
      info.endedAt = Date.now();
      if (isPrivate) { /* kept in memory only for this run */ } else persistSoon();
      emitSoon();
    });
  });
}

type Action = 'pause' | 'resume' | 'cancel' | 'open' | 'show' | 'remove' | 'clear' | 'open-folder';

async function confirmOpen(info: DownloadInfo): Promise<boolean> {
  if (!info.dangerous) return true;
  const tr = currentLang() === 'tr';
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    buttons: [tr ? 'İptal' : 'Cancel', tr ? 'Yine de aç' : 'Open anyway'],
    defaultId: 0,
    cancelId: 0,
    title: tr ? 'Çalıştırılabilir dosya' : 'Executable file',
    message: tr ? `${info.filename} çalıştırılabilir bir dosya.` : `${info.filename} is an executable file.`,
    detail: tr ? 'Yalnızca güvendiğin kaynaklardan gelen dosyaları aç.' : 'Only open files from sources you trust.',
  });
  return response === 1;
}

export function registerDownloadsIpc(): void {
  load();
  handle('downloads:list', () => ({ items: listDownloads() }));
  handle('downloads:do', async (_e, cmd: { id?: string; action: Action }) => {
    const action = cmd?.action;
    if (action === 'clear') {
      for (const [id, r] of records) if (!live.has(id) && r.state !== 'progressing' && r.state !== 'paused') records.delete(id);
      persistSoon(); emitSoon();
      return { ok: true };
    }
    if (action === 'open-folder') { void shell.openPath(app.getPath('downloads')); return { ok: true }; }
    const id = typeof cmd?.id === 'string' ? cmd.id : '';
    const info = records.get(id);
    if (!info) return { ok: false };
    const item = live.get(id);
    switch (action) {
      case 'pause': item?.pause(); break;
      case 'resume': if (item?.canResume()) item.resume(); break;
      case 'cancel': item?.cancel(); break;
      case 'show': if (fs.existsSync(info.savePath)) shell.showItemInFolder(info.savePath); break;
      case 'open': if (info.state === 'completed' && fs.existsSync(info.savePath) && (await confirmOpen(info))) void shell.openPath(info.savePath); break;
      case 'remove': item?.cancel(); records.delete(id); persistSoon(); break;
      default: return { ok: false };
    }
    emitSoon();
    return { ok: true };
  });
}

/** Per-session hardening applied to every web session (normal and private). */
import { app, type Session } from 'electron';
import type { Settings } from '../../shared/settings';
import path from 'node:path';
import { attachTekeliProtocol } from './protocol';
import { installPipeline } from '../privacy/pipeline';
import { log } from '../core/logger';

/** Drop the Electron/app tokens so the UA matches a real Chromium (client hints stay consistent). */
export function cleanUserAgent(ua: string): string {
  return ua.replace(/\s?Electron\/\S+/gi, '').replace(/\s?(tekeli-browser|TekeliBrowser)\/\S+/gi, '');
}

/** Permissions granted without asking. Everything else is denied until the permission UI lands. */
const SAFE_PERMISSIONS = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock', 'keyboardLock']);

export function configureSession(ses: Session): void {
  attachTekeliProtocol(ses);
  ses.setUserAgent(cleanUserAgent(ses.getUserAgent()));
  ses.setPermissionRequestHandler((_wc, permission, callback) => callback(SAFE_PERMISSIONS.has(permission)));
  ses.setPermissionCheckHandler((_wc, permission) => SAFE_PERMISSIONS.has(permission));
  installPipeline(ses);
  for (const file of ['adblock-preload.cjs', 'privacy-preload.cjs']) {
    try { ses.registerPreloadScript({ type: 'frame', filePath: path.join(__dirname, file) }); }
    catch (err) { log.error(`[session] preload ${file} failed:`, err); }
  }
}

const DOH_SERVERS: Record<Settings['dohProvider'], string> = {
  cloudflare: 'https://cloudflare-dns.com/dns-query',
  google: 'https://dns.google/dns-query',
  quad9: 'https://dns.quad9.net/dns-query',
};

export function applyDoh(s: Pick<Settings, 'dohMode' | 'dohProvider'>): void {
  if (s.dohMode === 'off') {
    app.configureHostResolver({ secureDnsMode: 'off' });
    return;
  }
  app.configureHostResolver({ secureDnsMode: s.dohMode, secureDnsServers: [DOH_SERVERS[s.dohProvider]] });
}

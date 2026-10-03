/**
 * tekeli:// serves the app's own UI (chrome, overlay and internal pages).
 *   tekeli://chrome            -> chrome.html   (window toolbar + tab strip)
 *   tekeli://overlay           -> overlay.html  (menus / popovers)
 *   tekeli://<page>[/<sub>]    -> pages.html    (newtab, settings, history, ...)
 *   tekeli://<host>/assets/... -> static files
 * Production reads from dist/; dev proxies to the Vite server.
 */
import { net, protocol, session, type Session } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { INTERNAL_PAGES } from '../../shared/url';

// Must run before app 'ready'.
protocol.registerSchemesAsPrivileged([
  { scheme: 'tekeli', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false } },
]);

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const NO_EMBED_DEST = new Set(['iframe', 'frame', 'embed', 'object']);

export function entryFor(host: string): 'chrome.html' | 'overlay.html' | 'pages.html' | null {
  if (host === 'chrome') return 'chrome.html';
  if (host === 'overlay') return 'overlay.html';
  if ((INTERNAL_PAGES as readonly string[]).includes(host)) return 'pages.html';
  return null;
}

/** Resolve a request path inside `root`, refusing anything that escapes it. */
export function safeJoin(root: string, requestPath: string): string | null {
  let decoded: string;
  try { decoded = decodeURIComponent(requestPath); } catch { return null; }
  const target = path.normalize(path.join(root, decoded));
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

let distRoot = '';

/** Handlers are per-session: chrome uses the default session, tabs use their own partition. */
export function attachTekeliProtocol(ses: Session): void {
  if (ses.protocol.isProtocolHandled('tekeli')) return;
  const distDir = distRoot;
  const devUrl = process.env.VITE_DEV_SERVER_URL;

  ses.protocol.handle('tekeli', async (request) => {
    // App pages are never meant to be embedded by web content.
    const dest = request.headers.get('sec-fetch-dest');
    if (dest && NO_EMBED_DEST.has(dest)) return new Response('Forbidden', { status: 403 });

    const url = new URL(request.url);
    const entry = entryFor(url.hostname);
    const isAsset =
      /\.[a-z0-9]+$/i.test(url.pathname) ||
      ['/assets/', '/src/', '/@', '/node_modules/', '/shared/'].some((p) => url.pathname.startsWith(p));

    if (devUrl) {
      const target = isAsset ? `${devUrl}${url.pathname}${url.search}` : `${devUrl}/${entry ?? 'pages.html'}`;
      return net.fetch(target);
    }

    let file: string | null;
    if (isAsset) file = safeJoin(distDir, url.pathname);
    else if (entry) file = path.join(distDir, entry);
    else return new Response('Not found', { status: 404 });

    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('Not found', { status: 404 });

    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    headers.set('Content-Security-Policy', CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('Cache-Control', 'no-store');
    return new Response(res.body, { status: res.status, headers });
  });
}

export function registerTekeliProtocol(distDir: string): void {
  distRoot = distDir;
  attachTekeliProtocol(session.defaultSession);
}

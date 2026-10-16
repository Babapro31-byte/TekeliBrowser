/** Decisions for password autofill. Pure (no Electron imports) so they can be unit-tested. */

export function httpOrigin(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin : null;
  } catch {
    return null;
  }
}

/** Page URL without its #fragment: a login offer stays valid across hash changes only. */
export function withoutHash(url: string): string {
  const i = url.indexOf('#');
  return i === -1 ? url : url.slice(0, i);
}

/**
 * Credentials may only reach a page whose exact origin (scheme + host + port) is the one they were saved for,
 * and only the top frame: never an iframe, never a lookalike or subdomain.
 */
export function canFillFor(frameUrl: string, savedOrigin: string, isTopFrame: boolean): boolean {
  if (!isTopFrame) return false;
  const origin = httpOrigin(frameUrl);
  return origin !== null && origin === savedOrigin;
}

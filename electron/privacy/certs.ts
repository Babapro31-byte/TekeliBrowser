/**
 * Certificate errors are never accepted automatically. The tab shows an interstitial
 * (tekeli://error?kind=cert); only an explicit "continue" adds the host here, for this app run.
 */
import { app } from 'electron';

const exceptions = new Set<string>();

export function allowCertException(host: string): void {
  if (host) exceptions.add(host.toLowerCase());
}

export const hasCertException = (host: string): boolean => exceptions.has(host.toLowerCase());

export function installCertHandler(): void {
  app.on('certificate-error', (event, _wc, url, _error, _cert, callback) => {
    event.preventDefault();
    let host = '';
    try { host = new URL(url).hostname; } catch { /* invalid url: reject */ }
    callback(hasCertException(host));
  });
}

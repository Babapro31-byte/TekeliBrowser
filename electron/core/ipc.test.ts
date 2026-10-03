import { beforeEach, describe, expect, it } from 'vitest';
import { __resetIpcForTests, addTrustedOrigin, isTrustedSender, trustWebContents } from './ipc';

const ev = (id: number, url?: string) => ({ sender: { id }, senderFrame: url ? { url } : null });

describe('isTrustedSender', () => {
  beforeEach(() => __resetIpcForTests());

  it('trusts tekeli://app frames regardless of webContents id', () => {
    expect(isTrustedSender(ev(99, 'tekeli://app/settings'), undefined)).toBe(true);
  });

  it('rejects arbitrary web pages', () => {
    expect(isTrustedSender(ev(5, 'https://evil.example/'), undefined)).toBe(false);
  });

  it('rejects the substring tricks the old validator accepted', () => {
    expect(isTrustedSender(ev(5, 'https://evil.example/?localhost'), undefined)).toBe(false);
    expect(isTrustedSender(ev(5, 'https://localhost.evil.example/'), undefined)).toBe(false);
    expect(isTrustedSender(ev(5, 'http://127.0.0.1.evil.example/'), undefined)).toBe(false);
  });

  it('trusts a registered chrome webContents only on an app origin', () => {
    trustWebContents(7);
    expect(isTrustedSender(ev(7, 'tekeli://app/chrome'), undefined)).toBe(true);
    expect(isTrustedSender(ev(7, 'https://evil.example/'), undefined)).toBe(false);
  });

  it('allows the dev server origin only when configured', () => {
    trustWebContents(7);
    expect(isTrustedSender(ev(7, 'http://localhost:5173/index.html'), 'http://localhost:5173')).toBe(true);
    expect(isTrustedSender(ev(7, 'http://localhost:5173/index.html'), undefined)).toBe(false);
    expect(isTrustedSender(ev(8, 'http://localhost:5173/index.html'), 'http://localhost:5173')).toBe(false);
  });

  it('honors additional trusted origins', () => {
    addTrustedOrigin('tekeli://overlay');
    expect(isTrustedSender(ev(1, 'tekeli://overlay/x'), undefined)).toBe(true);
  });

  it('falls back to webContents id when no frame url is available', () => {
    trustWebContents(3);
    expect(isTrustedSender(ev(3), undefined)).toBe(true);
    expect(isTrustedSender(ev(4), undefined)).toBe(false);
  });
});

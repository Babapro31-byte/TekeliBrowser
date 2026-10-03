import { describe, expect, it } from 'vitest';
import { formatArg, redactUrls } from './logger';

describe('redactUrls', () => {
  it('drops query strings and fragments', () => {
    expect(redactUrls('GET https://example.com/a/b?token=secret&x=1#frag ok')).toBe('GET https://example.com/a/b ok');
  });

  it('keeps bare origins tidy', () => {
    expect(redactUrls('visit https://example.com/?q=1')).toBe('visit https://example.com');
  });

  it('leaves non-url text alone', () => {
    expect(redactUrls('no urls here')).toBe('no urls here');
  });
});

describe('formatArg', () => {
  it('serializes Error with its stack instead of {}', () => {
    const out = formatArg(new Error('boom'));
    expect(out).toContain('boom');
    expect(out).not.toBe('{}');
  });

  it('serializes objects as JSON and survives cycles', () => {
    expect(formatArg({ a: 1 })).toBe('{"a":1}');
    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    expect(typeof formatArg(cyc)).toBe('string');
  });
});

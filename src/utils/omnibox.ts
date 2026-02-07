import type { SearchEngine } from '../types/electron';

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const q = encodeURIComponent(query);
  if (engine === 'google') return `https://www.google.com/search?q=${q}`;
  return `https://duckduckgo.com/?q=${q}`;
}

function hasUrlScheme(input: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input);
}

function looksLikeIPv4Host(host: string): boolean {
  const m = host.match(/^(\d{1,3})(\.\d{1,3}){3}$/);
  if (!m) return false;
  return host.split('.').every(part => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function looksLikeHostname(input: string): boolean {
  if (input.includes(' ')) return false;

  const withoutPath = input.split('/')[0];
  const [host] = withoutPath.split(':');
  if (!host) return false;

  if (host === 'localhost') return true;
  if (looksLikeIPv4Host(host)) return true;

  if (!host.includes('.')) return false;
  if (host.startsWith('.') || host.endsWith('.')) return false;

  const labels = host.split('.');
  if (labels.some(l => l.length === 0)) return false;
  if (labels.some(l => !/^[a-zA-Z0-9-]+$/.test(l))) return false;
  if (labels.some(l => l.startsWith('-') || l.endsWith('-'))) return false;

  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  return true;
}

export function resolveOmniboxInput(raw: string, engine: SearchEngine): string {
  const input = raw.trim();
  if (!input) return '';

  if (input.startsWith('tekeli://')) return input;
  if (input.startsWith('about:')) return input;
  if (hasUrlScheme(input)) return input;

  if (looksLikeHostname(input)) return `https://${input}`;

  return buildSearchUrl(engine, input);
}


/** Netscape bookmark HTML (what Chrome, Edge and Firefox export/import). Pure functions, no Electron imports. */

export interface IoBookmark {
  url: string;
  title: string;
  folder: string;
}

const MAX_ENTRIES = 5000;
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });

const encode = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

const stripTags = (s: string): string => s.replace(/<[^>]*>/g, '');

/** Only http(s) links are imported; javascript:, data:, file: and the like are dropped. */
const safeUrl = (raw: string): string | null => {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};

// ponytail: folders are flat. A nested folder is imported under its innermost name; add a path column if real nesting is needed.
export function parseNetscapeHtml(html: string): IoBookmark[] {
  const out: IoBookmark[] = [];
  const stack: string[] = [];
  let pending: string | null = null;
  const token = /<H3\b[^>]*>([\s\S]*?)<\/H3>|<A\b[^>]*?\bHREF\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/A>|<DL\b|<\/DL>/gi;
  for (let m = token.exec(html); m && out.length < MAX_ENTRIES; m = token.exec(html)) {
    const tag = m[0].slice(0, 3).toLowerCase();
    if (tag === '<h3') pending = decode(stripTags(m[1])).trim().slice(0, 100);
    else if (tag === '<dl') { stack.push(pending ?? stack[stack.length - 1] ?? ''); pending = null; }
    else if (tag === '</d') stack.pop();
    else {
      const url = safeUrl(decode(m[2]).trim());
      if (url) out.push({ url, title: decode(stripTags(m[3])).trim().slice(0, 500) || url, folder: stack[stack.length - 1] ?? '' });
    }
  }
  return out;
}

export function toNetscapeHtml(entries: IoBookmark[]): string {
  const link = (b: IoBookmark): string => `<DT><A HREF="${encode(b.url)}">${encode(b.title || b.url)}</A>`;
  const folders = [...new Set(entries.map((b) => b.folder).filter(Boolean))].sort();
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    ...entries.filter((b) => !b.folder).map(link),
    ...folders.flatMap((f) => [`<DT><H3>${encode(f)}</H3>`, '<DL><p>', ...entries.filter((b) => b.folder === f).map(link), '</DL><p>']),
    '</DL><p>',
  ];
  return lines.join('\n') + '\n';
}

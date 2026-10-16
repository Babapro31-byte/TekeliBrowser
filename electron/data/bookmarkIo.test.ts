import { describe, expect, it } from 'vitest';
import { parseNetscapeHtml, toNetscapeHtml } from './bookmarkIo';

const CHROME = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://root.example/" ADD_DATE="1">Root &amp; Co</A>
    <DT><H3 ADD_DATE="1">Work</H3>
    <DL><p>
        <DT><A HREF="https://work.example/a?x=1&amp;y=2">Work A</A>
        <DT><H3>Deep</H3>
        <DL><p>
            <DT><A HREF="https://deep.example/">Deep</A>
        </DL><p>
        <DT><A HREF="https://work.example/b">Work B</A>
    </DL><p>
</DL><p>`;

describe('parseNetscapeHtml', () => {
  it('reads links with folders and decodes entities', () => {
    expect(parseNetscapeHtml(CHROME)).toEqual([
      { url: 'https://root.example/', title: 'Root & Co', folder: '' },
      { url: 'https://work.example/a?x=1&y=2', title: 'Work A', folder: 'Work' },
      { url: 'https://deep.example/', title: 'Deep', folder: 'Deep' },
      { url: 'https://work.example/b', title: 'Work B', folder: 'Work' },
    ]);
  });

  it('drops non-http(s) and malformed links', () => {
    const html = '<DL><DT><A HREF="javascript:alert(1)">x</A><DT><A HREF="file:///c:/a">y</A><DT><A HREF="not a url">z</A><DT><A HREF="http://ok.example">ok</A></DL>';
    expect(parseNetscapeHtml(html).map((b) => b.url)).toEqual(['http://ok.example/']);
  });

  it('falls back to the url when the title is empty', () => {
    expect(parseNetscapeHtml('<DL><DT><A HREF="https://a.example/"></A></DL>')[0].title).toBe('https://a.example/');
  });
});

describe('toNetscapeHtml', () => {
  it('round-trips and escapes', () => {
    const items = [
      { url: 'https://a.example/?q="1"&r=<2>', title: 'A <b> & "c"', folder: '' },
      { url: 'https://b.example/', title: 'B', folder: 'Reading' },
    ];
    const back = parseNetscapeHtml(toNetscapeHtml(items));
    expect(back.map((b) => [b.title, b.folder])).toEqual([['A <b> & "c"', ''], ['B', 'Reading']]);
    expect(back.map((b) => new URL(b.url).search)).toEqual([new URL(items[0].url).search, '']);
  });
});

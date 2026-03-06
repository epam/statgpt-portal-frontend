import { linkifyText } from './linkify';

describe('linkifyText', () => {
  it('returns empty text part for empty input', () => {
    expect(linkifyText('')).toEqual([{ type: 'text', value: '' }]);
  });

  it('returns single text part when no urls', () => {
    expect(linkifyText('hello world')).toEqual([
      { type: 'text', value: 'hello world' },
    ]);
  });

  it('linkifies a single URL in the middle', () => {
    expect(linkifyText('See https://example.com now')).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: ' now' },
    ]);
  });

  it('handles url at start', () => {
    expect(linkifyText('https://example.com is here')).toEqual([
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: ' is here' },
    ]);
  });

  it('handles url at end', () => {
    expect(linkifyText('Go https://example.com')).toEqual([
      { type: 'text', value: 'Go ' },
      { type: 'link', value: 'https://example.com' },
    ]);
  });

  it('linkifies multiple URLs', () => {
    expect(linkifyText('A https://a.com B https://b.com C')).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'link', value: 'https://a.com' },
      { type: 'text', value: ' B ' },
      { type: 'link', value: 'https://b.com' },
      { type: 'text', value: ' C' },
    ]);
  });

  it('trims trailing punctuation: period', () => {
    expect(linkifyText('Docs: https://example.com.')).toEqual([
      { type: 'text', value: 'Docs: ' },
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: '.' },
    ]);
  });

  it('trims trailing punctuation: multiple chars', () => {
    expect(linkifyText('See https://example.com), ok')).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: '),' },
      { type: 'text', value: ' ok' },
    ]);
  });

  it('keeps query and hash, trims punctuation after them', () => {
    expect(linkifyText('Open https://example.com/a?b=1&c=2#top.')).toEqual([
      { type: 'text', value: 'Open ' },
      { type: 'link', value: 'https://example.com/a?b=1&c=2#top' },
      { type: 'text', value: '.' },
    ]);
  });

  it('does not linkify "www." without protocol', () => {
    expect(linkifyText('go to www.example.com please')).toEqual([
      { type: 'text', value: 'go to www.example.com please' },
    ]);
  });

  it('does not include angle brackets or quotes in the url (regex stops before them)', () => {
    expect(
      linkifyText('See <https://example.com> and "https://a.com"'),
    ).toEqual([
      { type: 'text', value: 'See <' },
      { type: 'link', value: 'https://example.com' },
      { type: 'text', value: '> and "' },
      { type: 'link', value: 'https://a.com' },
      { type: 'text', value: '"' },
    ]);
  });

  it('is stable across repeated calls (no regex shared state)', () => {
    const a = linkifyText('A https://a.com.');
    const b = linkifyText('B https://b.com.');

    expect(a).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'link', value: 'https://a.com' },
      { type: 'text', value: '.' },
    ]);

    expect(b).toEqual([
      { type: 'text', value: 'B ' },
      { type: 'link', value: 'https://b.com' },
      { type: 'text', value: '.' },
    ]);
  });
});

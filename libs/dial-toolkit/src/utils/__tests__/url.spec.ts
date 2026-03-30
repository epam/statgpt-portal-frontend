import { encodeApiUrl, decodeApiUrl } from '../url';

// ---------------------------------------------------------------------------
// encodeApiUrl
// ---------------------------------------------------------------------------

describe('encodeApiUrl', () => {
  it('returns an empty string unchanged', () => {
    expect(encodeApiUrl('')).toBe('');
  });

  it('encodes a single path segment with no special characters', () => {
    expect(encodeApiUrl('simple')).toBe('simple');
  });

  it('encodes spaces in a single segment', () => {
    expect(encodeApiUrl('hello world')).toBe('hello%20world');
  });

  it('preserves slashes as path separators and encodes each segment independently', () => {
    expect(encodeApiUrl('foo/bar')).toBe('foo/bar');
  });

  it('encodes special characters inside each segment', () => {
    expect(encodeApiUrl('a b/c d')).toBe('a%20b/c%20d');
  });

  it('encodes percent signs', () => {
    expect(encodeApiUrl('100%/done')).toBe('100%25/done');
  });

  it('encodes question marks and hash symbols within a segment', () => {
    expect(encodeApiUrl('search?q=1/hash#anchor')).toBe(
      'search%3Fq%3D1/hash%23anchor',
    );
  });

  it('handles a path with trailing slash', () => {
    expect(encodeApiUrl('foo/')).toBe('foo/');
  });

  it('handles a path with leading slash', () => {
    expect(encodeApiUrl('/foo')).toBe('/foo');
  });

  it('encodes unicode characters', () => {
    expect(encodeApiUrl('café/résumé')).toBe('caf%C3%A9/r%C3%A9sum%C3%A9');
  });
});

// ---------------------------------------------------------------------------
// decodeApiUrl
// ---------------------------------------------------------------------------

describe('decodeApiUrl', () => {
  it('returns an empty string unchanged', () => {
    expect(decodeApiUrl('')).toBe('');
  });

  it('returns a plain path unchanged', () => {
    expect(decodeApiUrl('simple')).toBe('simple');
  });

  it('decodes a percent-encoded space', () => {
    expect(decodeApiUrl('hello%20world')).toBe('hello world');
  });

  it('preserves slashes as path separators and decodes each segment independently', () => {
    expect(decodeApiUrl('foo/bar')).toBe('foo/bar');
  });

  it('decodes special characters in each segment', () => {
    expect(decodeApiUrl('a%20b/c%20d')).toBe('a b/c d');
  });

  it('decodes percent-encoded percent signs', () => {
    expect(decodeApiUrl('100%25/done')).toBe('100%/done');
  });

  it('decodes multiple special characters in a single segment', () => {
    expect(decodeApiUrl('search%3Fq%3D1/hash%23anchor')).toBe(
      'search?q=1/hash#anchor',
    );
  });

  it('handles a path with trailing slash', () => {
    expect(decodeApiUrl('foo/')).toBe('foo/');
  });

  it('handles a path with leading slash', () => {
    expect(decodeApiUrl('/foo')).toBe('/foo');
  });

  it('decodes unicode escape sequences', () => {
    expect(decodeApiUrl('caf%C3%A9/r%C3%A9sum%C3%A9')).toBe('café/résumé');
  });
});

// ---------------------------------------------------------------------------
// roundtrip
// ---------------------------------------------------------------------------

describe('encodeApiUrl / decodeApiUrl roundtrip', () => {
  it('roundtrips a path with spaces', () => {
    const original = 'folder one/file two';
    expect(decodeApiUrl(encodeApiUrl(original))).toBe(original);
  });

  it('roundtrips a path with unicode characters', () => {
    const original = 'données/résumé';
    expect(decodeApiUrl(encodeApiUrl(original))).toBe(original);
  });

  it('roundtrips a path with special URL characters', () => {
    const original = 'search?q=hello/hash#value&x=1';
    expect(decodeApiUrl(encodeApiUrl(original))).toBe(original);
  });
});

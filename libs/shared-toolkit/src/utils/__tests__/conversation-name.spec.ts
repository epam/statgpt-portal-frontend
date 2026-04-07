import {
  deleteConversationNamePostfix,
  getClearedConversationName,
} from '../conversation-name';

// ---------------------------------------------------------------------------
// deleteConversationNamePostfix
// ---------------------------------------------------------------------------

describe('deleteConversationNamePostfix', () => {
  it('removes a numeric postfix preceded by a hyphen', () => {
    expect(deleteConversationNamePostfix('my-conversation-42')).toBe(
      'my-conversation',
    );
  });

  it('removes only the last numeric postfix', () => {
    expect(deleteConversationNamePostfix('chat-1-2')).toBe('chat-1');
  });

  it('returns the full name when there is no numeric postfix', () => {
    expect(deleteConversationNamePostfix('hello-world')).toBe('hello-world');
  });

  it('returns an empty string for undefined input', () => {
    expect(deleteConversationNamePostfix(undefined)).toBe('');
  });

  it('returns the name unchanged when it ends with non-numeric characters after hyphen', () => {
    expect(deleteConversationNamePostfix('report-abc')).toBe('report-abc');
  });

  it('handles a name that is only a numeric postfix pattern', () => {
    expect(deleteConversationNamePostfix('-123')).toBe('');
  });

  it('returns an empty string for an empty string input', () => {
    expect(deleteConversationNamePostfix('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getClearedConversationName
// ---------------------------------------------------------------------------

describe('getClearedConversationName', () => {
  it('lowercases and normalises whitespace to single spaces', () => {
    expect(getClearedConversationName('Hello  World')).toBe('hello world');
  });

  it('strips leading and trailing non-alphanumeric characters', () => {
    expect(getClearedConversationName('--Hello--')).toBe('hello');
  });

  it('replaces punctuation and symbols with spaces', () => {
    expect(getClearedConversationName('foo@bar!baz')).toBe('foo bar baz');
  });

  it('preserves unicode letters and digits', () => {
    expect(getClearedConversationName('Ünïcödé 123')).toBe('ünïcödé 123');
  });

  it('returns an empty string for undefined input', () => {
    expect(getClearedConversationName(undefined)).toBe('');
  });

  it('returns an empty string for an empty string input', () => {
    expect(getClearedConversationName('')).toBe('');
  });

  it('returns an empty string when input contains only symbols', () => {
    expect(getClearedConversationName('!@#$%^&*()')).toBe('');
  });

  it('collapses multiple consecutive separators into a single space', () => {
    expect(getClearedConversationName('a---b___c')).toBe('a b c');
  });

  it('handles a realistic conversation name', () => {
    expect(
      getClearedConversationName('  GDP Growth (2024) — Analysis!  '),
    ).toBe('gdp growth 2024 analysis');
  });
});

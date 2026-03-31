import { unwrapMarkdownCode } from '../unwrap-markdown-code';

// ---------------------------------------------------------------------------
// unwrapMarkdownCode
// ---------------------------------------------------------------------------

describe('unwrapMarkdownCode', () => {
  // -------------------------------------------------------------------------
  // Non-fenced input — returned as-is
  // -------------------------------------------------------------------------

  it('returns the input as code when the string does not start with ```', () => {
    expect(unwrapMarkdownCode('plain text')).toEqual({ code: 'plain text' });
  });

  it('returns no language when the input is not fenced', () => {
    expect(unwrapMarkdownCode('hello')).not.toHaveProperty('language');
  });

  it('returns the original input (not a modified copy) when not fenced', () => {
    const input = 'some code';
    expect(unwrapMarkdownCode(input).code).toBe(input);
  });

  // -------------------------------------------------------------------------
  // Fenced input — with closing fence
  // -------------------------------------------------------------------------

  it('extracts code between opening and closing fences', () => {
    const input = '```\nconst x = 1;\n```';
    expect(unwrapMarkdownCode(input)).toEqual({ code: 'const x = 1;', language: undefined });
  });

  it('extracts the language tag from the opening fence line', () => {
    const input = '```typescript\nconst x = 1;\n```';
    expect(unwrapMarkdownCode(input)).toEqual({ code: 'const x = 1;', language: 'typescript' });
  });

  it('trims whitespace from the language tag', () => {
    const input = '```  js  \ncode\n```';
    expect(unwrapMarkdownCode(input).language).toBe('js');
  });

  it('sets language to undefined when the opening fence has no language tag', () => {
    const input = '```\ncode\n```';
    expect(unwrapMarkdownCode(input).language).toBeUndefined();
  });

  it('preserves internal newlines within the code block', () => {
    const input = '```\nline1\nline2\nline3\n```';
    expect(unwrapMarkdownCode(input).code).toBe('line1\nline2\nline3');
  });

  it('excludes the closing ``` line from the extracted code', () => {
    const input = '```\ncode\n```';
    expect(unwrapMarkdownCode(input).code).toBe('code');
  });

  it('uses the last ``` as the closing fence when there are multiple fences inside', () => {
    const input = '```\nfirst\n```\nsecond\n```';
    expect(unwrapMarkdownCode(input).code).toBe('first\n```\nsecond');
  });

  it('extracts an empty string when the fenced block contains no code lines', () => {
    const input = '```\n```';
    expect(unwrapMarkdownCode(input).code).toBe('');
  });

  // -------------------------------------------------------------------------
  // Fenced input — without closing fence
  // -------------------------------------------------------------------------

  it('returns everything after the opening fence when there is no closing ```', () => {
    const input = '```\nno closing fence';
    expect(unwrapMarkdownCode(input)).toEqual({
      code: 'no closing fence',
      language: undefined,
    });
  });

  it('includes the language when there is no closing fence', () => {
    const input = '```python\nprint("hi")';
    expect(unwrapMarkdownCode(input)).toEqual({
      code: 'print("hi")',
      language: 'python',
    });
  });

  // -------------------------------------------------------------------------
  // Windows-style line endings (\r\n)
  // -------------------------------------------------------------------------

  it('normalises \\r\\n to \\n before processing', () => {
    const input = '```typescript\r\nconst x = 1;\r\n```';
    expect(unwrapMarkdownCode(input)).toEqual({ code: 'const x = 1;', language: 'typescript' });
  });

  it('handles plain text with \\r\\n without treating it as fenced', () => {
    const input = 'just text\r\nmore text';
    expect(unwrapMarkdownCode(input).code).toBe('just text\r\nmore text');
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it('returns an empty code string for an empty input', () => {
    expect(unwrapMarkdownCode('')).toEqual({ code: '' });
  });

  it('handles a fenced block that is only the opening fence with no lines after', () => {
    const input = '```typescript';
    expect(unwrapMarkdownCode(input)).toEqual({ code: '', language: 'typescript' });
  });

  it('ignores a closing fence that appears with surrounding whitespace on the same line', () => {
    // Lines like "  ```  " (with spaces) are NOT a valid closing fence per the implementation
    // (it uses .trim() === '```'), so they ARE treated as closing fences.
    const input = '```\ncode\n  ```  ';
    expect(unwrapMarkdownCode(input).code).toBe('code');
  });
});

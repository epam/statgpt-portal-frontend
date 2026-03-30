import { isError } from '../is-error';

// ---------------------------------------------------------------------------
// isError
// ---------------------------------------------------------------------------

describe('isError', () => {
  it('returns true for an Error whose message contains "404"', () => {
    expect(isError(new Error('Not found 404'))).toBe(true);
  });

  it('returns true when the message is exactly "404"', () => {
    expect(isError(new Error('404'))).toBe(true);
  });

  it('returns false for an Error whose message does not contain "404"', () => {
    expect(isError(new Error('Internal Server Error'))).toBe(false);
  });

  it('returns false for an Error with an empty message', () => {
    expect(isError(new Error(''))).toBe(false);
  });

  it('returns false for a plain string that contains "404"', () => {
    expect(isError('404')).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(isError({ message: '404' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isError(undefined)).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isError(404)).toBe(false);
  });
});

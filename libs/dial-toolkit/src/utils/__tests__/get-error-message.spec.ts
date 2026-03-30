import { getErrorMessage } from '../get-error-message';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeResponse = (status: number, statusText: string): Response =>
  ({ status, statusText }) as unknown as Response;

const makeData = (
  overrides: Partial<{ data: unknown; error?: string; message?: string }> = {},
): { data: unknown; error?: string; message?: string } => ({
  data: null,
  ...overrides,
});

// ---------------------------------------------------------------------------
// getErrorMessage
// ---------------------------------------------------------------------------

describe('getErrorMessage', () => {
  it('returns the error field when present', () => {
    const response = makeResponse(400, 'Bad Request');
    const data = makeData({ error: 'explicit error' });
    expect(getErrorMessage(data, response)).toBe('explicit error');
  });

  it('returns the message field when error is absent', () => {
    const response = makeResponse(400, 'Bad Request');
    const data = makeData({ message: 'fallback message' });
    expect(getErrorMessage(data, response)).toBe('fallback message');
  });

  it('prefers error over message when both are present', () => {
    const response = makeResponse(400, 'Bad Request');
    const data = makeData({ error: 'error wins', message: 'message loses' });
    expect(getErrorMessage(data, response)).toBe('error wins');
  });

  it('falls back to status and statusText when neither error nor message is present', () => {
    const response = makeResponse(500, 'Internal Server Error');
    const data = makeData();
    expect(getErrorMessage(data, response)).toBe('500 Internal Server Error');
  });

  it('falls back to status and statusText when error is an empty string', () => {
    const response = makeResponse(503, 'Service Unavailable');
    const data = makeData({ error: '', message: '' });
    expect(getErrorMessage(data, response)).toBe('503 Service Unavailable');
  });

  it('uses message when error is an empty string but message is non-empty', () => {
    const response = makeResponse(422, 'Unprocessable Entity');
    const data = makeData({ error: '', message: 'validation failed' });
    expect(getErrorMessage(data, response)).toBe('validation failed');
  });

  it('composes status code and statusText with a space separator', () => {
    const response = makeResponse(404, 'Not Found');
    const data = makeData();
    expect(getErrorMessage(data, response)).toBe('404 Not Found');
  });
});

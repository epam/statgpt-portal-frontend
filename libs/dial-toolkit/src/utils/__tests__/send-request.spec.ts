import { sendRequest } from '../send-request';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeHeaders = (
  overrides: Record<string, string> = {},
): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...overrides,
});

const mockResponse = { ok: true, status: 200 } as Response;

// ---------------------------------------------------------------------------
// sendRequest
// ---------------------------------------------------------------------------

describe('sendRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls fetch with the provided url and headers', async () => {
    const headers = makeHeaders();
    await sendRequest('https://example.com/api', headers, { method: 'GET' });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ headers }),
    );
  });

  it('uses GET as the default method when method is not specified', async () => {
    await sendRequest('https://example.com/api', makeHeaders(), {});

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes the explicit method to fetch', async () => {
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'POST',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends body as JSON-stringified string when body is an object and isFormData is false', async () => {
    const body = { key: 'value' };
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'POST',
      body,
      isFormData: false,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ body: JSON.stringify(body) }),
    );
  });

  it('sends body as JSON-stringified string when isFormData is not set', async () => {
    const body = { name: 'test' };
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'POST',
      body,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ body: JSON.stringify(body) }),
    );
  });

  it('passes the body as-is when isFormData is true', async () => {
    const formData = new FormData();
    formData.append('file', 'blob');

    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'POST',
      body: formData,
      isFormData: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ body: formData }),
    );
  });

  it('sends undefined body when body is not set', async () => {
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'GET',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ body: undefined }),
    );
  });

  it('passes the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'GET',
      signal: controller.signal,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('passes undefined signal when no signal is provided', async () => {
    await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'GET',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({ signal: undefined }),
    );
  });

  it('returns the fetch response', async () => {
    const result = await sendRequest('https://example.com/api', makeHeaders(), {
      method: 'GET',
    });

    expect(result).toBe(mockResponse);
  });

  it('propagates errors thrown by fetch', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network failure'));

    await expect(
      sendRequest('https://example.com/api', makeHeaders(), { method: 'GET' }),
    ).rejects.toThrow('network failure');
  });
});

/// <reference types="jest" />
import { apiRequest, apiRequestVoid, apiRequestBlob } from '../api-client';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
    blob: () => Promise.resolve(new Blob([body])),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// handleErrorResponse (tested through apiRequest)
// ---------------------------------------------------------------------------

describe('handleErrorResponse', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns { success: true, data } when response.ok is true', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, '{"value":1}'));
    const result = await apiRequest<{ value: number }>(
      '/api/test',
      'fetch test',
    );
    expect(result).toEqual({ success: true, data: { value: 1 } });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('returns 401 short-circuit without reading the body', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, 'Unauthorized'));
    const result = await apiRequest('/api/test', 'fetch test');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 401,
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('returns success: false with message when body is JSON with an "error" field', async () => {
    const body = JSON.stringify({
      error: { message: 'upstream broke', code: 'ERR_UP' },
    });
    mockFetch.mockResolvedValue(makeResponse(503, body));

    const result = await apiRequest('/api/test', 'fetch test');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 503,
      message: 'fetch test: 503 Error',
    });
    expect(consoleSpy).toHaveBeenCalledWith('[API Error]', {
      operation: 'fetch test',
      status: 503,
      error: { message: 'upstream broke', code: 'ERR_UP' },
    });
  });

  it('returns success: false with message when JSON body has no "error" field', async () => {
    const body = JSON.stringify({ message: 'something went wrong' });
    mockFetch.mockResolvedValue(makeResponse(500, body));

    const result = await apiRequest('/api/test', 'fetch test');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 500,
      message: 'fetch test: 500 Error',
    });
    expect(consoleSpy).toHaveBeenCalledWith('[API Error]', {
      operation: 'fetch test',
      status: 500,
      error: { message: 'something went wrong' },
    });
  });

  it('returns success: false with message when body is not JSON', async () => {
    mockFetch.mockResolvedValue(makeResponse(502, 'Bad Gateway'));

    const result = await apiRequest('/api/test', 'fetch test');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 502,
      message: 'fetch test: 502 Error',
    });
    expect(consoleSpy).toHaveBeenCalledWith('[API Error]', {
      operation: 'fetch test',
      status: 502,
      error: 'Bad Gateway',
    });
  });
});

// ---------------------------------------------------------------------------
// buildFetchOptions (tested through apiRequest fetch call args)
// ---------------------------------------------------------------------------

describe('buildFetchOptions', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(makeResponse(200, '{}'));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('sends Content-Type: application/json and serialized body when body is present', async () => {
    await apiRequest('/api/test', 'test', {
      method: 'POST',
      body: { key: 'val' },
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'val' }),
    });
  });

  it('caller headers are merged after Content-Type, so caller can override it', async () => {
    await apiRequest('/api/test', 'test', {
      method: 'POST',
      body: { key: 'val' },
      headers: { 'Content-Type': 'text/plain', 'X-Custom': 'yes' },
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'X-Custom': 'yes' },
      body: JSON.stringify({ key: 'val' }),
    });
  });

  it('omits Content-Type when no body is present but passes custom headers', async () => {
    await apiRequest('/api/test', 'test', {
      method: 'GET',
      headers: { 'X-Token': 'abc' },
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: { 'X-Token': 'abc' },
    });
  });

  it('passes no headers when neither body nor headers are provided', async () => {
    await apiRequest('/api/test', 'test', { method: 'GET' });
    expect(mockFetch).toHaveBeenCalledWith('/api/test', { method: 'GET' });
  });
});

// ---------------------------------------------------------------------------
// apiRequestVoid
// ---------------------------------------------------------------------------

describe('apiRequestVoid', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns { success: true, data: undefined } on ok response', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, ''));
    const result = await apiRequestVoid('/api/test', 'test');
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('returns 401 short-circuit on unauthorized response', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, ''));
    const result = await apiRequestVoid('/api/test', 'test');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 401,
    });
  });
});

// ---------------------------------------------------------------------------
// apiRequestBlob
// ---------------------------------------------------------------------------

describe('apiRequestBlob', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns { success: true, data: Blob } on ok response', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, 'binary data'));
    const result = await apiRequestBlob('/api/file', 'fetch blob');
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('returns 401 short-circuit on unauthorized response', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, ''));
    const result = await apiRequestBlob('/api/file', 'fetch blob');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 401,
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('returns success: false with message on non-ok non-401 response', async () => {
    mockFetch.mockResolvedValue(makeResponse(404, 'Not Found'));
    const result = await apiRequestBlob('/api/file', 'fetch blob');
    expect(result).toEqual({
      success: false,
      data: undefined,
      statusCode: 404,
      message: 'fetch blob: 404 Error',
    });
    expect(consoleSpy).toHaveBeenCalledWith('[API Error]', {
      operation: 'fetch blob',
      status: 404,
      error: 'Not Found',
    });
  });
});

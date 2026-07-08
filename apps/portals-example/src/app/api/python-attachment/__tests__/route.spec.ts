/**
 * @jest-environment node
 */
/// <reference types="jest" />
import { NextRequest } from 'next/server';

jest.mock('../../../../utils/auth/withAuth', () => ({
  withAuth:
    (
      handler: (
        req: NextRequest,
        authParams: { token: { access_token: string } },
      ) => Promise<Response>,
    ) =>
    (req: NextRequest) =>
      handler(req, { token: { access_token: 'test-token' } }),
}));

const mockPostRequest = jest.fn();
jest.mock('../../api', () => ({
  dialApiClient: {
    postRequest: (...args: unknown[]) => mockPostRequest(...args),
  },
  DEFAULT_MODEL_ID: 'test-model',
}));

const mockApiLoggerWarn = jest.fn();
const mockApiLoggerError = jest.fn();
jest.mock('../../../../core/logger', () => ({
  apiLogger: {
    warn: (...args: unknown[]) => mockApiLoggerWarn(...args),
    error: (...args: unknown[]) => mockApiLoggerError(...args),
  },
}));

import { POST } from '../route';

function makeRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('POST /api/python-attachment', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPostRequest.mockReset();
    mockApiLoggerWarn.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the result on first-attempt success without retrying', async () => {
    mockPostRequest.mockResolvedValue({ python_code: 'print(1)' });

    const response = await POST(makeRequest({ queries: [] }));
    const json = await response.json();

    expect(json).toEqual({ python_code: 'print(1)' });
    expect(mockPostRequest).toHaveBeenCalledTimes(1);
    expect(mockApiLoggerWarn).not.toHaveBeenCalled();
  });

  it('retries once on a transient failure and returns the eventual success', async () => {
    mockPostRequest
      .mockRejectedValueOnce(
        new Error('API request failed: 500 Internal Server Error'),
      )
      .mockResolvedValueOnce({ python_code: 'print(2)' });

    const responsePromise = POST(makeRequest({ queries: [] }));
    await jest.runAllTimersAsync();
    const response = await responsePromise;
    const json = await response.json();

    expect(json).toEqual({ python_code: 'print(2)' });
    expect(mockPostRequest).toHaveBeenCalledTimes(2);
    expect(mockApiLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockApiLoggerWarn).toHaveBeenCalledWith(
      '[BFF] python-attachment retry 1',
      expect.objectContaining({ delayMs: 300 }),
    );
  });

  it('returns an error response after exhausting all retries', async () => {
    mockPostRequest.mockRejectedValue(
      new Error('API request failed: 500 Internal Server Error'),
    );

    const responsePromise = POST(makeRequest({ queries: [] }));
    await jest.runAllTimersAsync();
    const response = await responsePromise;
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error.operation).toBe('get-python-attachment');
    expect(mockPostRequest).toHaveBeenCalledTimes(3);
    expect(mockApiLoggerWarn).toHaveBeenCalledTimes(2);
  });
});

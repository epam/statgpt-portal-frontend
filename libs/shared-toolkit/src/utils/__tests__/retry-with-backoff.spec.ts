/// <reference types="jest" />
import { retryWithBackoff } from '../retry-with-backoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('succeeds on the first attempt without calling onRetry', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const onRetry = jest.fn();

    const result = await retryWithBackoff(fn, { onRetry });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('succeeds after N failures, calling onRetry once per failed attempt with the correct attempt/delay', async () => {
    const error1 = new Error('fail 1');
    const error2 = new Error('fail 2');
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValueOnce('ok');
    const onRetry = jest.fn();

    const promise = retryWithBackoff(fn, {
      retries: 2,
      baseDelayMs: 300,
      onRetry,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 0, error1, 300);
    expect(onRetry).toHaveBeenNthCalledWith(2, 1, error2, 600);
  });

  it('exhausts retries and rethrows the last error, calling onRetry exactly `retries` times', async () => {
    const error1 = new Error('fail 1');
    const error2 = new Error('fail 2');
    const error3 = new Error('fail 3');
    const fn = jest
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockRejectedValueOnce(error3);
    const onRetry = jest.fn();

    const promise = retryWithBackoff(fn, {
      retries: 2,
      baseDelayMs: 300,
      onRetry,
    });
    promise.catch(() => {});
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toBe(error3);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('uses default retries (2) and baseDelayMs (300) when no options are passed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

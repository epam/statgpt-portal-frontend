type AsyncAction<TArgs extends readonly unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

const resolvedRequests = new Map<string, unknown>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function getFullKey(action: object, key: string): string {
  return `${(action as { name?: string }).name ?? ''}::${key}`;
}

export function buildRequestCacheKey(...parts: readonly unknown[]) {
  return JSON.stringify(parts);
}

export async function getCachedRequestResult<
  TArgs extends readonly unknown[],
  TResult,
>(
  action: AsyncAction<TArgs, TResult>,
  key: string,
  request: () => Promise<TResult>,
): Promise<TResult> {
  const fullKey = getFullKey(action, key);

  if (resolvedRequests.has(fullKey)) {
    return resolvedRequests.get(fullKey) as TResult;
  }

  const inFlightRequest = inFlightRequests.get(fullKey);
  if (inFlightRequest) {
    return inFlightRequest as Promise<TResult>;
  }

  const nextRequest = request()
    .then((result) => {
      resolvedRequests.set(fullKey, result);
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(fullKey);
    });

  inFlightRequests.set(fullKey, nextRequest);

  return nextRequest;
}

export function clearRequestCache() {
  resolvedRequests.clear();
  inFlightRequests.clear();
}

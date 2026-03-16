type AsyncAction<TArgs extends readonly unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

type ResolvedCache = Map<string, unknown>;
type InFlightCache = Map<string, Promise<unknown>>;

const resolvedRequests = new WeakMap<object, ResolvedCache>();
const inFlightRequests = new WeakMap<object, InFlightCache>();
const cacheRegistry = new Set<ResolvedCache | InFlightCache>();

function getOrCreateCache<TCache extends ResolvedCache | InFlightCache>(
  storage: WeakMap<object, TCache>,
  action: object,
  createCache: () => TCache,
): TCache {
  const existingCache = storage.get(action);
  if (existingCache) {
    return existingCache;
  }

  const nextCache = createCache();
  storage.set(action, nextCache);
  cacheRegistry.add(nextCache);

  return nextCache;
}

function getResolvedMap(action: object) {
  return getOrCreateCache(resolvedRequests, action, () => new Map());
}

function getInFlightMap(action: object) {
  return getOrCreateCache(inFlightRequests, action, () => new Map());
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
  const resolvedCache = getResolvedMap(action as object);
  if (resolvedCache.has(key)) {
    return resolvedCache.get(key) as TResult;
  }

  const inFlightCache = getInFlightMap(action as object);
  const inFlightRequest = inFlightCache.get(key);
  if (inFlightRequest) {
    return inFlightRequest as Promise<TResult>;
  }

  const nextRequest = request()
    .then((result) => {
      resolvedCache.set(key, result);
      return result;
    })
    .finally(() => {
      inFlightCache.delete(key);
    });

  inFlightCache.set(key, nextRequest);

  return nextRequest;
}

export function clearRequestCache() {
  cacheRegistry.forEach((cache) => cache.clear());
}

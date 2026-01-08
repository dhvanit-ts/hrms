import logger from "@/core/logger";
import { DB } from "@/infra/db/types";
import cache from "@/infra/services/cache/index";

type CacheOptions = {
  ttl?: number;
};

const inFlight = new Map<string, Promise<unknown>>();

export const cached = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  const hit = cache.get<T>(key);

  if (hit !== undefined) {
    logger.debug(`cache.hit.${key}`);
    return hit;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  logger.debug(`cache.miss.${key}`);

  const promise = (async () => {
    const result = await fetcher();
    if (result !== undefined) {
      cache.set(key, result, options.ttl);
    }
    return result;
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
};

export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    dbTx?: DB;
    ttl?: number;
  } = {}
): Promise<T> => {
  if (options.dbTx) {
    logger.debug(`cache.bypass.${key}`);
    return fetcher();
  }

  return cached(key, fetcher, { ttl: options.ttl });
};


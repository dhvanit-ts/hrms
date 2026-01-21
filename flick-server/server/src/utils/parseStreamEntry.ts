export function parseStreamEntry([id, fields]: RedisStreamEntry): Record<string, string> {
  return {
    _redisId: id,
    ...Object.fromEntries(
      fields.reduce((acc, val, idx, arr) => {
        if (idx % 2 === 0) acc.push([val, arr[idx + 1]]);
        return acc;
      }, [] as [string, string][])
    ),
  };
}

export type RedisStreamEntry = [string, string[]];
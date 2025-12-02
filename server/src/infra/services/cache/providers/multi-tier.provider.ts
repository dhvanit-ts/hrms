import { CacheProvider } from "../cache.interface";
export class MultiTierCacheProvider implements CacheProvider {
  constructor(
    private l1: CacheProvider,
    private l2: CacheProvider,
    private ttl?: number
  ) {}

  async get<T>(key: string) {
    const l1Val = await this.l1.get<T>(key);
    if (l1Val) return l1Val;

    const l2Val = await this.l2.get<T>(key);
    if (l2Val) {
      await this.l1.set(key, l2Val, this.ttl);
      return l2Val;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number) {
    const l1Success = await this.l1.set(key, value, ttl ?? this.ttl);
    const l2Success = await this.l2.set(key, value, ttl ?? this.ttl);
    return l1Success && l2Success;
  }

  async del(key: string) {
    const l1Success = await this.l1.del(key);
    const l2Success = await this.l2.del(key);
    return l1Success && l2Success;
  }

  async flush() {
    await this.l1.flush();
    await this.l2.flush();
  }

  async keys() {
    const l1Keys = await this.l1.keys();
    const l2Keys = await this.l2.keys();
    return [...l1Keys, ...l2Keys];
  }

  async has(key: string) {
    const l1Has = await this.l1.has(key);
    const l2Has = await this.l2.has(key);
    return l1Has || l2Has;
  }
}

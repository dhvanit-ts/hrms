export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  del(...keys: string[]): Promise<boolean>;
  flush(): Promise<void>;
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
}

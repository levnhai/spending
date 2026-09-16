import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AppCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (e) {
      console.warn(`Cache get error for key "${key}":`, e);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    try {
      // cache-manager v5/v6: ttl in milliseconds
      await this.cacheManager.set(key, value, ttlSeconds * 1000);
    } catch (e) {
      console.warn(`Cache set error for key "${key}":`, e);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (e) {
      console.warn(`Cache del error for key "${key}":`, e);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 60,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  // Invalidate toàn bộ cache theo pattern hoặc xóa các key của user
  async invalidateUser(
    userId: string,
    namespaces: string[] = [
      'analytics',
      'orders',
      'wallets',
      'categories',
      'budgets',
      'savings',
      'bills',
      'monthly-plan',
      'transactions',
    ],
  ) {
    try {
      const store: any = (this.cacheManager as any).store;
      if (store && typeof store.keys === 'function') {
        const keys: string[] = await store.keys();
        const userKeys = keys.filter(
          (k) =>
            k.includes(`:${userId}:`) ||
            k.endsWith(`:${userId}`) ||
            namespaces.some(
              (ns) =>
                k.startsWith(`${ns}:${userId}`) ||
                k.startsWith(`${ns}:list:${userId}`),
            ),
        );
        await Promise.allSettled(userKeys.map((k) => this.del(k)));
        return;
      }
    } catch (err) {
      console.warn('Cache keys pattern invalidation error:', err);
    }

    const promises: Promise<void>[] = [];
    for (const ns of namespaces) {
      // Xóa các key phổ biến
      promises.push(this.del(`${ns}:${userId}`));
      for (const p of ['all', 'today', 'week', 'month', 'year']) {
        promises.push(this.del(`${ns}:${userId}:${p}`));
        promises.push(this.del(`${ns}:list:${userId}:${p}`));
        for (let page = 1; page <= 20; page++) {
          for (const limit of [0, 10, 20, 50, 100]) {
            promises.push(this.del(`${ns}:list:${userId}:${p}:${page}:${limit}`));
          }
        }
      }
    }
    await Promise.allSettled(promises);
  }
}

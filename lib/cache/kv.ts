import { Redis } from '@upstash/redis';

/**
 * Cache compartido entre instancias serverless usando Upstash Redis
 * (la integracion de Redis recomendada por Vercel Marketplace).
 *
 * Si KV_REST_API_URL / KV_REST_API_TOKEN no estan configuradas, cae de
 * vuelta a un cache en memoria del proceso: sigue funcionando en
 * desarrollo local, pero no se comparte entre instancias ni sobrevive
 * a un cold start.
 */
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    return (await redis.get<T>(key)) ?? null;
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.value as T;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }

  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;

export const redis = REDIS_URL
  ? createClient({ url: REDIS_URL })
  : null;

let redisUnavailableUntil = 0;

export const connectRedis = async () => {
  if (!redis) return;
  if (Date.now() < redisUnavailableUntil) return;
  if (!redis.isOpen) {
    try {
      await redis.connect();
      redisUnavailableUntil = 0;
    } catch {
      redisUnavailableUntil = Date.now() + 30_000;
    }
  }
};

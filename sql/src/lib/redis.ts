import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_CONNECT_TIMEOUT_MS = 1000;

export const redis = REDIS_URL
  ? createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: false
      }
    })
  : null;

let redisUnavailableUntil = 0;

redis?.on("error", () => {
  redisUnavailableUntil = Date.now() + 30_000;
});

export const connectRedis = async () => {
  if (!redis) return;
  if (Date.now() < redisUnavailableUntil) return;
  if (!redis.isOpen) {
    try {
      await Promise.race([
        redis.connect(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Redis connect timeout")), REDIS_CONNECT_TIMEOUT_MS);
        })
      ]);
      redisUnavailableUntil = 0;
    } catch {
      redisUnavailableUntil = Date.now() + 30_000;
    }
  }
};

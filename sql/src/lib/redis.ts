import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;

export const redis = REDIS_URL
  ? createClient({ url: REDIS_URL })
  : null;

export const connectRedis = async () => {
  if (!redis) return;
  if (!redis.isOpen) {
    await redis.connect();
  }
};

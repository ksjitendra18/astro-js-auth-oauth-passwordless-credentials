import { Redis } from "ioredis";

if (!import.meta.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables");
}

const redis = new Redis(import.meta.env.REDIS_URL);

export default redis;

type ExtendTtlParams = {
  key: string;
  newTTL: number;
  thresholdInSeconds?: number;
};

export const extendTtl = async ({
  key,
  newTTL,
  thresholdInSeconds = 60,
}: ExtendTtlParams) => {
  const remainingTTL = await redis.ttl(key);

  if (remainingTTL === -2) {
    return;
  }

  if (remainingTTL === -1) {
    await redis.expire(key, newTTL);
    return;
  }

  if (remainingTTL < thresholdInSeconds) {
    await redis.expire(key, newTTL);
  }
};

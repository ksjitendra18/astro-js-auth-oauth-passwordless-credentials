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
    console.log("Key does not exist.");
    return;
  }

  if (remainingTTL === -1) {
    console.log("Key exists but does not have a TTL. Setting a new TTL.");
    await redis.expire(key, newTTL);
    return;
  }

  if (remainingTTL < thresholdInSeconds) {
    console.log("Remaining TTL is less than the threshold. Extending TTL.");
    await redis.expire(key, newTTL);
  }
};

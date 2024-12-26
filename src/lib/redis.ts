import { Redis } from "ioredis";

if (!import.meta.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables");
}

const redis = new Redis(import.meta.env.REDIS_URL);

export default redis;

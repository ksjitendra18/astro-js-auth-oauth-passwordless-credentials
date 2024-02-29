import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: import.meta.env.REDIS_URL,
  token: import.meta.env.REDIS_TOKEN,
});

export default redis;

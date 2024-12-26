import { v4 } from "uuid";
import redis from "../../../lib/redis";

interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetTime: Date;
}

export class FixedWindowRateLimiter {
  private readonly key: string;
  private readonly windowSize: number;
  private readonly maxRequests: number;

  constructor(key: string, windowSize: number, maxRequests: number) {
    this.key = key;
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.key}:${identifier}`;
    const currentWindow = Math.floor(Date.now() / 1000 / this.windowSize);
    const windowKey = `${key}:${currentWindow}`;

    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, this.windowSize, "NX");

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis pipeline execution failed");
    }

    const requestCount = results[0]?.[1] as number;

    if (typeof requestCount !== "number") {
      throw new Error("Invalid response from Redis");
    }

    return {
      allowed: requestCount <= this.maxRequests,
      current: requestCount,
      remaining: Math.max(0, this.maxRequests - requestCount),
      resetTime: new Date((currentWindow + 1) * this.windowSize * 1000),
    };
  }
}

export class SlidingWindowRateLimiter {
  private readonly key: string;
  private readonly windowSize: number;
  private readonly maxRequests: number;

  constructor(key: string, windowSize: number, maxRequests: number) {
    this.key = key;
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.key}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowSize * 1000;

    const pipeline = redis.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);

    // const uniqueId = `${now}-${Math.random()}`;
    const uniqueId = v4();
    pipeline.zadd(key, now, uniqueId);

    pipeline.zcount(key, windowStart, "+inf");

    pipeline.expire(key, this.windowSize);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis pipeline execution failed");
    }

    const requestCount = results[2]?.[1] as number;

    if (typeof requestCount !== "number") {
      throw new Error("Invalid response from Redis");
    }

    return {
      allowed: requestCount <= this.maxRequests,
      current: requestCount,
      remaining: Math.max(0, this.maxRequests - requestCount),
      resetTime: new Date(now + this.windowSize * 1000),
    };
  }
}

export class TokenBucketRateLimiter {
  private readonly key: string;
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly ttl: number;

  constructor(
    key: string,
    capacity: number,
    refillRate: number,
    ttl: number = 3600
  ) {
    this.key = key;
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.ttl = ttl;

    if (refillRate <= 0) throw new Error("Refill rate must be positive");
    if (capacity <= 0) throw new Error("Capacity must be positive");
    if (refillRate > capacity)
      throw new Error("Refill rate cannot exceed capacity");
  }

  private getKeys(identifier: string): {
    lastRefillKey: string;
    tokensKey: string;
  } {
    const bucketKey = `${this.key}:${identifier}`;
    return {
      lastRefillKey: `${bucketKey}:lastRefill`,
      tokensKey: `${bucketKey}:tokens`,
    };
  }

  private calculateTokens(
    lastRefill: number,
    currentTokens: number,
    now: number
  ): number {
    const timePassed = (now - lastRefill) / 1000;
    const newTokens = currentTokens + timePassed * this.refillRate;
    return Math.min(newTokens, this.capacity);
  }

  private calculateResetTime(currentTokens: number, now: number): Date {
    if (currentTokens >= this.capacity) {
      return new Date(now);
    }
    const timeToFull =
      ((this.capacity - currentTokens) / this.refillRate) * 1000;
    return new Date(now + timeToFull);
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const { lastRefillKey, tokensKey } = this.getKeys(identifier);
    const now = Date.now();

    const result = await redis.multi().mget(lastRefillKey, tokensKey).exec();

    if (!result) {
      throw new Error("Redis transaction failed");
    }

    const [lastRefillResult, tokensResult] = result[0][1] as [
      string | null,
      string | null
    ];

    if (!lastRefillResult || !tokensResult) {
      await redis
        .multi()
        .mset(lastRefillKey, now, tokensKey, this.capacity.toString())
        .expire(lastRefillKey, this.ttl)
        .expire(tokensKey, this.ttl)
        .exec();

      return {
        allowed: true,
        current: 0,
        remaining: this.capacity,
        resetTime: new Date(now + this.ttl * 1000),
      };
    }

    const lastRefill = parseInt(lastRefillResult);
    const currentTokens = parseFloat(tokensResult);
    const newTokens = this.calculateTokens(lastRefill, currentTokens, now);

    const hasToken = newTokens >= 1;
    const remainingTokens = hasToken ? newTokens - 1 : newTokens;

    if (hasToken) {
      await redis
        .multi()
        .mset(lastRefillKey, now, tokensKey, remainingTokens.toString())
        .expire(lastRefillKey, this.ttl)
        .expire(tokensKey, this.ttl)
        .exec();
    }

    return {
      allowed: hasToken,
      current: this.capacity - remainingTokens,
      remaining: Math.floor(remainingTokens),
      resetTime: this.calculateResetTime(remainingTokens, now),
    };
  }
}

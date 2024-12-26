import redis from "../../../lib/redis";
import { RATELIMIT_CONFIG } from "./auth";

export const checkRateLimit = async ({
  rateLimitKey,
  email,
}: {
  rateLimitKey: keyof typeof RATELIMIT_CONFIG;
  email: string;
}) => {
  const rateLimitConfig = RATELIMIT_CONFIG[rateLimitKey];
  const lastEmailSentKey = rateLimitConfig.key({ email, type: "sent" });

  const hourlyEmailSentCountKey = rateLimitConfig.key({
    email,
    type: "hourly_count",
  });

  const dailyEmailSentCountKey = rateLimitConfig.key({
    email,
    type: "daily_count",
  });

  const lastEmailSentTime = await redis.get(lastEmailSentKey);

  if (lastEmailSentTime) {
    return {
      rateLimit: true,
      waitTime: 30 - (new Date().getTime() - Number(lastEmailSentTime)),
      recentlySent: true,
      dailyLimit: null,
      hourlyLimit: null,
    };
  }

  const dailyEmailSentCount = await redis.get(dailyEmailSentCountKey);

  const hourlyEmailSentCount = await redis.get(hourlyEmailSentCountKey);

  if (!dailyEmailSentCount) {
    return {
      rateLimit: false,
      waitTime: 0,
      recentlySent: false,
      dailyLimit: null,
      hourlyLimit: null,
    };
  }

  console.log("data", Number(dailyEmailSentCount), rateLimitConfig.dailyLimit);
  console.log("d", Number(dailyEmailSentCount) >= rateLimitConfig.dailyLimit);
  if (Number(dailyEmailSentCount) >= rateLimitConfig.dailyLimit) {
    return {
      rateLimit: true,
      waitTime: 0,
      dailyLimit: true,
      hourlyLimit: false,
      recentlySent: false,
    };
  }

  if (!hourlyEmailSentCount) {
    return {
      rateLimit: false,
      waitTime: 0,
      dailyLimit: null,
      hourlyLimit: null,
      recentlySent: false,
    };
  }

  if (Number(hourlyEmailSentCount) >= rateLimitConfig.hourlyLimit) {
    return {
      rateLimit: true,
      waitTime: 0,
      dailyLimit: false,
      hourlyLimit: true,
      recentlySent: false,
    };
  }
};

export const updateRateLimit = async ({
  rateLimitKey,
  email,
}: {
  rateLimitKey: keyof typeof RATELIMIT_CONFIG;
  email: string;
}) => {
  const rateLimitConfig = RATELIMIT_CONFIG[rateLimitKey];

  const lastEmailSentKey = rateLimitConfig.key({ email, type: "sent" });

  const hourlyEmailSentCountKey = rateLimitConfig.key({
    email,
    type: "hourly_count",
  });

  const dailyEmailSentCountKey = rateLimitConfig.key({
    email,
    type: "daily_count",
  });

  const hourlyEmailCount = await redis.get(hourlyEmailSentCountKey);

  let hourlyEmailCountPromise;

  if (hourlyEmailCount === null) {
    hourlyEmailCountPromise = redis.set(
      hourlyEmailSentCountKey,
      1,
      "EX",
      60 * 60
    );
  } else {
    hourlyEmailCountPromise = redis.incr(hourlyEmailSentCountKey);
  }

  const dailyEmailCount = await redis.get(dailyEmailSentCountKey);

  let dailyEmailCountPromise;

  if (dailyEmailCount === null) {
    dailyEmailCountPromise = redis.set(dailyEmailSentCountKey, 1, "EX", 86400);
  } else {
    dailyEmailCountPromise = redis.incr(dailyEmailSentCountKey);
  }

  const lastEmailSentTimePromise = redis.set(
    lastEmailSentKey,
    new Date().getTime(),
    "EX",
    rateLimitConfig.retryAfter
  );

  const [res1, res2, res3] = await Promise.all([
    hourlyEmailCountPromise,
    dailyEmailCountPromise,
    lastEmailSentTimePromise,
  ]);

  if (res1 && res2 && res3) {
    return { success: true };
  } else {
    console.log("error in updateRateLimit", res1, res2);
    throw new Error("Error while sending mail");
  }
};

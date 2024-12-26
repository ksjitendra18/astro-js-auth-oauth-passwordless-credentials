export const RATELIMIT_CONFIG = {
  magic_link: {
    hourlyLimit: 3,
    dailyLimit: 10,
    time: 60 * 60,
    retryAfter: 30,
    key: ({ email, type }: { email: string; type: string }) =>
      `magic_link:${email}:${type}`,
  },
  verification_email: {
    hourlyLimit: 3,
    dailyLimit: 10,
    time: 60 * 60,
    retryAfter: 30,
    key: ({ email, type }: { email: string; type: string }) =>
      `verification_email:${email}:${type}`,
  },
  password_reset_email: {
    hourlyLimit: 3,
    dailyLimit: 10,
    time: 60 * 60,
    retryAfter: 30,
    key: ({ email, type }: { email: string; type: string }) =>
      `password_reset_email:${email}:${type}`,
  },
  email_change_email: {
    hourlyLimit: 6,
    dailyLimit: 12,
    time: 60 * 60,
    retryAfter: 30,
    key: ({ email, type }: { email: string; type: string }) =>
      `email_change_email:${email}:${type}`,
  },
};

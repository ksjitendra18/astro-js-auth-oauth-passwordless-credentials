import { defineMiddleware } from "astro/middleware";
import { AUTH_COOKIES } from "./features/auth/constants";
import {
  extendSession,
  getSessionInfo,
} from "./features/auth/services/session";

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionToken = context.cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
  const sessionInfo = await getSessionInfo(sessionToken);

  if (sessionInfo && sessionInfo.user) {
    context.locals.userId = sessionInfo.user.id;
    // Extend session if it's about to expire
    // if less than 2 days left then extend it for another 14 days
    await extendSession({
      sessionId: sessionInfo.id,
      expiresAt: sessionInfo.expiresAt,
    });
  }

  return next();
});

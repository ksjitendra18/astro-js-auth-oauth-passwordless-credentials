import { defineMiddleware } from "astro/middleware";
import { getSessionInfo } from "./features/auth/services/session";
import { AUTH_COOKIES } from "./features/auth/constants";

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionToken = context.cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
  const sessionInfo = await getSessionInfo(sessionToken);

  context.locals.userId = sessionInfo?.user?.id;

  return next();
});

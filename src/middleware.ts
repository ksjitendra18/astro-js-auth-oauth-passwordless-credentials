import { defineMiddleware } from "astro/middleware";
import getUser from "./lib/getUser";

export const onRequest = defineMiddleware(async (context, next) => {
  const userInfo = await getUser(context.cookies.get("app_auth_token")?.value);

  context.locals.userId = userInfo?.user?.id;

  if (
    context.url.pathname.includes("dashboard") ||
    context.url.pathname.includes("account")
  ) {
    if (!userInfo || !userInfo.user) {
      return context.redirect("/login");
    } else {
      return next();
    }
  }

  if (context.url.pathname.includes("login")) {
    if (userInfo?.user) {
      return context.redirect("/");
    }
  }

  return next();
});

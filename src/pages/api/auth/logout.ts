import type { APIContext } from "astro";
import { deleteSessionById } from "../../../features/auth/services/session";
import { AUTH_COOKIES } from "../../../features/auth/constants";

export async function GET({ cookies }: APIContext) {
  const sessionId = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
  if (!sessionId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  await deleteSessionById(sessionId);

  cookies.delete(AUTH_COOKIES.SESSION_TOKEN, {
    path: "/",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}

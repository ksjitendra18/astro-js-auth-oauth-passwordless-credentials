import type { APIContext } from "astro";
import { db } from "../../../db";
import { sessions } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET({ cookies }: APIContext) {
  const sessionId = cookies.get("app_auth_token")?.value;
  if (!sessionId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }
  await db.delete(sessions).where(eq(sessions.id, sessionId));

  cookies.delete("app_auth_token", {
    path: "/",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}

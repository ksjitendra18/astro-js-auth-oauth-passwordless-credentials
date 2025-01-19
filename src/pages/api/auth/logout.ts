import type { APIContext } from "astro";
import { deleteSessionById } from "../../../features/auth/services/session";
import { AUTH_COOKIES } from "../../../features/auth/constants";
import { aesDecrypt, EncryptionPurpose } from "../../../lib/aes";
import redis from "../../../lib/redis";

export async function GET({ cookies }: APIContext) {
  const encryptedSessionId = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
  if (!encryptedSessionId) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const decryptedSessionId = aesDecrypt(
    encryptedSessionId,
    EncryptionPurpose.SESSION_COOKIE_SECRET
  );

  await deleteSessionById(decryptedSessionId);

  await redis.del(decryptedSessionId);

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

import { and, eq, gte } from "drizzle-orm";
import { db } from "../db";
import { sessions } from "../db/schema";

async function getUser(authToken: string | undefined) {
  if (!authToken) return null;

  const userInfo = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, authToken),
      gte(sessions.expiresAt, new Date().getTime())
    ),
    columns: {
      id: true,
    },
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          userName: true,
        },
      },
    },
  });

  if (!userInfo) {
    return null;
  }

  if (!userInfo.user) {
    return null;
  }
  return userInfo;
}

export default getUser;

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../../db/index";
import { loginLogs, oauthProviders, users } from "../../../db/schema";
import type { oauthProvidersEnum } from "../constants";
import { normalizeEmail } from "../utils";

type NewUserParams = {
  email: string;
  fullName: string;
  profilePhoto: string;
  emailVerified: boolean;
};

export const createUser = async ({
  email,
  fullName,
  profilePhoto,
  emailVerified,
}: NewUserParams) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        normalizedEmail,
        profilePhoto,
        fullName,
        emailVerified,
      })
      .returning({ id: users.id });

    return { userId: newUser.id };
  } catch (error) {
    console.log("Error while creating user", error);
    throw new Error("Error while creating user");
  }
};

interface GetUserByEmailArgs {
  email: string;
  shouldNormalizeEmail?: boolean;
}
export const getUserByEmail = async ({
  email,
  shouldNormalizeEmail = false,
}: GetUserByEmailArgs) => {
  let formattedEmail = email;

  if (shouldNormalizeEmail) {
    formattedEmail = normalizeEmail(email);
  }

  return await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
    where: and(
      eq(
        users[shouldNormalizeEmail ? "normalizedEmail" : "email"],
        formattedEmail
      ),
      eq(users.isBanned, false),
      isNull(users.deletedAt)
    ),
  });
};

export const getUserById = async (id: string) => {
  return await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
    where: and(
      eq(users.id, id),
      eq(users.isBanned, false),
      isNull(users.deletedAt)
    ),
  });
};

export const getOauthUserData = async ({
  email,
  providerId,
  strategy,
}: {
  email: string;
  providerId: string;
  strategy: (typeof oauthProvidersEnum)[number];
}) => {
  const normalizedEmail = normalizeEmail(email);
  const userData = await db.query.users.findFirst({
    where: and(
      eq(users.normalizedEmail, normalizedEmail),
      eq(users.isBanned, false),
      isNull(users.deletedAt)
    ),
    columns: {
      id: true,
      email: true,
      twoFactorEnabled: true,
    },
    with: {
      oauthProviders: {
        where: and(
          eq(oauthProviders.providerUserId, String(providerId)),
          eq(oauthProviders.strategy, strategy)
        ),
        columns: {
          email: true,
        },
      },
    },
  });

  const oauthData = await db.query.oauthProviders.findFirst({
    where: and(
      eq(oauthProviders.providerUserId, String(providerId)),
      eq(oauthProviders.strategy, strategy)
    ),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
        },
      },
    },
  });

  return { userData, oauthData };
};

export const createOauthProvider = async ({
  providerId,
  userId,
  email,
  strategy,
}: {
  providerId: string | number;
  userId: string;
  email: string;
  strategy: (typeof oauthProvidersEnum)[number];
}) => {
  try {
    await db.insert(oauthProviders).values({
      providerUserId: String(providerId),
      userId,
      strategy,
      email,
    });
  } catch (error) {
    console.log("Error while creating oauth provider", error);
    throw new Error("Error while creating oauth provider");
  }
};

export const updateOauthUserEmail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  return await db
    .update(oauthProviders)
    .set({
      email: email,
    })
    .where(eq(oauthProviders.providerUserId, userId));
};

export const updateEmailVerificationStatus = async (userId: string) => {
  return await db
    .update(users)
    .set({
      emailVerified: true,
    })
    .where(eq(users.id, userId));
};

export const getUserProfile = async (usersId: string) => {
  return await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
      fullName: true,
    },
    where: eq(users.id, usersId),
  });
};

export const updateUserProfile = async ({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) => {
  return await db
    .update(users)
    .set({
      fullName,
    })
    .where(eq(users.id, userId));
};

export const updateUserEmail = async ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) => {
  return await db
    .update(users)
    .set({
      email,
    })
    .where(eq(users.id, userId));
};

export const getUserAccountInfo = async (userId: string) => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      fullName: true,
      email: true,
      twoFactorEnabled: true,
    },
    with: {
      passwords: {
        columns: {
          id: true,
        },
      },
      oauthProviders: {
        columns: {
          id: true,
          strategy: true,
        },
      },
      loginLogs: {
        columns: {
          os: true,
          device: true,
          browser: true,
          strategy: true,
          createdAt: true,
          ip: true,
          userId: true,
          sessionId: true,
        },
        orderBy: desc(loginLogs.createdAt),
      },
    },
  });
};

export type UserAccountInfo = NonNullable<
  Awaited<ReturnType<typeof getUserAccountInfo>>
>;

// you may want to perform soft deletion.
// user table has the field isDeleted
// Please check laws regarding soft deletion
export const deleteAccount = async (userId: string) => {
  return await db.delete(users).where(eq(users.id, userId));
};

import {
  boolean,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { v7 as uuidv7 } from "uuid";
import {
  allLoginProvidersEnum,
  oauthProvidersEnum,
} from "../../features/auth/constants";

export const users = mysqlTable("users", {
  id: text()
    .$default(() => uuidv7())
    .primaryKey(),
  fullName: text(),
  email: text().notNull().unique(),
  normalizedEmail: text().notNull().unique(),
  profilePhoto: text(),
  emailVerified: boolean().default(false).notNull(),
  twoFactorEnabled: boolean().default(false).notNull(),
  twoFactorSecret: text(),
  isBanned: boolean().default(false),
  banReason: text(),
  deletedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
});

export const passwords = mysqlTable(
  "passwords",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),

    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),

    password: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("passwords_user_id_idx").on(table.userId)],
);

export const oauthProviders = mysqlTable(
  "oauth_providers",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),
    providerUserId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    email: text().notNull(),
    strategy: text({ enum: oauthProvidersEnum }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("oauth_providers_user_id_idx").on(table.userId),
    index("oauth_providers_provider_user_id_strategy_idx").on(
      table.providerUserId,
      table.strategy,
    ),
  ],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),
    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    expiresAt: int().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const loginLogs = mysqlTable(
  "login_logs",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),

    sessionId: text()
      .references(() => sessions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),

    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),

    strategy: text({
      enum: allLoginProvidersEnum,
    }).notNull(),

    browser: text().notNull(),
    device: text().notNull(),
    os: text().notNull(),
    ip: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("login_logs_user_id_idx").on(table.userId)],
);

export const recoveryCodes = mysqlTable(
  "recovery_codes",
  {
    id: text()
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    code: text().notNull(),
    isUsed: boolean().default(false).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("recovery_codes_user_id_idx").on(table.userId)],
);

import {
  pgTable,
  text,
  boolean,
  timestamp,
  index,
  integer,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

export const users = pgTable("users", {
  id: uuid()
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
  deletedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const passwords = pgTable(
  "passwords",
  {
    id: uuid()
      .$default(() => uuidv7())
      .primaryKey(),

    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),

    password: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [index("passwords_user_id_idx").on(table.userId)],
);

export const oauthProvidersEnum = pgEnum("oauth_providers_enum", [
  "github",
  "google",
]);

export const oauthProviders = pgTable(
  "oauth_providers",
  {
    id: uuid()
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
    strategy: oauthProvidersEnum().notNull(),
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

export const sessions = pgTable(
  "sessions",
  {
    id: uuid()
      .$default(() => uuidv7())
      .primaryKey(),
    userId: text()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    expiresAt: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const allLoginProvidersEnum = pgEnum("all_login_providers_enum", [
  "github",
  "google",
  "password",
  "magic_link",
]);

export const loginLogs = pgTable(
  "login_logs",
  {
    id: uuid()
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

    strategy: allLoginProvidersEnum().notNull(),

    browser: text().notNull(),
    device: text().notNull(),
    os: text().notNull(),
    ip: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("login_logs_user_id_idx").on(table.userId)],
);

export const recoveryCodes = pgTable(
  "recovery_codes",
  {
    id: uuid()
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
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [index("recovery_codes_user_id_idx").on(table.userId)],
);

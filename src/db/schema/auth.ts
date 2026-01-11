import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import {
  allLoginProvidersEnum,
  oauthProvidersEnum,
} from "../../features/auth/constants";

export const users = sqliteTable("users", {
  id: text()
    .$default(() => uuidv7())
    .primaryKey(),
  fullName: text(),
  email: text().notNull().unique(),
  normalizedEmail: text().notNull().unique(),
  profilePhoto: text(),
  emailVerified: integer({ mode: "boolean" }).default(false).notNull(),
  twoFactorEnabled: integer({ mode: "boolean" }).default(false).notNull(),
  twoFactorSecret: text(),
  isBanned: integer({ mode: "boolean" }).default(false),
  banReason: text(),
  // isDeleted: integer({ mode: "boolean" }).default(false),
  deletedAt: integer(),
  createdAt: integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    // .$onUpdateFn(() => sql`(unixepoch())`), // THIS IS GIVING ERROR
    .$onUpdateFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginLogs: many(loginLogs),
  passwords: one(passwords),
  oauthProviders: many(oauthProviders),
  recoveryCodes: many(recoveryCodes),
}));

export const passwords = sqliteTable(
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
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("passwords_user_id_idx").on(table.userId)]
);

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const oauthProviders = sqliteTable(
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
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("oauth_providers_user_id_idx").on(table.userId),
    index("oauth_providers_provider_user_id_strategy_idx").on(
      table.providerUserId,
      table.strategy
    ),
  ]
);

export const oauthProviderRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable(
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
    expiresAt: integer().notNull(),
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  loginLog: one(loginLogs),
}));

export const loginLogs = sqliteTable(
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
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("login_logs_user_id_idx").on(table.userId)]
);

export const loginLogsRelations = relations(loginLogs, ({ one }) => ({
  user: one(users, {
    fields: [loginLogs.userId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [loginLogs.sessionId],
    references: [sessions.id],
  }),
}));

export const recoveryCodes = sqliteTable(
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
    isUsed: integer({ mode: "boolean" }).default(false),
    createdAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("recovery_codes_user_id_idx").on(table.userId)]
);

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [recoveryCodes.userId],
    references: [users.id],
  }),
}));

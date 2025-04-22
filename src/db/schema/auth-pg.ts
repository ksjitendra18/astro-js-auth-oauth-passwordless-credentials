import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  boolean,
  timestamp,
  index,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

export const users = pgTable("users", {
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
  deletedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginLogs: many(loginLogs),
  passwords: one(passwords),
  oauthProviders: many(oauthProviders),
  recoveryCodes: many(recoveryCodes),
}));

export const passwords = pgTable(
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
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [index("passwords_user_id_idx").on(table.userId)]
);

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const oauthProvidersEnum = pgEnum("oauth_providers_enum", [
  "github",
  "google",
]);

export const oauthProviders = pgTable(
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
    strategy: oauthProvidersEnum().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
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

export const sessions = pgTable(
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
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
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

export const allLoginProvidersEnum = pgEnum("all_login_providers_enum", [
  "github",
  "google",
  "password",
  "magic_link",
]);

export const loginLogs = pgTable(
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

    strategy: allLoginProvidersEnum().notNull(),

    browser: text().notNull(),
    device: text().notNull(),
    os: text().notNull(),
    ip: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
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

export const recoveryCodes = pgTable(
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
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [index("recovery_codes_user_id_idx").on(table.userId)]
);

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [recoveryCodes.userId],
    references: [users.id],
  }),
}));

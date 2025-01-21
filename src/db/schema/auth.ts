import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";

const socialProvidersEnum = ["google", "github"] as const;
const allLoginProvidersEnum = [
  "google",
  "github",
  "password",
  "magic_link",
] as const;

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
  isDeleted: integer({ mode: "boolean" }).default(false),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginLogs: many(loginLogs),
  passwords: one(passwords),
  oauthProviders: many(oauthProviders),
  recoveryCodes: many(recoveryCodes),
  loginMethods: many(loginMethods),
}));

export const passwords = sqliteTable(
  "passwords",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),
    userId: text().references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

    password: text().notNull(),
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
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
    strategy: text({ enum: socialProvidersEnum }).notNull(),
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
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

export const loginMethods = sqliteTable(
  "login_methods",
  {
    id: text()
      .$default(() => uuidv7())
      .primaryKey(),
    userId: text().references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    method: text("method", {
      enum: ["github", "google", "password", "magic_link"],
    }).notNull(),
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("login_method_user_id_idx").on(table.userId)]
);

export const loginMethodRelations = relations(loginMethods, ({ one }) => ({
  user: one(users, {
    fields: [loginMethods.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable("sessions", {
  id: text()
    .$default(() => uuidv7())
    .primaryKey(),
  userId: text().references(() => users.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  expiresAt: integer().notNull(),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`),
});

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
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
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
    userId: text().references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    code: text().notNull(),
    isUsed: integer({ mode: "boolean" }).default(false),
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("recovery_codes_user_id_idx").on(table.userId)]
);

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [recoveryCodes.userId],
    references: [users.id],
  }),
}));

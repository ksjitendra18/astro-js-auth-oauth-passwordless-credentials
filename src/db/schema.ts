import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customAlphabet } from "nanoid";

const createSessionId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz_-",
  48
);

export const users = sqliteTable("users", {
  id: text("id")
    .$default(() => createId())
    .primaryKey(),
  fullName: text("full_name"),
  userName: text("user_name").unique(),
  email: text("email").notNull().unique(),
  profilePhoto: text("profile_photo"),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" })
    .default(false)
    .notNull(),
  twoFactorSecret: text("two_factor_secret"),
  isBlocked: integer("is_blocked", { mode: "boolean" }).default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  loginLogs: many(loginLogs),
  passwords: one(passwords),
  recoveryCodes: many(recoveryCodes),
  oauthProviders: many(oauthProviders),
}));

export const oauthProviders = sqliteTable(
  "oauth_providers",
  {
    id: text("id")
      .$default(() => createId())
      .primaryKey(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    email: text("email").notNull(),
    strategy: text("strategy", { enum: ["google", "github"] }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    oauthProvidersUserIdIdx: index("oauth_providers_user_id_idx").on(
      table.userId
    ),
    oauthProviderProvierUserIdStrategyIdx: index(
      "oauth_providers_provider_user_id_strategy_idx"
    ).on(table.providerUserId, table.strategy),
  })
);

export const oauthProviderRelations = relations(oauthProviders, ({ one }) => ({
  user: one(users, {
    fields: [oauthProviders.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id")
    .$default(() => createSessionId())
    .primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
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
    id: text("id")
      .$default(() => createId())
      .primaryKey(),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    strategy: text("strategy", {
      enum: ["github", "google", "credentials", "magic_link"],
    }).notNull(),

    browser: text("browser").notNull(),
    device: text("device").notNull(),
    os: text("os").notNull(),
    ip: text("ip").notNull(),
    loggedInAt: text("logged_in_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    loginLogsUserIdIdx: index("login_logs_user_id_idx").on(table.userId),
  })
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

export const passwords = sqliteTable("passwords", {
  userId: text("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .primaryKey(),
  password: text("password").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));

export const recoveryCodes = sqliteTable(
  "recovery_codes",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    code: text("code").notNull(),
    isUsed: integer("is_used", { mode: "boolean" }).default(false),
  },
  (table) => ({
    recoveryCodesUserIdIdx: index("recovery_codes_user_id_idx").on(
      table.userId
    ),
  })
);

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [recoveryCodes.userId],
    references: [users.id],
  }),
}));

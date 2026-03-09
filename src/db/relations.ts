import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions({
      from: r.users.id,
      to: r.sessions.userId,
    }),
    loginLogs: r.many.loginLogs({
      from: r.users.id,
      to: r.loginLogs.userId,
    }),
    passwords: r.one.passwords({
      from: r.users.id,
      to: r.passwords.userId,
    }),
    recoveryCodes: r.many.recoveryCodes({
      from: r.users.id,
      to: r.recoveryCodes.userId,
    }),

    oauthProviders: r.many.oauthProviders({
      from: r.users.id,
      to: r.oauthProviders.userId,
    }),
  },

  oauthProviders: {
    user: r.one.users({
      from: r.oauthProviders.userId,
      to: r.users.id,
    }),
  },

  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
      optional: false,
    }),
  },

  passwords: {
    user: r.one.users({
      from: r.passwords.userId,
      to: r.users.id,
    }),
  },
}));

import { createClient, type ResultSet } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { relations } from "./relations";
import * as schema from "./schema";

if (!import.meta.env.DB_URL || !import.meta.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN environment variables are required");
}

const client = createClient({
  url: import.meta.env.DB_URL,
  authToken: import.meta.env.DB_TOKEN,
});

export const db = drizzle({
  connection: {
    url: import.meta.env.DB_URL,
    authToken: import.meta.env.DB_TOKEN,
  },
  relations,
  schema,
  casing: "snake_case",
});

type Schema = typeof schema;
type Relation = typeof relations;


export type Transaction = SQLiteTransaction<
  "async",
  ResultSet,
  Schema,
  Relation
>;
